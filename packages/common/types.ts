export type Platform = "DESKTOP" | "IOS" | "ANDROID";

export interface TestCase {
  id: string;
  projectId: string;
  title: string;
  description: string;
  state: "SANDBOX" | "LIBRARY";
  instructions: string;
  platform: Platform;
  tags: Record<string, string[]>;
  parameters: Record<string, any>;
  metadata: Record<string, any>;
  version: number;
}

export interface StepLog {
  stepIndex: number;
  blockName: string;
  action: string;
  screenshotRef: string;
  detectedObjects: any[];
  ocrText: Record<string, string>;
  expectation: Record<string, any>;
  actual: Record<string, any>;
  result: "PASS" | "FAIL" | "UNKNOWN";
  explanation: string;
  timestamp: string;
}
