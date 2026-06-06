import { chromium } from "playwright";
import { loadTestCases, formatTestSuite } from "./testCaseLoader";
import { executeTestCaseDemo, saveDemoResults } from "./testCaseDemo";
import * as path from "path";
import * as fs from "fs";

/**
 * Main entry point for running test case demo from API
 */
export async function runTestCaseDemo(
  testCaseFilePath: string,
  spinCount: number = 3,
  headless: boolean = false
) {
  let browser;

  try {
    // Resolve file path
    let resolvedPath = testCaseFilePath;
    if (!fs.existsSync(resolvedPath)) {
      resolvedPath = path.join(process.cwd(), testCaseFilePath);
    }
    if (!fs.existsSync(resolvedPath)) {
      resolvedPath = path.resolve(__dirname, "../../..", testCaseFilePath);
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Test case file not found: ${testCaseFilePath}`);
    }

    console.log(`\n${"═".repeat(80)}`);
    console.log(`║  📋 TEST CASE DEMO RUNNER - COMPREHENSIVE GAME TESTING WITH LEARNING  ║`);
    console.log(`${"═".repeat(80)}\n`);

    const testSuite = await loadTestCases(resolvedPath);
    console.log(formatTestSuite(testSuite));

    // Launch browser
    console.log(`\n🚀 Launching Chromium browser...`);
    const headfulMode = !headless || process.env.PLAYWRIGHT_HEADFUL === "true";

    browser = await chromium.launch({
      headless: !headfulMode,
      slowMo: headfulMode ? 200 : undefined,
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    console.log(`   ✅ Browser launched (headless: ${!headfulMode})`);
    console.log(`   ✅ Context created`);
    console.log(`   ✅ Page opened\n`);

    // Navigate to game
    console.log(`\n🌐 Navigating to game URL...`);
    console.log(`   URL: ${testSuite.gameUrl}`);

    await page.goto(testSuite.gameUrl, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    console.log(`   ✅ Page loaded`);
    await page.waitForTimeout(3000);
    console.log(`   ✅ Rendering complete\n`);

    // Run comprehensive demo
    const demoResult = await executeTestCaseDemo(page, testSuite, spinCount);

    // Save results
    const resultsPath = path.join(
      "artifacts",
      "demo-results",
      `demo_${Date.now()}.json`
    );
    saveDemoResults(demoResult, resultsPath);

    // Close browser
    await browser.close();

    console.log(`\n${"═".repeat(80)}`);
    console.log(`✅ DEMO COMPLETED SUCCESSFULLY`);
    console.log(`${"═".repeat(80)}\n`);

    return demoResult;
  } catch (error) {
    console.error(`\n❌ ERROR: ${error}`);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}
