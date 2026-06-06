# Reelspect Visual QA — Quick Start & Reference

This repository contains the Visual QA platform (frontend + backend) with local LLM integration (Ollama) and evidence management.

Keep these two files only:
- `README.md` — this file (runtime + quick reference)
- `AI_CONTINUATION.md` — instructions to continue development if AI assistance stops

Primary folders to use
- `apps/api` — backend (Express + TypeScript)
- `apps/ui-next` — frontend (Next.js)

Run servers

1) Backend (port 4000)
```bash
cd d:/aqtest/apps/api
npm install
npm run dev
```

2) Frontend (Next; default 3000, may use 3001)
```bash
cd d:/aqtest/apps/ui-next
npm install
npm run dev
```

Open the UI in your browser (http://localhost:3000 or 3001). Create tests, run them, and manage evidence from the Custom Tests panel.

Evidence management
- Evidence files are stored under `apps/api/artifacts/test-evidence/`:
	- `screenshots/` — PNG images
	- `reports/` — JSON reports
- Use the UI: Custom Tests → select a test → Evidence & Screenshots → View / Open / Delete
- Or delete files manually if needed.

Key API endpoints
- `GET /api/tests/list` — list custom tests
- `POST /api/tests/create` — create test
- `PUT /api/tests/:testId` — update test
- `DELETE /api/tests/:testId` — delete test
- `POST /api/tests/run/:testId` — run test (body: `{ headless }`)
- `GET /api/tests/session/list` — list active Ollama browser sessions
- `POST /api/tests/session/start` — start a live Ollama browser session (body: `{ url, headless }`)
- `GET /api/tests/session/status/:sessionId` — get live session state
- `POST /api/tests/session/command/:sessionId` — send instruction to the live session
- `POST /api/tests/session/close/:sessionId` — close a live session
- `GET /api/tests/evidence/list` — list evidence files
- `GET /api/tests/evidence/report/:reportId` — get report
- `DELETE /api/tests/evidence/report/:reportId` — delete report
- `GET /api/tests/evidence/screenshot/:screenshotId` — get screenshot
- `DELETE /api/tests/evidence/screenshot/:screenshotId` — delete screenshot
- `POST /api/tests/convert` — convert freeform instructions into a test
- `POST /api/tests/learning/teach` — submit a manual teaching entry to the KB

If you change AI settings (Ollama model), the simplest path is:
1) Use the UI model input and click `Save Model`, or edit `ollama_model.json` manually.
2) Ensure the model exists locally with `ollama list` or `ollama pull <model>`.
3) Restart your local Ollama process and backend server if needed.

If you want to use a different Ollama host or port, set `OLLAMA_URL` before starting the backend, for example:
```bash
export OLLAMA_URL="http://localhost:11435/api/generate"
```

If you want me to run an end-to-end verification (create → run → view → delete evidence), tell me and I will execute it and report results.

----

Ollama Integration Details (complete)
------------------------------------

This section documents exactly how the app interacts with your local Ollama instance, where to change models, how context files are used, and the API the UI calls.

1) Model selection
- File stored at workspace root: `ollama_model.json` (auto-created by UI when you save model).
- Example content:
```json
{ "model": "qwen2.5:3b" }
```
- API to read/update model:
	- `GET /api/tests/ollama/model` → { status, model }
	- `PUT /api/tests/ollama/model` body `{ model: "qwen2.5:3b" }`

2) Context folder (files Ollama can read)
- Folder: `apps/api/ollama-context/`
- Drop files (markdown, txt, json) into this folder and the backend will include their contents (first ~4000 chars per file) when proxying chat requests to Ollama.
- API to manage context files from UI:
	- `GET /api/tests/ollama/context` → { files: [ ... ] }
	- `POST /api/tests/ollama/upload` body `{ filename, content }` → saves the file into the context folder

3) Chat proxy (how the UI talks to Ollama)
- Endpoint: `POST /api/tests/ollama/chat` body `{ message }`
- Server builds a prompt that begins with the concatenated context files, then `USER: <message>` and forwards to local Ollama generate endpoint.
- Default local Ollama endpoint used: `http://localhost:11434/api/generate` (can be overridden with `OLLAMA_URL` env var).
- If Ollama isn't reachable, the proxy returns a helpful fallback message indicating the local Ollama endpoint was unavailable.

4) UI features provided
- Model field: set which Ollama model to use (e.g., `qwen2.5:3b`, `qwen3.5:latest`). UI saves to `ollama_model.json`.
- Chat panel: send messages, see Ollama replies in the UI.
- Upload context files: upload .md/.txt/.json files via the UI; these become part of Ollama's context for subsequent chats.

5) File formats and limits
- Supported context file extensions: `.md`, `.txt`, `.json` (any file will be saved, but UI lists those types).
- The server sends up to the first ~4000 characters per file when composing the prompt.

6) How chat prompt is composed (implementation detail)
- The server concatenates all context files with a small delimiter header per file:
```
CONTEXT:
--- file1.md ---
<first 4000 chars>
--- file2.json ---
<first 4000 chars>

USER: <your message>
```
- This lets Ollama reason with your knowledge base excerpts before answering.

7) Switching models
- To switch Ollama model:
	- Use UI model input + `Save Model` (saves `ollama_model.json`) OR
	- Edit `ollama_model.json` manually and restart the backend.
- After switching model you should ensure the model is available in your Ollama instance (use `ollama pull <model>`), then restart `ollama serve` if needed.

5) Live session game automation
- The UI includes a live session panel where you can start an Ollama-controlled browser session from the current game URL.
- Click `Run Slot Game Flow` to start the session, then Ollama will execute the instruction:
  1. Open the slot game URL
  2. Click on the SignIn button
  3. Click on select game
  4. Click on select manifest
  5. Click on launch game
- You can refresh session status, see page state, and close the session from the same UI panel.

8) Troubleshooting
- If `POST /api/tests/ollama/chat` returns `LOCAL_OLLAMA_UNAVAILABLE`, verify:
	- Ollama is running: `ollama serve` (default port 11434)
	- The model is installed in Ollama: `ollama list` or `ollama pull <model>`
	- You can change `OLLAMA_URL` env var to point to a different host/port
- If context files are not listed, ensure `apps/api/ollama-context/` exists and has readable files.

9) Security note
- Context files and `ollama_model.json` are stored locally in the repo/workspace. Do not commit sensitive secrets into these files.

10) Example: ask Ollama to convert an uploaded GDD into tests
1. Upload your GDD or notes as `game-design.md` via the UI context upload.
2. Save model selection (e.g., `qwen3.5:latest`).
3. In the chat panel, ask: `Please convert game-design.md into a set of step-by-step visual tests, each with a name and plain-English instructions.`
4. The server will include the GDD excerpt in the prompt and return Ollama's conversion. You can then paste that output into `Create Custom Test` or call `POST /api/tests/convert` with the generated instructions to create tests programmatically.

----

If you'd like, I'll now implement a richer chat UX (message timestamps, streaming responses) and add a background task that ingests all context files into the knowledge base automatically. Which do you want next? (1) richer chat UX, (2) auto-ingest context files into KB, (3) run a full end-to-end test now.
