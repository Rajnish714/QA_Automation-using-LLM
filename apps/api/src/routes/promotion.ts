import express, { Request, Response } from "express";
import { createLibraryCase, getSandboxCase } from "../store";
import { sanitizeTestCase, validatePromotionPayload } from "../services/promotion";

const router = express.Router();

router.post("/", (req: Request, res: Response) => {
  const { testCaseId, tags, parameterMapping } = req.body;
  const userId = req.headers["x-user-id"] as string | undefined;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const validation = validatePromotionPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const sandboxCase = getSandboxCase(testCaseId);
  if (!sandboxCase) {
    return res.status(404).json({ error: "Sandbox test case not found" });
  }

  const sanitized = sanitizeTestCase(sandboxCase, parameterMapping || {});
  const libraryCase = createLibraryCase(sandboxCase, {
    promotedFrom: sandboxCase.id,
    promotionNotes: sanitized.notes,
  });

  return res.status(201).json({ testCase: libraryCase });
});

export default router;
