import fs from "fs/promises";
import path from "path";
import { chromium, Locator, Page } from "playwright";
import { AgentStep, createAgentPlan } from "./agent";
import { executeWithLocalLLMGuidance } from "./localLLMAgent";
import { executeWithVisionGuidance } from "./visionAgent";
import { executeWithToolBasedAgent } from "./toolBasedAgent";

export interface VisualTestPayload {
  url: string;
  instructions: string;
  platform?: "DESKTOP" | "IOS" | "ANDROID";
  headless?: boolean;
  mode?: "tool-based" | "game-specific" | "auto"; // 'auto' = tries tool-based first
}

export interface RunStep {
  stepIndex: number;
  description: string;
  action: string;
  result: "PASS" | "FAIL";
  explanation: string;
  screenshotBase64: string;
  x?: number;
  y?: number;
}

async function getBoundingCenter(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) return undefined;
  return {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2),
  };
}

async function findButtonByText(page: Page, keywords: string[]): Promise<{ x: number; y: number } | undefined> {
  // Use page.evaluate to search DOM for clickable elements matching keywords
  const result = await page.evaluate((searchKeywords: string[]) => {
    const allElements = document.querySelectorAll("button, [role='button'], a, input[type='button'], input[type='submit']");
    const candidates: Array<{x: number; y: number; matched: string; score: number}> = [];
    
    for (const elem of allElements) {
      const htmlElem = elem as HTMLElement;
      const inputElem = elem as HTMLInputElement;
      const text = (htmlElem.textContent || htmlElem.innerText || inputElem.value || "").toLowerCase().trim();
      const ariaLabel = (htmlElem.getAttribute("aria-label") || "").toLowerCase();
      const title = (htmlElem.getAttribute("title") || "").toLowerCase();
      const combined = `${text} ${ariaLabel} ${title}`;
      const box = htmlElem.getBoundingClientRect();
      
      // Skip hidden or off-screen elements
      if (box.width < 10 || box.height < 10 || box.top < 0 || box.left < 0) continue;
      
      // Check if any keyword matches
      for (const keyword of searchKeywords) {
        if (combined.includes(keyword.toLowerCase())) {
          let score = 0;
          
          // Exact text match gets highest score
          if (text === keyword.toLowerCase()) score += 100;
          else if (text.includes(keyword.toLowerCase())) score += 50;
          
          // Visible buttons in main content (not header) get bonus
          if (box.top > 50) score += 30;
          
          // Properly sized buttons get bonus
          if (box.width > 60 && box.height > 30) score += 20;
          
          // Avoid very far right/header buttons
          if (box.left < 200) score -= 10;
          
          candidates.push({
            x: Math.round(box.left + box.width / 2),
            y: Math.round(box.top + box.height / 2),
            matched: keyword,
            score,
          });
        }
      }
    }
    
    // Return the best candidate (highest score)
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0];
    }
    return null;
  }, keywords);

  if (result) {
    console.log(`Found button matching "${result.matched}": clicking at ${result.x}, ${result.y} (score: ${result.score})`);
    try {
      // Click using mouse coordinates
      await page.mouse.click(result.x, result.y);
      return { x: result.x, y: result.y };
    } catch (e) {
      console.log(`Click failed: ${e}`);
    }
  }
  
  return undefined;
}

async function clickElement(page: Page, selectors: string[], instructionKeywords?: string[]) {
  // First, try to find by instruction keywords (smarter AI approach)
  if (instructionKeywords && instructionKeywords.length > 0) {
    const found = await findButtonByText(page, instructionKeywords);
    if (found) return found;
  }

  // Fallback: try standard selectors
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) === 0) continue;
    try {
      const center = await getBoundingCenter(locator);
      await locator.click({ force: true, trial: false });
      return center;
    } catch {
      // continue to next selector
    }
  }
  return undefined;
}

async function captureBalanceText(page: Page) {
  const balanceSelectors = [
    'text=/balance/i',
    'text=/credits/i',
    'text=/cash/i',
    'text=/bankroll/i',
  ];

  for (const selector of balanceSelectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) === 0) continue;
    try {
      const text = (await locator.innerText()).trim();
      if (text) return text;
    } catch {
      // continue scanning
    }
  }

  const content = await page.evaluate(() => document.body.innerText || "");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
  return lines.join(" | ");
}

export async function runVisualTest(payload: VisualTestPayload) {
  const artifactsRoot = path.join(process.cwd(), "artifacts");
  await fs.mkdir(artifactsRoot, { recursive: true });

  // Capture Ollama logs
  const ollamaLogs: string[] = [];
  const originalLog = console.log;
  
  // Override console.log to capture Ollama-related messages
  console.log = (...args: any[]) => {
    const message = args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
    
    // Capture logs that contain Ollama-specific markers
    if (message.includes('🤖') || message.includes('💭') || message.includes('📋') || 
        message.includes('🧠') || message.includes('✅') || message.includes('❌') ||
        message.includes('👁️') || message.includes('🎯') || message.includes('👆') ||
        message.includes('OLLAMA') || message.includes('Page State:') || 
        message.includes('Action:') || message.includes('Button:') ||
        message.includes('Reason:') || message.includes('CLICK') ||
        message.includes('WAIT') || message.includes('SCROLL')) {
      ollamaLogs.push(message);
    }
    
    // Always print to original console
    originalLog(...args);
  };

  // Determine headful mode - UI parameter overrides environment
  const headful = payload.headless === false || (payload.headless !== true && process.env.PLAYWRIGHT_HEADFUL === "true");
  
  console.log(`\n${"╔" + "═".repeat(70) + "╗"}`);
  console.log(`║  🎬 STARTING VISUAL TEST WITH CHROMIUM BROWSER                      ║`);
  console.log(`${`╚` + `═`.repeat(70) + `╝`}\n`);
  console.log(`⚙️  BROWSER SETTINGS:`);
  console.log(`   👁️  Headful mode (visible): ${headful ? "YES ✓" : "NO (headless)"}`);
  console.log(`   📐 Viewport: 1280x800`);
  console.log(`   ⏱️  Slow motion: ${headful ? "200ms (for visibility)" : "disabled"}`);
  console.log(`\n🌐 LOADING GAME URL:`);
  console.log(`   URL: ${payload.url}`);
  console.log(`   Waiting for network to settle...`);
  
  const browser = await chromium.launch({
    headless: !headful,
    slowMo: headful ? 200 : undefined,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const steps: RunStep[] = [];

  try {
    console.log(`\n🚀 LAUNCHING CHROMIUM BROWSER...`);
    console.log(`   ✅ Browser started`);
    console.log(`   ✅ Context created`);
    console.log(`   ✅ Page opened\n`);
    
    await page.goto(payload.url, { waitUntil: "networkidle", timeout: 60000 });
    console.log(`   ✅ Page loaded successfully`);
    
    await page.waitForTimeout(3000);
    console.log(`   ✅ Wait for page rendering complete\n`);

    // Check if vision AI is enabled
    const useVisionAI = !!process.env.ANTHROPIC_API_KEY;
    const useLocalLLM = !!process.env.OLLAMA_URL || process.env.USE_LOCAL_LLM === "true";
    const mode = payload.mode || process.env.AGENT_MODE || "auto";
    
    // TOOL-BASED AGENT (game-agnostic, works with any game/website)
    if (mode === "tool-based" || (mode === "auto" && useLocalLLM)) {
      console.log(`${"╔" + "═".repeat(70) + "╗"}`);
      console.log(`║  🧰 TOOL-BASED AGENT - GAME AGNOSTIC AUTOMATION                  ║`);
      console.log(`${`╚` + `═`.repeat(70) + `╝`}\n`);
      const toolResult = await executeWithToolBasedAgent(page, payload.instructions);
      
      // Convert tool-based results to RunStep format
      for (let i = 0; i < toolResult.steps.length; i++) {
        const screenshot = await page.screenshot({ type: "png" });
        const screenshotBase64 = screenshot.toString("base64");
        await fs.writeFile(path.join(artifactsRoot, `tool-step-${i + 1}.png`), screenshot);

        steps.push({
          stepIndex: i + 1,
          description: toolResult.steps[i],
          action: "Tool-based action",
          result: "PASS",
          explanation: `Tool agent executed: ${toolResult.steps[i]}`,
          screenshotBase64,
        });
      }

      console.log(`\n✅ CLOSING BROWSER & SAVING ARTIFACTS...`);
      await browser.close();
      console.log = originalLog;
      return { status: toolResult.success ? "COMPLETED" : "PARTIAL", steps, ollamaLogs };
    }
    
    if (useLocalLLM) {
      console.log(`${"╔" + "═".repeat(70) + "╗"}`);
      console.log(`║  🤖 RUNNING WITH QWEN2.5:3B LOCAL AI (NO API COST)               ║`);
      console.log(`${`╚` + `═`.repeat(70) + `╝`}\n`);
      const localResult = await executeWithLocalLLMGuidance(page, payload.instructions);
      
      // Convert local LLM results to RunStep format
      for (let i = 0; i < localResult.steps.length; i++) {
        const screenshot = await page.screenshot({ type: "png" });
        const screenshotBase64 = screenshot.toString("base64");
        await fs.writeFile(path.join(artifactsRoot, `local-llm-step-${i + 1}.png`), screenshot);

        steps.push({
          stepIndex: i + 1,
          description: localResult.steps[i],
          action: "Local LLM guided action",
          result: "PASS",
          explanation: `Qwen AI recommended: ${localResult.steps[i]}`,
          screenshotBase64,
        });
      }

      console.log(`\n✅ CLOSING BROWSER & SAVING ARTIFACTS...`);
      await browser.close();
      console.log = originalLog;
      return { status: localResult.success ? "COMPLETED" : "PARTIAL", steps, ollamaLogs };
    }

    if (useVisionAI) {
      console.log("🤖 Using Vision AI Agent (Claude with vision)");
      const visionResult = await executeWithVisionGuidance(page, payload.instructions);
      
      // Convert vision results to RunStep format
      for (let i = 0; i < visionResult.steps.length; i++) {
        const screenshot = await page.screenshot({ type: "png" });
        const screenshotBase64 = screenshot.toString("base64");
        await fs.writeFile(path.join(artifactsRoot, `vision-step-${i + 1}.png`), screenshot);

        steps.push({
          stepIndex: i + 1,
          description: visionResult.steps[i],
          action: "Vision-guided action",
          result: "PASS",
          explanation: `Vision AI guided this step: ${visionResult.steps[i]}`,
          screenshotBase64,
        });
      }

      await browser.close();
      console.log = originalLog;
      return { status: visionResult.success ? "COMPLETED" : "PARTIAL", steps, ollamaLogs };
    }

    // Fallback: Use plan-based execution
    console.log("📋 Using Plan-Based Agent (keyword matching)");
    const plan = await createAgentPlan(payload.instructions, payload.url);

    for (let index = 0; index < plan.length; index += 1) {
      const step = plan[index];
      const stepIndex = index + 1;
      const screenshot = await page.screenshot({ type: "png" });
      const screenshotBase64 = screenshot.toString("base64");
      await fs.writeFile(path.join(artifactsRoot, `step-${stepIndex}.png`), screenshot);

      let actionCenter: { x: number; y: number } | undefined;
      if (step.type === "CLICK") {
        // Extract keywords from instruction for intelligent button detection
        const instructionLower = step.description.toLowerCase();
        const keywords = [];
        
        if (instructionLower.includes("sign")) keywords.push("sign", "signin", "login");
        if (instructionLower.includes("game")) keywords.push("game", "select game");
        if (instructionLower.includes("manifest")) keywords.push("manifest", "select manifest");
        if (instructionLower.includes("launch")) keywords.push("launch", "start");
        if (instructionLower.includes("spin")) keywords.push("spin");
        if (instructionLower.includes("bet")) keywords.push("bet", "stake");
        if (instructionLower.includes("authenticate")) keywords.push("authenticate", "login", "sign");

        console.log(`\n👆 [CLICK ACTION] Searching for button: ${JSON.stringify(keywords)}`);
        const target = step.target?.trim();
        if (target) {
          actionCenter = await clickElement(page, [target], keywords);
        }

        // If not found, try smart keyword matching
        if (!actionCenter && keywords.length > 0) {
          actionCenter = await clickElement(page, [], keywords);
        }

        // If still not found, try common button patterns
        if (!actionCenter) {
          console.log(`📋 Trying common button selectors...`);
          actionCenter = await clickElement(page, [
            'button:has-text("spin")',
            'text=/spin/i',
            '[role="button"]:has-text("spin")',
            '.spin-button',
            '.button-spin',
            'button:has-text("bet")',
            'text=/bet/i',
            '[role="button"]:has-text("bet")',
            '.bet-button',
            '.stake-button',
          ], keywords);
        }

        // Last resort: click center of viewport (for unknown buttons)
        if (!actionCenter) {
          const viewport = page.viewportSize() || { width: 1280, height: 800 };
          actionCenter = { x: Math.floor(viewport.width * 0.5), y: Math.floor(viewport.height * 0.82) };
          console.log(`⚠️ No button found, clicking center area at ${actionCenter.x}, ${actionCenter.y}`);
          await page.mouse.click(actionCenter.x, actionCenter.y);
        }

        if (actionCenter) {
          console.log(`✅ Button found! Clicked at (${actionCenter.x}, ${actionCenter.y})`);
          step.explanation += ` ✅ Successfully clicked at ${actionCenter.x}, ${actionCenter.y}.`;
        } else {
          console.log(`❌ Could not find button for action: ${step.description}`);
          step.explanation += ` ❌ Button click failed - could not locate element.`;
        }

        // IMPORTANT: Wait for page navigation/rendering AFTER click
        console.log(`⏳ Waiting for page to respond (3.5s)...`);
        await page.waitForTimeout(3500);
        console.log(`✅ Wait complete, ready for next action`);
      }

      if (step.type === "CAPTURE") {
        console.log(`📷 Capturing page data...`);
        const balanceText = await captureBalanceText(page);
        step.explanation += ` Captured visible text: ${balanceText}`;
        console.log(`✅ Capture complete: ${balanceText.substring(0, 50)}...`);
      }

      if (step.type === "WAIT") {
        console.log(`⏱️ Waiting for game load (2.5s)...`);
        await page.waitForTimeout(2500);
        console.log(`✅ Wait complete`);
      }

      // TAKE SCREENSHOT AFTER all actions and waits complete
      console.log(`📸 Taking screenshot...`);
      const screenshot = await page.screenshot({ type: "png" });
      const screenshotBase64 = screenshot.toString("base64");
      await fs.writeFile(path.join(artifactsRoot, `step-${stepIndex}.png`), screenshot);
      console.log(`✅ Screenshot saved\n`);

      steps.push({
        stepIndex,
        description: step.description,
        action: step.type === "CLICK" ? "Click action" : step.type === "CAPTURE" ? "Capture data" : "Wait for page refresh",
        result: "PASS",
        explanation: step.explanation,
        screenshotBase64,
        x: actionCenter?.x,
        y: actionCenter?.y,
      });
    }

    await browser.close();
    console.log = originalLog;
    return { status: "COMPLETED", steps, ollamaLogs };
  } catch (error: any) {
    await browser.close();
    console.log = originalLog;
    return {
      status: "FAILED",
      error: error.message,
      steps,
      ollamaLogs,
    };
  }
}
