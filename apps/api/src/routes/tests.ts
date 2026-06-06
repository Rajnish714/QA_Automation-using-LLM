import express, { Request, Response } from "express";
import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";
import {
  createTest,
  getAllTests,
  getTest,
  uploadTestsFromFile,
  deleteTest,
  updateTest,
} from "../customTestManager";
import { executeCustomTestWithLearning, formatTestResult } from "../advancedTestExecutor";
import {
  getLearningMetrics,
  saveLearningReport,
  getKBDirectory,
  addLearningRecord,
} from "../learningKnowledgeBase";
import { getEvidenceDirectory } from "../enhancedTestReporter";
import { createSession, getSession, getSessionState, executeSessionInstruction, closeSession, listSessionIds } from "../sessionManager";
import fetch from "node-fetch";

const router = express.Router();

/**
 * GET /api/tests/list - Get all custom tests
 */
router.get("/list", (req: Request, res: Response) => {
  try {
    const tests = getAllTests();
    res.json({
      status: "SUCCESS",
      tests,
      count: tests.length
    });
  } catch (error: any) {
    res.status(500).json({
      status: "ERROR",
      error: error.message
    });
  }
});

/**
 * POST /api/tests/create - Create a new custom test
 */
router.post("/create", (req: Request, res: Response) => {
  const { name, instructions, gameUrl } = req.body;

  if (!name || !instructions) {
    return res.status(400).json({
      status: "ERROR",
      error: "Missing required fields: name and instructions"
    });
  }

  try {
    const test = createTest(name, instructions, gameUrl || "");
    res.json({
      status: "SUCCESS",
      test
    });
  } catch (error: any) {
    res.status(500).json({
      status: "ERROR",
      error: error.message
    });
  }
});

/**
 * POST /api/tests/run/:testId - Run a custom test with learning and evidence
 */
router.post("/run/:testId", async (req: Request, res: Response) => {
  const { testId } = req.params;
  const { headless = false } = req.body;

  if (!testId) {
    return res.status(400).json({
      status: "ERROR",
      error: "Missing test ID"
    });
  }

  const test = getTest(testId);
  if (!test) {
    return res.status(404).json({
      status: "ERROR",
      error: "Test not found"
    });
  }

  let browser;
  try {
    console.log(`\n${"═".repeat(80)}`);
    console.log(`Starting test execution for: ${test.name}`);
    console.log(`${"═".repeat(80)}`);

    // Launch browser
    const headfulMode = !headless || process.env.PLAYWRIGHT_HEADFUL === "true";
    browser = await chromium.launch({
      headless: !headfulMode,
      slowMo: headfulMode ? 200 : undefined,
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    // Navigate to test URL if provided
    if (test.gameUrl) {
      console.log(`\nNavigating to: ${test.gameUrl}`);
      await page.goto(test.gameUrl, {
        waitUntil: "networkidle",
        timeout: 60000
      }).catch((err) => {
        console.log(`Navigation warning: ${err.message}`);
      });
      await page.waitForTimeout(2000);
    }

    // Execute test with learning and evidence capture
    const result = await executeCustomTestWithLearning(page, testId);

    // Close browser
    await context.close();
    await browser.close();

    // Return result with evidence path
    res.json({
      status: "SUCCESS",
      ...result,
      formattedOutput: formatTestResult(result)
    });
  } catch (error: any) {
    if (browser) {
      await browser.close().catch(() => { });
    }

    console.error(`Test execution error: ${error.message}`);
    res.status(500).json({
      status: "ERROR",
      testId,
      testName: test.name,
      error: error.message,
      success: false
    });
  }
});

/**
 * POST /api/tests/session/start - Start a persistent browser session for Ollama commands
 */
router.post("/session/start", async (req: Request, res: Response) => {
  const { url, headless = false } = req.body;
  if (!url) {
    return res.status(400).json({ status: "ERROR", error: "Missing url" });
  }

  try {
    const session = await createSession(url, headless);
    res.json({ status: "SUCCESS", sessionId: session.sessionId, state: session.state });
  } catch (error: any) {
    console.error(`Session start error: ${error.message}`);
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

/**
 * GET /api/tests/session/status/:sessionId - Get current session state
 */
router.get("/session/status/:sessionId", async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  try {
    const session = await getSession(sessionId);
    if (!session) {
      return res.status(404).json({ status: "ERROR", error: "Session not found" });
    }
    const state = await getSessionState(session);
    res.json({ status: "SUCCESS", state });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

/**
 * POST /api/tests/session/command/:sessionId - Send instruction to a live Ollama-controlled session
 */
router.post("/session/command/:sessionId", async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { instruction, maxSteps = 12 } = req.body;
  if (!instruction) {
    return res.status(400).json({ status: "ERROR", error: "Missing instruction" });
  }

  try {
    const result = await executeSessionInstruction(sessionId, instruction, maxSteps);
    res.json({ status: "SUCCESS", ...result });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

/**
 * POST /api/tests/session/close/:sessionId - Close a live session
 */
router.post("/session/close/:sessionId", async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  try {
    await closeSession(sessionId);
    res.json({ status: "SUCCESS", sessionId });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

/**
 * GET /api/tests/session/list - List active Ollama browser sessions
 */
router.get("/session/list", (req: Request, res: Response) => {
  try {
    res.json({ status: "SUCCESS", sessions: listSessionIds() });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

/**
 * GET /api/tests/evidence/list - List all test evidence files
 */
router.get("/evidence/list", (req: Request, res: Response) => {
  try {
    const evidenceDir = getEvidenceDirectory();
    const reportsDir = path.join(evidenceDir, "reports");
    const screenshotsDir = path.join(evidenceDir, "screenshots");

    let reports: string[] = [];
    let screenshots: string[] = [];

    if (fs.existsSync(reportsDir)) {
      reports = fs
        .readdirSync(reportsDir)
        .filter((f) => f.endsWith(".json") || f.endsWith(".md"));
    }

    if (fs.existsSync(screenshotsDir)) {
      screenshots = fs
        .readdirSync(screenshotsDir)
        .filter((f) => f.endsWith(".png"));
    }

    res.json({
      status: "SUCCESS",
      evidence: {
        reports,
        screenshots,
        reportsCount: reports.length,
        screenshotsCount: screenshots.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: "ERROR",
      error: error.message
    });
  }
});

/**
 * GET /api/tests/evidence/report/:reportId - Get specific evidence report
 */
router.get("/evidence/report/:reportId", (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const evidenceDir = getEvidenceDirectory();
    const reportsDir = path.join(evidenceDir, "reports");

    // Try JSON first, then markdown
    let reportPath = path.join(reportsDir, reportId);
    if (!fs.existsSync(reportPath) && !reportId.endsWith(".json")) {
      reportPath = path.join(reportsDir, `${reportId}.json`);
    }

    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        status: "ERROR",
        error: "Report not found"
      });
    }

    const content = fs.readFileSync(reportPath, "utf-8");
    const data = reportPath.endsWith(".json") ? JSON.parse(content) : content;

    res.json({
      status: "SUCCESS",
      report: data
    });
  } catch (error: any) {
    res.status(500).json({
      status: "ERROR",
      error: error.message
    });
  }
});

/**
 * GET /api/tests/learning/metrics - Get learning metrics and improvement trend
 */
router.get("/learning/metrics", (req: Request, res: Response) => {
  try {
    const metrics = getLearningMetrics();
    res.json({
      status: "SUCCESS",
      metrics
    });
  } catch (error: any) {
    res.status(500).json({
      status: "ERROR",
      error: error.message
    });
  }
});

/**
 * GET /api/tests/learning/report - Generate and download learning report
 */
router.get("/learning/report", (req: Request, res: Response) => {
  try {
    const reportPath = saveLearningReport();
    const content = fs.readFileSync(reportPath, "utf-8");

    res.json({
      status: "SUCCESS",
      report: content,
      savedAt: reportPath
    });
  } catch (error: any) {
    res.status(500).json({
      status: "ERROR",
      error: error.message
    });
  }
});

/**
 * DELETE /api/tests/:testId - Delete a custom test
 */
router.delete("/:testId", (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    if (!testId) {
      return res.status(400).json({ status: "ERROR", error: "Missing test ID" });
    }

    const ok = deleteTest(testId);
    if (!ok) {
      return res.status(404).json({ status: "ERROR", error: "Test not found or could not be deleted" });
    }

    res.json({ status: "SUCCESS", testId });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

/**
 * PUT /api/tests/:testId - Update a custom test
 */
router.put("/:testId", (req: Request, res: Response) => {
  try {
    const { testId } = req.params;
    const updates = req.body;

    if (!testId) {
      return res.status(400).json({ status: "ERROR", error: "Missing test ID" });
    }

    const updated = updateTest(testId, updates);
    if (!updated) {
      return res.status(404).json({ status: "ERROR", error: "Test not found or not updated" });
    }

    res.json({ status: "SUCCESS", test: updated });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

/**
 * POST /api/tests/convert - Convert freeform instructions into a test
 * Body: { name?, instructions, gameUrl? }
 */
router.post("/convert", (req: Request, res: Response) => {
  try {
    const { name, instructions, gameUrl } = req.body;
    if (!instructions) {
      return res.status(400).json({ status: "ERROR", error: "Missing instructions to convert" });
    }

    const testName = name || `Converted Test ${Date.now()}`;
    const test = createTest(testName, instructions, gameUrl || "");

    res.json({ status: "SUCCESS", test });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

/**
 * POST /api/tests/learning/teach - Submit a teaching/correction entry to KB
 * Body: { testName, whatWasAttempted, whatWorked, toolsUsed, canvasElements, successRate, improvements }
 */
router.post("/learning/teach", (req: Request, res: Response) => {
  try {
    const {
      testName = "manual-teach",
      whatWasAttempted = "",
      whatWorked = false,
      toolsUsed = [],
      canvasElements = [],
      successRate = 0,
      improvements = [],
      retry = 1,
    } = req.body;

    const record = addLearningRecord(
      testName,
      whatWasAttempted,
      !!whatWorked,
      Array.isArray(toolsUsed) ? toolsUsed : [],
      Array.isArray(canvasElements) ? canvasElements : [],
      Number(successRate) || 0,
      Array.isArray(improvements) ? improvements : [],
      Number(retry) || 1
    );

    res.json({ status: "SUCCESS", record });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

/**
 * GET /api/tests/evidence/screenshot/:screenshotId - Get specific screenshot
 */
router.get("/evidence/screenshot/:screenshotId", (req: Request, res: Response) => {
  try {
    const { screenshotId } = req.params;
    const evidenceDir = getEvidenceDirectory();
    const screenshotsDir = path.join(evidenceDir, "screenshots");
    const filePath = path.join(screenshotsDir, screenshotId);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: "ERROR",
        error: "Screenshot not found"
      });
    }

    // Send as image
    res.setHeader("Content-Type", "image/png");
    res.sendFile(filePath);
  } catch (error: any) {
    res.status(500).json({
      status: "ERROR",
      error: error.message
    });
  }
});

/**
 * DELETE /api/tests/evidence/report/:reportId - Delete a report file
 */
router.delete("/evidence/report/:reportId", (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const evidenceDir = getEvidenceDirectory();
    const reportsDir = path.join(evidenceDir, "reports");

    let reportPath = path.join(reportsDir, reportId);
    if (!fs.existsSync(reportPath) && !reportId.endsWith('.json')) {
      reportPath = path.join(reportsDir, `${reportId}.json`);
    }

    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ status: "ERROR", error: "Report not found" });
    }

    fs.unlinkSync(reportPath);
    res.json({ status: "SUCCESS", reportId });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

/**
 * DELETE /api/tests/evidence/screenshot/:screenshotId - Delete a screenshot file
 */
router.delete("/evidence/screenshot/:screenshotId", (req: Request, res: Response) => {
  try {
    const { screenshotId } = req.params;
    const evidenceDir = getEvidenceDirectory();
    const screenshotsDir = path.join(evidenceDir, "screenshots");
    const filePath = path.join(screenshotsDir, screenshotId);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: "ERROR", error: "Screenshot not found" });
    }

    fs.unlinkSync(filePath);
    res.json({ status: "SUCCESS", screenshotId });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

// Ollama support: model config, chat proxy, and context file upload/list
const modelConfigPath = path.join(process.cwd(), "ollama_model.json");
const contextDir = path.join(process.cwd(), "apps", "api", "ollama-context");

if (!fs.existsSync(contextDir)) {
  try {
    fs.mkdirSync(contextDir, { recursive: true });
  } catch (e: any) {
    console.warn("Could not create ollama-context dir:", e?.message);
  }
}

router.get("/ollama/model", (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(modelConfigPath)) return res.json({ status: "SUCCESS", model: null });
    const raw = fs.readFileSync(modelConfigPath, "utf-8");
    const j = JSON.parse(raw || "{}");
    res.json({ status: "SUCCESS", model: j.model || null });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

router.put("/ollama/model", (req: Request, res: Response) => {
  try {
    const { model } = req.body;
    if (!model) return res.status(400).json({ status: "ERROR", error: "Missing model" });
    fs.writeFileSync(modelConfigPath, JSON.stringify({ model }, null, 2), "utf-8");
    res.json({ status: "SUCCESS", model });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

router.post("/ollama/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ status: "ERROR", error: "Missing message" });

    let model = "qwen2.5:3b";
    if (fs.existsSync(modelConfigPath)) {
      try {
        const raw = fs.readFileSync(modelConfigPath, "utf-8");
        const j = JSON.parse(raw || "{}");
        if (j.model) model = j.model;
      } catch {}
    }

    let contextText = "";
    try {
      if (fs.existsSync(contextDir)) {
        const files = fs.readdirSync(contextDir).filter((f) => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json'));
        for (const f of files) {
          try {
            const content = fs.readFileSync(path.join(contextDir, f), 'utf-8');
            contextText += `\n--- ${f} ---\n` + content.substring(0, 4000);
          } catch {}
        }
      }
    } catch {}

    const prompt = `CONTEXT:\n${contextText}\n\nUSER: ${message}`;
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";

    const response = await fetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt }),
    }).catch(() => null as any);

    if (!response || !response.ok) {
      return res.json({ status: "SUCCESS", reply: `LOCAL_OLLAMA_UNAVAILABLE: Could not reach ${ollamaUrl}. Message received: ${message}` });
    }

    // Read body as text first so we can safely fallback when it's not valid JSON
    const bodyText = await response.text();
    // Attempt to parse as a single JSON object
    let reply = "";
    try {
      const json = JSON.parse(bodyText || "{}");
      reply = json?.results?.[0]?.output?.[0]?.content || json?.text || JSON.stringify(json);
    } catch (parseErr) {
      // Possibly a stream of JSON objects (one per line) — extract `response` fields if present
      const lines = String(bodyText).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const parts: string[] = [];
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          // Only include non-empty response fields (skip final done:true message with empty response)
          if (obj?.response && String(obj.response).trim()) parts.push(String(obj.response));
          else if (obj?.text) parts.push(String(obj.text));
        } catch {
          // Skip lines that aren't valid JSON
        }
      }
      reply = parts.join("").trim();
    }

    // Final cleanup: remove any trailing JSON that might have been concatenated
    reply = String(reply).replace(/\s*\{\s*"model"\s*:.*$/s, '').trim();

    res.json({ status: "SUCCESS", reply });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

router.get("/ollama/status", async (req: Request, res: Response) => {
  try {
    const base = process.env.OLLAMA_URL ? String(process.env.OLLAMA_URL).replace(/\/api\/.*$/, "") : "http://localhost:11434/";
    const resp = await fetch(base, { method: "GET" }).catch(() => null as any);
    if (!resp) return res.json({ status: "ERROR", available: false, info: `Could not reach ${base}` });
    const text = await resp.text().catch(() => "");
    res.json({ status: "SUCCESS", available: true, info: text });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

router.post("/ollama/upload", (req: Request, res: Response) => {
  try {
    const { filename, content } = req.body;
    if (!filename || !content) return res.status(400).json({ status: "ERROR", error: "Missing filename or content" });
    const safe = path.basename(filename);
    const dest = path.join(contextDir, safe);
    fs.writeFileSync(dest, content, 'utf-8');
    res.json({ status: "SUCCESS", file: safe });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

router.get("/ollama/context", (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(contextDir)) return res.json({ status: "SUCCESS", files: [] });
    const files = fs.readdirSync(contextDir).filter((f) => fs.statSync(path.join(contextDir, f)).isFile());
    res.json({ status: "SUCCESS", files });
  } catch (error: any) {
    res.status(500).json({ status: "ERROR", error: error.message });
  }
});

export default router;

