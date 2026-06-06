import express, { Request, Response } from "express";
import { createSandboxCase } from "../store";

const router = express.Router();

router.post("/", (req: Request, res: Response) => {
  const { title, description, instructions, platform, tags, parameters, metadata, createdBy } = req.body;

  if (!title || !instructions || !platform || !createdBy) {
    return res.status(400).json({ error: "Missing required sandbox fields." });
  }

  const sandbox = createSandboxCase({
    projectId: req.body.projectId || "demo-project",
    title,
    description: description || "",
    instructions,
    platform,
    tags: Array.isArray(tags) ? tags : [],
    parameters: parameters || {},
    metadata: metadata || {},
    createdBy,
  });

  res.status(201).json({ sandbox });
});

export default router;
