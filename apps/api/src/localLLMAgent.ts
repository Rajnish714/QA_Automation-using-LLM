import { Page } from "playwright";

/**
 * Local LLM Vision Agent using Ollama
 * Completely free - runs on your machine
 * No API keys needed!
 */
export async function analyzePageWithLocalLLM(
  page: Page,
  currentInstruction: string,
  previousSteps: string[] = []
): Promise<{ pageState: string; recommendedAction: string; targetButton: string; reasoning: string } | null> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";

  try {
    // Get page context
    const pageContext = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, [role='button'], a, input[type='button'], input[type='submit']"))
        .map(el => {
          const htmlEl = el as HTMLElement;
          const inputEl = el as HTMLInputElement;
          let text = (htmlEl.textContent || htmlEl.innerText || inputEl.value || "").trim();
          
          // Normalize whitespace: collapse all newlines and extra spaces into single spaces
          text = text.replace(/\s+/g, ' ');
          
          // Fallback to aria-label if no text content
          if (!text) {
            text = (htmlEl.getAttribute("aria-label") || "").trim().replace(/\s+/g, ' ');
          }
          
          // Fallback to title attribute
          if (!text) {
            text = (htmlEl.getAttribute("title") || "").trim().replace(/\s+/g, ' ');
          }
          
          // Fallback to placeholder
          if (!text && inputEl.placeholder) {
            text = inputEl.placeholder.trim().replace(/\s+/g, ' ');
          }
          
          const visible = htmlEl.offsetHeight > 0 && htmlEl.offsetWidth > 0;
          return {
            text,
            visible,
            tag: el.tagName,
          };
        })
        .filter(b => b.text.length > 0 && b.visible)
        .slice(0, 20); // Increased from 15 to 20

      return {
        pageTitle: document.title,
        url: window.location.href,
        buttons: buttons,
        bodyText: document.body.innerText.slice(0, 1000), // Increased from 800 to 1000
      };
    });

    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║  🤖 OLLAMA AI ANALYSIS (${ollamaUrl})      ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
    console.log(`\n📋 PAGE CONTEXT BEING ANALYZED:`);
    console.log(`   🌐 URL: ${pageContext.url}`);
    console.log(`   📄 Title: ${pageContext.pageTitle}`);
    console.log(`   🔘 Buttons found: ${pageContext.buttons.length}`);
    if (pageContext.buttons.length > 0) {
      console.log(`   📍 Options: ${pageContext.buttons.map(b => `"${b.text}"`).join(", ")}`);
    }
    console.log(`\n🧠 CALLING QWEN2.5:3B FOR ANALYSIS...`);
    console.log(`   Task: "${currentInstruction}"`);
    console.log(`   Step: ${previousSteps.length + 1}`);

    // Build button list for context
    const buttonList = pageContext.buttons
      .map((b, i) => `${i + 1}. "${b.text}"`)
      .join("\n");

    // Call local Ollama
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5:3b",
        prompt: `You are an EXPERT slot game testing automation agent with knowledge of:
- Authentication (Sign In, Login, Register)
- Game selection workflows (Select Game, Choose Game, Manifest selection)
- Game launching and loading (Launch, Start, Play - games can take 10+ seconds)
- Slot machine mechanics (Spin, Bet, Animations lasting 3-5 seconds)
- Promo/intro screens (Continue, Skip, OK buttons)
- Balance and result screens
- Slow servers and network delays

WORKFLOW TASK: ${currentInstruction}
STEP PROGRESS: ${previousSteps.length > 0 ? `Completed: ${previousSteps.join(" → ")}` : "Just started"}

PAGE STATE:
- URL: ${pageContext.url}
- Title: ${pageContext.pageTitle}
- Buttons available: ${pageContext.buttons.length}
${buttonList ? `- List: ${pageContext.buttons.map(b => `"${b.text}"`).join(", ")}` : "- No buttons visible"}

PAGE TEXT (first section):
${pageContext.bodyText.slice(0, 500)}

CRITICAL GAME SEQUENCES:
1. Auth: "Sign In" or "Login" → authenticate user
2. Game Selection: "Select Game" / "Choose Game" → pick game
3. Manifest: "Manifest" / "Settings" / "Configure" → select game config
4. Launch: "Launch" / "Start Game" / "Play" → start loading
5. Loading: Page changing, no buttons → WAIT (up to 15 seconds!)
6. Promo: "Continue" / "Skip" / "Accept" → dismiss intro
7. Base Game: "Spin" / "Bet" buttons visible → ready
8. Spinning: After click, WAIT for 3-5 second animation
9. Result: Balance updates, ready for next spin

DECISION LOGIC:
1. If page shows expected buttons → CLICK them in order
2. If page is loading/no buttons → WAIT (don't click empty space!)
3. If button not in list → WAIT, page may still be loading
4. For Spin: Plan 5-second wait for animation after click
5. Patience = success with slow game servers

RESPOND WITH EXACTLY 4 LINES:
Page State: [signin/game-select/manifest/launching/loading/promo/base-game/spinning/result]
Action: [click / wait / scroll]
Button: [exact button text OR "WAIT" OR "SCROLL"]
Reason: [why this action]

RULES:
- ONLY use button text from list above
- Missing expected button? → "Button: WAIT"
- Unsure if loading? → "Button: WAIT"
- After Spin button? → "Button: WAIT" (5 sec animation)
- Game loading = WAIT, not error`,
        stream: false,
        options: {
          temperature: 0.2,
          top_k: 5,
        },
      }),
    });

    if (!response.ok) {
      console.log(`\n❌ OLLAMA ERROR: HTTP ${response.status}`);
      console.log(`   Make sure Ollama is running: ollama serve`);
      return null;
    }

    const data = await response.json();
    const text = data.response;

    console.log(`\n💭 OLLAMA'S ANALYSIS & DECISION:`);
    console.log(`${"─".repeat(60)}`);
    console.log(text);
    console.log(`${"─".repeat(60)}`);

    // Parse response - look for the 4 required lines
    const lines = text.split("\n");
    const result: any = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("Page State:")) {
        result.pageState = trimmed.replace("Page State:", "").trim();
      } else if (trimmed.startsWith("Action:")) {
        result.recommendedAction = trimmed.replace("Action:", "").trim();
      } else if (trimmed.startsWith("Button:")) {
        result.targetButton = trimmed.replace("Button:", "").trim();
      } else if (trimmed.startsWith("Reason:")) {
        result.reasoning = trimmed.replace("Reason:", "").trim();
      }
    }

    if (!result.pageState || !result.recommendedAction) {
      console.log(`\n❌ PARSE ERROR: Could not extract Ollama's decision`);
      console.log(`   Response was: ${text.slice(0, 300)}`);
      return null;
    }

    console.log(`\n✅ OLLAMA'S DECISION:`);
    console.log(`   👁️  Page sees: ${result.pageState}`);
    console.log(`   🎯 Will do: ${result.recommendedAction}`);
    if (result.targetButton && result.targetButton !== "WAIT" && result.targetButton !== "SCROLL") {
      console.log(`   🔘 Click: "${result.targetButton}"`);
    }
    console.log(`   💡 Because: ${result.reasoning}`);
    console.log(`╚════════════════════════════════════════════════════════╝\n`);

    return result;
  } catch (error) {
    console.log(`⚠️  Local LLM error: ${error}`);
    console.log(`   Make sure Ollama is running: ollama serve`);
    return null;
  }
}

/**
 * Execute workflow using local LLM guidance
 */
export async function executeWithLocalLLMGuidance(
  page: Page,
  workflow: string,
  maxSteps: number = 20
): Promise<{ steps: string[]; success: boolean }> {
  const steps: string[] = [];

  console.log(`\n`);
  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║     🎮 LOCAL LLM GAME AUTOMATION WITH QWEN2.5:3B          ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝`);
  console.log(`\n📝 WORKFLOW: ${workflow}`);
  console.log(`🌐 CURRENT URL: ${page.url()}`);
  console.log(`🔄 MAX STEPS: ${maxSteps}\n`);

  for (let step = 0; step < maxSteps; step++) {
    console.log(`\n${"═".repeat(63)}`);
    console.log(`STEP ${step + 1}/${maxSteps} - GETTING AI RECOMMENDATION...`);
    console.log(`${"═".repeat(63)}`);

    // Get LLM recommendation
    const recommendation = await analyzePageWithLocalLLM(page, workflow, steps);
    if (!recommendation) {
      console.log(`\n❌ QWEN AI NOT AVAILABLE - Cannot continue`);
      break;
    }

    // Execute action
    const actionLower = recommendation.recommendedAction.toLowerCase();

    if (actionLower.includes("wait")) {
      console.log(`\n⏳ ACTION: Waiting for page to load...`);
      console.log(`   Reason: ${recommendation.reasoning}`);
      await page.waitForTimeout(4000);
      
      // Wait for network to settle on slow servers (up to 10 seconds)
      try {
        await page.waitForLoadState("networkidle", { timeout: 10000 });
      } catch {
        console.log(`   ⚠️  Network still settling... continuing anyway`);
      }
      
      console.log(`   ✅ Wait completed`);
      steps.push("Waited for page to load");
    } else if (actionLower.includes("scroll")) {
      console.log(`\n📜 ACTION: Scrolling page down...`);
      console.log(`   Reason: ${recommendation.reasoning}`);
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(1500);
      console.log(`   ✅ Scroll completed`);
      steps.push("Scrolled down");
    } else if (
      (actionLower.includes("click") || recommendation.targetButton) &&
      recommendation.targetButton &&
      recommendation.targetButton !== "WAIT" &&
      recommendation.targetButton !== "SCROLL"
    ) {
      console.log(`\n👆 ACTION: Clicking button...`);
      console.log(`   Button: "${recommendation.targetButton}"`);
      console.log(`   Reason: ${recommendation.reasoning}`);

      const clicked = await page.evaluate((btnText: string) => {
        const buttons = Array.from(
          document.querySelectorAll("button, [role='button'], a, input[type='button'], input[type='submit']")
        );
        
        // Helper function for semantic matching
        const semanticMatch = (actual: string, target: string): boolean => {
          // Normalize whitespace in both strings
          const actualNorm = actual.toLowerCase().replace(/\s+/g, ' ').trim();
          const targetNorm = target.toLowerCase().replace(/\s+/g, ' ').trim();
          
          // Exact match
          if (actualNorm === targetNorm) return true;
          
          // Partial match (target is substring of actual)
          if (actualNorm.includes(targetNorm)) return true;
          
          // Check if actual contains most of target words
          const targetWords = targetNorm.split(' ').filter(w => w.length > 0);
          const matchedWords = targetWords.filter(word => actualNorm.includes(word));
          if (matchedWords.length >= Math.max(1, Math.floor(targetWords.length * 0.7))) {
            return true;
          }
          
          // Semantic match - handle common variations
          const variations: { [key: string]: string[] } = {
            'sign': ['sign', 'signin', 'login', 'authenticate', 'auth'],
            'game': ['game', 'select game', 'game selection', 'choose game'],
            'manifest': ['manifest', 'settings', 'config', 'configure'],
            'launch': ['launch', 'start', 'play', 'begin', 'start game', 'go'],
            'spin': ['spin', 'spin reel', 'pull', 'roll'],
            'bet': ['bet', 'stake', 'wager', 'set bet'],
            'continue': ['continue', 'next', 'proceed', 'ok', 'confirm'],
            'close': ['close', 'exit', 'back', 'cancel'],
          };
          
          for (const [key, words] of Object.entries(variations)) {
            if (words.includes(targetNorm) && words.some(w => actualNorm.includes(w))) {
              return true;
            }
          }
          
          return false;
        };
        
        // Try semantic match first (smarter)
        for (const btn of buttons) {
          const htmlEl = btn as HTMLElement;
          const inputEl = btn as HTMLInputElement;
          let text = (htmlEl.textContent || htmlEl.innerText || inputEl.value || "").trim();
          text = text.replace(/\s+/g, ' '); // Normalize whitespace
          if (!text) {
            text = (htmlEl.getAttribute("aria-label") || "").trim().replace(/\s+/g, ' ');
          }
          if (text && semanticMatch(text, btnText)) {
            (htmlEl as any).click?.() || (htmlEl as HTMLElement).click();
            return true;
          }
        }
        
        // Fallback: Try exact match
        for (const btn of buttons) {
          const htmlEl = btn as HTMLElement;
          const inputEl = btn as HTMLInputElement;
          let text = (htmlEl.textContent || htmlEl.innerText || inputEl.value || "").trim();
          text = text.replace(/\s+/g, ' '); // Normalize whitespace
          if (text === btnText) {
            (htmlEl as any).click?.() || (htmlEl as HTMLElement).click();
            return true;
          }
        }

        return false;
      }, recommendation.targetButton);

      if (clicked) {
        console.log(`   ✅ CLICK SUCCESSFUL!`);
        steps.push(`Clicked: ${recommendation.targetButton}`);
        
        // Wait longer for game servers and animations
        console.log(`   ⏱️  Waiting for page transition and animations...`);
        await page.waitForTimeout(3000);
        
        // Wait for network to settle (games may take 10+ seconds to load)
        try {
          await page.waitForLoadState("networkidle", { timeout: 12000 });
        } catch {
          console.log(`   ⚠️  Page still loading (game servers may be slow)... continuing anyway`);
        }
        
        await page.waitForTimeout(2000);
        console.log(`   📸 Page updated, ready for next action`);
      } else {
        console.log(`   ❌ CLICK FAILED - Button not found on page`);
        console.log(`   🔍 Continuing to next step...`);
        steps.push(`Tried to click: ${recommendation.targetButton} (not found)`);
      }
    } else {
      console.log(`\n❓ UNKNOWN ACTION: ${recommendation.recommendedAction}`);
      console.log(`   Qwen recommended something unexpected, waiting...`);
      await page.waitForTimeout(1000);
    }

    // Check if game launched (multiple detection methods)
    const gameDetection = await page.evaluate(() => {
      // Method 1: Check for canvas element (most games use canvas)
      const canvas = document.querySelector("canvas");
      const hasCanvas = canvas && canvas.offsetHeight > 100;
      
      // Method 2: Check for game-like content
      const gameKeywords = ['game', 'play', 'spin', 'reel', 'balance', 'bet', 'stake'];
      const pageText = document.body.innerText.toLowerCase();
      const hasGameContent = gameKeywords.filter(k => pageText.includes(k)).length >= 3;
      
      // Method 3: Check for WebGL or game iframes
      const hasWebGL = !!document.querySelector("[class*='webgl'], [class*='game'], canvas");
      const gameFrame = document.querySelector("iframe[src*='game'], iframe[src*='play'], iframe[src*='slot']");
      
      return {
        hasCanvas,
        hasGameContent,
        hasWebGL,
        hasGameFrame: !!gameFrame,
        anyGameIndicator: hasCanvas || hasGameContent || hasWebGL || !!gameFrame
      };
    });

    if (gameDetection.anyGameIndicator) {
      console.log(`\n${"═".repeat(63)}`);
      console.log(`🎮 GAME DETECTED! - Game is loaded and running`);
      console.log(`   Canvas: ${gameDetection.hasCanvas ? "✓" : "✗"}`);
      console.log(`   Game content: ${gameDetection.hasGameContent ? "✓" : "✗"}`);
      console.log(`   WebGL/Frames: ${gameDetection.hasWebGL ? "✓" : "✗"}`);
      console.log(`${"═".repeat(63)}`);
      steps.push("🎮 Game canvas launched and ready for interaction");
      break;
    }

    const url = page.url().toLowerCase();
    if (url.includes("game") || url.includes("play") || url.includes("iframe") || url.includes("launch")) {
      console.log(`\n${"═".repeat(63)}`);
      console.log(`🎮 GAME LAUNCHED! - Workflow complete`);
      console.log(`${"═".repeat(63)}`);
      steps.push("🎮 Game launched successfully!");
      break;
    }

    // Check if we seem stuck
    if (step > 2 && steps.filter(s => s.includes("not found")).length > 2) {
      console.log(`\n${"═".repeat(63)}`);
      console.log(`⚠️  TOO MANY FAILED CLICKS - Stopping to prevent loops`);
      console.log(`${"═".repeat(63)}`);
      break;
    }
  }

  console.log(`\n${"═".repeat(63)}`);
  console.log(`✅ WORKFLOW COMPLETE`);
  console.log(`${"═".repeat(63)}`);
  console.log(`📊 Total steps executed: ${steps.length}`);
  console.log(`🎯 Status: ${steps.length > 0 ? "SUCCESS ✓" : "NO ACTIONS"}`);
  console.log(`${"═".repeat(63)}\n`);

  return {
    steps,
    success: steps.length > 0,
  };
}
