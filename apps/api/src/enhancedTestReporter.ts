import { Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface Screenshot {
  id: string;
  timestamp: string;
  step: string;
  filePath: string;
  base64: string;
  description: string;
}

export interface CanvasAnalysis {
  hasCanvas: boolean;
  canvasCount: number;
  canvasSize: string;
  elements: string[];
  textContent: string;
}

export interface ToolSelection {
  toolName: string;
  reason: string;
  success: boolean;
  attemptNumber: number;
  canvasElements: string[];
}

export interface TestEvidence {
  testId: string;
  testName: string;
  startTime: string;
  endTime: string;
  duration: number;
  screenshots: Screenshot[];
  canvasAnalysis: CanvasAnalysis;
  toolSelections: ToolSelection[];
  expectedVsActual: Array<{
    expected: string;
    actual: string;
    match: boolean;
  }>;
  errorLogs: string[];
  successMetrics: {
    screenshotsCaptured: number;
    toolsAttempted: number;
    canvasElementsFound: number;
    successRate: number;
  };
}

const EVIDENCE_DIR = path.join(process.cwd(), "artifacts", "test-evidence");

export async function initializeEvidenceDir() {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
}

/**
 * Capture screenshot and save evidence
 */
export async function captureScreenshotEvidence(
  page: Page,
  step: string,
  description: string,
  testId: string
): Promise<Screenshot> {
  try {
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const base64 = screenshotBuffer.toString("base64");

    const screenshotId = crypto.randomUUID();
    const fileName = `${testId}-step-${screenshotId}.png`;
    const filePath = path.join(EVIDENCE_DIR, "screenshots", fileName);

    // Create screenshots directory
    const screenshotsDir = path.join(EVIDENCE_DIR, "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Save full-size PNG
    fs.writeFileSync(filePath, screenshotBuffer);

    return {
      id: screenshotId,
      timestamp: new Date().toISOString(),
      step,
      filePath,
      base64,
      description
    };
  } catch (error: any) {
    console.error(`Screenshot capture failed: ${error.message}`);
    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      step,
      filePath: "N/A",
      base64: "",
      description: `Failed: ${error.message}`
    };
  }
}

/**
 * Analyze canvas elements on the page
 */
export async function analyzeCanvasElements(page: Page): Promise<CanvasAnalysis> {
  try {
    const canvasInfo = await page.evaluate(() => {
      const canvases = document.querySelectorAll("canvas");
      const elements: string[] = [];

      // Analyze canvas elements
      canvases.forEach((canvas: any) => {
        const rect = canvas.getBoundingClientRect();
        elements.push(
          `Canvas: ${rect.width}x${rect.height} at (${rect.x}, ${rect.y})`
        );
      });

      // Find interactive elements
      const buttons = document.querySelectorAll(
        "button, [role='button'], .btn, .button"
      );
      buttons.forEach((btn: any) => {
        const text = btn.textContent?.trim() || btn.getAttribute("aria-label") || "unnamed";
        elements.push(`Button: "${text}"`);
      });

      // Find input fields
      const inputs = document.querySelectorAll(
        "input, textarea, [contenteditable='true']"
      );
      inputs.forEach((input: any) => {
        elements.push(`Input: ${input.type || "text"}`);
      });

      // Get all text content
      const textContent = document.body.textContent || "";

      return {
        canvasCount: canvases.length,
        canvasSize:
          canvases.length > 0
            ? `${canvases[0].width}x${canvases[0].height}`
            : "N/A",
        elements,
        textContent: textContent.substring(0, 500)
      };
    });

    return {
      hasCanvas: canvasInfo.canvasCount > 0,
      canvasCount: canvasInfo.canvasCount,
      canvasSize: canvasInfo.canvasSize,
      elements: canvasInfo.elements,
      textContent: canvasInfo.textContent
    };
  } catch (error: any) {
    console.error(`Canvas analysis failed: ${error.message}`);
    return {
      hasCanvas: false,
      canvasCount: 0,
      canvasSize: "N/A",
      elements: [],
      textContent: `Error: ${error.message}`
    };
  }
}

/**
 * Create detailed test evidence report
 */
export function createTestEvidence(
  testId: string,
  testName: string
): TestEvidence {
  return {
    testId,
    testName,
    startTime: new Date().toISOString(),
    endTime: "",
    duration: 0,
    screenshots: [],
    canvasAnalysis: {
      hasCanvas: false,
      canvasCount: 0,
      canvasSize: "N/A",
      elements: [],
      textContent: ""
    },
    toolSelections: [],
    expectedVsActual: [],
    errorLogs: [],
    successMetrics: {
      screenshotsCaptured: 0,
      toolsAttempted: 0,
      canvasElementsFound: 0,
      successRate: 0
    }
  };
}

/**
 * Save test evidence to file
 */
export function saveTestEvidence(evidence: TestEvidence): string {
  const evidenceId = crypto.randomUUID();
  const fileName = `${evidence.testId}-evidence-${evidenceId}.json`;
  const filePath = path.join(EVIDENCE_DIR, "reports", fileName);

  // Create reports directory
  const reportsDir = path.join(EVIDENCE_DIR, "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Finalize metrics
  evidence.successMetrics.screenshotsCaptured = evidence.screenshots.length;
  evidence.successMetrics.toolsAttempted = evidence.toolSelections.length;
  evidence.successMetrics.canvasElementsFound =
    evidence.canvasAnalysis.elements.length;

  // Calculate success rate
  const successToolSelections = evidence.toolSelections.filter(
    (t) => t.success
  ).length;
  evidence.successMetrics.successRate =
    evidence.toolSelections.length > 0
      ? (successToolSelections / evidence.toolSelections.length) * 100
      : 0;

  // Calculate duration
  const endTime = new Date(evidence.endTime);
  const startTime = new Date(evidence.startTime);
  evidence.duration = endTime.getTime() - startTime.getTime();

  fs.writeFileSync(filePath, JSON.stringify(evidence, null, 2));

  console.log(`📋 Evidence saved: ${filePath}`);
  console.log(`   Screenshots: ${evidence.screenshots.length}`);
  console.log(`   Tools attempted: ${evidence.toolSelections.length}`);
  console.log(`   Success rate: ${evidence.successMetrics.successRate.toFixed(1)}%`);

  return filePath;
}

/**
 * Generate detailed test report
 */
export function generateTestReport(evidence: TestEvidence): string {
  const reportLines = [
    `# 📊 Test Execution Report`,
    `**Test:** ${evidence.testName}`,
    `**Test ID:** ${evidence.testId}`,
    `**Duration:** ${evidence.duration}ms`,
    `**Start Time:** ${evidence.startTime}`,
    `**End Time:** ${evidence.endTime}`,
    ``,
    `## 🎮 Canvas Analysis`,
    `- **Canvas Found:** ${evidence.canvasAnalysis.hasCanvas ? "✅ YES" : "❌ NO"}`,
    `- **Canvas Count:** ${evidence.canvasAnalysis.canvasCount}`,
    `- **Canvas Size:** ${evidence.canvasAnalysis.canvasSize}`,
    `- **Elements Found:** ${evidence.canvasAnalysis.elements.length}`,
    ``,
    `### Elements Detected:`,
    evidence.canvasAnalysis.elements
      .slice(0, 10)
      .map((e) => `  - ${e}`)
      .join("\n"),
    ``,
    `## 🛠️ Tools Selected & Used`,
    `**Total Tools Attempted:** ${evidence.toolSelections.length}`,
    `**Success Rate:** ${evidence.successMetrics.successRate.toFixed(1)}%`,
    ``,
    evidence.toolSelections
      .map(
        (tool, idx) =>
          `### Tool ${idx + 1}: ${tool.toolName}
  - **Attempt:** ${tool.attemptNumber}
  - **Reason:** ${tool.reason}
  - **Success:** ${tool.success ? "✅" : "❌"}
  - **Canvas Elements Available:** ${tool.canvasElements.length}`
      )
      .join("\n\n"),
    ``,
    `## 📸 Screenshots Captured`,
    `**Total Screenshots:** ${evidence.screenshots.length}`,
    ``,
    evidence.screenshots
      .map(
        (ss, idx) =>
          `### Screenshot ${idx + 1}: ${ss.step}
  - **Time:** ${ss.timestamp}
  - **Description:** ${ss.description}
  - **File:** screenshots/${ss.filePath.split("/").pop()}`
      )
      .join("\n\n"),
    ``,
    `## ✅/❌ Expected vs Actual`,
    evidence.expectedVsActual.length > 0
      ? evidence.expectedVsActual
          .map(
            (item) =>
              `- **Expected:** ${item.expected}\n  **Actual:** ${item.actual}\n  **Match:** ${item.match ? "✅" : "❌"}`
          )
          .join("\n\n")
      : "No comparisons recorded",
    ``,
    `## 🚨 Errors & Logs`,
    evidence.errorLogs.length > 0
      ? evidence.errorLogs.map((log) => `- ${log}`).join("\n")
      : "No errors recorded",
    ``,
    `## 📊 Success Metrics`,
    `- Screenshots Captured: ${evidence.successMetrics.screenshotsCaptured}`,
    `- Tools Attempted: ${evidence.successMetrics.toolsAttempted}`,
    `- Canvas Elements Found: ${evidence.successMetrics.canvasElementsFound}`,
    `- Success Rate: ${evidence.successMetrics.successRate.toFixed(1)}%`,
    ``
  ];

  return reportLines.join("\n");
}

/**
 * Save detailed test report
 */
export function saveDetailedReport(evidence: TestEvidence): string {
  const report = generateTestReport(evidence);
  const reportsDir = path.join(EVIDENCE_DIR, "reports");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(
    reportsDir,
    `${evidence.testId}-report-${Date.now()}.md`
  );
  fs.writeFileSync(reportPath, report);

  console.log(`✅ Detailed report saved: ${reportPath}`);
  return reportPath;
}

export function getEvidenceDirectory(): string {
  return EVIDENCE_DIR;
}
