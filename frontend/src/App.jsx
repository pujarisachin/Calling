import React, { useEffect, useMemo, useState } from "react";
import { createTest, endCall, fetchTestResult } from "./api";

const defaultForm = {
  phone_number: "",
  test_name: "",
  test_scenario: "",
  expected_conversation_flow: "",
  success_criteria: "",
  additional_instructions: "",
  test_data: "",
  persona_instructions: "",
};

function parseCriteria(raw) {
  return raw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function App() {
  const [screen, setScreen] = useState("create");
  const [form, setForm] = useState(defaultForm);
  const [testId, setTestId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [endingCall, setEndingCall] = useState(false);

  const callStatus = result?.call?.status || "queued";
  const isFinished = useMemo(() => {
    return ["completed", "failed", "busy", "no-answer", "canceled"].includes(callStatus);
  }, [callStatus]);

  useEffect(() => {
    if (screen !== "running" || !testId) {
      return;
    }

    let timerId;
    const poll = async () => {
      try {
        const data = await fetchTestResult(testId);
        setResult(data);
        if (data.call && ["completed", "failed", "busy", "no-answer", "canceled"].includes(data.call.status)) {
          setScreen("results");
          return;
        }
      } catch (pollError) {
        setError(pollError.message);
        setScreen("results");
        return;
      }
      timerId = setTimeout(poll, 3000);
    };

    poll();
    return () => clearTimeout(timerId);
  }, [screen, testId]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        success_criteria: parseCriteria(form.success_criteria),
      };
      const created = await createTest(payload);
      setTestId(created.test_id);
      setScreen("running");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const onEndCall = async () => {
    setEndingCall(true);
    setError("");
    try {
      await endCall(testId);
    } catch (endError) {
      setError(endError.message);
    } finally {
      setEndingCall(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>AI Voice Bot Testing Platform</h1>
        <p>Automate outbound voice-bot scenario tests with transcript analysis.</p>
      </header>

      {screen === "create" && (
        <section className="card">
          <h2>Create Test</h2>
          <form onSubmit={onSubmit} className="form">
            <label>
              Target Phone Number
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={onChange}
                placeholder="+1XXXXXXXXXX"
                required
              />
            </label>

            <label>
              Test Name
              <input name="test_name" value={form.test_name} onChange={onChange} required />
            </label>

            <label>
              Test Scenario
              <textarea name="test_scenario" value={form.test_scenario} onChange={onChange} rows={4} required />
            </label>

            <label>
              Expected Conversation Flow (Optional)
              <textarea
                name="expected_conversation_flow"
                value={form.expected_conversation_flow}
                onChange={onChange}
                rows={3}
              />
            </label>

            <label>
              Success Criteria (One per line)
              <textarea
                name="success_criteria"
                value={form.success_criteria}
                onChange={onChange}
                rows={5}
                required
              />
            </label>

            <label>
              Additional Instructions (Optional)
              <textarea
                name="additional_instructions"
                value={form.additional_instructions}
                onChange={onChange}
                rows={3}
              />
            </label>

            <label>
              Test Data (Optional)
              <textarea
                name="test_data"
                value={form.test_data}
                onChange={onChange}
                rows={3}
                placeholder={"Specific values the AI caller should give if asked, e.g.\nDOB: 15th March 1990\nPhone number: 9876543210\nAccount number: 1234567890"}
              />
            </label>

            <label>
              Caller Behavior (Optional)
              <textarea
                name="persona_instructions"
                value={form.persona_instructions}
                onChange={onChange}
                rows={3}
                placeholder={"How the AI caller should behave, e.g.\nStay silent after the greeting and just observe what the bot says.\nWhen asked for DOB, say it as \"15 March 1990\" not \"03/15/1990\"."}
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Start Test"}
            </button>
          </form>
        </section>
      )}

      {screen === "running" && (
        <section className="card">
          <h2>Running Test</h2>
          <p>Test ID: {testId}</p>
          <p>Current Call Status: {callStatus}</p>
          <p>The platform is running the scenario and polling results automatically.</p>

          <div className="actions">
            <button type="button" onClick={onEndCall} disabled={endingCall || isFinished}>
              {endingCall ? "Ending Call..." : "End Call"}
            </button>
          </div>

          <h3>Live Transcript</h3>
          {result?.call?.metadata?.transcript_note && <p>{result.call.metadata.transcript_note}</p>}
          <div className="transcript">
            {(result?.transcript || []).length === 0 ? (
              <p>Waiting for live speech...</p>
            ) : (
              (result?.transcript || []).map((item, idx) => (
                <p key={`${idx}-${item.timestamp}`}>
                  <strong>{item.speaker}:</strong> {item.text}
                </p>
              ))
            )}
          </div>
        </section>
      )}

      {screen === "results" && (
        <section className="card">
          <h2>Test Results</h2>
          {result ? (
            <>
              <p>
                <strong>Call Status:</strong> {result.call?.status || "unknown"}
              </p>
              <p>
                <strong>Call Duration:</strong> {result.call?.duration_seconds ?? "-"} seconds
              </p>

              <h3>Overall Result</h3>
              <p>{result.analysis?.overall_result || (isFinished ? "Unavailable" : "Pending")}</p>

              <h3>Score</h3>
              <p>{result.analysis?.score ?? "-"}</p>

              <h3>Summary</h3>
              <p>{result.analysis?.summary || "No summary available."}</p>

              <h3>Success Criteria Evaluation</h3>
              <ul>
                {(result.analysis?.criteria_evaluation || []).map((item, idx) => (
                  <li key={`${idx}-${item.criterion}`}>
                    {item.criterion} - {item.status}: {item.notes}
                  </li>
                ))}
              </ul>

              <h3>Issues Found</h3>
              <ul>
                {(result.analysis?.issues || []).map((item, idx) => (
                  <li key={`${idx}-${item.category}`}>
                    [{item.severity}] {item.category}: {item.description}
                  </li>
                ))}
              </ul>

              <h3>Improvement Suggestions</h3>
              <ul>
                {(result.analysis?.suggestions || []).map((item, idx) => (
                  <li key={`${idx}-${item}`}>{item}</li>
                ))}
              </ul>

              <h3>Transcript</h3>
              {result.call?.metadata?.transcript_note && (
                <p>{result.call.metadata.transcript_note}</p>
              )}
              <div className="transcript">
                {(result.transcript || []).length === 0 ? (
                  <p>No transcript available for this run.</p>
                ) : (
                  (result.transcript || []).map((item, idx) => (
                    <p key={`${idx}-${item.timestamp}`}>
                      <strong>{item.speaker}:</strong> {item.text}
                    </p>
                  ))
                )}
              </div>
            </>
          ) : (
            <p>No result data yet.</p>
          )}

          <div className="actions">
            <button
              type="button"
              onClick={() => {
                setScreen("create");
                setForm(defaultForm);
                setResult(null);
                setTestId("");
                setError("");
              }}
            >
              Create New Test
            </button>
          </div>
        </section>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  );
}
