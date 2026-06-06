import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * Manages custom tests: creation, storage, loading, execution
 */

export interface CustomTest {
  id: string;
  name: string;
  instructions: string;
  gameUrl: string;
  createdAt: string;
  tags?: string[];
}

export interface TestExecutionResult {
  testId: string;
  testName: string;
  success: boolean;
  duration: number;
  steps: any[];
  error?: string;
  retryAttempts?: RetryAttempt[];
  buttonFindingDebug?: ButtonFindingDebug;
  learningPatterns?: string[];
  ollamaDecisions?: OllamaDecision[];
  suggestions?: string[];
}

export interface RetryAttempt {
  attemptNumber: number;
  strategy: string;
  reason: string;
  success: boolean;
  actionTaken?: string;
}

export interface ButtonFindingDebug {
  totalButtons: number;
  ollamaFound: boolean;
  reason?: string;
  visibleButtons?: ButtonInfo[];
  targetButtonCoords?: { x: number; y: number };
  clickedCoords?: { x: number; y: number };
}

export interface ButtonInfo {
  selector: string;
  text: string;
  visible: boolean;
  x: number;
  y: number;
}

export interface OllamaDecision {
  action: string;
  reasoning: string;
  success: boolean;
}

const TESTS_DIR = path.join(__dirname, "../../artifacts/custom-tests");
const RESULTS_DIR = path.join(__dirname, "../../artifacts/test-results");

// Ensure directories exist
[TESTS_DIR, RESULTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Create a new custom test
 */
export function createTest(name: string, instructions: string, gameUrl: string): CustomTest {
  const test: CustomTest = {
    id: crypto.randomUUID(),
    name,
    instructions,
    gameUrl,
    createdAt: new Date().toISOString(),
    tags: []
  };

  const testPath = path.join(TESTS_DIR, `${test.id}.json`);
  fs.writeFileSync(testPath, JSON.stringify(test, null, 2));

  console.log(`✅ Test created: ${test.name} (ID: ${test.id})`);
  return test;
}

/**
 * Load all custom tests
 */
export function getAllTests(): CustomTest[] {
  if (!fs.existsSync(TESTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(TESTS_DIR).filter(f => f.endsWith(".json"));
  return files.map(file => {
    const content = fs.readFileSync(path.join(TESTS_DIR, file), "utf-8");
    return JSON.parse(content) as CustomTest;
  });
}

/**
 * Get a specific test
 */
export function getTest(testId: string): CustomTest | null {
  const testPath = path.join(TESTS_DIR, `${testId}.json`);
  if (!fs.existsSync(testPath)) {
    return null;
  }
  const content = fs.readFileSync(testPath, "utf-8");
  return JSON.parse(content) as CustomTest;
}

/**
 * Upload tests from a file (JSON, JSONL, or Markdown)
 */
export function uploadTestsFromFile(filePath: string): CustomTest[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();
  const uploadedTests: CustomTest[] = [];

  try {
    if (ext === ".json") {
      const data = JSON.parse(content);
      const tests = Array.isArray(data) ? data : data.testCases || [];
      tests.forEach((test: any) => {
        if (test.name && test.instructions) {
          uploadedTests.push(
            createTest(test.name, test.instructions, test.gameUrl || "")
          );
        }
      });
    } else if (ext === ".jsonl") {
      content
        .split("\n")
        .filter(line => line.trim())
        .forEach(line => {
          const test = JSON.parse(line);
          if (test.name && test.instructions) {
            uploadedTests.push(
              createTest(test.name, test.instructions, test.gameUrl || "")
            );
          }
        });
    } else if (ext === ".md" || ext === ".txt") {
      // Parse markdown test definitions
      const sections = content.split(/^## /m);
      sections.forEach(section => {
        const lines = section.split("\n");
        const name = lines[0].trim();
        if (name) {
          const instructions = lines.slice(1).join("\n").trim();
          if (instructions) {
            uploadedTests.push(
              createTest(name, instructions, "")
            );
          }
        }
      });
    }
  } catch (error) {
    console.error(`Error parsing test file: ${error}`);
  }

  return uploadedTests;
}

/**
 * Save test execution results for learning
 */
export function saveTestResult(result: TestExecutionResult): void {
  const fileName = `result_${result.testId}_${Date.now()}.json`;
  const filePath = path.join(RESULTS_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
}

/**
 * Get learning data from previous test runs
 */
export function getLearningData(testId: string): any {
  if (!fs.existsSync(RESULTS_DIR)) {
    return null;
  }

  const files = fs.readdirSync(RESULTS_DIR);
  const testResults = files
    .filter(f => f.includes(testId))
    .map(f => {
      const content = fs.readFileSync(path.join(RESULTS_DIR, f), "utf-8");
      return JSON.parse(content);
    });

  if (testResults.length === 0) {
    return null;
  }

  // Aggregate learning data
  const successCount = testResults.filter((r: any) => r.success).length;
  const successRate = (successCount / testResults.length) * 100;

  const patterns: Record<string, number> = {};
  testResults.forEach((r: any) => {
    if (r.learningPatterns) {
      r.learningPatterns.forEach((pattern: string) => {
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      });
    }
  });

  return {
    totalRuns: testResults.length,
    successRate,
    mostCommonPatterns: Object.entries(patterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern),
    averageDuration: testResults.reduce((sum: number, r: any) => sum + (r.duration || 0), 0) / testResults.length
  };
}

/**
 * Generate improvement suggestions based on test results
 */
export function generateSuggestions(result: TestExecutionResult): string[] {
  const suggestions: string[] = [];

  if (!result.success) {
    suggestions.push("Test failed. Consider breaking into smaller steps.");
  }

  if (result.retryAttempts && result.retryAttempts.length > 0) {
    suggestions.push(
      `Test required ${result.retryAttempts.length} retry attempts. ` +
      "Consider adding wait times or more descriptive selectors."
    );
  }

  if (result.buttonFindingDebug && !result.buttonFindingDebug.ollamaFound) {
    suggestions.push(
      "Ollama struggled to find buttons. " +
      "Consider using more specific instructions or visible text labels."
    );
  }

  if (result.duration > 30000) {
    suggestions.push(
      `Test took ${(result.duration / 1000).toFixed(1)}s. ` +
      "Consider optimizing step execution or adding parallel operations."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("✅ Test execution was successful. No improvements needed.");
  }

  return suggestions;
}

/**
 * Delete a test by ID
 */
export function deleteTest(testId: string): boolean {
  const testPath = path.join(TESTS_DIR, `${testId}.json`);
  if (fs.existsSync(testPath)) {
    fs.unlinkSync(testPath);
    console.log(`✅ Test deleted: ${testId}`);
    return true;
  }
  return false;
}

/**
 * Update a test by ID
 */
export function updateTest(testId: string, updates: Partial<CustomTest>): CustomTest | null {
  const test = getTest(testId);
  if (!test) {
    return null;
  }

  const updated: CustomTest = {
    ...test,
    ...updates,
    id: test.id, // prevent id change
    createdAt: test.createdAt // prevent date change
  };

  const testPath = path.join(TESTS_DIR, `${testId}.json`);
  fs.writeFileSync(testPath, JSON.stringify(updated, null, 2));
  console.log(`✅ Test updated: ${testId}`);
  return updated;
}
