import fs from "fs/promises";
import path from "path";

/**
 * LEARNING & MEMORY SYSTEM
 * 
 * Stores test results and learns from them
 * - Tracks what works and what doesn't
 * - Identifies patterns in successes/failures
 * - Improves prompts based on learnings
 * - Persists knowledge between sessions
 */

export interface TestResult {
  id: string;
  testName: string;
  gameUrl: string;
  timestamp: number;
  success: boolean;
  steps: StepResult[];
  duration: number;
  errorMessage?: string;
  notes?: string;
}

export interface StepResult {
  stepNumber: number;
  action: string;
  success: boolean;
  duration: number;
  observation?: string;
  gameState?: {
    balance?: string;
    animationDetected?: boolean;
  };
}

export interface LearningData {
  gameUrl: string;
  gameType: string;
  successfulPatterns: {
    pattern: string;
    count: number;
    reliability: number; // 0-1
  }[];
  failedPatterns: {
    pattern: string;
    count: number;
    commonError?: string;
  }[];
  optimalWaits: {
    action: string;
    avgWaitMs: number;
    minMs: number;
    maxMs: number;
  }[];
  zoneCoordinates: {
    zoneName: string;
    coordinates: { x: number; y: number }[];
    average: { x: number; y: number };
  }[];
  aiPromptHistory: {
    timestamp: number;
    version: number;
    successRate: number;
    changes: string[];
  }[];
}

/**
 * Store test result to learning database
 */
export async function storeTestResult(
  result: TestResult,
  baseDir: string = "artifacts"
): Promise<void> {
  const resultsDir = path.join(baseDir, "test-results");
  await fs.mkdir(resultsDir, { recursive: true });

  const fileName = `result_${result.id}_${Date.now()}.json`;
  const filePath = path.join(resultsDir, fileName);

  await fs.writeFile(filePath, JSON.stringify(result, null, 2));
  console.log(`\n💾 Test result saved: ${fileName}`);
}

/**
 * Load all test results and analyze patterns
 */
export async function analyzeLearnings(
  gameUrl: string,
  baseDir: string = "artifacts"
): Promise<LearningData> {
  const resultsDir = path.join(baseDir, "test-results");
  let files: string[] = [];

  try {
    files = await fs.readdir(resultsDir);
  } catch {
    console.log(`\n⚠️ No previous test results found. Starting fresh.`);
    return {
      gameUrl,
      gameType: "unknown",
      successfulPatterns: [],
      failedPatterns: [],
      optimalWaits: [],
      zoneCoordinates: [],
      aiPromptHistory: [],
    };
  }

  const learning: LearningData = {
    gameUrl,
    gameType: "slot",
    successfulPatterns: [],
    failedPatterns: [],
    optimalWaits: [],
    zoneCoordinates: [],
    aiPromptHistory: [],
  };

  const results: TestResult[] = [];

  // Load all test results
  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(resultsDir, file), "utf-8");
      const result = JSON.parse(content);
      results.push(result);
    } catch {
      // Skip invalid files
    }
  }

  if (results.length === 0) {
    console.log(`\n📊 No analyzable results yet.`);
    return learning;
  }

  // ANALYZE PATTERNS
  const patterns = new Map<string, { count: number; successes: number }>();

  results.forEach((result) => {
    result.steps.forEach((step) => {
      const key = step.action.toLowerCase();
      if (!patterns.has(key)) {
        patterns.set(key, { count: 0, successes: 0 });
      }
      const p = patterns.get(key)!;
      p.count++;
      if (step.success) p.successes++;
    });
  });

  // Convert to successful/failed patterns
  patterns.forEach((stats, pattern) => {
    const reliability = stats.successes / stats.count;
    if (reliability > 0.7) {
      learning.successfulPatterns.push({
        pattern,
        count: stats.count,
        reliability,
      });
    } else if (reliability < 0.5) {
      learning.failedPatterns.push({
        pattern,
        count: stats.count,
        commonError: "Low success rate detected",
      });
    }
  });

  // ANALYZE OPTIMAL WAIT TIMES
  const waits = new Map<string, number[]>();

  results.forEach((result) => {
    result.steps.forEach((step) => {
      if (step.duration && step.success) {
        const key = step.action;
        if (!waits.has(key)) {
          waits.set(key, []);
        }
        waits.get(key)!.push(step.duration);
      }
    });
  });

  waits.forEach((durations, action) => {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    learning.optimalWaits.push({
      action,
      avgWaitMs: Math.round(avg),
      minMs: Math.min(...durations),
      maxMs: Math.max(...durations),
    });
  });

  console.log(`\n📊 LEARNING ANALYSIS:`);
  console.log(`   ✅ Successful patterns: ${learning.successfulPatterns.length}`);
  console.log(`   ❌ Failed patterns: ${learning.failedPatterns.length}`);
  console.log(`   ⏱️ Optimal waits analyzed: ${learning.optimalWaits.length}`);

  return learning;
}

/**
 * Generate improved Ollama prompt based on learnings
 */
export function generateImprovedPrompt(learning: LearningData): string {
  let prompt = `You are an expert game testing agent with accumulated knowledge.

LEARNED INSIGHTS FROM PREVIOUS TESTS:
───────────────────────────────────

WHAT WORKS WELL (High Success Rate):
${
  learning.successfulPatterns.length > 0
    ? learning.successfulPatterns
        .map(
          (p) =>
            `- "${p.pattern}" (${(p.reliability * 100).toFixed(0)}% success rate, ${p.count} times)`
        )
        .join("\n")
    : "- No strong patterns yet (learning in progress)"
}

PATTERNS TO AVOID (Low Success Rate):
${
  learning.failedPatterns.length > 0
    ? learning.failedPatterns
        .map((p) => `- "${p.pattern}" (failed ${p.count} times)`)
        .join("\n")
    : "- No problematic patterns detected"
}

OPTIMAL WAIT TIMES (from past tests):
${
  learning.optimalWaits.length > 0
    ? learning.optimalWaits
        .map((w) => `- "${w.action}": ${w.avgWaitMs}ms (range: ${w.minMs}-${w.maxMs}ms)`)
        .join("\n")
    : "- Default waits: 2000ms"
}

YOUR IMPROVED STRATEGY:
1. PREFER: Actions from successful patterns
2. AVOID: Actions from failed patterns  
3. USE: Optimal wait times from learned data
4. ADAPT: If pattern changes, notify operator
5. LEARN: Every test improves future tests

CURRENT TASK:
You will test a game. Apply learned insights:
- Use successful patterns when possible
- Avoid failed patterns
- Use optimal wait times
- Report any new findings

Remember: Each test makes future tests faster and more reliable!`;

  return prompt;
}

/**
 * Save learning data
 */
export async function saveLearning(
  learning: LearningData,
  baseDir: string = "artifacts"
): Promise<void> {
  const learningDir = path.join(baseDir, "learnings");
  await fs.mkdir(learningDir, { recursive: true });

  const gameUrlHash = learning.gameUrl.replace(/[^a-z0-9]/gi, "_").slice(0, 30);
  const fileName = `learning_${gameUrlHash}_${Date.now()}.json`;
  const filePath = path.join(learningDir, fileName);

  await fs.writeFile(filePath, JSON.stringify(learning, null, 2));
  console.log(`\n🧠 Learning data saved: ${fileName}`);
}

/**
 * Load latest learning data for a game
 */
export async function loadLatestLearning(
  gameUrl: string,
  baseDir: string = "artifacts"
): Promise<LearningData | null> {
  const learningDir = path.join(baseDir, "learnings");
  let files: string[] = [];

  try {
    files = await fs.readdir(learningDir);
  } catch {
    return null;
  }

  const gameUrlHash = gameUrl.replace(/[^a-z0-9]/gi, "_").slice(0, 30);
  const matchingFiles = files
    .filter((f) => f.includes(gameUrlHash))
    .sort()
    .reverse();

  if (matchingFiles.length === 0) return null;

  try {
    const content = await fs.readFile(
      path.join(learningDir, matchingFiles[0]),
      "utf-8"
    );
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Generate self-improving test instruction
 */
export function generateSelfImprovingInstruction(
  baseInstruction: string,
  learning?: LearningData
): string {
  if (!learning || learning.successfulPatterns.length === 0) {
    return baseInstruction;
  }

  let improved = baseInstruction;

  // Add successful patterns as guidance
  const successHints = learning.successfulPatterns
    .slice(0, 3)
    .map((p) => `- Try: ${p.pattern}`)
    .join("\n");

  if (successHints) {
    improved += `\n\nLEARNED BEST PRACTICES:\n${successHints}`;
  }

  // Add timing guidance
  const spinWait = learning.optimalWaits.find((w) =>
    w.action.toLowerCase().includes("spin")
  );
  if (spinWait) {
    improved += `\n\nOPTIMIZED TIMING:\n- After spin: wait ${spinWait.avgWaitMs}ms for animation`;
  }

  return improved;
}
