import React, { useEffect, useMemo, useState } from "react";
import { createTest, fetchTestResult } from "./api";

const defaultForm = {
  phone_number: "",
  test_name: "",
  test_scenario: "",
  expected_conversation_flow: "",
  success_criteria: "",
  additional_instructions: "",
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
              <div className="transcript">
                {(result.transcript || []).map((item, idx) => (
                  <p key={`${idx}-${item.timestamp}`}>
                    <strong>{item.speaker}:</strong> {item.text}
                  </p>
                ))}
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
