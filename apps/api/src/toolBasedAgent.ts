import { Page } from "playwright";
import { analyzeCanvasGame, clickCanvasZone } from "./canvasGameAnalyzer";

/**
 * GAME-AGNOSTIC TOOL-BASED AGENT
 * 
 * Instead of hardcoding game-specific flows, this agent:
 * 1. Analyzes ANY page dynamically
 * 2. Presents a TOOLKIT of reusable actions to Ollama
 * 3. Ollama decides which tools to use based on what it sees
 * 4. Works with ANY game, web app, or interface
 */

export interface PageTool {
  name: string;
  description: string;
  elementId?: string;
  visible: boolean;
  context: {
    tag: string;
    text?: string;
    type?: string;
    placeholder?: string;
  };
}

export interface ToolAction {
  tool: string;
  target?: string;
  value?: string;
  wait?: number;
  reason: string;
}

/**
 * Discover ALL available tools on current page dynamically
 * Returns comprehensive toolkit for any interface
 */

export async function discoverPageTools(page: Page): Promise<PageTool[]> {
  const tools: PageTool[] = await page.evaluate(() => {
    const tools: PageTool[] = [];
    const processedElements = new Set<HTMLElement>();

    // 1. CLICKABLE ELEMENTS
    const clickableSelectors =
      "button, a, [role='button'], [role='link'], [role='tab'], [onclick], .clickable, [class*='btn'], [class*='button'], *[id*='sign'], *[id*='login'], *[id*='play'], *[id*='launch'], *[aria-label*='sign'], *[aria-label*='play'], *[class*='sign'], *[class*='login'], *[class*='play']";
    const clickables = document.querySelectorAll(clickableSelectors);

    clickables.forEach((el, idx) => {
      if (!processedElements.has(el as HTMLElement)) {
        const htmlEl = el as HTMLElement;
        if (htmlEl.offsetHeight > 0 && htmlEl.offsetWidth > 0) {
          let text = htmlEl.innerText?.trim() || htmlEl.textContent?.trim() || "";
          text = text.replace(/\s+/g, " ").slice(0, 50);

          if (text.length > 0) {
            tools.push({
              name: `click_${idx}`,
              description: `Click: "${text}"`,
              visible: true,
              context: {
                tag: el.tagName.toLowerCase(),
                text: text,
              },
            });
            processedElements.add(htmlEl);
          }
        }
      }
    });

    // 2. INPUT FIELDS - text, email, password, number, etc.
    const inputs = document.querySelectorAll(
      "input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select"
    );

    inputs.forEach((el, idx) => {
      if (!processedElements.has(el as HTMLElement)) {
        const htmlEl = el as HTMLElement;
        if (htmlEl.offsetHeight > 0 && htmlEl.offsetWidth > 0) {
          const input = el as
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLSelectElement;
          const placeholder = (input as HTMLInputElement).placeholder || "";
          const label =
            (document.querySelector(`label[for="${el.id}"]`)?.textContent ||
              "") ||
            (el.previousElementSibling?.textContent || "") ||
            placeholder ||
            input.name ||
            "";

          tools.push({
            name: `input_${idx}`,
            description: `Type in: "${label || input.type}"`,
            visible: true,
            context: {
              tag: el.tagName.toLowerCase(),
              type: input.type || "textarea",
              placeholder: placeholder || "",
            },
          });
          processedElements.add(htmlEl);
        }
      }
    });

    // 3. FORM ELEMENTS
    const forms = document.querySelectorAll("form");
    forms.forEach((form, idx) => {
      const label = form.querySelector("legend, h2, h3")?.textContent || "";
      tools.push({
        name: `submit_form_${idx}`,
        description: `Submit form: "${label || "unnamed"}"`,
        visible: true,
        context: {
          tag: "form",
          text: label,
        },
      });
    });

    // 4. ACTIONABLE MODALS/DIALOGS
    const modals = document.querySelectorAll("dialog, [role='dialog'], .modal, .popup");
    modals.forEach((modal, idx) => {
      const buttons = modal.querySelectorAll("button");
      buttons.forEach((btn, bidx) => {
        const text = btn.textContent?.trim() || "";
        if (text) {
          tools.push({
            name: `modal_btn_${idx}_${bidx}`,
            description: `Modal action: "${text}"`,
            visible: true,
            context: {
              tag: "button",
              text: text,
            },
          });
        }
      });
    });

    // 5. NAVIGATION & MENU ITEMS
    const navItems = document.querySelectorAll("nav a, [role='menuitem'], .menu li");
    navItems.forEach((item, idx) => {
      const text = item.textContent?.trim().slice(0, 50) || "";
      if (text && !processedElements.has(item as HTMLElement)) {
        tools.push({
          name: `nav_${idx}`,
          description: `Navigate to: "${text}"`,
          visible: true,
          context: {
            tag: item.tagName.toLowerCase(),
            text: text,
          },
        });
        processedElements.add(item as HTMLElement);
      }
    });

    // 6. DATA/CONTENT TO EXTRACT
    const textContent = document.body.innerText;
    if (textContent.toLowerCase().includes("balance")) {
      tools.push({
        name: "extract_balance",
        description: "Extract current balance/credits from page",
        visible: true,
        context: { tag: "data", text: "balance" },
      });
    }

    if (textContent.toLowerCase().includes("error") || textContent.toLowerCase().includes("invalid")) {
      tools.push({
        name: "check_errors",
        description: "Check for error messages on page",
        visible: true,
        context: { tag: "data", text: "error" },
      });
    }

    // 7. GAME-SPECIFIC ELEMENTS (Canvas, animations, etc.)
    const canvas = document.querySelector("canvas");
    if (canvas && canvas.offsetHeight > 0 && canvas.offsetWidth > 0) {
      tools.push({
        name: "game_canvas",
        description: "Game canvas detected - game is running",
        visible: true,
        context: { tag: "canvas", text: "game running" },
      });
    }

    const videos = document.querySelectorAll("video");
    if (videos.length > 0) {
      tools.push({
        name: "video_player",
        description: `Video player detected (${videos.length} video(s))`,
        visible: true,
        context: { tag: "video", text: "video playing" },
      });
    }

    // 8. PAGE STATE INDICATORS
    const isLoading =
      document.querySelector(".loading, .spinner, [class*='loading'], [class*='spinner']") ||
      document.title.toLowerCase().includes("loading");

    if (isLoading) {
      tools.push({
        name: "wait_for_load",
        description: "Page is loading - wait for completion",
        visible: true,
        context: { tag: "state", text: "loading" },
      });
    }

    const isError =
      document.querySelector(".error, [class*='error']") ||
      document.body.innerText.toLowerCase().includes("error occurred");

    if (isError) {
      tools.push({
        name: "handle_error",
        description: "Error state detected on page",
        visible: true,
        context: { tag: "state", text: "error" },
      });
    }

    // 9. STANDARD NAVIGATION TOOLS (always available)
    tools.push(
      {
        name: "scroll_down",
        description: "Scroll down to see more content",
        visible: true,
        context: { tag: "action", text: "scroll" },
      },
      {
        name: "scroll_up",
        description: "Scroll up to see previous content",
        visible: true,
        context: { tag: "action", text: "scroll" },
      },
      {
        name: "wait_time",
        description: "Wait for page/animation to complete (3-5 seconds)",
        visible: true,
        context: { tag: "action", text: "wait" },
      },
      {
        name: "take_screenshot",
        description: "Take screenshot for verification",
        visible: true,
        context: { tag: "action", text: "screenshot" },
      }
    );

    return tools;
  });

  const canvasZones = await analyzeCanvasGame(page);
  if (canvasZones.length > 0) {
    canvasZones.forEach((zone) => {
      tools.push({
        name: `canvas_zone_${zone.id}`,
        description: `Click canvas zone: ${zone.label}`,
        visible: true,
        context: {
          tag: "canvas_zone",
          text: zone.description,
          type: zone.type,
        },
      });
    });

    tools.push({
      name: "canvas_click_center",
      description: "Click the center of the main canvas",
      visible: true,
      context: { tag: "canvas", text: "center click" },
    });
  }

  return tools;
}

/**
 * Execute a tool action on the page
 * Game-agnostic execution of discovered tools
 */
export async function executeTool(
  page: Page,
  action: ToolAction
): Promise<string> {
  const { tool, target, value, wait } = action;

  console.log(`\n🔧 EXECUTING TOOL: ${tool}`);
  console.log(`   📝 Action: ${action.reason}`);

  // CLICK ACTIONS
  if (tool.startsWith("click_")) {
    await page.evaluate((toolId) => {
      const clickables = document.querySelectorAll(
        "button, a, [role='button'], [role='link'], [onclick], .clickable, [class*='btn'], [class*='button'], *[id*='sign'], *[id*='login'], *[id*='play'], *[id*='launch'], *[aria-label*='sign'], *[aria-label*='play']"
      );
      let index = 0;
      for (const el of clickables) {
        if (
          (el as HTMLElement).offsetHeight > 0 &&
          (el as HTMLElement).offsetWidth > 0
        ) {
          if (`click_${index}` === toolId) {
            (el as HTMLElement).click();
            return true;
          }
          index++;
        }
      }
    }, tool);

    console.log(`   ✅ Clicked element`);
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    return `Clicked: ${target}`;
  }

  // CANVAS ZONE CLICK ACTIONS
  if (tool.startsWith("canvas_zone_")) {
    const zoneId = tool.replace("canvas_zone_", "");
    const zones = await analyzeCanvasGame(page);
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) {
      await clickCanvasZone(page, zone);
      return `Clicked canvas zone: ${zone.label}`;
    }
    console.log(`   ⚠️ Canvas zone not found: ${zoneId}`);
    return `Canvas zone not found: ${zoneId}`;
  }

  if (tool === "canvas_click_center") {
    const canvas = await page.$("canvas");
    if (canvas) {
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        console.log(`   ✅ Clicked center of canvas`);
        await page.waitForTimeout(2000);
        await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
        return "Clicked canvas center";
      }
    }
    console.log(`   ⚠️ No canvas found to click center`);
    return "No canvas found";
  }

  if (tool === "game_canvas") {
    const canvas = await page.$("canvas");
    if (canvas) {
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        console.log(`   ✅ Clicked main canvas center`);
        await page.waitForTimeout(2000);
        await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
        return "Clicked main canvas";
      }
    }
    console.log(`   ⚠️ No canvas available to click`);
    return "No canvas available";
  }

  // INPUT ACTIONS
  if (tool.startsWith("input_")) {
    const inputs = await page.$$eval(
      "input, textarea, select",
      (els) =>
        els
          .filter(
            (el: any) =>
              (el as HTMLElement).offsetHeight > 0 &&
              (el as HTMLElement).offsetWidth > 0
          )
          .map((el: any) => ({
            type: el.type,
            placeholder: el.placeholder,
          }))
    );

    const index = parseInt(tool.replace("input_", ""));
    if (inputs[index]) {
      const input = await page.$$(
        "input:not([type='hidden']), textarea, select"
      );
      await input[index].focus();
      await page.keyboard.press("Control+A");
      await page.keyboard.type(value || "");

      console.log(`   ✅ Typed: "${value}"`);
      return `Typed: ${value}`;
    }
  }

  // FORM SUBMIT
  if (tool.startsWith("submit_form_")) {
    const forms = await page.$$("form");
    const index = parseInt(tool.replace("submit_form_", ""));
    if (forms[index]) {
      await forms[index].evaluate((f: any) => f.submit?.());
      console.log(`   ✅ Submitted form`);
      await page.waitForTimeout(2000);
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      return "Submitted form";
    }
  }

  // SCROLL ACTIONS
  if (tool === "scroll_down") {
    await page.evaluate(() => window.scrollBy(0, 500));
    console.log(`   ✅ Scrolled down`);
    return "Scrolled down";
  }

  if (tool === "scroll_up") {
    await page.evaluate(() => window.scrollBy(0, -500));
    console.log(`   ✅ Scrolled up`);
    return "Scrolled up";
  }

  // WAIT ACTIONS
  if (tool === "wait_for_load") {
    console.log(`   ⏳ Waiting 4 seconds for page to load...`);
    await page.waitForTimeout(4000);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    console.log(`   ✅ Wait completed`);
    return "Page loaded";
  }

  if (tool === "wait_time") {
    const duration = wait || 3000;
    console.log(`   ⏳ Waiting ${duration}ms...`);
    await page.waitForTimeout(duration);
    console.log(`   ✅ Wait completed`);
    return `Waited ${duration}ms`;
  }

  // DATA EXTRACTION
  if (tool === "extract_balance") {
    const balance = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/balance[:\s]+[\d.,]+/i);
      return match ? match[0] : "balance not found";
    });
    console.log(`   ✅ Balance: ${balance}`);
    return `Balance: ${balance}`;
  }

  if (tool === "check_errors") {
    const errors = await page.evaluate(() => {
      const errorEls = document.querySelectorAll(
        ".error, [class*='error'], .alert-danger"
      );
      return Array.from(errorEls)
        .map((el) => el.textContent?.trim())
        .filter((t) => t && t.length > 0)
        .slice(0, 3)
        .join(" | ");
    });
    console.log(`   ⚠️ Errors found: ${errors || "none"}`);
    return `Errors: ${errors || "none"}`;
  }

  // SCREENSHOT
  if (tool === "take_screenshot") {
    const path = `artifacts/screenshot-${Date.now()}.png`;
    await page.screenshot({ path });
    console.log(`   📸 Screenshot saved: ${path}`);
    return `Screenshot: ${path}`;
  }

  return "Tool executed";
}

/**
 * Analyze page with TOOL-BASED approach
 * Instead of "what to do next", ask "what tools are available and which should we use?"
 */
export async function analyzePageWithTools(
  page: Page,
  instruction: string,
  previousActions: string[]
): Promise<ToolAction | null> {
  // Discover all available tools
  const tools = await discoverPageTools(page);

  console.log(`\n🔍 DISCOVERED TOOLS ON PAGE:`);
  console.log(`   📦 Available: ${tools.length} tools`);
  tools.slice(0, 8).forEach((t) => {
    console.log(`   - ${t.name}: ${t.description}`);
  });
  if (tools.length > 8) {
    console.log(`   ... and ${tools.length - 8} more tools`);
  }

  // Build tool list for Ollama
  const toolList = tools
    .map(
      (t) =>
        `- ${t.name}: ${t.description} [${t.context.tag}]`
    )
    .join("\n");

  const pageContext = await page.evaluate(() => ({
    title: document.title,
    url: window.location.href,
    text: document.body.innerText.slice(0, 800),
  }));

  // Ask Ollama WHICH TOOL to use instead of WHAT TO DO
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";

  console.log(`\n🤖 ASKING OLLAMA WHICH TOOL TO USE...`);
  console.log(`   💭 Current task: ${instruction}`);
  console.log(`   📋 Progress: ${previousActions.length} steps completed`);

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5:3b",
      prompt: `You are a TOOL-BASED AI agent. Your job is to pick the RIGHT TOOL from available tools to accomplish tasks.

CURRENT TASK: ${instruction}
PROGRESS: ${previousActions.length > 0 ? previousActions.join(" → ") : "Just started"}

AVAILABLE TOOLS ON PAGE:
${toolList}

PAGE CONTEXT:
- Title: ${pageContext.title}
- URL: ${pageContext.url}
- Content: ${pageContext.text.slice(0, 300)}...

YOUR DECISION:
1. Read the current task
2. Look at available tools
3. Pick the BEST tool to accomplish it
4. Explain why

RESPOND WITH EXACTLY 2 LINES:
Tool: [tool_name from the list above]
Reason: [why this tool will help accomplish the task]

RULES:
- ONLY use tool names from the list above
- If no perfect tool exists, use "wait_time" or "scroll_down"
- Be decisive - pick ONE tool
- Progress toward the goal step by step`,
      stream: false,
      options: {
        temperature: 0.2,
        top_k: 5,
      },
    }),
  });

  if (!response.ok) {
    console.log(`\n❌ OLLAMA ERROR: HTTP ${response.status}`);
    return null;
  }

  const data = await response.json();
  const text = data.response;

  console.log(`\n💭 OLLAMA'S TOOL DECISION:`);
  console.log(`${"─".repeat(60)}`);
  console.log(text);
  console.log(`${"─".repeat(60)}`);

  // Parse response
  const lines = text.split("\n");
  let selectedTool = "";
  let reason = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Tool:")) {
      selectedTool = trimmed.replace("Tool:", "").trim();
    } else if (trimmed.startsWith("Reason:")) {
      reason = trimmed.replace("Reason:", "").trim();
    }
  }

  if (!selectedTool) {
    console.log(`\n❌ Could not parse Ollama's decision`);
    return null;
  }

  // Find matching tool
  const matchedTool = tools.find((t) => t.name === selectedTool);
  if (!matchedTool) {
    console.log(`\n⚠️ Tool not found: ${selectedTool} (using wait instead)`);
    return {
      tool: "wait_time",
      wait: 2000,
      reason: reason,
    };
  }

  console.log(`\n✅ USING TOOL: ${selectedTool}`);
  console.log(`   📝 ${reason}`);

  return {
    tool: selectedTool,
    target: matchedTool.description,
    reason: reason,
  };
}

/**
 * Execute workflow using TOOL-BASED approach
 * Works with ANY game, app, or website
 */
export async function executeWithToolBasedAgent(
  page: Page,
  workflow: string,
  maxSteps: number = 20
): Promise<{ steps: string[]; success: boolean }> {
  const steps: string[] = [];

  console.log(`\n${"═".repeat(70)}`);
  console.log(`║  🧰 TOOL-BASED AGENT - GAME AGNOSTIC AUTOMATION  ║`);
  console.log(`${"═".repeat(70)}`);

  for (let i = 0; i < maxSteps; i++) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`STEP ${i + 1}/${maxSteps}`);
    console.log(`${"─".repeat(70)}`);

    const decision = await analyzePageWithTools(page, workflow, steps);

    if (!decision) {
      console.log(`\n⚠️ Could not get Ollama decision, waiting...`);
      await page.waitForTimeout(2000);
      continue;
    }

    const result = await executeTool(page, decision);
    steps.push(result);

    console.log(`\n📊 STEP RESULT: ${result}`);
    console.log(`   ✅ Step ${i + 1} completed`);
  }

  console.log(`\n${"═".repeat(70)}`);
  console.log(`✅ WORKFLOW COMPLETED - ${steps.length} steps executed`);
  console.log(`${"═".repeat(70)}`);

  return {
    steps,
    success: steps.length > 0,
  };
}
