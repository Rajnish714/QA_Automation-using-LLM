import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

interface LearningRecord {
  id: string;
  testName: string;
  timestamp: string;
  whatWasAttempted: string;
  whatWorked: boolean;
  toolsUsed: string[];
  canvasElements: string[];
  successRate: number;
  improvements: string[];
  retry: number;
}

interface KnowledgeBase {
  id: string;
  createdAt: string;
  lastUpdated: string;
  records: LearningRecord[];
  patterns: {
    successfulTools: Map<string, number>;
    commonErrors: Map<string, number>;
    canvasPatterns: Map<string, number>;
  };
  metrics: {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageSuccessRate: number;
    improvementTrend: number[];
  };
}

const KB_DIR = path.join(process.cwd(), "artifacts", "knowledge-base");

export function initializeKB() {
  if (!fs.existsSync(KB_DIR)) {
    fs.mkdirSync(KB_DIR, { recursive: true });
  }
}

/**
 * Add a learning record to knowledge base
 */
export function addLearningRecord(
  testName: string,
  whatWasAttempted: string,
  whatWorked: boolean,
  toolsUsed: string[],
  canvasElements: string[],
  successRate: number,
  improvements: string[],
  retry: number = 1
): LearningRecord {
  const record: LearningRecord = {
    id: crypto.randomUUID(),
    testName,
    timestamp: new Date().toISOString(),
    whatWasAttempted,
    whatWorked,
    toolsUsed,
    canvasElements,
    successRate,
    improvements,
    retry
  };

  // Load existing KB or create new
  let kb = loadOrCreateKB();

  // Add record
  kb.records.push(record);
  kb.lastUpdated = new Date().toISOString();

  // Update patterns
  updatePatterns(kb, record);

  // Update metrics
  updateMetrics(kb);

  // Save KB
  saveKB(kb);

  console.log(`📚 Learning recorded: ${testName} (Success: ${whatWorked})`);

  return record;
}

/**
 * Get similar past learnings to apply to current test
 */
export function getPastLearnings(
  currentTestName: string,
  keywords: string[]
): LearningRecord[] {
  try {
    let kb = loadOrCreateKB();

    // Filter similar records
    const similar = kb.records.filter((record) => {
      const testMatch =
        record.testName.toLowerCase().includes(
          currentTestName.toLowerCase()
        ) ||
        currentTestName
          .toLowerCase()
          .includes(record.testName.toLowerCase());

      const keywordMatch = keywords.some(
        (kw) =>
          record.whatWasAttempted.toLowerCase().includes(kw.toLowerCase()) ||
          record.improvements.some((imp) =>
            imp.toLowerCase().includes(kw.toLowerCase())
          )
      );

      return testMatch || keywordMatch;
    });

    return similar.sort((a, b) => {
      // Sort by success first, then by recency
      if (a.whatWorked !== b.whatWorked) {
        return a.whatWorked ? -1 : 1;
      }
      return (
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    });
  } catch (error) {
    console.error(`Failed to get past learnings: ${error}`);
    return [];
  }
}

/**
 * Get learning metrics and improvement trend
 */
export function getLearningMetrics(): {
  totalAttempts: number;
  successRate: number;
  improvementTrend: number[];
  topTools: Array<{ tool: string; useCount: number; successRate: number }>;
  commonErrors: Array<{ error: string; count: number }>;
} {
  try {
    let kb = loadOrCreateKB();

    // Calculate top tools
    const topTools = Array.from(kb.patterns.successfulTools.entries())
      .map(([tool, count]) => {
        const records = kb.records.filter((r) => r.toolsUsed.includes(tool));
        const successful = records.filter((r) => r.whatWorked).length;
        return {
          tool,
          useCount: count,
          successRate:
            records.length > 0
              ? (successful / records.length) * 100
              : 0
        };
      })
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 5);

    // Calculate common errors
    const commonErrors = Array.from(kb.patterns.commonErrors.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAttempts: kb.metrics.totalAttempts,
      successRate: kb.metrics.averageSuccessRate,
      improvementTrend: kb.metrics.improvementTrend,
      topTools,
      commonErrors
    };
  } catch (error) {
    console.error(`Failed to get metrics: ${error}`);
    return {
      totalAttempts: 0,
      successRate: 0,
      improvementTrend: [],
      topTools: [],
      commonErrors: []
    };
  }
}

/**
 * Generate learning report
 */
export function generateLearningReport(): string {
  const kb = loadOrCreateKB();
  const metrics = getLearningMetrics();

  const lines = [
    `# 📚 Knowledge Base Learning Report`,
    `**Knowledge Base ID:** ${kb.id}`,
    `**Created:** ${kb.createdAt}`,
    `**Last Updated:** ${kb.lastUpdated}`,
    ``,
    `## 📊 Overall Metrics`,
    `- **Total Attempts:** ${kb.metrics.totalAttempts}`,
    `- **Successful:** ${kb.metrics.successfulAttempts}`,
    `- **Failed:** ${kb.metrics.failedAttempts}`,
    `- **Success Rate:** ${kb.metrics.averageSuccessRate.toFixed(1)}%`,
    ``,
    `## 📈 Improvement Trend`,
    metrics.improvementTrend.length > 0
      ? metrics.improvementTrend
          .map((rate, idx) => `  - Session ${idx + 1}: ${rate.toFixed(1)}%`)
          .join("\n")
      : "No trend data yet",
    ``,
    `## 🔧 Top Tools Used`,
    metrics.topTools.length > 0
      ? metrics.topTools
          .map(
            (tool) =>
              `- **${tool.tool}**: Used ${tool.useCount} times (${tool.successRate.toFixed(1)}% success)`
          )
          .join("\n")
      : "No tools recorded yet",
    ``,
    `## ❌ Common Errors`,
    metrics.commonErrors.length > 0
      ? metrics.commonErrors
          .map((err) => `- **${err.error}**: ${err.count} occurrences`)
          .join("\n")
      : "No errors recorded",
    ``,
    `## 📚 Recent Learning Records`,
    kb.records
      .slice(-5)
      .reverse()
      .map(
        (record) =>
          `### ${record.testName} (${new Date(record.timestamp).toLocaleString()})
- **Attempt:** ${record.retry}
- **What Was Attempted:** ${record.whatWasAttempted}
- **Result:** ${record.whatWorked ? "✅ SUCCESS" : "❌ FAILED"}
- **Tools Used:** ${record.toolsUsed.join(", ") || "None"}
- **Success Rate:** ${record.successRate.toFixed(1)}%
- **Improvements:** ${record.improvements.join("; ") || "None"}`
      )
      .join("\n\n"),
    ``
  ];

  return lines.join("\n");
}

/**
 * Save learning report
 */
export function saveLearningReport(): string {
  const report = generateLearningReport();
  const reportPath = path.join(KB_DIR, `learning-report-${Date.now()}.md`);

  fs.writeFileSync(reportPath, report);
  console.log(`📚 Learning report saved: ${reportPath}`);

  return reportPath;
}

// ============ Internal Functions ============

function loadOrCreateKB(): KnowledgeBase {
  const kbPath = path.join(KB_DIR, "knowledge-base.json");

  if (fs.existsSync(kbPath)) {
    const data = fs.readFileSync(kbPath, "utf-8");
    const kb = JSON.parse(data);

    // Convert Maps back from JSON
    kb.patterns.successfulTools = new Map(
      Object.entries(kb.patterns.successfulTools)
    );
    kb.patterns.commonErrors = new Map(
      Object.entries(kb.patterns.commonErrors)
    );
    kb.patterns.canvasPatterns = new Map(
      Object.entries(kb.patterns.canvasPatterns)
    );

    return kb;
  }

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    records: [],
    patterns: {
      successfulTools: new Map(),
      commonErrors: new Map(),
      canvasPatterns: new Map()
    },
    metrics: {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageSuccessRate: 0,
      improvementTrend: []
    }
  };
}

function updatePatterns(kb: KnowledgeBase, record: LearningRecord) {
  // Update tool patterns
  record.toolsUsed.forEach((tool) => {
    const count = kb.patterns.successfulTools.get(tool) || 0;
    kb.patterns.successfulTools.set(tool, count + 1);
  });

  // Update canvas patterns
  record.canvasElements.forEach((element) => {
    const count = kb.patterns.canvasPatterns.get(element) || 0;
    kb.patterns.canvasPatterns.set(element, count + 1);
  });
}

function updateMetrics(kb: KnowledgeBase) {
  const successful = kb.records.filter((r) => r.whatWorked).length;
  const failed = kb.records.filter((r) => !r.whatWorked).length;

  kb.metrics.totalAttempts = kb.records.length;
  kb.metrics.successfulAttempts = successful;
  kb.metrics.failedAttempts = failed;
  kb.metrics.averageSuccessRate =
    kb.records.length > 0
      ? (successful / kb.records.length) * 100
      : 0;

  // Calculate improvement trend (success rate per 5 attempts)
  kb.metrics.improvementTrend = [];
  for (let i = 0; i < kb.records.length; i += 5) {
    const batch = kb.records.slice(i, i + 5);
    const batchSuccess = batch.filter((r) => r.whatWorked).length;
    const batchRate = (batchSuccess / batch.length) * 100;
    kb.metrics.improvementTrend.push(batchRate);
  }
}

function saveKB(kb: KnowledgeBase) {
  const kbPath = path.join(KB_DIR, "knowledge-base.json");

  // Convert Maps to objects for JSON serialization
  const kbToSave = {
    ...kb,
    patterns: {
      successfulTools: Object.fromEntries(kb.patterns.successfulTools),
      commonErrors: Object.fromEntries(kb.patterns.commonErrors),
      canvasPatterns: Object.fromEntries(kb.patterns.canvasPatterns)
    }
  };

  fs.writeFileSync(kbPath, JSON.stringify(kbToSave, null, 2));
}

export function getKBDirectory(): string {
  return KB_DIR;
}
