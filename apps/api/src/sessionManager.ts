import { Browser, BrowserContext, chromium, Page } from "playwright";
import { randomUUID } from "crypto";
import { analyzePageWithTools, executeWithToolBasedAgent } from "./toolBasedAgent";
import { analyzeCanvasGame, captureGameState } from "./canvasGameAnalyzer";

export interface SessionState {
  url: string;
  title: string;
  textSnippet: string;
  hasCanvas: boolean;
  canvasZones: Array<{ id: string; label: string; description: string }>; 
  pageStatus: string;
  lastUpdated: string;
}

export interface AgentSession {
  sessionId: string;
  browser: Browser;
  context: BrowserContext;
  pages: Page[];
  currentPage: Page;
  createdAt: string;
  updatedAt: string;
  lastState?: SessionState;
}

const sessions: Record<string, AgentSession> = {};

export async function createSession(url: string, headless = false): Promise<AgentSession & { state: SessionState }> {
  const browser = await chromium.launch({
    headless: !headless,
    slowMo: headless ? undefined : 100,
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const sessionId = randomUUID();
  const session: AgentSession = {
    sessionId,
    browser,
    context,
    pages: [page],
    currentPage: page,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  context.on("page", (newPage) => {
    session.pages.push(newPage);
    session.currentPage = newPage;
    session.updatedAt = new Date().toISOString();
  });

  page.on("close", () => {
    session.pages = session.pages.filter((p) => p !== page);
    if (session.pages.length > 0) {
      session.currentPage = session.pages[session.pages.length - 1];
    }
    session.updatedAt = new Date().toISOString();
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);
  } catch (error) {
    console.warn(`Session ${sessionId} navigation warning: ${error}`);
  }

  session.lastState = await getSessionState(session);
  sessions[sessionId] = session;
  return { ...session, state: session.lastState };
}

export async function getSession(sessionId: string): Promise<AgentSession | null> {
  return sessions[sessionId] || null;
}

export async function closeSession(sessionId: string): Promise<void> {
  const session = sessions[sessionId];
  if (!session) return;
  try {
    await session.context.close();
    await session.browser.close();
  } catch {
    // ignore errors closing session
  }
  delete sessions[sessionId];
}

export async function getSessionState(session: AgentSession): Promise<SessionState> {
  const page = session.currentPage;
  const textSnippet = await page.evaluate(() => document.body.innerText.slice(0, 500));
  const title = await page.title();
  const url = page.url();
  const canvasZones = (await analyzeCanvasGame(page)).map((zone) => ({
    id: zone.id,
    label: zone.label,
    description: zone.description,
  }));
  const hasCanvas = canvasZones.length > 0;
  const pageStatus = await page.evaluate(() => {
    if (document.querySelector(".loading, .spinner, [class*='loading'], [class*='spinner']")) {
      return "loading";
    }
    if (document.body.innerText.toLowerCase().includes("error")) {
      return "error";
    }
    return "ready";
  });

  const state: SessionState = {
    url,
    title,
    textSnippet,
    hasCanvas,
    canvasZones,
    pageStatus,
    lastUpdated: new Date().toISOString(),
  };

  session.lastState = state;
  session.updatedAt = state.lastUpdated;
  return state;
}

export async function executeSessionInstruction(
  sessionId: string,
  instruction: string,
  maxSteps = 12
): Promise<{ steps: string[]; success: boolean; state: SessionState }> {
  const session = sessions[sessionId];
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const result = await executeWithToolBasedAgent(session.currentPage, instruction, maxSteps);
  const state = await getSessionState(session);
  return {
    steps: result.steps,
    success: result.success,
    state,
  };
}

export function listSessionIds(): string[] {
  return Object.keys(sessions);
}
