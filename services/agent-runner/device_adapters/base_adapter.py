from typing import Any, Dict, Tuple

class BaseDeviceAdapter:
    platform: str = "UNKNOWN"

    def capture_screen(self) -> bytes:
        raise NotImplementedError()

    def tap(self, x: int, y: int) -> None:
        raise NotImplementedError()

    def wait(self, duration_ms: int) -> None:
        import time

        time.sleep(duration_ms / 1000.0)

    def read_state(self) -> Dict[str, Any]:
        return {}

    def viewport(self) -> Dict[str, Any]:
        return {"width": 1920, "height": 1080}
