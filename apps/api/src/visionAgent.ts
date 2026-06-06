import { Page } from "playwright";
import { Anthropic } from "@anthropic-ai/sdk";

export interface VisionAgentStep {
  pageState: string;
  recommendedAction: string;
  targetSelector: string;
  confidence: number;
  reasoning: string;
}

/**
 * Vision-powered agent that analyzes screenshots to understand page state
 * and make intelligent decisions about what to click/do next
 */
export async function analyzePageWithVision(
  page: Page,
  currentInstruction: string,
  previousSteps: string[] = []
): Promise<VisionAgentStep | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("No ANTHROPIC_API_KEY set - vision agent disabled");
    return null;
  }

  try {
    // Take screenshot and convert to base64
    const screenshot = await page.screenshot({ type: "jpeg" });
    const base64Screenshot = screenshot.toString("base64");

    // Get page text content for context
    const pageText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, [role='button'], a, input[type='button']"))
        .map(el => ({
          text: (el.textContent || (el as any).value || "").trim(),
          visible: (el as HTMLElement).offsetHeight > 0,
        }))
        .filter(b => b.text.length > 0 && b.visible);

      return {
        pageTitle: document.title,
        url: window.location.href,
        visibleButtons: buttons.slice(0, 15),
        bodyText: document.body.innerText.slice(0, 1000),
      };
    });

    // Create Claude client
    const client = new Anthropic();

    // Send to Claude with vision
    const prompt = `You are an intelligent game testing agent. Analyze this screenshot and determine what action to take next.

Current Instruction: ${currentInstruction}
Previous Steps Completed: ${previousSteps.length > 0 ? previousSteps.join(" -> ") : "None yet"}

Page Information:
- Title: ${pageText.pageTitle}
- URL: ${pageText.url}
- Visible Buttons: ${JSON.stringify(pageText.visibleButtons)}

Based on the screenshot and the current instruction, respond with ONLY valid JSON in this format:
{
  "pageState": "description of what you see on the page",
  "recommendedAction": "click button X" or "wait for page load" or "scroll down",
  "targetButton": "exact text of button to click, or empty string",
  "confidence": 0.0-1.0,
  "reasoning": "why this action makes sense"
}

Example response:
{"pageState": "Sign in page with email field", "recommendedAction": "click the Sign In button", "targetButton": "Sign In", "confidence": 0.95, "reasoning": "User wants to authenticate, Sign In button is clearly visible and clickable"}`;

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Screenshot,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    // Parse Claude's response
    const responseText = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("Could not extract JSON from vision agent response");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      pageState: parsed.pageState,
      recommendedAction: parsed.recommendedAction,
      targetSelector: parsed.targetButton,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error("Vision agent error:", error);
    return null;
  }
}

/**
 * Execute a full multi-step workflow using vision AI guidance
 */
export async function executeWithVisionGuidance(
  page: Page,
  workflow: string,
  maxSteps: number = 10
): Promise<{ steps: string[]; finalState: string; success: boolean }> {
  const steps: string[] = [];
  let currentStep = 0;

  console.log(`\n🤖 Starting vision-guided workflow: ${workflow}\n`);

  while (currentStep < maxSteps) {
    console.log(`\n--- Step ${currentStep + 1} ---`);

    // Get vision agent recommendation
    const visionStep = await analyzePageWithVision(page, workflow, steps);
    if (!visionStep) {
      console.log("Vision agent not available, using fallback");
      break;
    }

    console.log(`📸 Page State: ${visionStep.pageState}`);
    console.log(`🎯 Recommended: ${visionStep.recommendedAction}`);
    console.log(`💡 Reasoning: ${visionStep.reasoning}`);
    console.log(`🔍 Confidence: ${(visionStep.confidence * 100).toFixed(0)}%`);

    // If confidence is low, stop
    if (visionStep.confidence < 0.5) {
      console.log("⚠️ Confidence too low, stopping");
      break;
    }

    // Execute recommended action
    if (visionStep.recommendedAction.toLowerCase().includes("wait")) {
      console.log("⏳ Waiting for page to stabilize...");
      await page.waitForTimeout(2000);
      steps.push(`Waited for page load`);
    } else if (visionStep.recommendedAction.toLowerCase().includes("scroll")) {
      console.log("📜 Scrolling...");
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(1000);
      steps.push(`Scrolled down`);
    } else if (visionStep.recommendedAction.toLowerCase().includes("click") && visionStep.targetSelector) {
      console.log(`👆 Clicking: ${visionStep.targetSelector}`);

      // Try to find and click the button
      const found = await page.evaluate((buttonText: string) => {
        const buttons = Array.from(document.querySelectorAll("button, [role='button'], a, input[type='button']"));
        for (const btn of buttons) {
          const text = (btn.textContent || (btn as any).value || "").toLowerCase().trim();
          if (text.includes(buttonText.toLowerCase())) {
            (btn as HTMLElement).click();
            return true;
          }
        }
        return false;
      }, visionStep.targetSelector);

      if (found) {
        console.log(`✅ Clicked: ${visionStep.targetSelector}`);
        steps.push(`Clicked: ${visionStep.targetSelector}`);
        await page.waitForTimeout(3000);
      } else {
        console.log(`❌ Could not find button: ${visionStep.targetSelector}`);
        steps.push(`Failed to click: ${visionStep.targetSelector}`);
      }
    }

    currentStep++;

    // Check if we've reached a game screen
    const currentUrl = page.url();
    if (currentUrl.includes("game") || currentUrl.includes("iframe") || currentUrl.includes("play")) {
      console.log("🎮 Game screen detected!");
      steps.push("Game launched successfully");
      break;
    }
  }

  const finalScreenshot = await page.screenshot({ type: "png" });
  const finalState = await page.evaluate(() => ({
    url: window.location.href,
    title: document.title,
    bodyText: document.body.innerText.slice(0, 500),
  }));

  console.log(`\n✅ Vision-guided workflow completed in ${currentStep} steps`);

  return {
    steps,
    finalState: `URL: ${finalState.url}\nTitle: ${finalState.title}`,
    success: currentStep > 0,
  };
}
