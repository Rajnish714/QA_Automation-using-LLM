import { Page } from "playwright";

/**
 * CANVAS GAME ANALYZER
 * 
 * Detects and analyzes HTML5 Canvas games:
 * - Finds clickable zones (buttons, reels, controls)
 * - Tracks game state changes
 * - Extracts visual metrics (balance, multipliers, animations)
 * - Validates game behavior
 */

export interface CanvasZone {
  id: string;
  type: "button" | "display" | "animation" | "clickable";
  bounds: { x: number; y: number; width: number; height: number };
  label: string;
  description: string;
  centerX: number;
  centerY: number;
}

export interface GameState {
  timestamp: number;
  balance?: string;
  bet?: string;
  multiplier?: string;
  messageText?: string;
  canvasHash?: string; // Simple visual fingerprint
  isAnimating: boolean;
  visibleZones: CanvasZone[];
}

/**
 * Analyze Canvas and detect interactive zones
 */
export async function analyzeCanvasGame(page: Page): Promise<CanvasZone[]> {
  const zones: CanvasZone[] = await page.evaluate((): CanvasZone[] => {
    const zoneArray: CanvasZone[] = [];
    let zoneIndex = 0;

    // 1. FIND CANVAS ELEMENTS
    const canvases = document.querySelectorAll("canvas");
    if (canvases.length === 0) return [] as CanvasZone[];

    const mainCanvas = canvases[0] as HTMLCanvasElement;
    const rect = mainCanvas.getBoundingClientRect();

    // 2. DETECT CLICKABLE REGIONS (usually defined by game JS)
    // Look for data attributes or nearby buttons that control game
    const gameControls = document.querySelectorAll(
      "[data-game-control], [class*='spin'], [class*='button'], [class*='control']"
    );

    gameControls.forEach((control) => {
      const controlRect = (control as HTMLElement).getBoundingClientRect();
      if (controlRect.width > 0 && controlRect.height > 0) {
        const text = (control as HTMLElement).textContent || "";
        let type: "button" | "display" | "animation" | "clickable" = "clickable";
        let description = "";

        if (text.toLowerCase().includes("spin")) {
          type = "button";
          description = "Spin Button - click to initiate spin";
        } else if (text.toLowerCase().includes("bet")) {
          type = "button";
          description = "Bet Control - adjust bet amount";
        } else if (text.toLowerCase().includes("max")) {
          type = "button";
          description = "Max Bet - set maximum bet";
        } else if (text.toLowerCase().includes("balance")) {
          type = "display";
          description = "Balance Display - shows current balance";
        } else if (text.toLowerCase().includes("multiplier")) {
          type = "display";
          description = "Multiplier - shows win multiplier";
        }

        zoneArray.push({
          id: `zone_${zoneIndex++}`,
          type,
          bounds: {
            x: controlRect.left,
            y: controlRect.top,
            width: controlRect.width,
            height: controlRect.height,
          },
          label: text.slice(0, 30),
          description,
          centerX: controlRect.left + controlRect.width / 2,
          centerY: controlRect.top + controlRect.height / 2,
        });
      }
    });

    // 3. DETECT REEL ZONES (common in slot games)
    const reelContainers = document.querySelectorAll(
      "[class*='reel'], [data-reel], [class*='symbol']"
    );

    reelContainers.forEach((reel, idx) => {
      const reelRect = (reel as HTMLElement).getBoundingClientRect();
      if (reelRect.width > 30 && reelRect.height > 30) {
        zoneArray.push({
          id: `reel_${idx}`,
          type: "clickable",
          bounds: {
            x: reelRect.left,
            y: reelRect.top,
            width: reelRect.width,
            height: reelRect.height,
          },
          label: `Reel ${idx + 1}`,
          description: `Slot reel ${idx + 1} - part of game canvas`,
          centerX: reelRect.left + reelRect.width / 2,
          centerY: reelRect.top + reelRect.height / 2,
        });
      }
    });

    // 4. DETECT BALANCE/INFO DISPLAYS
    const balancePatterns = [
      /balance.*?(\d+[.,]\d+)/i,
      /\$\s*(\d+[.,]\d+)/i,
      /credits?.*?(\d+[.,]\d+)/i,
    ];

    const pageText = document.body.innerText;
    balancePatterns.forEach((pattern, idx) => {
      if (pattern.test(pageText)) {
        zoneArray.push({
          id: `info_${idx}`,
          type: "display",
          bounds: { x: rect.left, y: rect.top, width: 100, height: 40 },
          label: "Info Display",
          description: "Game information (balance, credits, etc)",
          centerX: rect.left + 50,
          centerY: rect.top + 20,
        });
      }
    });

    return zoneArray;
  });

  return zones;
}

/**
 * Capture current game state
 */
export async function captureGameState(page: Page): Promise<GameState> {
  const state = await page.evaluate(() => {
    // Extract balance
    const bodyText = document.body.innerText;
    const balanceMatch = bodyText.match(/balance[:\s]+(\d+[.,]\d+)/i);
    const balance = balanceMatch ? balanceMatch[1] : undefined;

    // Extract bet
    const betMatch = bodyText.match(/bet[:\s]+(\d+[.,]\d+)/i);
    const bet = betMatch ? betMatch[1] : undefined;

    // Detect animation
    const animatedElements = Array.from(
      document.querySelectorAll("[class*='anim'], [style*='animation']")
    ).filter(
      (el) =>
        (el as HTMLElement).offsetHeight > 0 &&
        (el as HTMLElement).offsetWidth > 0
    );

    // Create simple canvas hash (visual fingerprint)
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    let canvasHash = "";
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, 100, 100);
        canvasHash = btoa(String.fromCharCode(...imageData.data.slice(0, 100)));
      }
    }

    return {
      timestamp: Date.now(),
      balance,
      bet,
      messageText: document.body.innerText.slice(0, 200),
      canvasHash,
      isAnimating: animatedElements.length > 0,
      visibleZones: [] as any[],
    };
  });

  // Add visible zones
  const zones = await analyzeCanvasGame(page);
  state.visibleZones = zones;

  return state;
}

/**
 * Click on a specific zone by coordinate (for canvas games)
 */
export async function clickCanvasZone(
  page: Page,
  zone: CanvasZone
): Promise<boolean> {
  try {
    console.log(`\n🎯 CANVAS CLICK: ${zone.label}`);
    console.log(`   📍 Coordinates: (${zone.centerX}, ${zone.centerY})`);
    console.log(`   📝 Description: ${zone.description}`);

    // Click on the zone center
    await page.mouse.click(zone.centerX, zone.centerY);

    console.log(`   ✅ Clicked`);

    // Wait for game response
    await page.waitForTimeout(2000);
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

    return true;
  } catch (error) {
    console.log(`   ❌ Click failed: ${error}`);
    return false;
  }
}

/**
 * Validate game state against expected state
 */
export function validateGameState(
  current: GameState,
  expected: Partial<GameState>
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (
    expected.balance &&
    current.balance !== expected.balance &&
    current.balance
  ) {
    // Allow small variance
    const currentNum = parseFloat(current.balance);
    const expectedNum = parseFloat(expected.balance);
    if (Math.abs(currentNum - expectedNum) > 1) {
      reasons.push(
        `Balance mismatch: expected ${expected.balance}, got ${current.balance}`
      );
    }
  }

  if (expected.isAnimating !== undefined) {
    if (expected.isAnimating && !current.isAnimating) {
      reasons.push(
        `Expected animation but none detected`
      );
    } else if (!expected.isAnimating && current.isAnimating) {
      reasons.push(`Expected animation to stop but still animating`);
    }
  }

  if (expected.visibleZones && expected.visibleZones.length > 0) {
    const missingZones = expected.visibleZones.filter(
      (ez) =>
        !current.visibleZones.some(
          (cz) =>
            cz.label.toLowerCase() === ez.label.toLowerCase()
        )
    );

    if (missingZones.length > 0) {
      reasons.push(
        `Missing zones: ${missingZones.map((z) => z.label).join(", ")}`
      );
    }
  }

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
