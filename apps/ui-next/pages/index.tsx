import {useEffect, useState} from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const defaultGameUrl =
  "https://ingenuity-hardrock-dev.finrings.com/api/prgs/createToken?=http://localhost:8080claimUrl=&currency=USD&depositUrl=&device=desktop&gameId=cash-wings-96&language=en&jurisdiction=us-nj&lobbyUrl=https://bet.dev1.hrd-usa.com/casino&moneyModeUrl=&operatorId=https://bet.dev1.hrd-usa.com/casino&playMode=D&playerId=6908d43d1ee8030001fe01cb&realityIntervalSecs=&realityRemainingSecs=&realityUrl=&sessionToken=MuH7hIP1uq8By0IK36U1t6HMQwEgle_xDSvr7T0n95Y=";

const pageStyle = {
  padding: 32,
  fontFamily: "Inter, system-ui, sans-serif",
  maxWidth: 1120,
  margin: "0 auto",
  background: "#f5f8ff",
  color: "#111827",
};

const cardStyle = {
  background: "#fff",
  borderRadius: 24,
  boxShadow: "0 24px 80px rgba(15, 23, 42, 0.08)",
  padding: 28,
  marginBottom: 24,
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  fontSize: 15,
  marginTop: 8,
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "14px 24px",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
};

const statusPill = (status: string) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  borderRadius: 999,
  background: status === "ok" ? "#ecfdf5" : "#fde8e8",
  color: status === "ok" ? "#166534" : "#991b1b",
  fontWeight: 700,
});

export default function Home() {
  const [health, setHealth] = useState<string>("checking");
  const [healthDetail, setHealthDetail] = useState<string>("");
  const [sandboxResult, setSandboxResult] = useState<string>("");
  const [promotionResult, setPromotionResult] = useState<string>("");
  const [sandboxId, setSandboxId] = useState<string>("");
  const [runningSandbox, setRunningSandbox] = useState(false);
  const [runningPromotion, setRunningPromotion] = useState(false);
  const [runningExecute, setRunningExecute] = useState(false);
  const [executionResult, setExecutionResult] = useState<string>("");
  const [executionSteps, setExecutionSteps] = useState<any[]>([]);
  const [gameUrl, setGameUrl] = useState(defaultGameUrl);
  const [platform, setPlatform] = useState("DESKTOP");
  const [tags, setTags] = useState("US-NJ, DESKTOP, PragmaticPlay");
  const [parameterMapping, setParameterMapping] = useState(
    "GAME_URL={{GAME_URL}}; CURRENCY=USD",
  );
  const [instructions, setInstructions] = useState(
    "1. Open the slot game URL\n2. Capture balance text\n3. Set minimum bet\n4. Tap spin\n5. Confirm balance changes and win banner appears.",
  );
  const [description, setDescription] = useState(
    "Sandbox test for Cash Wings 96 slot game using visual AI agent flow.",
  );
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [consoleVisible, setConsoleVisible] = useState(true);
  const [isHeadless, setIsHeadless] = useState(false);
  const [ollamaLogs, setOllamaLogs] = useState<string[]>([]);
  const [ollamaLogsVisible, setOllamaLogsVisible] = useState(true);
  const [customTests, setCustomTests] = useState<any[]>([]);
  const [testName, setTestName] = useState("");
  const [testInstructions, setTestInstructions] = useState("");
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [learningVisibility, setLearningVisibility] = useState(true);
  const [selectedTestResult, setSelectedTestResult] = useState<string | null>(
    null,
  );
  const [evidence, setEvidence] = useState<Record<string, any>>({});
  const [learningMetrics, setLearningMetrics] = useState<any>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{from: string; text: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [ollamaModel, setOllamaModel] = useState<string | null>(null);
  const [contextFiles, setContextFiles] = useState<string[]>([]);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
  const [ollamaStatusInfo, setOllamaStatusInfo] = useState<string>("");
  const [ollamaChatLoading, setOllamaChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<any>(null);
  const [sessionLogs, setSessionLogs] = useState<string[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionCommandText, setSessionCommandText] = useState(
    "Open the page, click the SignIn button, click select game, click select manifest, then launch game."
  );
  const [sessionStatus, setSessionStatus] = useState<string>("");
  const selectedEvidence = selectedTestResult ? evidence[selectedTestResult] : undefined;

  const refreshHealth = async () => {
    setHealth("checking");
    setHealthDetail("");

    try {
      const response = await fetch(`${apiUrl}/api/health`, {
        mode: "cors",
      });
      if (!response.ok) {
                      {/* List reports and screenshots with actions */}
                      <div style={{marginTop: 12, display: 'grid', gap: 8}}>
                        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                          <button onClick={() => loadEvidenceList(selectedTestResult || undefined)} style={{...buttonStyle, width: 140}}>
                            🔄 Refresh Evidence
                          </button>
                          <div style={{fontSize: 12, color: '#666'}}>Manage reports and screenshots below</div>
                        </div>

                        <div style={{display: 'grid', gap: 8}}>
                          <div style={{fontSize: 13, fontWeight: 700}}>Reports</div>
                          {(selectedEvidence?.reports || []).length === 0 && (
                            <div style={{color: '#666', fontSize: 12}}>No reports</div>
                          )}
                          {(selectedEvidence?.reports || []).map((r: string) => (
                            <div key={r} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: 8, borderRadius: 6}}>
                              <div style={{fontFamily: 'monospace', fontSize: 12, color: '#333'}}>{r}</div>
                              <div style={{display: 'flex', gap: 8}}>
                                <button onClick={() => viewReport(r)} style={{...buttonStyle, background: '#2563eb', width: 90}}>View</button>
                                <button onClick={() => deleteReport(r)} style={{...buttonStyle, background: '#ef4444', width: 90}}>Delete</button>
                              </div>
                            </div>
                          ))}

                          <div style={{fontSize: 13, fontWeight: 700, marginTop: 8}}>Screenshots</div>
                          {(selectedEvidence?.screenshots || []).length === 0 && (
                            <div style={{color: '#666', fontSize: 12}}>No screenshots</div>
                          )}
                          {(selectedEvidence?.screenshots || []).map((s: string) => (
                            <div key={s} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: 8, borderRadius: 6}}>
                              <div style={{fontFamily: 'monospace', fontSize: 12, color: '#333'}}>{s}</div>
                              <div style={{display: 'flex', gap: 8}}>
                                <button onClick={() => viewScreenshot(s)} style={{...buttonStyle, background: '#06b6d4', width: 90}}>Open</button>
                                <button onClick={() => deleteScreenshot(s)} style={{...buttonStyle, background: '#ef4444', width: 90}}>Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {reportContent && (
                          <div style={{background: '#0f172a', color: '#e6eef8', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 12}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                              <div style={{fontWeight: 700}}>Report Content</div>
                              <button onClick={() => setReportContent(null)} style={{background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer'}}>Close</button>
                            </div>
                            <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{reportContent}</pre>
                          </div>
                        )}
                      </div>
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setHealth(data.status || "ok");
      setHealthDetail("Connected to backend at " + apiUrl);
    } catch (error: any) {
      setHealth("unavailable");
      setHealthDetail(error?.message || "Unable to reach backend.");
    }
  };

  useEffect(() => {
    refreshHealth();
    loadCustomTests();
    loadOllamaModel();
    loadContextFiles();
    checkOllamaStatus();
  }, []);

  const loadOllamaModel = async () => {
    try {
      const resp = await fetch(`${apiUrl}/api/tests/ollama/model`);
      if (!resp.ok) return;
      const data = await resp.json();
      setOllamaModel(data.model || null);
    } catch (e) {
      console.warn('Could not load model', e);
    }
  };

  const checkOllamaStatus = async () => {
    try {
      const resp = await fetch(`${apiUrl}/api/tests/ollama/status`);
      if (!resp.ok) {
        setOllamaAvailable(false);
        setOllamaStatusInfo('Status check failed');
        return;
      }
      const data = await resp.json();
      setOllamaAvailable(!!data.available);
      setOllamaStatusInfo(String(data.info || ''));
    } catch (e: any) {
      setOllamaAvailable(false);
      setOllamaStatusInfo(e?.message || 'Error checking Ollama');
    }
  };

  const setModel = async (model: string) => {
    try {
      const resp = await fetch(`${apiUrl}/api/tests/ollama/model`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model }) });
      if (resp.ok) {
        setOllamaModel(model);
        alert('Model saved: ' + model);
      } else {
        const err = await resp.json();
        alert('Save failed: ' + (err.error || resp.status));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const loadContextFiles = async () => {
    try {
      const resp = await fetch(`${apiUrl}/api/tests/ollama/context`);
      if (!resp.ok) return;
      const data = await resp.json();
      setContextFiles(data.files || []);
    } catch (e) {
      console.warn('Could not load context files', e);
    }
  };

  const uploadContextFile = async (file: File) => {
    try {
      const text = await file.text();
      const resp = await fetch(`${apiUrl}/api/tests/ollama/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, content: text }) });
      const data = await resp.json();
      if (resp.ok) {
        alert('Uploaded ' + data.file);
        loadContextFiles();
      } else {
        alert('Upload failed: ' + (data.error || 'unknown'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const appendSessionLog = (message: string) => {
    setSessionLogs((prev) => [...prev, message]);
  };

  const refreshSessionState = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`${apiUrl}/api/tests/session/status/${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        setSessionState(data.state || null);
        setSessionStatus('Session ready');
        appendSessionLog('Refreshed session state.');
      } else {
        setSessionState(null);
        setSessionStatus('Session unavailable');
        appendSessionLog(`Session status failed: ${data.error || response.status}`);
      }
    } catch (error: any) {
      setSessionStatus('Unable to refresh session state');
      appendSessionLog(`Error refreshing session state: ${error.message}`);
    }
  };

  const closeOllamaSession = async () => {
    if (!sessionId) return;
    setSessionLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/tests/session/close/${sessionId}`, { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        appendSessionLog(`Closed session ${sessionId}`);
        setSessionId(null);
        setSessionState(null);
        setSessionStatus('Session closed');
      } else {
        appendSessionLog(`Failed to close session: ${data.error || response.status}`);
      }
    } catch (error: any) {
      appendSessionLog(`Error closing session: ${error.message}`);
    } finally {
      setSessionLoading(false);
    }
  };

  const runSlotGameFlow = async () => {
    setSessionLoading(true);
    setSessionLogs([]);
    setSessionStatus('Starting live game session...');
    appendSessionLog('▶ Starting live Ollama game session');

    try {
      const startResponse = await fetch(`${apiUrl}/api/tests/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: gameUrl, headless: isHeadless }),
      });
      const startData = await startResponse.json();
      if (!startResponse.ok) {
        throw new Error(startData.error || 'Could not start session');
      }

      setSessionId(startData.sessionId);
      setSessionState(startData.state || null);
      appendSessionLog(`✅ Session started: ${startData.sessionId}`);
      setSessionStatus('Session started');

      const commandResponse = await fetch(`${apiUrl}/api/tests/session/command/${startData.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: sessionCommandText, maxSteps: 12 }),
      });
      const commandData = await commandResponse.json();
      if (!commandResponse.ok) {
        throw new Error(commandData.error || 'Could not execute session command');
      }

      appendSessionLog(`✅ Command executed: ${commandData.success ? 'success' : 'failure'}`);
      if (Array.isArray(commandData.steps)) {
        commandData.steps.forEach((step: any, index: number) => {
          appendSessionLog(`Step ${index + 1}: ${step}`);
        });
      }
      setSessionState(commandData.state || startData.state || sessionState);
      setSessionStatus(commandData.success ? 'Slot flow completed' : 'Slot flow completed with warnings');
    } catch (error: any) {
      appendSessionLog(`❌ ${error.message}`);
      setSessionStatus('Slot flow failed');
    } finally {
      setSessionLoading(false);
    }
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatMessages((s) => [...s, { from: 'user', text: msg }]);
    setChatInput('');
    setOllamaChatLoading(true);
    try {
      const resp = await fetch(`${apiUrl}/api/tests/ollama/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const data = await resp.json();
      if (resp.ok) {
        let reply = String(data.reply || JSON.stringify(data) || '');
        // Extra safety: strip any trailing JSON metadata from Ollama streaming response
        reply = reply.replace(/\s*\{\s*"model"\s*:.*$/s, '').trim();
        setChatMessages((s) => [...s, { from: 'bot', text: reply || '(no response)' }]);
      } else {
        setChatMessages((s) => [...s, { from: 'bot', text: 'Error: ' + (data.error || resp.status) }]);
      }
    } catch (e: any) {
      setChatMessages((s) => [...s, { from: 'bot', text: 'Error: ' + e.message }]);
    } finally {
      setOllamaChatLoading(false);
    }
  };

  const loadCustomTests = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/tests/list`, {
        headers: {"x-user-id": "user-1"},
      });
      if (response.ok) {
        const data = await response.json();
        setCustomTests(data.tests || []);
      }
    } catch (error) {
      console.error("Failed to load tests:", error);
    }
  };

  const createCustomTest = async () => {
    if (!testName.trim() || !testInstructions.trim()) {
      alert("Please fill in test name and instructions");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/tests/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          name: testName,
          instructions: testInstructions,
          gameUrl: gameUrl,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTestName("");
        setTestInstructions("");
        await loadCustomTests();
      } else {
        alert("Error: " + (data.error || "Failed to create test"));
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const uploadTestFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiUrl}/api/tests/upload`, {
        method: "POST",
        headers: {"x-user-id": "user-1"},
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        await loadCustomTests();
        alert(`Loaded ${data.count} tests from file`);
      } else {
        alert("Error: " + (data.error || "Failed to upload"));
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const runCustomTest = async (testId: string) => {
    setRunningTestId(testId);
    setSelectedTestResult(testId);
    setLoadingEvidence(true);

    try {
      const response = await fetch(`${apiUrl}/api/tests/run/${testId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          headless: isHeadless,
        }),
      });

      const data = await response.json();
      setTestResults((prev) => ({
        ...prev,
        [testId]: data,
      }));

      // Load evidence and metrics after test completes
      if (data.evidencePath) {
        try {
          const evidenceListResponse = await fetch(
            `${apiUrl}/api/tests/evidence/list`,
          );
          const evidenceListData = await evidenceListResponse.json();
          setEvidence((prev) => ({
            ...prev,
            [testId]: evidenceListData.evidence,
          }));

          // set empty report content
          setReportContent(null);

          // Load learning metrics
          const metricsResponse = await fetch(
            `${apiUrl}/api/tests/learning/metrics`,
          );
          const metricsData = await metricsResponse.json();
          setLearningMetrics(metricsData.metrics);
        } catch (evidenceError) {
          console.log("Could not load evidence:", evidenceError);
        }
      }

      if (data.error) {
        alert("Test failed: " + data.error);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setRunningTestId(null);
      setLoadingEvidence(false);
    }
  };

  const deleteCustomTest = async (testId: string) => {
    if (!confirm("Delete this test? This cannot be undone.")) return;
    try {
      const response = await fetch(`${apiUrl}/api/tests/${testId}`, {
        method: "DELETE",
        headers: { "x-user-id": "user-1" },
      });
      const data = await response.json();
      if (response.ok) {
        await loadCustomTests();
      } else {
        alert("Delete failed: " + (data.error || "unknown"));
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const editCustomTest = async (test: any) => {
    const newName = prompt("Edit test name:", test.name) || test.name;
    const newInstructions =
      prompt("Edit test instructions:", test.instructions) || test.instructions;

    try {
      const response = await fetch(`${apiUrl}/api/tests/${test.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({ name: newName, instructions: newInstructions }),
      });
      const data = await response.json();
      if (response.ok) {
        await loadCustomTests();
      } else {
        alert("Update failed: " + (data.error || "unknown"));
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  // Teach textarea state and submit
  const [teachText, setTeachText] = useState("");
  const submitTeach = async () => {
    if (!teachText.trim()) {
      alert("Please enter teaching text or correction.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/tests/learning/teach`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "user-1" },
        body: JSON.stringify({
          testName: "manual-teach",
          whatWasAttempted: teachText,
          whatWorked: false,
          toolsUsed: [],
          canvasElements: [],
          successRate: 0,
          improvements: ["manual teaching entry"],
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Teaching recorded.");
        setTeachText("");
        // refresh metrics
        const metricsResponse = await fetch(`${apiUrl}/api/tests/learning/metrics`);
        const metricsData = await metricsResponse.json();
        setLearningMetrics(metricsData.metrics);
      } else {
        alert("Teach failed: " + (data.error || "unknown"));
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  // Evidence management helpers
  const loadEvidenceList = async (forTestId?: string) => {
    setLoadingEvidence(true);
    try {
      const response = await fetch(`${apiUrl}/api/tests/evidence/list`);
      if (!response.ok) return;
      const data = await response.json();
      const id = forTestId || selectedTestResult;
      if (id) {
        setEvidence((prev) => ({ ...prev, [id]: data.evidence }));
      }
    } catch (e) {
      console.error("Could not load evidence list", e);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const viewReport = async (reportId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/tests/evidence/report/${reportId}`);
      if (!response.ok) {
        const err = await response.json();
        alert(`Could not load report: ${err.error || response.status}`);
        return;
      }
      const data = await response.json();
      const content = typeof data.report === 'string' ? data.report : JSON.stringify(data.report, null, 2);
      setReportContent(content);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      alert('Error loading report: ' + error.message);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    try {
      const response = await fetch(`${apiUrl}/api/tests/evidence/report/${reportId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        alert('Report deleted');
        loadEvidenceList(selectedTestResult || undefined);
        setReportContent(null);
      } else {
        alert('Delete failed: ' + (data.error || 'unknown'));
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const viewScreenshot = (screenshotId: string) => {
    // open direct image endpoint in new tab
    const url = `${apiUrl}/api/tests/evidence/screenshot/${screenshotId}`;
    window.open(url, '_blank');
  };

  const deleteScreenshot = async (screenshotId: string) => {
    if (!confirm('Delete this screenshot? This cannot be undone.')) return;
    try {
      const response = await fetch(`${apiUrl}/api/tests/evidence/screenshot/${screenshotId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        alert('Screenshot deleted');
        loadEvidenceList(selectedTestResult || undefined);
      } else {
        alert('Delete failed: ' + (data.error || 'unknown'));
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const createSandbox = async () => {
    setRunningSandbox(true);
    setSandboxResult("");
    setPromotionResult("");

    try {
      const response = await fetch(`${apiUrl}/api/sandbox`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          title: "Cash Wings 96 visual spin test",
          description,
          instructions,
          platform,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          parameters: {gameUrl},
          metadata: {intent: "spin and verify balance"},
          createdBy: "user-1",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sandbox creation failed");
      }

      const data = await response.json();
      setSandboxId(data.sandbox.id);
      setSandboxResult(`Sandbox created: ${data.sandbox.id}`);
    } catch (error: any) {
      setSandboxResult(`Error: ${error.message}`);
    } finally {
      setRunningSandbox(false);
    }
  };

  const promoteSandbox = async () => {
    if (!sandboxId) {
      setPromotionResult("Please create a sandbox test case first.");
      return;
    }

    setRunningPromotion(true);
    setPromotionResult("");

    try {
      const payload = {
        testCaseId: sandboxId,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        parameterMapping: Object.fromEntries(
          parameterMapping.split(/\s*[;,]\s*/).map((entry) => {
            const [key, value] = entry.split("=");
            return [key?.trim(), value?.trim()];
          }),
        ),
      };

      const response = await fetch(`${apiUrl}/api/promotion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Promotion failed");
      }

      const data = await response.json();
      setPromotionResult(`Promoted to library: ${data.testCase.id}`);
    } catch (error: any) {
      setPromotionResult(`Error: ${error.message}`);
    } finally {
      setRunningPromotion(false);
    }
  };

  const runVisualTest = async () => {
    setRunningExecute(true);
    setExecutionResult("");
    setExecutionSteps([]);
    setConsoleLogs([
      "🚀 Starting visual AI test...",
      "⏳ Loading game URL...",
      "",
    ]);
    setOllamaLogs([
      "🤖 Ollama Thinking Panel...",
      "Waiting for AI analysis...",
      "",
    ]);
    setConsoleVisible(true);
    setOllamaLogsVisible(true);

    const addLog = (message: string) => {
      setConsoleLogs((prev) => [...prev, message]);
    };

    const addOllamaLog = (message: string) => {
      setOllamaLogs((prev) => [...prev, message]);
    };

    try {
      addLog("📡 Sending request to backend API...");
      addOllamaLog("🔄 Connecting to Ollama at http://localhost:11434...");

      const response = await fetch(`${apiUrl}/api/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-1",
        },
        body: JSON.stringify({
          url: gameUrl,
          instructions,
          platform,
          headless: isHeadless,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        addLog(`❌ Error: ${data.error || "Execution failed"}`);
        addOllamaLog(`❌ Error: ${data.error || "Execution failed"}`);
        throw new Error(data.error || "Execution failed");
      }

      // Add Ollama logs if provided
      if (data.ollamaLogs && Array.isArray(data.ollamaLogs)) {
        addOllamaLog("✅ Ollama Analysis Complete:");
        addOllamaLog("─".repeat(60));
        data.ollamaLogs.forEach((log: string) => addOllamaLog(log));
        addOllamaLog("─".repeat(60));
      }

      addLog(`✅ Backend returned status: ${data.status}`);
      addLog(`📊 Total steps executed: ${data.steps?.length || 0}`);

      if (data.steps && data.steps.length > 0) {
        data.steps.forEach((step: any, idx: number) => {
          addLog(`\n  [Step ${idx + 1}] ${step.description}`);
          addLog(`     → ${step.explanation}`);
          if (step.x != null && step.y != null) {
            addLog(`     → Clicked at (${step.x}, ${step.y})`);
          }
        });
      }

      addLog("\n✅ Test completed!");
      setExecutionResult(`Execution status: ${data.status}`);
      setExecutionSteps(data.steps || []);
    } catch (error: any) {
      addLog(`\n❌ ERROR: ${error.message}`);
      addOllamaLog(`\n❌ ERROR: ${error.message}`);
      setExecutionResult(`Error: ${error.message}`);
    } finally {
      setRunningExecute(false);
      addLog("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
  };

  return (
    <main style={pageStyle}>
      <header style={{marginBottom: 28}}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#2563eb",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              Visual QA dashboard
            </p>
            <h1
              style={{
                margin: "12px 0",
                fontSize: "clamp(2.4rem, 3vw, 3.6rem)",
                lineHeight: 1.05,
              }}
            >
              Reelspect Visual QA Platform
            </h1>
            <p
              style={{
                color: "#475569",
                maxWidth: 680,
                fontSize: 17,
                lineHeight: 1.75,
              }}
            >
              A single UI to create sandbox tests, promote them to reusable
              library cases, and execute the visual slot agent against your game
              URL.
            </p>
          </div>
          <div
            style={{...statusPill(health), minWidth: 170, textAlign: "center"}}
          >
            <span>
              {health === "checking"
                ? "Checking..."
                : health === "ok"
                  ? "Backend OK"
                  : "Backend unavailable"}
            </span>
          </div>
        </div>
        {healthDetail && (
          <p style={{marginTop: 12, color: "#475569"}}>{healthDetail}</p>
        )}
      </header>

      <section style={cardStyle}>
        <div style={{display: "grid", gap: 18, gridTemplateColumns: "1fr 1fr"}}>
          <div>
            <h2 style={{marginTop: 0}}>1. Sandbox Test Case</h2>
            <p style={{color: "#475569"}}>
              Create a quick visual test using your slot game URL and
              plain-English instructions.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <button
              onClick={refreshHealth}
              style={{...buttonStyle, background: "#1d4ed8"}}
            >
              Refresh Backend
            </button>
          </div>
        </div>
        <div style={{display: "grid", gap: 18, marginTop: 24}}>
          <label style={{display: "block"}}>
            Game URL
            <textarea
              rows={3}
              value={gameUrl}
              onChange={(event) => setGameUrl(event.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{display: "block"}}>
            Description
            <textarea
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{display: "block"}}>
            Instructions
            <textarea
              rows={6}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              style={inputStyle}
            />
          </label>
          <div
            style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18}}
          >
            <label style={{display: "block"}}>
              Platform
              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                style={inputStyle}
              >
                <option value="DESKTOP">DESKTOP</option>
                <option value="IOS">IOS</option>
                <option value="ANDROID">ANDROID</option>
              </select>
            </label>
            <label style={{display: "block"}}>
              Tags
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                style={inputStyle}
              />
            </label>
          </div>
          <button
            onClick={createSandbox}
            disabled={runningSandbox}
            style={{...buttonStyle, width: 220}}
          >
            {runningSandbox ? "Creating sandbox..." : "Create Sandbox Test"}
          </button>
          {sandboxResult && (
            <p style={{marginTop: 16, color: "#334155"}}>{sandboxResult}</p>
          )}
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={{marginTop: 0}}>2. Promote to Library</h2>
        <p style={{color: "#475569"}}>
          Turn sandbox tests into reusable library test cases with parameter
          mappings.
        </p>
        <div style={{display: "grid", gap: 18, marginTop: 16}}>
          <label style={{display: "block"}}>
            Parameter Mapping
            <input
              value={parameterMapping}
              onChange={(event) => setParameterMapping(event.target.value)}
              style={inputStyle}
            />
          </label>
          <button
            onClick={promoteSandbox}
            disabled={runningPromotion}
            style={{...buttonStyle, width: 280}}
          >
            {runningPromotion ? "Promoting..." : "Promote Sandbox to Library"}
          </button>
          {promotionResult && (
            <p style={{marginTop: 16, color: "#334155"}}>{promotionResult}</p>
          )}
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={{marginTop: 0}}>3. Run the Visual AI Agent</h2>
        <p style={{color: "#475569"}}>
          Execute the visual runner against this URL. The backend will launch
          Chromium, capture screenshots, and simulate clicks.
        </p>

        {/* Browser Mode Toggle */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: 20,
            padding: 16,
            background: "#f0fdf4",
            borderRadius: 12,
            border: "1px solid #dcfce7",
          }}
        >
          <div style={{flex: 1}}>
            <strong
              style={{display: "block", color: "#166534", marginBottom: 4}}
            >
              🖥️ Browser Mode
            </strong>
            <p style={{margin: 0, color: "#166534", fontSize: 13}}>
              {isHeadless
                ? "Headless mode (invisible browser)"
                : "Headful mode (visible browser window)"}
            </p>
          </div>
          <button
            onClick={() => setIsHeadless(!isHeadless)}
            style={{
              ...buttonStyle,
              background: isHeadless ? "#ef4444" : "#22c55e",
              width: 180,
              padding: "10px 16px",
            }}
          >
            {isHeadless ? "🔴 Switch to Visible" : "🟢 Switch to Headless"}
          </button>
        </div>

        <button
          onClick={runVisualTest}
          disabled={runningExecute}
          style={{...buttonStyle, width: 260}}
        >
          {runningExecute
            ? "Running visual agent..."
            : `Run Visual Test (${isHeadless ? "Headless" : "Visible"})`}
        </button>
        {executionResult && (
          <p style={{marginTop: 16, color: "#334155"}}>{executionResult}</p>
        )}

        {/* Ollama Thinking Panel */}
        {ollamaLogsVisible && (
          <div
            style={{
              marginTop: 24,
              background: "#1a1a2e",
              borderRadius: 14,
              padding: 14,
              fontFamily: "monospace",
              fontSize: 13,
              border: "2px solid #16a34a",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span style={{color: "#16a34a", fontWeight: 700}}>
                🤖 Ollama Thinking & Analysis
              </span>
              <button
                onClick={() => setOllamaLogsVisible(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 12,
                }}
              >
                Close
              </button>
            </div>
            <div
              style={{
                maxHeight: 350,
                overflowY: "auto",
                background: "#0d0d1a",
                borderRadius: 8,
                padding: 12,
              }}
            >
              {ollamaLogs.map((log: string, idx: number) => {
                let color = "#a0aec0";
                if (
                  log.includes("🤖") ||
                  log.includes("✅") ||
                  log.includes("🔄")
                )
                  color = "#16a34a";
                else if (log.includes("❌")) color = "#ef4444";
                else if (log.includes("🧠") || log.includes("💭"))
                  color = "#fbbf24";
                else if (log.includes("─") || log.includes("═"))
                  color = "#475569";
                else if (
                  log.includes("Page") ||
                  log.includes("Action") ||
                  log.includes("Button")
                )
                  color = "#60a5fa";

                return (
                  <div
                    key={idx}
                    style={{
                      color,
                      marginBottom: 4,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      lineHeight: 1.4,
                      fontFamily: "Consolas, Monaco, monospace",
                    }}
                  >
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ollama Chat Panel */}
        <div style={{marginTop: 18, display: 'grid', gap: 8}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h4 style={{margin: 0, color: '#93c5fd'}}>💬 Ollama Chat</h4>
            <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
              <input value={ollamaModel || ''} onChange={(e) => setOllamaModel(e.target.value)} placeholder='model (e.g., qwen2.5:3b)' style={{padding: 8, borderRadius: 8, border: '1px solid #cbd5e1'}} />
              <button onClick={() => setModel(ollamaModel || 'qwen2.5:3b')} style={{...buttonStyle, width: 120}}>Save Model</button>
              <button onClick={checkOllamaStatus} style={{...buttonStyle, width: 120, background: '#06b6d4'}}>Test Ollama</button>
              <div style={{marginLeft: 8, fontSize: 13, fontWeight: 700, minWidth: 100}}>
                {ollamaAvailable === true && <span style={{color: '#16a34a'}}>✓ Connected</span>}
                {ollamaAvailable === false && <span style={{color: '#dc2626'}}>✗ Disconnected</span>}
                {ollamaAvailable === null && <span style={{color: '#6b7280'}}>⏳ Unknown</span>}
              </div>
            </div>
          </div>

          <div style={{display: 'flex', gap: 12}}>
            <div style={{flex: 1}}>
              <div style={{background: '#0b1220', color: '#e6eef8', padding: 12, borderRadius: 8, maxHeight: 260, overflowY: 'auto', fontFamily: 'monospace', fontSize: 13}}>
                {chatMessages.map((m, idx) => (
                  <div key={idx} style={{marginBottom: 8}}>
                    <div style={{fontSize: 11, color: m.from === 'user' ? '#93c5fd' : '#a7f3d0'}}>{m.from === 'user' ? 'You' : 'Ollama'}</div>
                    <div style={{whiteSpace: 'pre-wrap'}}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div style={{display: 'flex', gap: 8, marginTop: 8}}>
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder='Ask Ollama...' style={{...inputStyle, flex: 1}} onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} />
                <button onClick={sendChatMessage} disabled={ollamaChatLoading || ollamaAvailable === false} style={{...buttonStyle, width: 120, opacity: ollamaChatLoading || ollamaAvailable === false ? 0.6 : 1, cursor: ollamaChatLoading || ollamaAvailable === false ? 'not-allowed' : 'pointer'}}>
                  {ollamaChatLoading ? '⏳ Sending...' : 'Send'}
                </button>
              </div>
            </div>

            <div style={{width: 320}}>
              <div style={{background: '#fff', padding: 10, borderRadius: 8}}>
                <div style={{fontWeight: 700, marginBottom: 8}}>Context Files</div>
                <div style={{display: 'grid', gap: 6, maxHeight: 200, overflowY: 'auto'}}>
                  {contextFiles.length === 0 && <div style={{color: '#666', fontSize: 12}}>No files</div>}
                  {contextFiles.map((f) => (
                    <div key={f} style={{fontFamily: 'monospace', fontSize: 12}}>{f}</div>
                  ))}
                </div>
                <div style={{marginTop: 8}}>
                  <label style={{display: 'block', cursor: 'pointer'}}>
                    <input type='file' onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadContextFile(file); }} style={{display: 'block'}} />
                  </label>
                </div>
                <div style={{marginTop: 8}}>
                  <button onClick={loadContextFiles} style={{...buttonStyle, width: 120}}>Refresh</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{marginTop: 24, padding: 20, borderRadius: 18, background: '#f8fafc', border: '1px solid #cbd5e1'}}>
            <h3 style={{marginTop: 0, color: '#1d4ed8'}}>🎮 Live Ollama Game Session</h3>
            <p style={{margin: 0, color: '#475569', fontSize: 14}}>
              Start a live browser session, then ask Ollama to click SignIn, select game, select manifest, and launch the game.
            </p>
            <textarea
              value={sessionCommandText}
              onChange={(e) => setSessionCommandText(e.target.value)}
              rows={4}
              style={{...inputStyle, marginTop: 12, resize: 'vertical'}}
            />
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12}}>
              <button onClick={runSlotGameFlow} disabled={sessionLoading} style={{...buttonStyle, background: '#2563eb', width: 220}}>
                {sessionLoading ? 'Running slot flow...' : 'Run Slot Game Flow'}
              </button>
              <button onClick={refreshSessionState} disabled={!sessionId || sessionLoading} style={{...buttonStyle, background: '#06b6d4', width: 180}}>
                Refresh Session Status
              </button>
              <button onClick={closeOllamaSession} disabled={!sessionId || sessionLoading} style={{...buttonStyle, background: '#ef4444', width: 140}}>
                Close Session
              </button>
            </div>
            <div style={{marginTop: 12, display: 'grid', gap: 8}}>
              <div style={{fontSize: 13, color: '#334155'}}><strong>Session:</strong> {sessionId || 'No session started'}</div>
              <div style={{fontSize: 13, color: '#334155'}}><strong>Session state:</strong> {sessionStatus || 'Idle'}</div>
              {sessionState && (
                <div style={{fontSize: 13, color: '#475569', background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #e2e8f0'}}>
                  <div><strong>URL:</strong> {sessionState.url}</div>
                  <div><strong>Title:</strong> {sessionState.title}</div>
                  <div><strong>Page status:</strong> {sessionState.pageStatus}</div>
                  <div><strong>Canvas zones:</strong> {Array.isArray(sessionState.canvasZones) ? sessionState.canvasZones.length : 0}</div>
                </div>
              )}
              {sessionLogs.length > 0 && (
                <div style={{background: '#0f172a', color: '#e2e8f0', borderRadius: 12, padding: 12, maxHeight: 240, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12}}>
                  {sessionLogs.map((log, idx) => (
                    <div key={idx} style={{marginBottom: 6}}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Execution Console */}
        {consoleVisible && (
          <div
            style={{
              marginTop: 24,
              background: "#1e1e1e",
              borderRadius: 14,
              padding: 14,
              fontFamily: "monospace",
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span style={{color: "#00d4ff", fontWeight: 700}}>
                🖥️ Live Execution Console
              </span>
              <button
                onClick={() => setConsoleVisible(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 12,
                }}
              >
                Close
              </button>
            </div>
            <div
              style={{
                maxHeight: 300,
                overflowY: "auto",
                background: "#0d1117",
                borderRadius: 8,
                padding: 12,
              }}
            >
              {consoleLogs.map((log: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    color: log.includes("✅")
                      ? "#4ade80"
                      : log.includes("❌")
                        ? "#f87171"
                        : log.includes("⏳")
                          ? "#fbbf24"
                          : "#a0aec0",
                    marginBottom: 4,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {executionSteps.length > 0 && (
          <div style={{marginTop: 24}}>
            <h3 style={{marginBottom: 14}}>Execution Steps</h3>
            <div style={{display: "grid", gap: 18}}>
              {executionSteps.map((step) => (
                <div
                  key={step.stepIndex}
                  style={{
                    background: "#f8fafc",
                    borderRadius: 18,
                    padding: 18,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <strong>{step.description}</strong>
                    <span style={{color: "#475569"}}>
                      Result: {step.result}
                    </span>
                  </div>
                  <div style={{marginTop: 10, color: "#475569"}}>
                    <div>Action: {step.action}</div>
                    <div>Explanation: {step.explanation}</div>
                    {step.x != null && step.y != null && (
                      <div>
                        Clicked at: {step.x}, {step.y}
                      </div>
                    )}
                  </div>
                  {step.screenshotBase64 && (
                    <img
                      src={`data:image/png;base64,${step.screenshotBase64}`}
                      alt={`step-${step.stepIndex}`}
                      style={{
                        marginTop: 14,
                        width: "100%",
                        maxWidth: 560,
                        borderRadius: 14,
                        border: "1px solid #d1d5db",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={{marginTop: 0}}>
          4. � Custom Test Management & Learning Analysis
        </h2>
        <p style={{color: "#475569"}}>
          Create custom tests, upload test files, and observe Ollama's learning
          process with retry mechanisms and button-finding analysis.
        </p>

        {/* Create Custom Test */}
        <div
          style={{
            background: "#f0fdf4",
            borderRadius: 14,
            padding: 18,
            marginBottom: 24,
            border: "1px solid #dcfce7",
          }}
        >
          <h3 style={{marginTop: 0, color: "#166534"}}>
            ✏️ Create Custom Test
          </h3>
          <div style={{display: "grid", gap: 12}}>
            <label style={{display: "block"}}>
              Test Name
              <input
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g., Spin Game 3 Times"
                style={inputStyle}
              />
            </label>
            <label style={{display: "block"}}>
              Test Instructions
              <textarea
                value={testInstructions}
                onChange={(e) => setTestInstructions(e.target.value)}
                placeholder="e.g., 1. Navigate to game\n2. Click spin button\n3. Wait for animation\n4. Check balance change"
                style={{
                  ...inputStyle,
                  height: 120,
                  fontFamily: "monospace",
                  fontSize: 13,
                  resize: "vertical",
                }}
              />
            </label>
            <button
              onClick={createCustomTest}
              style={{...buttonStyle, width: 140}}
            >
              ✏️ Create Test
            </button>
          </div>
        </div>

        {/* Upload Test File */}
        <div
          style={{
            background: "#fef3c7",
            borderRadius: 14,
            padding: 18,
            marginBottom: 24,
            border: "1px solid #fcd34d",
          }}
        >
          <h3 style={{marginTop: 0, color: "#92400e"}}>📤 Upload Test File</h3>
          <p style={{color: "#78350f", marginTop: 8, marginBottom: 12}}>
            Supports JSON, JSONL, or markdown formats
          </p>
          <label style={{display: "block", cursor: "pointer"}}>
            <input
              type="file"
              onChange={uploadTestFile}
              accept=".json,.jsonl,.md,.txt"
              style={{display: "block", padding: 10}}
            />
          </label>
        </div>

        {/* Custom Tests List */}
        {customTests.length > 0 && (
          <div
            style={{
              background: "#ede9fe",
              borderRadius: 14,
              padding: 18,
              marginBottom: 24,
              border: "1px solid #ddd6fe",
            }}
          >
            <h3 style={{marginTop: 0, color: "#6b21a8"}}>
              📋 Custom Tests ({customTests.length})
            </h3>
            {/* Teach input for manual corrections */}
            <div style={{marginBottom: 12}}>
              <div style={{fontSize: 13, color: "#475569", marginBottom: 6}}>
                🧑‍🏫 Teach Ollama (manual correction / notes)
              </div>
              <textarea
                value={teachText}
                onChange={(e) => setTeachText(e.target.value)}
                placeholder="Describe the correction or hint for Ollama (e.g., 'The spin button is labeled Play, not Spin')"
                style={{...inputStyle, height: 80, marginBottom: 8}}
              />
              <div>
                <button onClick={submitTeach} style={{...buttonStyle, width: 160}}>
                  🧠 Teach Ollama
                </button>
              </div>
            </div>
            <div style={{display: "grid", gap: 12}}>
              {customTests.map((test: any) => (
                <div
                  key={test.id}
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: 14,
                    border: "1px solid #ddd6fe",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{flex: 1}}>
                    <div style={{fontWeight: 600, color: "#111"}}>
                      {test.name}
                    </div>
                    <div style={{fontSize: 12, color: "#666", marginTop: 4}}>
                      {test.instructions?.substring(0, 60)}...
                    </div>
                  </div>
                  <div style={{display: "flex", gap: 8, alignItems: "center"}}>
                    {testResults[test.id] && (
                      <div
                        style={{
                          fontSize: 12,
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: testResults[test.id].success
                            ? "#ecfdf5"
                            : "#fde8e8",
                          color: testResults[test.id].success
                            ? "#166534"
                            : "#991b1b",
                        }}
                      >
                        {testResults[test.id].success
                          ? "✅ Passed"
                          : "❌ Failed"}
                      </div>
                    )}
                    <button
                      onClick={() => runCustomTest(test.id)}
                      disabled={runningTestId === test.id}
                      style={{
                        ...buttonStyle,
                        background:
                          runningTestId === test.id ? "#9ca3af" : "#2563eb",
                        width: 120,
                        padding: "8px 12px",
                        fontSize: 13,
                      }}
                    >
                      {runningTestId === test.id ? "Running..." : "▶️ Run"}
                    </button>
                    <button
                      onClick={() => editCustomTest(test)}
                      style={{
                        ...buttonStyle,
                        background: "#f59e0b",
                        width: 90,
                        padding: "8px 10px",
                        fontSize: 13,
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteCustomTest(test.id)}
                      style={{
                        ...buttonStyle,
                        background: "#ef4444",
                        width: 90,
                        padding: "8px 10px",
                        fontSize: 13,
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Visibility & Button-Finding Analysis */}
        {selectedTestResult && testResults[selectedTestResult] && (
          <div
            style={{
              background: "#f8f9fa",
              borderRadius: 14,
              padding: 18,
              marginTop: 24,
              border: "2px solid #0ea5e9",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h3 style={{margin: 0, color: "#0369a1"}}>
                🧠 Learning & Button-Finding Analysis
              </h3>
              <button
                onClick={() => setLearningVisibility(!learningVisibility)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0369a1",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {learningVisibility ? "▼ Hide" : "▶ Show"}
              </button>
            </div>

            {learningVisibility && (
              <div style={{display: "grid", gap: 16}}>
                {/* Test Status Overview */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: 14,
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <div
                    style={{fontWeight: 600, marginBottom: 10, color: "#111"}}
                  >
                    📊 Test Status
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{fontSize: 12, color: "#666"}}>Success</div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: testResults[selectedTestResult].success
                            ? "#16a34a"
                            : "#dc2626",
                        }}
                      >
                        {testResults[selectedTestResult].success
                          ? "✅ YES"
                          : "❌ NO"}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize: 12, color: "#666"}}>Duration</div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#0369a1",
                        }}
                      >
                        {testResults[selectedTestResult].duration || 0}ms
                      </div>
                    </div>
                  </div>
                </div>

                {/* Retry Attempts */}
                {testResults[selectedTestResult].retryAttempts &&
                  testResults[selectedTestResult].retryAttempts.length > 0 && (
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 10,
                        padding: 14,
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 10,
                          color: "#111",
                        }}
                      >
                        🔄 Retry Attempts (
                        {testResults[selectedTestResult].retryAttempts.length})
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gap: 8,
                          maxHeight: 300,
                          overflowY: "auto",
                        }}
                      >
                        {testResults[selectedTestResult].retryAttempts.map(
                          (attempt: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                background: attempt.success
                                  ? "#f0fdf4"
                                  : "#fef2f2",
                                borderRadius: 8,
                                padding: 10,
                                borderLeft: `3px solid ${attempt.success ? "#16a34a" : "#dc2626"}`,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  marginBottom: 4,
                                }}
                              >
                                Attempt {idx + 1}:{" "}
                                {attempt.success ? "✅ Success" : "❌ Failed"}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#666",
                                  fontFamily: "monospace",
                                }}
                              >
                                {attempt.reason}
                              </div>
                              {attempt.strategy && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#666",
                                    marginTop: 4,
                                  }}
                                >
                                  Strategy: {attempt.strategy}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Button Finding Debug */}
                {testResults[selectedTestResult].buttonFindingDebug && (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 10,
                      padding: 14,
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <div
                      style={{fontWeight: 600, marginBottom: 10, color: "#111"}}
                    >
                      🔘 Button Finding Analysis
                    </div>
                    <div style={{display: "grid", gap: 8, fontSize: 12}}>
                      <div>
                        <span style={{color: "#666"}}>
                          Buttons Visible on Page:
                        </span>
                        <div style={{fontWeight: 600, color: "#0369a1"}}>
                          {
                            testResults[selectedTestResult].buttonFindingDebug
                              .totalButtons
                          }{" "}
                          buttons found
                        </div>
                      </div>
                      <div>
                        <span style={{color: "#666"}}>Ollama Identified:</span>
                        <div
                          style={{
                            fontWeight: 600,
                            color: testResults[selectedTestResult]
                              .buttonFindingDebug.ollamaFound
                              ? "#16a34a"
                              : "#dc2626",
                          }}
                        >
                          {testResults[selectedTestResult].buttonFindingDebug
                            .ollamaFound
                            ? "✅ Found target button"
                            : "❌ Could not identify target button"}
                        </div>
                      </div>
                      <div>
                        <span style={{color: "#666"}}>
                          Reason for Mismatch (if any):
                        </span>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: 11,
                            background: "#f8f9fa",
                            padding: 8,
                            borderRadius: 6,
                            marginTop: 4,
                            color: "#475569",
                          }}
                        >
                          {testResults[selectedTestResult].buttonFindingDebug
                            .reason || "No mismatch"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Learning Patterns */}
                {testResults[selectedTestResult].learningPatterns && (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 10,
                      padding: 14,
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <div
                      style={{fontWeight: 600, marginBottom: 10, color: "#111"}}
                    >
                      💡 Patterns Learned
                    </div>
                    {testResults[selectedTestResult].learningPatterns.length >
                    0 ? (
                      <div style={{display: "grid", gap: 8}}>
                        {testResults[selectedTestResult].learningPatterns.map(
                          (pattern: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                background: "#f0fdf4",
                                borderRadius: 6,
                                padding: 10,
                                borderLeft: "3px solid #16a34a",
                                fontSize: 12,
                              }}
                            >
                              <div style={{fontWeight: 600, color: "#166534"}}>
                                Pattern {idx + 1}:
                              </div>
                              <div style={{color: "#475569", marginTop: 4}}>
                                {pattern}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div style={{color: "#666", fontSize: 12}}>
                        No patterns learned yet
                      </div>
                    )}
                  </div>
                )}

                {/* Ollama Decision Log */}
                {testResults[selectedTestResult].ollamaDecisions && (
                  <div
                    style={{
                      background: "#1a1a2e",
                      borderRadius: 10,
                      padding: 14,
                      border: "1px solid #16a34a",
                      fontFamily: "monospace",
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 10,
                        color: "#16a34a",
                      }}
                    >
                      🤖 Ollama Decision Log
                    </div>
                    <div
                      style={{
                        maxHeight: 250,
                        overflowY: "auto",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      {testResults[selectedTestResult].ollamaDecisions.map(
                        (decision: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              background: "#0d0d1a",
                              borderRadius: 6,
                              padding: 8,
                              borderLeft: `2px solid ${decision.success ? "#16a34a" : "#ef4444"}`,
                              color: decision.success ? "#16a34a" : "#ef4444",
                            }}
                          >
                            <div style={{fontWeight: 600}}>
                              {decision.action}
                            </div>
                            <div
                              style={{
                                color: "#a0aec0",
                                marginTop: 2,
                                fontSize: 10,
                              }}
                            >
                              {decision.reasoning}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Canvas Analysis */}
                {testResults[selectedTestResult].canvasAnalysis && (
                  <div
                    style={{
                      background: "#f0e7ff",
                      borderRadius: 10,
                      padding: 14,
                      border: "1px solid #e9d5ff",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 10,
                        color: "#6b21a8",
                      }}
                    >
                      🎮 Canvas Analysis
                    </div>
                    <div style={{display: "grid", gap: 8, fontSize: 12}}>
                      <div>
                        <span style={{color: "#666"}}>Canvas Detected:</span>
                        <div
                          style={{
                            fontWeight: 600,
                            color: testResults[selectedTestResult]
                              .canvasAnalysis.hasCanvas
                              ? "#16a34a"
                              : "#dc2626",
                          }}
                        >
                          {testResults[selectedTestResult].canvasAnalysis
                            .hasCanvas
                            ? "✅ YES (Game is canvas-based)"
                            : "❌ NO"}
                        </div>
                      </div>
                      <div>
                        <span style={{color: "#666"}}>Canvas Count:</span>
                        <div style={{fontWeight: 600, color: "#0369a1"}}>
                          {
                            testResults[selectedTestResult].canvasAnalysis
                              .canvasCount
                          }
                        </div>
                      </div>
                      <div>
                        <span style={{color: "#666"}}>
                          Page Elements Found:
                        </span>
                        <div style={{fontWeight: 600, color: "#0369a1"}}>
                          {testResults[selectedTestResult].canvasAnalysis
                            .elements?.length || 0}{" "}
                          interactive elements
                        </div>
                      </div>
                      {testResults[selectedTestResult].canvasAnalysis.elements
                        ?.slice(0, 5)
                        .map((elem: string, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              background: "#fff",
                              padding: 8,
                              borderRadius: 4,
                              fontSize: 11,
                              fontFamily: "monospace",
                              color: "#475569",
                            }}
                          >
                            • {elem}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Expected vs Actual */}
                {testResults[selectedTestResult].expectedVsActual &&
                  testResults[selectedTestResult].expectedVsActual.length >
                    0 && (
                    <div
                      style={{
                        background: "#eff6ff",
                        borderRadius: 10,
                        padding: 14,
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 10,
                          color: "#0369a1",
                        }}
                      >
                        ✅/❌ Expected vs Actual
                      </div>
                      <div style={{display: "grid", gap: 8}}>
                        {testResults[selectedTestResult].expectedVsActual.map(
                          (item: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                background: item.match ? "#dcfce7" : "#fee2e2",
                                borderRadius: 8,
                                padding: 10,
                                borderLeft: `3px solid ${item.match ? "#16a34a" : "#dc2626"}`,
                                fontSize: 11,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 4,
                                  marginBottom: 4,
                                }}
                              >
                                <span>{item.match ? "✅" : "❌"}</span>
                                <span
                                  style={{
                                    fontFamily: "monospace",
                                    color: "#475569",
                                  }}
                                >
                                  Expected: {item.expected}
                                </span>
                              </div>
                              <div style={{display: "flex", gap: 4}}>
                                <span> {item.match ? "✅" : "❌"}</span>
                                <span
                                  style={{
                                    fontFamily: "monospace",
                                    color: "#475569",
                                  }}
                                >
                                  Actual: {item.actual}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Error Logs */}
                {testResults[selectedTestResult].errorLogs &&
                  testResults[selectedTestResult].errorLogs.length > 0 && (
                    <div
                      style={{
                        background: "#fef2f2",
                        borderRadius: 10,
                        padding: 14,
                        border: "1px solid #fecaca",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 10,
                          color: "#991b1b",
                        }}
                      >
                        🚨 Errors & Issues
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gap: 6,
                          maxHeight: 200,
                          overflowY: "auto",
                        }}
                      >
                        {testResults[selectedTestResult].errorLogs.map(
                          (error: string, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                background: "#fff",
                                padding: 8,
                                borderRadius: 4,
                                fontSize: 11,
                                fontFamily: "monospace",
                                color: "#dc2626",
                                borderLeft: "2px solid #dc2626",
                              }}
                            >
                              ❌ {error}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Tool Selections Made */}
                {testResults[selectedTestResult].toolSelections &&
                  testResults[selectedTestResult].toolSelections.length > 0 && (
                    <div
                      style={{
                        background: "#f3e8ff",
                        borderRadius: 10,
                        padding: 14,
                        border: "1px solid #ddd6fe",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 10,
                          color: "#6b21a8",
                        }}
                      >
                        🔧 Tools Selected & Used
                      </div>
                      <div style={{display: "grid", gap: 8}}>
                        {testResults[selectedTestResult].toolSelections.map(
                          (tool: any, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                background: tool.success
                                  ? "#f0fdf4"
                                  : "#fef2f2",
                                borderRadius: 8,
                                padding: 10,
                                borderLeft: `3px solid ${tool.success ? "#16a34a" : "#dc2626"}`,
                                fontSize: 11,
                              }}
                            >
                              <div style={{fontWeight: 600, marginBottom: 4}}>
                                {tool.toolName} {tool.success ? "✅" : "❌"}
                              </div>
                              <div style={{color: "#666", fontSize: 10}}>
                                Reason: {tool.reason}
                              </div>
                              <div
                                style={{
                                  color: "#666",
                                  fontSize: 10,
                                  marginTop: 2,
                                }}
                              >
                                Attempt #{tool.attemptNumber}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Improvement Suggestions */}
                {testResults[selectedTestResult].suggestions && (
                  <div
                    style={{
                      background: "#fef3c7",
                      borderRadius: 10,
                      padding: 14,
                      border: "1px solid #fcd34d",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 10,
                        color: "#92400e",
                      }}
                    >
                      📝 Improvement Suggestions
                    </div>
                    <div style={{display: "grid", gap: 8}}>
                      {testResults[selectedTestResult].suggestions.map(
                        (suggestion: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: 12,
                              color: "#78350f",
                              display: "flex",
                              gap: 8,
                            }}
                          >
                            <span>•</span>
                            <span>{suggestion}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Knowledge Base & Learning Trends */}
                {learningMetrics && (
                  <div
                    style={{
                      background: "#e0e7ff",
                      borderRadius: 10,
                      padding: 14,
                      border: "1px solid #c7d2fe",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 10,
                        color: "#4338ca",
                      }}
                    >
                      📚 Knowledge Base Lifetime Learning
                    </div>
                    <div style={{display: "grid", gap: 12, fontSize: 12}}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            background: "#fff",
                            padding: 10,
                            borderRadius: 6,
                          }}
                        >
                          <div style={{fontSize: 10, color: "#666"}}>
                            Total Attempts
                          </div>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: "#4338ca",
                            }}
                          >
                            {learningMetrics.totalAttempts}
                          </div>
                        </div>
                        <div
                          style={{
                            background: "#fff",
                            padding: 10,
                            borderRadius: 6,
                          }}
                        >
                          <div style={{fontSize: 10, color: "#666"}}>
                            Success Rate
                          </div>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color:
                                learningMetrics.successRate > 50
                                  ? "#16a34a"
                                  : "#dc2626",
                            }}
                          >
                            {learningMetrics.successRate.toFixed(1)}%
                          </div>
                        </div>
                        <div
                          style={{
                            background: "#fff",
                            padding: 10,
                            borderRadius: 6,
                          }}
                        >
                          <div style={{fontSize: 10, color: "#666"}}>Trend</div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0369a1",
                            }}
                          >
                            {learningMetrics.improvementTrend.length > 0
                              ? "📈 "
                              : "→ "}{" "}
                            Learning
                          </div>
                        </div>
                      </div>

                      {learningMetrics.topTools &&
                        learningMetrics.topTools.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                marginBottom: 6,
                                fontSize: 11,
                                color: "#4338ca",
                              }}
                            >
                              Top Tools Used:
                            </div>
                            {learningMetrics.topTools
                              .slice(0, 3)
                              .map((tool: any, idx: number) => (
                                <div
                                  key={idx}
                                  style={{
                                    background: "#fff",
                                    padding: 8,
                                    borderRadius: 4,
                                    marginBottom: 4,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 10,
                                  }}
                                >
                                  <span>
                                    {tool.tool}: {tool.useCount} uses
                                  </span>
                                  <span
                                    style={{
                                      color:
                                        tool.successRate > 70
                                          ? "#16a34a"
                                          : "#f97316",
                                    }}
                                  >
                                    {tool.successRate.toFixed(0)}% success
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}

                      {learningMetrics.improvementTrend &&
                        learningMetrics.improvementTrend.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                marginBottom: 6,
                                fontSize: 11,
                                color: "#4338ca",
                              }}
                            >
                              Success Trend:
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 2,
                                alignItems: "flex-end",
                                height: 40,
                              }}
                            >
                              {learningMetrics.improvementTrend.map(
                                (rate: number, idx: number) => (
                                  <div
                                    key={idx}
                                    title={`Session ${idx + 1}: ${rate.toFixed(0)}%`}
                                    style={{
                                      flex: 1,
                                      background:
                                        rate > 50 ? "#16a34a" : "#ef4444",
                                      height: `${Math.max(rate, 10)}%`,
                                      borderRadius: 2,
                                    }}
                                  />
                                ),
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#666",
                                marginTop: 4,
                              }}
                            >
                              {learningMetrics.improvementTrend.length} sessions
                              tracked
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Evidence & Screenshots */}
                {selectedEvidence && (
                  <div
                    style={{
                      background: "#f5f3ff",
                      borderRadius: 10,
                      padding: 14,
                      border: "1px solid #ede9fe",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 10,
                        color: "#7c3aed",
                      }}
                    >
                      📸 Evidence & Screenshots
                    </div>
                    <div style={{display: "grid", gap: 8, fontSize: 12}}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            background: "#fff",
                            padding: 10,
                            borderRadius: 6,
                          }}
                        >
                          <div style={{fontSize: 10, color: "#666"}}>
                            Screenshots
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#7c3aed",
                            }}
                          >
                            {selectedEvidence?.screenshotsCount || 0}
                          </div>
                        </div>
                        <div
                          style={{
                            background: "#fff",
                            padding: 10,
                            borderRadius: 6,
                          }}
                        >
                          <div style={{fontSize: 10, color: "#666"}}>
                            Reports
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#7c3aed",
                            }}
                          >
                            {selectedEvidence?.reportsCount || 0}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#666",
                          background: "#fff",
                          padding: 10,
                          borderRadius: 6,
                        }}
                      >
                        Evidence saved to:{" "}
                        <span
                          style={{fontFamily: "monospace", color: "#7c3aed"}}
                        >
                          artifacts/test-evidence/
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Learning Metrics Dashboard */}
      <section
        style={{
          marginTop: 24,
          padding: 24,
          borderRadius: 20,
          background: "#f3e8ff",
          border: "2px solid #ddd6fe",
        }}
      >
        <h2 style={{marginTop: 0, color: "#6b21a8"}}>
          📊 Global Learning Metrics
        </h2>
        {learningMetrics ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #e9d5ff",
              }}
            >
              <div style={{fontSize: 12, color: "#666", marginBottom: 8}}>
                Total Attempts
              </div>
              <div style={{fontSize: 32, fontWeight: 700, color: "#6b21a8"}}>
                {learningMetrics.totalAttempts}
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #e9d5ff",
              }}
            >
              <div style={{fontSize: 12, color: "#666", marginBottom: 8}}>
                Overall Success Rate
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color:
                    learningMetrics.successRate > 60 ? "#16a34a" : "#dc2626",
                }}
              >
                {learningMetrics.successRate.toFixed(1)}%
              </div>
            </div>
            {learningMetrics.commonErrors &&
              learningMetrics.commonErrors.length > 0 && (
                <div
                  style={{
                    background: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid #e9d5ff",
                  }}
                >
                  <div style={{fontSize: 12, color: "#666", marginBottom: 8}}>
                    Common Issues
                  </div>
                  <div style={{display: "grid", gap: 4}}>
                    {learningMetrics.commonErrors
                      .slice(0, 2)
                      .map((err: any, idx: number) => (
                        <div key={idx} style={{fontSize: 11, color: "#666"}}>
                          • {err.error.substring(0, 30)}... ({err.count}x)
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div style={{color: "#666", fontSize: 14}}>
            No learning data yet. Run tests to build knowledge base.
          </div>
        )}
      </section>

      <section
        style={{
          marginTop: 24,
          padding: 24,
          borderRadius: 20,
          background: "#eef2ff",
        }}
      >
        <h2 style={{marginTop: 0}}>How it works</h2>
        <ol style={{color: "#475569", lineHeight: 1.8}}>
          <li>
            Create a sandbox test case using the game URL and plain-English
            instructions.
          </li>
          <li>Promote the sandbox case to a reusable library test case.</li>
          <li>
            Run the library test with the Visual AI Agent to capture the canvas
            and issue click coordinates.
          </li>
        </ol>
        <p style={{color: "#475569"}}>
          This UI now shows a clear status badge, a refresh button, and a
          polished execution experience so you can test your game quickly.
        </p>
      </section>
    </main>
  );
}
