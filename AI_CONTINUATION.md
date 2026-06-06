AI Continuation Guide
=====================

Purpose
- This file explains how to continue development and operations if the AI helper (me) or quota is unavailable. Keep it with the project and hand it to another engineer or to your future self.

Quick checklist to continue working
1. Start Ollama (if using local LLM):
```bash
ollama serve
```
2. Start backend:
```bash
cd d:/aqtest/apps/api
npm install
npm run dev
```
3. Start frontend:
```bash
cd d:/aqtest/apps/ui-next
npm install
npm run dev
```
4. Open UI: http://localhost:3000 (or 3001)

Common tasks & where to edit
- Create / Edit tests: `apps/api/src/customTestManager.ts` and UI `apps/ui-next/pages/index.tsx`
- Run logic and evidence: `apps/api/src/advancedTestExecutor.ts` and `apps/api/src/enhancedTestReporter.ts`
- Learning KB: `apps/api/src/learningKnowledgeBase.ts`
- Ollama calls: `apps/api/src/localLLMAgent.ts` (or wherever Ollama HTTP calls are implemented)

How to add an Ollama chat panel (minimal)
1. Frontend: add a small chat UI in `pages/index.tsx` with an input and message history state.
2. Backend: add POST `/api/ollama/chat` that proxies user messages to `http://localhost:11434` Ollama API and returns responses.
3. Persist helpful messages into KB by calling `POST /api/tests/learning/teach` with structured payload.

How to convert freeform text to test case (already present)
- Use `POST /api/tests/convert` with body `{ name?, instructions, gameUrl? }`. It saves a test JSON via `createTest`.

How to clean evidence manually
- Remove files in:
  - `apps/api/artifacts/test-evidence/screenshots/`
  - `apps/api/artifacts/test-evidence/reports/`
- Or use UI: Custom Tests → select test → Evidence & Screenshots → Delete

If you modify AI model or Ollama settings
1. Stop backend and Ollama
2. Update model references in `apps/api/src/localLLMAgent.ts` (model name/tag)
3. Restart Ollama (`ollama serve`) and ensure model is `ollama pull <model>`
4. Restart backend

Quick debug commands
- Health check backend:
```bash
curl http://localhost:4000/api/health
# expect: {"status":"ok"}
```
- List evidence files:
```bash
curl http://localhost:4000/api/tests/evidence/list
```

If you need help, hand over this file and the `README.md`. They contain everything needed to run, test, and continue development.

-- end
