import os
from typing import Any, Dict

class VisionLLMClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ.get("VISION_API_KEY")
        if not self.api_key:
            raise RuntimeError("VISION_API_KEY must be configured")

    def analyze(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Placeholder implementation.
        # Replace with calls to your Vision LLM or object-detection service.
        return {
            "action": {
                "type": "WAIT",
                "x": None,
                "y": None,
                "label": None,
                "payload": {"duration_ms": 1200},
            },
            "detected_objects": [],
            "ocr_text": {},
            "expectation": {},
            "block_name": "Vision observation",
        }
