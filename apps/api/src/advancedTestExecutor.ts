import { Page } from "playwright";
import {
  TestExecutionResult,
  RetryAttempt,
  ButtonFindingDebug,
  OllamaDecision,
  getTest,
  saveTestResult,
  getLearningData,
  generateSuggestions
} from "./customTestManager";
import { executeWithToolBasedAgent } from "./toolBasedAgent";
import { analyzeCanvasGame, captureGameState } from "./canvasGameAnalyzer";
import {
  initializeEvidenceDir,
  captureScreenshotEvidence,
  analyzeCanvasElements,
  createTestEvidence,
  saveTestEvidence,
  saveDetailedReport,
  TestEvidence
} from "./enhancedTestReporter";
import {
  initializeKB,
  addLearningRecord,
  getPastLearnings,
  getLearningMetrics
} from "./learningKnowledgeBase";

/**
 * Advanced test executor with learning, retry mechanism, and button-finding debug
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export async function executeCustomTestWithLearning(
  page: Page,
  testId: string
): Promise<TestExecutionResult & { evidencePath?: string; reportPath?: string }> {
  const test = getTest(testId);
  if (!test) {
    throw new Error(`Test not found: ${testId}`);
  }

  // Initialize evidence tracking and knowledge base
  initializeEvidenceDir();
  initializeKB();

  const evidence = createTestEvidence(testId, test.name);
  const result: TestExecutionResult = {
    testId,
    testName: test.name,
    success: false,
    duration: 0,
    steps: [],
    retryAttempts: [],
    learningPatterns: [],
    ollamaDecisions: [],
    suggestions: []
  };

  const startTime = Date.now();

  console.log(`\n${"═".repeat(80)}`);
  console.log(`║  🧪 EXECUTING CUSTOM TEST WITH LEARNING & EVIDENCE           ║`);
  console.log(`${"═".repeat(80)}\n`);
  console.log(`📋 Test: ${test.name}`);
  console.log(`🎮 URL: ${test.gameUrl || "Current page"}`);
  console.log(`📝 Instructions: ${test.instructions.substring(0, 100)}...`);
  console.log(`📸 Evidence will be captured to: artifacts/test-evidence/`);

  // Load previous learning data
  const learningData = getLearningData(testId);
  if (learningData) {
    console.log(`\n📚 PREVIOUS LEARNING DATA:`);
    console.log(`   Success Rate: ${learningData.successRate.toFixed(1)}%`);
    console.log(`   Total Runs: ${learningData.totalRuns}`);
    console.log(`   Avg Duration: ${learningData.averageDuration.toFixed(0)}ms`);
    if (learningData.mostCommonPatterns.length > 0) {
      console.log(`   Common Patterns: ${learningData.mostCommonPatterns.slice(0, 3).join(", ")}`);
    }
  }

  // Get related learnings from knowledge base
  const pastLearnings = getPastLearnings(test.name, test.instructions.split(" ").slice(0, 5));
  if (pastLearnings.length > 0) {
    console.log(`\n📖 Found ${pastLearnings.length} related past learning(s)`);
    pastLearnings.slice(0, 2).forEach(learning => {
      console.log(`   • ${learning.testName}: ${learning.whatWorked ? "✅" : "❌"}`);
    });
  }

  // Navigate to game if URL provided
  if (test.gameUrl) {
    console.log(`\n🌐 Navigating to: ${test.gameUrl}`);
    try {
      await page.goto(test.gameUrl, {
        waitUntil: "networkidle",
        timeout: 60000
      });
      console.log(`   ✅ Page loaded`);

      // Capture screenshot of loaded page
      const loadedScreenshot = await captureScreenshotEvidence(
        page,
        "page_loaded",
        "Initial page load screenshot",
        testId
      );
      evidence.screenshots.push(loadedScreenshot);
    } catch (error) {
      console.log(`   ⚠️ Navigation issue: ${error}`);
      evidence.errorLogs.push(`Navigation failed: ${error}`);
    }
  }

  // Analyze canvas and elements on page
  console.log(`\n🔍 Analyzing page canvas and elements...`);
  const canvasAnalysis = await analyzeCanvasElements(page);
  evidence.canvasAnalysis = canvasAnalysis;

  console.log(`   Canvas detected: ${canvasAnalysis.hasCanvas ? "✅ YES" : "❌ NO"}`);
  console.log(`   Total elements found: ${canvasAnalysis.elements.length}`);
  canvasAnalysis.elements.slice(0, 3).forEach(elem => {
    console.log(`     • ${elem}`);
  });

  // Analyze buttons on page
  console.log(`\n🔘 Analyzing buttons...`);
  const buttonFindingDebug = await analyzeButtonsOnPage(page);
  result.buttonFindingDebug = buttonFindingDebug;

  console.log(`   Found ${buttonFindingDebug.totalButtons} buttons`);
  buttonFindingDebug.visibleButtons?.slice(0, 3).forEach(btn => {
    console.log(`     • "${btn.text}" at (${btn.x}, ${btn.y})`);
  });

  // Execute test with retry logic
  let lastError: Error | null = null;
  let attemptedTools: string[] = [];

  for (let attemptNum = 0; attemptNum < MAX_RETRIES; attemptNum++) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`ATTEMPT ${attemptNum + 1} OF ${MAX_RETRIES}`);
    console.log(`${"─".repeat(80)}`);

    try {
      // Capture initial state
      console.log(`\n📸 Capturing initial game state...`);
      const initialState = await captureGameState(page);
      console.log(`   Balance: ${initialState.balance || "unknown"}`);
      console.log(`   Animating: ${initialState.isAnimating}`);

      // Record expected state
      evidence.expectedVsActual.push({
        expected: `Initial state: Balance=${initialState.balance}`,
        actual: "",
        match: false
      });

      // Build enhanced prompt with learning data
      let enhancedInstructions = test.instructions;
      if (learningData) {
        enhancedInstructions += `\n\nLEARNED CONTEXT:\nPrevious success rate: ${learningData.successRate.toFixed(1)}%\nAverage duration: ${learningData.averageDuration.toFixed(0)}ms`;
        if (learningData.mostCommonPatterns.length > 0) {
          enhancedInstructions += `\nSuccessful patterns: ${learningData.mostCommonPatterns.join(", ")}`;
        }
      }

      // Execute with Ollama/tool-based agent
      console.log(`\n🤖 Executing instructions with Ollama...`);
      const toolName = `tool_attempt_${attemptNum + 1}`;
      attemptedTools.push(toolName);

      const agentResult = await executeWithToolBasedAgent(page, enhancedInstructions);

      // Record tool selection
      evidence.toolSelections.push({
        toolName,
        reason: `Attempt ${attemptNum + 1} to execute: ${test.instructions.substring(0, 50)}...`,
        success: agentResult.success || false,
        attemptNumber: attemptNum + 1,
        canvasElements: canvasAnalysis.elements
      });

      // Record Ollama decision from steps
      if (agentResult.steps && Array.isArray(agentResult.steps)) {
        agentResult.steps.forEach((step: string) => {
          result.ollamaDecisions?.push({
            action: step.substring(0, 50) || "unknown",
            reasoning: step,
            success: true
          });
        });
      }

      // Capture screenshot after execution
      const afterExecScreenshot = await captureScreenshotEvidence(
        page,
        `execution_step_${attemptNum + 1}`,
        `State after attempting step execution (attempt ${attemptNum + 1})`,
        testId
      );
      evidence.screenshots.push(afterExecScreenshot);

      // Capture final state
      console.log(`\n📸 Capturing final game state...`);
      const finalState = await captureGameState(page);
      console.log(`   Balance: ${finalState.balance || "unknown"}`);
      console.log(`   Animating: ${finalState.isAnimating}`);

      // Record actual state
      evidence.expectedVsActual[evidence.expectedVsActual.length - 1].actual = `Final state: Balance=${finalState.balance}`;
      evidence.expectedVsActual[evidence.expectedVsActual.length - 1].match = initialState.balance !== finalState.balance;

      // Check success
      const stateChanged = initialState.balance !== finalState.balance;
      result.success = stateChanged || agentResult.success;

      if (result.success) {
        console.log(`\n✅ TEST PASSED`);
        result.learningPatterns?.push("successful_execution");
        break;
      } else {
        throw new Error("Game state did not change");
      }
    } catch (error: any) {
      lastError = error;
      const strategy = getRetryStrategy(attemptNum);

      console.log(`\n❌ Attempt failed: ${error.message}`);
      console.log(`   Strategy for retry: ${strategy}`);

      evidence.errorLogs.push(`Attempt ${attemptNum + 1} failed: ${error.message}`);

      result.retryAttempts?.push({
        attemptNumber: attemptNum + 1,
        strategy,
        reason: error.message,
        success: false
      });

      // Capture screenshot of failure state
      const failureScreenshot = await captureScreenshotEvidence(
        page,
        `failure_step_${attemptNum + 1}`,
        `Page state after failed attempt ${attemptNum + 1}`,
        testId
      );
      evidence.screenshots.push(failureScreenshot);

      // Apply retry strategy
      if (attemptNum < MAX_RETRIES - 1) {
        await applyRetryStrategy(page, strategy);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
      }
    }
  }

  // Detect patterns learned
  console.log(`\n🧠 Analyzing patterns learned...`);
  const patterns = detectLearningPatterns(
    result,
    buttonFindingDebug,
    learningData
  );
  result.learningPatterns = patterns;

  patterns.forEach(pattern => {
    console.log(`   💡 ${pattern}`);
  });

  // Generate suggestions
  result.suggestions = generateSuggestions(result);

  // Finalize evidence
  evidence.endTime = new Date().toISOString();
  result.duration = Date.now() - startTime;

  console.log(`\n⏱️ Total Duration: ${result.duration}ms`);

  // Record learning in knowledge base
  const improvements = result.suggestions?.slice(0, 3) || [];
  addLearningRecord(
    test.name,
    `Attempted: ${test.instructions.substring(0, 50)}`,
    result.success,
    attemptedTools,
    canvasAnalysis.elements,
    result.success ? 100 : ((MAX_RETRIES - (result.retryAttempts?.length || 0)) / MAX_RETRIES) * 100,
    improvements,
    (result.retryAttempts?.length || 0) + 1
  );

  // Save results and evidence
  saveTestResult(result);
  const evidencePath = saveTestEvidence(evidence);
  saveDetailedReport(evidence);

  console.log(`\n💾 Results, evidence, and learning saved`);
  console.log(`   Evidence: artifacts/test-evidence/reports/`);
  console.log(`   Screenshots: artifacts/test-evidence/screenshots/`);

  console.log(`\n${"═".repeat(80)}`);
  console.log(`EXECUTION COMPLETE - ${result.success ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`${"═".repeat(80)}\n`);

  return {
    ...result,
    evidencePath
  };
}

/**
 * Analyze buttons on the current page
 */
async function analyzeButtonsOnPage(page: Page): Promise<ButtonFindingDebug> {
  const buttons = await page.evaluate(() => {
    const btns: any[] = [];
    document.querySelectorAll("button, input[type='button'], [role='button']").forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        btns.push({
          selector: el.tagName.toLowerCase(),
          text: el.textContent?.substring(0, 50) || "no-text",
          visible: rect.top >= 0 && rect.left >= 0,
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2)
        });
      }
    });
    return btns;
  });

  return {
    totalButtons: buttons.length,
    ollamaFound: buttons.length > 0,
    visibleButtons: buttons.slice(0, 10),
    reason: buttons.length === 0 ? "No buttons found on page (possibly canvas-based game)" : undefined
  };
}

/**
 * Get retry strategy based on attempt number
 */
function getRetryStrategy(attemptNum: number): string {
  const strategies = [
    "Waiting longer for page load",
    "Refreshing page and retrying with clearer selectors",
    "Zooming/scrolling to find elements"
  ];
  return strategies[attemptNum] || "Giving up - too many failures";
}

/**
 * Apply retry strategy
 */
async function applyRetryStrategy(page: Page, strategy: string): Promise<void> {
  console.log(`\n🔄 Applying retry strategy: ${strategy}`);

  if (strategy.includes("Waiting")) {
    console.log(`   ⏳ Waiting 2000ms...`);
    await page.waitForTimeout(2000);
  } else if (strategy.includes("Refreshing")) {
    console.log(`   🔄 Refreshing page...`);
    await page.reload({ waitUntil: "networkidle" }).catch(() => {});
  } else if (strategy.includes("Zooming")) {
    console.log(`   🔍 Adjusting viewport and scrolling...`);
    await page.evaluate(() => {
      window.scrollBy(0, 100);
    });
  }
}

/**
 * Detect patterns learned from this execution
 */
function detectLearningPatterns(
  result: TestExecutionResult,
  buttonDebug: ButtonFindingDebug,
  previousLearning: any
): string[] {
  const patterns: string[] = [];

  if (result.success) {
    patterns.push("Success: Test completed without retries");
  }

  if (result.retryAttempts && result.retryAttempts.length > 0) {
    patterns.push(`Required ${result.retryAttempts.length} retry attempts`);
    patterns.push(`Retry strategies used: ${result.retryAttempts.map(r => r.strategy).join(", ")}`);
  }

  if (buttonDebug.totalButtons === 0) {
    patterns.push("Game uses canvas-based rendering (no DOM buttons)");
  } else if (buttonDebug.ollamaFound && !result.success) {
    patterns.push("Button found but action ineffective - may need different interaction");
  }

  if (result.duration > 20000) {
    patterns.push("Slow test execution - may need longer waits between steps");
  }

  if (previousLearning && result.success && previousLearning.successRate < 70) {
    patterns.push("Improvement: Success rate increased from previous runs");
  }

  return patterns;
}

/**
 * Format test result for display
 */
export function formatTestResult(result: TestExecutionResult): string {
  const lines: string[] = [];

  lines.push(`${"═".repeat(80)}`);
  lines.push(`TEST: ${result.testName}`);
  lines.push(`STATUS: ${result.success ? "✅ PASSED" : "❌ FAILED"}`);
  lines.push(`DURATION: ${result.duration}ms`);
  lines.push(`${"═".repeat(80)}`);

  if (result.retryAttempts && result.retryAttempts.length > 0) {
    lines.push(`\nRETRY ATTEMPTS: ${result.retryAttempts.length}`);
    result.retryAttempts.forEach((attempt, idx) => {
      lines.push(`  ${idx + 1}. ${attempt.strategy}`);
      lines.push(`     Reason: ${attempt.reason}`);
    });
  }

  if (result.buttonFindingDebug) {
    lines.push(`\nBUTTON ANALYSIS:`);
    lines.push(`  Total Found: ${result.buttonFindingDebug.totalButtons}`);
    lines.push(`  Ollama Identified: ${result.buttonFindingDebug.ollamaFound ? "YES" : "NO"}`);
    if (result.buttonFindingDebug.reason) {
      lines.push(`  Issue: ${result.buttonFindingDebug.reason}`);
    }
  }

  if (result.learningPatterns && result.learningPatterns.length > 0) {
    lines.push(`\nPATTERNS LEARNED:`);
    result.learningPatterns.forEach(pattern => {
      lines.push(`  💡 ${pattern}`);
    });
  }

  if (result.suggestions && result.suggestions.length > 0) {
    lines.push(`\nIMPROVEMENT SUGGESTIONS:`);
    result.suggestions.forEach(suggestion => {
      lines.push(`  📝 ${suggestion}`);
    });
  }

  return lines.join("\n");
}
