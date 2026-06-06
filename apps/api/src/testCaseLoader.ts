import * as fs from "fs";
import * as path from "path";

/**
 * Test Case Loader - Load and execute test cases from files
 * Supports: JSON, JSON Lines, YAML (plain text), Markdown
 */

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  steps: TestStep[];
  expectedResult?: string;
  tags?: string[];
}

export interface TestStep {
  action: string;
  target?: string;
  value?: string;
  waitTime?: number;
  expectedResult?: string;
}

export interface TestSuite {
  name: string;
  gameUrl: string;
  testCases: TestCase[];
  beforeEach?: TestStep[];
  afterEach?: TestStep[];
}

/**
 * Load test cases from file
 */
export async function loadTestCases(filePath: string): Promise<TestSuite> {
  console.log(`\n📂 Loading test cases from: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Test case file not found: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  let testSuite: TestSuite;

  switch (ext) {
    case ".json":
      testSuite = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      break;

    case ".jsonl":
      const lines = fs
        .readFileSync(filePath, "utf-8")
        .split("\n")
        .filter((l) => l.trim());
      testSuite = {
        name: "JSONL Test Suite",
        gameUrl: "",
        testCases: lines.map((line) => JSON.parse(line)),
      };
      break;

    case ".md":
    case ".txt":
      testSuite = parseMarkdownTestCases(
        fs.readFileSync(filePath, "utf-8"),
        filePath
      );
      break;

    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }

  console.log(`   ✅ Loaded suite: "${testSuite.name}"`);
  console.log(
    `   📋 Test cases: ${testSuite.testCases.length}`
  );

  return testSuite;
}

/**
 * Parse markdown format test cases
 */
function parseMarkdownTestCases(content: string, filePath: string): TestSuite {
  const lines = content.split("\n");
  const suite: TestSuite = {
    name: path.basename(filePath),
    gameUrl: "",
    testCases: [],
  };

  let currentTest: Partial<TestCase> | null = null;
  let currentSteps: TestStep[] = [];

  for (const line of lines) {
    // Title
    if (line.startsWith("# ")) {
      suite.name = line.slice(2).trim();
    }

    // Game URL
    if (line.includes("Game URL:") || line.includes("URL:")) {
      suite.gameUrl = line.split(":")[1]?.trim() || "";
    }

    // Test case header
    if (line.startsWith("## ")) {
      if (currentTest) {
        currentTest.steps = currentSteps;
        suite.testCases.push(currentTest as TestCase);
        currentSteps = [];
      }

      currentTest = {
        id: `test_${suite.testCases.length}`,
        name: line.slice(3).trim(),
        steps: [],
      };
    }

    // Description
    if (line.startsWith("**Description:**")) {
      if (currentTest) {
        currentTest.description = line
          .replace("**Description:**", "")
          .trim();
      }
    }

    // Steps
    if (line.match(/^\d+\.\s+/)) {
      const stepText = line.replace(/^\d+\.\s+/, "").trim();
      const step: TestStep = { action: stepText };

      // Parse action: target: value format
      if (stepText.includes(":")) {
        const [action, rest] = stepText.split(":", 1);
        step.action = action.trim();

        if (rest.includes(":")) {
          const [target, value] = rest.split(":", 1);
          step.target = target.trim();
          step.value = value.trim();
        } else {
          step.target = rest.trim();
        }
      }

      currentSteps.push(step);
    }
  }

  // Add last test
  if (currentTest) {
    currentTest.steps = currentSteps;
    suite.testCases.push(currentTest as TestCase);
  }

  return suite;
}

/**
 * Create example test case files
 */
export function createExampleTestCases(outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Example JSON test cases
  const jsonExample: TestSuite = {
    name: "Slot Game Spin Tests",
    gameUrl: "http://14.143.250.66:8786/starsgdk/workbench/index.html",
    testCases: [
      {
        id: "spin_1",
        name: "Single Spin Test",
        description: "Click spin button once and verify animation",
        steps: [
          { action: "click", target: "spin_button", waitTime: 500 },
          {
            action: "wait_for",
            target: "animation",
            waitTime: 3000,
            expectedResult: "Reel animation complete",
          },
          {
            action: "verify",
            target: "balance_changed",
            expectedResult: "Balance updated",
          },
        ],
        expectedResult: "Spin completed successfully",
        tags: ["smoke", "basic"],
      },
      {
        id: "spin_2",
        name: "Double Spin Test",
        description: "Click spin twice and verify results",
        steps: [
          { action: "click", target: "spin_button", waitTime: 500 },
          { action: "wait_for", target: "animation", waitTime: 3000 },
          { action: "click", target: "spin_button", waitTime: 500 },
          { action: "wait_for", target: "animation", waitTime: 3000 },
          { action: "verify", target: "result_displayed" },
        ],
        tags: ["sanity"],
      },
      {
        id: "spin_3",
        name: "Triple Spin Test",
        description: "Click spin three times and verify learning",
        steps: [
          { action: "click", target: "spin_button", waitTime: 500 },
          { action: "capture_state", target: "initial" },
          { action: "wait_for", target: "animation", waitTime: 3000 },
          { action: "click", target: "spin_button", waitTime: 500 },
          { action: "wait_for", target: "animation", waitTime: 3000 },
          { action: "click", target: "spin_button", waitTime: 500 },
          { action: "wait_for", target: "animation", waitTime: 3000 },
          { action: "capture_state", target: "final" },
          {
            action: "analyze_learning",
            expectedResult: "Pattern detected for 3 spins",
          },
        ],
        tags: ["learning", "stability"],
      },
    ],
  };

  fs.writeFileSync(
    path.join(outputDir, "test-cases.json"),
    JSON.stringify(jsonExample, null, 2)
  );

  console.log(
    `✅ Created example test cases: ${path.join(outputDir, "test-cases.json")}`
  );
}

/**
 * Convert test case to instruction string
 */
export function testCaseToInstruction(testCase: TestCase): string {
  let instruction = `Test: ${testCase.name}\n\n`;

  if (testCase.description) {
    instruction += `Description: ${testCase.description}\n\n`;
  }

  instruction += `Steps:\n`;
  testCase.steps.forEach((step, idx) => {
    instruction += `${idx + 1}. ${step.action}`;
    if (step.target) instruction += ` - ${step.target}`;
    if (step.value) instruction += ` - ${step.value}`;
    if (step.waitTime) instruction += ` (wait ${step.waitTime}ms)`;
    instruction += `\n`;
  });

  if (testCase.expectedResult) {
    instruction += `\nExpected Result: ${testCase.expectedResult}`;
  }

  return instruction;
}

/**
 * Format test suite for logging
 */
export function formatTestSuite(suite: TestSuite): string {
  let output = `\n${"═".repeat(70)}\n`;
  output += `║  📋 TEST SUITE: ${suite.name.padEnd(51)}  ║\n`;
  output += `${"═".repeat(70)}\n\n`;

  output += `🎮 Game URL: ${suite.gameUrl}\n`;
  output += `📝 Total Tests: ${suite.testCases.length}\n\n`;

  suite.testCases.forEach((tc, idx) => {
    output += `${idx + 1}. ${tc.name}\n`;
    output += `   ID: ${tc.id}\n`;
    if (tc.description) output += `   Description: ${tc.description}\n`;
    output += `   Steps: ${tc.steps.length}\n`;
    if (tc.tags) output += `   Tags: ${tc.tags.join(", ")}\n`;
    output += `\n`;
  });

  return output;
}
