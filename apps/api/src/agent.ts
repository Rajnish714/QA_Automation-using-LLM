import { OpenAI } from "openai";

export type AgentStepType = "CLICK" | "CAPTURE" | "WAIT";

export interface AgentStep {
  description: string;
  type: AgentStepType;
  target?: string;
  explanation: string;
}

function inferActionFromInstruction(description: string): AgentStep {
  const lower = description.toLowerCase();
  
  // CLICK actions - match multiple button types
  const clickKeywords = ["spin", "bet", "click", "signin", "sign in", "login", "authenticate", "game", "manifest", "launch", "select", "submit", "enter"];
  const isClickAction = clickKeywords.some(kw => lower.includes(kw));
  
  if (isClickAction) {
    // Determine specific selector based on keywords
    let target = "text=/button|click|spin|bet|sign|login|game|manifest|launch|select/i";
    
    if (lower.includes("spin")) target = "text=/spin/i";
    else if (lower.includes("bet")) target = "text=/bet/i";
    else if (lower.includes("signin") || lower.includes("sign in") || lower.includes("login") || lower.includes("authenticate")) target = "text=/sign|login|authenticate/i";
    else if (lower.includes("game")) target = "text=/game/i";
    else if (lower.includes("manifest")) target = "text=/manifest/i";
    else if (lower.includes("launch")) target = "text=/launch|start/i";
    
    return {
      description,
      type: "CLICK",
      target,
      explanation: `Click the relevant button to perform action: ${description}`,
    };
  }

  if (lower.includes("capture") || lower.includes("screenshot")) {
    return {
      description,
      type: "CAPTURE",
      explanation: "Capture and screenshot the current page state.",
    };
  }

  if (lower.includes("balance") || lower.includes("cash") || lower.includes("credits")) {
    return {
      description,
      type: "CAPTURE",
      explanation: "Capture visible balance value or cash text from the page.",
    };
  }

  if (lower.includes("wait") || lower.includes("load")) {
    return {
      description,
      type: "WAIT",
      explanation: "Wait for the page UI to settle before the next action.",
    };
  }

  return {
    description,
    type: "WAIT",
    explanation: "Wait for the page UI to settle before the next action.",
  };
}

async function runFallbackPlanner(instructions: string): Promise<AgentStep[]> {
  // First split by newlines
  let steps = instructions.split(/\r?\n/);
  
  // If only one line but contains numbered steps (1. 2. 3.), split by those too
  if (steps.length === 1) {
    const singleLine = steps[0];
    // Match patterns like "1.", "2.", etc. at word boundaries
    const numberedSteps = singleLine.match(/\d+\.\s+[^0-9]*(?=\d+\.|$)/g);
    if (numberedSteps && numberedSteps.length > 1) {
      steps = numberedSteps;
    } else {
      // Try splitting by common delimiters: "then", "next", "and then"
      const delimitedSteps = singleLine.split(/\s+(?:then|next|and then)\s+/i);
      if (delimitedSteps.length > 1) {
        steps = delimitedSteps;
      }
    }
  }
  
  return steps
    .map((line) => line.trim())
    .filter(Boolean)
    .map((description) => inferActionFromInstruction(description));
}

async function callOpenAIAgentPlan(instructions: string, url: string): Promise<AgentStep[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return runFallbackPlanner(instructions);
  }

  const client = new OpenAI({ apiKey });
  const prompt = `You are a visual automation agent. Given a page URL and a set of instructions, convert each instruction line into a structured action plan. Return only valid JSON.

Page URL: ${url}
Instructions:
${instructions}

Return a JSON array of objects where each object has:
- description: the user-visible step description
- type: one of CLICK, CAPTURE, WAIT
- target: optional selector or text query for clickable items
- explanation: a short rationale for the action

Example:
[
  {
    "description": "1. Open the page",
    "type": "WAIT",
    "explanation": "Open the page and let it finish loading."
  }
]
`;

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const firstOutput = response.output?.[0] as any;
  const text = firstOutput?.content?.[0]?.text;
  if (!text || typeof text !== "string") {
    return runFallbackPlanner(instructions);
  }

  const candidate = text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(candidate) as AgentStep[];
    return parsed.map((step) => ({
      description: step.description,
      type: step.type,
      target: step.target,
      explanation: step.explanation,
    }));
  } catch {
    return runFallbackPlanner(instructions);
  }
}

export async function createAgentPlan(instructions: string, url: string): Promise<AgentStep[]> {
  return callOpenAIAgentPlan(instructions, url);
}
