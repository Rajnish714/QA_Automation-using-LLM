import base64
import json
import time
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional

from vision_client import VisionLLMClient
from device_adapters.base_adapter import BaseDeviceAdapter

@dataclass
class AgentAction:
    type: str
    x: Optional[int] = None
    y: Optional[int] = None
    label: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None

@dataclass
class StepResult:
    step_index: int
    block_name: str
    action: AgentAction
    screenshot_ref: str
    detected_objects: List[Dict[str, Any]]
    ocr_text: Dict[str, str]
    expectation: Dict[str, Any]
    actual: Dict[str, Any]
    result: str
    explanation: str
    timestamp: str

class VisualAgentRunner:
    def __init__(self, vision_api_key: str, device_adapter: BaseDeviceAdapter):
        self.vision_client = VisionLLMClient(api_key=vision_api_key)
        self.device = device_adapter

    def run_test_case(self, test_case: Dict[str, Any]) -> List[StepResult]:
        instructions = test_case["instructions"]
        steps: List[StepResult] = []
        memory: List[Dict[str, Any]] = []

        for idx, instruction in enumerate(self._split_instructions(instructions)):
            screenshot = self.device.capture_screen()
            screenshot_b64 = base64.b64encode(screenshot).decode("utf-8")

            vision_payload = {
                "image_base64": screenshot_b64,
                "instruction": instruction,
                "context": {
                    "previousSteps": memory,
                    "platform": self.device.platform,
                    "viewport": self.device.viewport(),
                },
            }

            response = self.vision_client.analyze(vision_payload)
            action = self._parse_agent_action(response)
            detected_objects = response.get("detected_objects", [])
            ocr_text = response.get("ocr_text", {})
            block_name = response.get("block_name", f"Step {idx + 1}")

            self._execute_action(action)
            verification = self._verify_state(response)

            step_result = StepResult(
                step_index=idx + 1,
                block_name=block_name,
                action=action,
                screenshot_ref=self._store_screenshot(screenshot, test_case["id"], idx),
                detected_objects=detected_objects,
                ocr_text=ocr_text,
                expectation=response.get("expectation", {}),
                actual=verification.get("actual", {}),
                result=verification["result"],
                explanation=verification["explanation"],
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%S.%fZ", time.gmtime()),
            )

            steps.append(step_result)
            memory.append({
                "step": idx + 1,
                "action": asdict(action),
                "result": step_result.result,
                "summary": step_result.explanation,
            })

            if step_result.result == "FAIL":
                break

        return steps

    @staticmethod
    def _split_instructions(instructions: str) -> List[str]:
        return [line.strip() for line in instructions.split("\n") if line.strip()]

    @staticmethod
    def _parse_agent_action(response: Dict[str, Any]) -> AgentAction:
        action = response.get("action", {})
        return AgentAction(
            type=action.get("type", "WAIT"),
            x=action.get("x"),
            y=action.get("y"),
            label=action.get("label"),
            payload=action.get("payload", {}),
        )

    def _execute_action(self, action: AgentAction):
        if action.type == "CLICK":
            assert action.x is not None and action.y is not None
            self.device.tap(action.x, action.y)
        elif action.type == "WAIT":
            self.device.wait(action.payload.get("duration_ms", 1200))
        elif action.type == "ASSERT":
            pass
        else:
            raise RuntimeError(f"Unsupported action type: {action.type}")

    def _verify_state(self, response: Dict[str, Any]) -> Dict[str, Any]:
        expected = response.get("expectation", {})
        actual = self.device.read_state()
        if expected.get("type") == "balance_change":
            expected_delta = float(expected.get("delta", 0))
            actual_delta = float(actual.get("balance_delta", 0))
            passed = abs(actual_delta - expected_delta) < 0.01
            return {
                "result": "PASS" if passed else "FAIL",
                "actual": actual,
                "explanation": (
                    f"Expected balance delta {expected_delta}, got {actual_delta}."
                ),
            }

        return {
            "result": "PASS",
            "actual": actual,
            "explanation": "No explicit assertion required.",
        }

    @staticmethod
    def _store_screenshot(screenshot: bytes, test_case_id: str, idx: int) -> str:
        return f"s3://qa-artifacts/{test_case_id}/step-{idx + 1}.png"
