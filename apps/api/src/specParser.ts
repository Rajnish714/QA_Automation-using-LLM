/**
 * SPECIFICATION PARSER & TEST GENERATOR
 * 
 * Reads Game Design Documents (GDD), mockups, and specs
 * Extracts game mechanics and generates test cases automatically
 * Works with markdown, JSON, or plain text specifications
 */

export interface GameMechanic {
  id: string;
  name: string;
  description: string;
  inputs: string[];
  expectedOutputs: string[];
  preconditions: string[];
  successCriteria: string[];
  relatedMechanics: string[];
}

export interface GameSpecification {
  gameName: string;
  gameType: string; // "slot", "table", "card", etc
  mechanics: GameMechanic[];
  testScenarios: TestScenario[];
  controlMap: ControlMapping[];
  validationRules: ValidationRule[];
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  expectedResult: string;
  priority: "critical" | "high" | "medium" | "low";
}

export interface TestStep {
  action: string;
  target?: string;
  expectedState?: string;
  waitTime?: number;
}

export interface ControlMapping {
  controlName: string;
  type: "button" | "slider" | "input" | "display";
  cssClass?: string;
  dataAttribute?: string;
  coordinates?: { x: number; y: number };
}

export interface ValidationRule {
  rule: string;
  metric: string;
  condition: string;
  tolerance?: number;
}

/**
 * Parse markdown GDD/spec and extract game mechanics
 */
export function parseGameSpec(specText: string): GameSpecification {
  const lines = specText.split("\n");
  const spec: GameSpecification = {
    gameName: "",
    gameType: "slot",
    mechanics: [],
    testScenarios: [],
    controlMap: [],
    validationRules: [],
  };

  // Extract game name
  const titleMatch = specText.match(/^#\s+(.+)/m);
  if (titleMatch) spec.gameName = titleMatch[1];

  // Extract game type
  if (specText.toLowerCase().includes("slot")) spec.gameType = "slot";
  else if (specText.toLowerCase().includes("table")) spec.gameType = "table";
  else if (specText.toLowerCase().includes("card")) spec.gameType = "card";

  // EXTRACT MECHANICS
  // Look for "## Mechanics" sections
  const mechanicsMatch = specText.match(
    /##\s*Mechanics\s*\n([\s\S]*?)(?=##|$)/i
  );
  if (mechanicsMatch) {
    const mechanicsText = mechanicsMatch[1];
    const mechanicBlocks = mechanicsText.split(/^###\s+/m);

    mechanicBlocks.forEach((block, idx) => {
      if (block.trim()) {
        const lines = block.split("\n");
        const mechName = lines[0].trim();

        const mechanic: GameMechanic = {
          id: `mech_${idx}`,
          name: mechName,
          description: "",
          inputs: [],
          expectedOutputs: [],
          preconditions: [],
          successCriteria: [],
          relatedMechanics: [],
        };

        // Parse description
        const descMatch = block.match(/Description:\s*(.+?)(?=\n|Input|$)/i);
        if (descMatch) mechanic.description = descMatch[1].trim();

        // Parse inputs
        const inputsMatch = block.match(/Input[s]?:\s*(.+?)(?=\n|Output|$)/is);
        if (inputsMatch) {
          mechanic.inputs = inputsMatch[1]
            .split(/[,;]/)
            .map((i) => i.trim())
            .filter((i) => i);
        }

        // Parse expected outputs
        const outputsMatch = block.match(
          /Expected\s+Output[s]?:\s*(.+?)(?=\n|Precondition|$)/is
        );
        if (outputsMatch) {
          mechanic.expectedOutputs = outputsMatch[1]
            .split(/[,;]/)
            .map((o) => o.trim())
            .filter((o) => o);
        }

        // Parse preconditions
        const preMatch = block.match(
          /Precondition[s]?:\s*(.+?)(?=\n|Success|$)/is
        );
        if (preMatch) {
          mechanic.preconditions = preMatch[1]
            .split(/[,;]/)
            .map((p) => p.trim())
            .filter((p) => p);
        }

        // Parse success criteria
        const successMatch = block.match(
          /Success\s+Criteria?:\s*(.+?)(?=\n|Related|$)/is
        );
        if (successMatch) {
          mechanic.successCriteria = successMatch[1]
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter((s) => s);
        }

        spec.mechanics.push(mechanic);
      }
    });
  }

  // EXTRACT TEST SCENARIOS
  // Look for "## Test Scenarios" sections
  const scenariosMatch = specText.match(
    /##\s*Test\s*Scenarios?\s*\n([\s\S]*?)(?=##|$)/i
  );
  if (scenariosMatch) {
    const scenariosText = scenariosMatch[1];
    const scenarioBlocks = scenariosText.split(/^###\s+/m);

    scenarioBlocks.forEach((block, idx) => {
      if (block.trim()) {
        const lines = block.split("\n");
        const scenarioName = lines[0].trim();

        const scenario: TestScenario = {
          id: `scenario_${idx}`,
          name: scenarioName,
          description: "",
          steps: [],
          expectedResult: "",
          priority: "medium",
        };

        // Parse description
        const descMatch = block.match(/Description:\s*(.+?)(?=\n|Steps|$)/i);
        if (descMatch) scenario.description = descMatch[1].trim();

        // Parse steps
        const stepsMatch = block.match(/Steps?:\s*\n([\s\S]*?)(?=\n\nExpected|Expected|$)/i);
        if (stepsMatch) {
          const stepLines = stepsMatch[1].split("\n").filter((l) => l.trim());
          scenario.steps = stepLines.map((line) => {
            const cleanLine = line.replace(/^[\d+\.\-*]\s+/, "").trim();
            return {
              action: cleanLine,
              waitTime: 1000,
            };
          });
        }

        // Parse expected result
        const resultMatch = block.match(
          /Expected\s+Result:\s*(.+?)(?=\n|Priority|$)/i
        );
        if (resultMatch) scenario.expectedResult = resultMatch[1].trim();

        // Parse priority
        if (block.toLowerCase().includes("critical"))
          scenario.priority = "critical";
        else if (block.toLowerCase().includes("high")) scenario.priority = "high";
        else if (block.toLowerCase().includes("low")) scenario.priority = "low";

        spec.testScenarios.push(scenario);
      }
    });
  }

  // EXTRACT CONTROL MAPPINGS
  // Look for "## Controls" sections
  const controlsMatch = specText.match(
    /##\s*Control[s]?\s*\n([\s\S]*?)(?=##|$)/i
  );
  if (controlsMatch) {
    const controlsText = controlsMatch[1];
    const controlLines = controlsText.split("\n").filter((l) => l.trim());

    controlLines.forEach((line) => {
      const controlMatch = line.match(
        /([A-Za-z\s]+)\s*[:|\(]\s*(.+?)\s*(?:\(|$)/
      );
      if (controlMatch) {
        spec.controlMap.push({
          controlName: controlMatch[1].trim(),
          type: "button",
          dataAttribute: controlMatch[2].trim(),
        });
      }
    });
  }

  return spec;
}

/**
 * Generate test cases from specification
 */
export function generateTestsFromSpec(spec: GameSpecification): TestScenario[] {
  const generatedTests: TestScenario[] = [];

  // 1. BASIC MECHANIC TESTS
  spec.mechanics.forEach((mechanic, idx) => {
    const test: TestScenario = {
      id: `auto_${idx}`,
      name: `Test: ${mechanic.name}`,
      description: `Automatically generated test for ${mechanic.name}`,
      steps: [],
      expectedResult: mechanic.expectedOutputs.join(", "),
      priority: "high",
    };

    // Create test steps from mechanic inputs
    mechanic.inputs.forEach((input, inputIdx) => {
      test.steps.push({
        action: `Execute: ${input}`,
        waitTime: 2000,
      });
    });

    generatedTests.push(test);
  });

  // 2. COMBINATION TESTS (test multiple mechanics together)
  if (spec.mechanics.length > 1) {
    for (let i = 0; i < Math.min(3, spec.mechanics.length - 1); i++) {
      const combo: TestScenario = {
        id: `combo_${i}`,
        name: `Combined: ${spec.mechanics[i].name} + ${spec.mechanics[i + 1].name}`,
        description: `Test interaction between mechanics`,
        steps: [
          {
            action: `Execute: ${spec.mechanics[i].inputs[0] || "action"}`,
            waitTime: 1000,
          },
          {
            action: `Execute: ${spec.mechanics[i + 1].inputs[0] || "action"}`,
            waitTime: 2000,
          },
        ],
        expectedResult: `Both mechanics work correctly`,
        priority: "medium",
      };
      generatedTests.push(combo);
    }
  }

  // 3. EDGE CASE TESTS
  generatedTests.push({
    id: "edge_boundary",
    name: "Test: Boundary Conditions",
    description: "Test with minimum/maximum values",
    steps: [
      { action: "Set bet to minimum", waitTime: 1000 },
      { action: "Spin", waitTime: 3000 },
      { action: "Set bet to maximum", waitTime: 1000 },
      { action: "Spin", waitTime: 3000 },
    ],
    expectedResult: "Game works at all bet levels",
    priority: "high",
  });

  // 4. STABILITY TESTS
  generatedTests.push({
    id: "edge_stability",
    name: "Test: Stability (Multiple Spins)",
    description: "Test stability with repeated actions",
    steps: [
      { action: "Spin", waitTime: 3000 },
      { action: "Spin", waitTime: 3000 },
      { action: "Spin", waitTime: 3000 },
      { action: "Verify balance consistency", waitTime: 1000 },
    ],
    expectedResult: "No crashes, balance updates correctly",
    priority: "critical",
  });

  return generatedTests;
}

/**
 * Generate test instruction from TestScenario
 */
export function scenarioToInstruction(scenario: TestScenario): string {
  let instruction = `Test: ${scenario.name}\n`;
  instruction += `Priority: ${scenario.priority}\n`;
  instruction += `Description: ${scenario.description}\n\n`;
  instruction += `Steps:\n`;

  scenario.steps.forEach((step, idx) => {
    instruction += `${idx + 1}. ${step.action}`;
    if (step.expectedState) {
      instruction += ` (expect: ${step.expectedState})`;
    }
    instruction += `\n`;
  });

  instruction += `\nExpected Result: ${scenario.expectedResult}`;
  return instruction;
}
