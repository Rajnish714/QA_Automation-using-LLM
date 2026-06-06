export function validatePromotionPayload(body: any) {
  if (!body?.testCaseId || !Array.isArray(body.tags)) {
    return { valid: false, error: "Missing required fields: testCaseId and tags are required." };
  }
  return { valid: true };
}

export function sanitizeTestCase(testCase: any, parameterMapping: Record<string, string>) {
  let instructions = testCase.instructions;
  const sanitizedParameters: Record<string, any> = {};

  for (const [key, value] of Object.entries(parameterMapping)) {
    const placeholder = `{{${key}}}`;
    instructions = instructions.split(value).join(placeholder);
    sanitizedParameters[key] = placeholder;
  }

  const description = testCase.description
    ? testCase.description
        .replace(/https?:\/\/[^\s]+/g, "{{GAME_URL}}")
        .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "{{API_TOKEN}}")
    : "";

  return {
    instructions,
    description,
    parameters: sanitizedParameters,
    notes: "Promoted from SANDBOX and parameterized for LIBRARY use.",
  };
}
