import { Page } from "playwright";
import { TestResult, StepResult, storeTestResult, analyzeLearnings, saveLearning, loadLatestLearning, generateImprovedPrompt, generateSelfImprovingInstruction } from "./learningSystem";
import { GameSpecification, TestScenario, parseGameSpec, generateTestsFromSpec, scenarioToInstruction } from "./specParser";
import { CanvasZone, GameState, analyzeCanvasGame, captureGameState, clickCanvasZone, validateGameState } from "./canvasGameAnalyzer";

/**
 * INTELLIGENT GAME TESTING ORCHESTRATOR
 * 
 * Orchestrates: Spec parsing + Canvas analysis + Tool-based automation + Learning
 * Future-proof system that learns and improves over time
 */

export interface IntelligentTestConfig {
  gameUrl: string;
  specification?: string; // GDD or game spec text
  specFormat?: "markdown" | "json" | "plain";
  testScenarioId?: string; // Run specific scenario
  maxRetries?: number;
  enableLearning?: boolean;
  useLearnings?: boolean;
}

/**
 * Main intelligent test execution with learning
 */
export async function executeIntelligentTest(
  page: Page,
  config: IntelligentTestConfig
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    testName: "Intelligent Game Test",
    gameUrl: config.gameUrl,
    timestamp: Date.now(),
    success: false,
    steps: [],
    duration: 0,
  };

  console.log(`\n${"═".repeat(70)}`);
  console.log(`║  🧠 INTELLIGENT GAME TESTING WITH LEARNING                      ║`);
  console.log(`${"═".repeat(70)}\n`);

  try {
    // STEP 1: Load previous learnings
    let learning = null;
    if (config.useLearnings) {
      console.log(`\n📚 Loading previous learnings...`);
      learning = await loadLatestLearning(config.gameUrl);
      if (learning) {
        console.log(`   ✅ Found previous learning data`);
        console.log(
          `   📊 Successful patterns: ${learning.successfulPatterns.length}`
        );
        console.log(
          `   ⏱️ Optimal waits learned: ${learning.optimalWaits.length}`
        );
      } else {
        console.log(`   ℹ️ No previous learnings (first test)`);
      }
    }

    // STEP 2: Parse game specification
    let gameSpec: GameSpecification | null = null;
    let testScenarios: TestScenario[] = [];

    if (config.specification) {
      console.log(`\n📖 Parsing game specification...`);
      gameSpec = parseGameSpec(config.specification);
      console.log(`   ✅ Game: ${gameSpec.gameName} (${gameSpec.gameType})`);
      console.log(`   📋 Mechanics found: ${gameSpec.mechanics.length}`);
      console.log(`   🧪 Test scenarios found: ${gameSpec.testScenarios.length}`);

      // Generate tests from spec
      console.log(`\n🔧 Generating tests from specification...`);
      const generatedTests = generateTestsFromSpec(gameSpec);
      testScenarios = [...gameSpec.testScenarios, ...generatedTests];
      console.log(
        `   ✅ Total scenarios: ${testScenarios.length} (${gameSpec.testScenarios.length} manual + ${generatedTests.length} auto)`
      );
    }

    // STEP 3: Analyze canvas game
    console.log(`\n🎮 Analyzing canvas game...`);
    const canvasZones = await analyzeCanvasGame(page);
    console.log(`   ✅ Canvas zones detected: ${canvasZones.length}`);
    canvasZones.slice(0, 5).forEach((zone) => {
      console.log(`      - ${zone.label}: (${zone.centerX}, ${zone.centerY})`);
    });

    // STEP 4: Capture initial game state
    console.log(`\n📸 Capturing initial game state...`);
    const initialState = await captureGameState(page);
    console.log(`   ✅ Balance: ${initialState.balance || "N/A"}`);
    console.log(`   ✅ Bet: ${initialState.bet || "N/A"}`);
    console.log(`   ✅ Animating: ${initialState.isAnimating ? "YES" : "NO"}`);

    // STEP 5: Generate test instruction
    let testInstruction = "Test the game: click spin, verify balance changes";

    if (testScenarios.length > 0) {
      const scenario = testScenarios[0];
      testInstruction = scenarioToInstruction(scenario);
    }

    // STEP 6: Improve instruction with learnings
    if (learning && config.useLearnings) {
      console.log(`\n🧠 Applying learnings to improve test instructions...`);
      testInstruction = generateSelfImprovingInstruction(
        testInstruction,
        learning
      );
    }

    console.log(`\n📝 TEST INSTRUCTION:\n${testInstruction.slice(0, 200)}...`);

    // STEP 7: Execute test steps
    console.log(`\n⚙️ EXECUTING TEST STEPS...`);

    for (let step = 0; step < Math.min(5, canvasZones.length); step++) {
      const stepStart = Date.now();
      const zone = canvasZones[step];

      console.log(`\n   STEP ${step + 1}: ${zone.label}`);

      try {
        // Click zone
        const clicked = await clickCanvasZone(page, zone);

        // Capture resulting state
        const stepState = await captureGameState(page);

        // Validate state
        let validation: { valid: boolean; reasons: string[] } = { valid: true, reasons: [] };
        if (step > 0) {
          // Expect some change after interaction
          validation = validateGameState(stepState, {
            isAnimating: true, // Usually shows animation after click
          });
        }

        const stepDuration = Date.now() - stepStart;
        const stepResult: StepResult = {
          stepNumber: step + 1,
          action: zone.label,
          success: clicked && validation.valid,
          duration: stepDuration,
          observation: `Balance: ${stepState.balance}, Animating: ${stepState.isAnimating}`,
          gameState: {
            balance: stepState.balance,
            animationDetected: stepState.isAnimating,
          },
        };

        result.steps.push(stepResult);
        console.log(
          `      ✅ Success: ${stepResult.success} (${stepDuration}ms)`
        );
        console.log(
          `      📝 Observation: ${stepResult.observation}`
        );
      } catch (error) {
        result.steps.push({
          stepNumber: step + 1,
          action: zone.label,
          success: false,
          duration: Date.now() - stepStart,
          observation: `Error: ${error}`,
        });
      }
    }

    // STEP 8: Calculate results
    const successfulSteps = result.steps.filter((s) => s.success).length;
    result.success = successfulSteps === result.steps.length;
    result.duration = Date.now() - startTime;

    console.log(`\n${"─".repeat(70)}`);
    console.log(`📊 TEST RESULTS:`);
    console.log(`   ✅ Successful steps: ${successfulSteps}/${result.steps.length}`);
    console.log(`   ⏱️ Total duration: ${result.duration}ms`);
    console.log(
      `   🎯 Test status: ${result.success ? "PASSED ✅" : "PARTIAL ⚠️"}`
    );

    // STEP 9: Store and learn
    if (config.enableLearning !== false) {
      console.log(`\n💾 Storing test result for learning...`);
      await storeTestResult(result);

      console.log(`\n🧠 Analyzing patterns and learnings...`);
      const newLearning = await analyzeLearnings(config.gameUrl);
      await saveLearning(newLearning);

      console.log(`\n📈 IMPROVED PROMPT FOR NEXT TEST:`);
      const improvedPrompt = generateImprovedPrompt(newLearning);
      console.log(improvedPrompt.slice(0, 300) + "...\n");
    }

    return result;
  } catch (error) {
    result.errorMessage = `${error}`;
    result.duration = Date.now() - startTime;
    console.log(`\n❌ TEST ERROR: ${error}`);
    return result;
  }
}

/**
 * Extract GDD from various formats
 */
export async function loadGameSpecification(
  specPath: string
): Promise<string> {
  // This would load from file or URL
  // For now, return placeholder
  return `# Game Specification
  
## Mechanics
  
### Spin
Description: Player clicks spin button to initiate spin
Input: Click spin button, sufficient balance
Expected Output: Reels animate and stop, result displayed
Success Criteria: Reels stop after 2-5 seconds, result shows

### Bet Control  
Description: Player adjusts bet amount
Input: Click bet controls, valid bet amount
Expected Output: Bet updates, display refreshes
Success Criteria: Bet displays correct value`;
}
