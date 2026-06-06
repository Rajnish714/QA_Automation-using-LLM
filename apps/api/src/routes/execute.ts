import express, { Request, Response } from "express";
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { runVisualTest } from "../visualRunner";
import { runTestCaseDemo } from "../testCaseDemoRunner";
import {
  createTest,
  getAllTests,
  getTest,
  uploadTestsFromFile,
} from "../customTestManager";
import { executeCustomTestWithLearning, formatTestResult } from "../advancedTestExecutor";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { url, instructions, platform, headless } = req.body;
  if (!url || !instructions) {
    return res.status(400).json({ error: "Missing required fields: url and instructions." });
  }

  const result = await runVisualTest({
    url,
    instructions,
    platform: platform || "DESKTOP",
    headless: headless === true,
  });

  if (result.status === "FAILED") {
    return res.status(500).json(result);
  }

  return res.status(200).json(result);
});

// New endpoint for running test cases with learning demo
router.post("/test-case-demo", async (req: Request, res: Response) => {
  const { testCaseFile, spinCount = 3, headless = false } = req.body;
  
  if (!testCaseFile) {
    return res.status(400).json({ error: "Missing required field: testCaseFile" });
  }

  try {
    const result = await runTestCaseDemo(testCaseFile, spinCount, headless);
    return res.status(200).json({
      status: "SUCCESS",
      demo: result,
      message: "Test case demo completed with learning analysis"
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "ERROR",
      error: error.message,
      message: "Test case demo failed"
    });
  }
});

export default router;
