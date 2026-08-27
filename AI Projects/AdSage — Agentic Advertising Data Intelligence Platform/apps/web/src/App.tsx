import { FormEvent, useMemo, useState } from "react";

import { RunAccepted, submitQuestion } from "./api";

const suggestions = [
  "Which datasets and columns are required to calculate ROAS?",
  "Compare mobile and desktop conversion rate by placement.",
  "How is campaign_daily_metrics derived?",
];

export function App() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<RunAccepted | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const conversationId = useMemo(() => crypto.randomUUID(), []);

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (token.trim()) setAuthenticated(true);
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await submitQuestion(token, conversationId, question.trim()));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The request failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="sign-in-shell">
        <section className="sign-in-card" aria-labelledby="sign-in-title">
          <div className="brand-mark" aria-hidden="true">
            A
          </div>
          <p className="eyebrow">Governed advertising intelligence</p>
          <h1 id="sign-in-title">Welcome to AdSage</h1>
          <p className="muted">
            Phase 1 uses a short-lived local JWT. Tokens remain in memory and
            are never persisted by this client.
          </p>
          <form onSubmit={signIn}>
            <label htmlFor="access-token">Local access token</label>
            <textarea
              id="access-token"
              rows={4}
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="off"
              required
            />
            <button className="primary" type="submit">
              Continue securely
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>AdSage</span>
        </div>
        <button
          className="new-analysis"
          type="button"
          onClick={() => {
            setQuestion("");
            setResult(null);
          }}
        >
          <span aria-hidden="true">＋</span> New analysis
        </button>
        <nav aria-label="Conversations">
          <p className="nav-label">Today</p>
          <button className="conversation active" type="button">
            Foundation session
          </button>
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" aria-hidden="true" /> Synthetic demo
          tenant
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Analysis workspace</p>
            <h1>Ask the governed data lake</h1>
          </div>
          <span className="phase-badge">Phase 1 · contracts only</span>
        </header>

        <section className="conversation-pane" aria-live="polite">
          {!result && !loading && !error && (
            <div className="welcome-panel">
              <div className="spark" aria-hidden="true">
                ✦
              </div>
              <h2>What would you like to understand?</h2>
              <p>
                Questions are classified through a bounded workflow. No SQL or
                metric is invented in this phase.
              </p>
              <div className="suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="state-card" role="status">
              <span className="loader" /> Applying guardrails and classifying
              intent…
            </div>
          )}
          {error && (
            <div className="state-card error" role="alert">
              <strong>Analysis unavailable</strong>
              <p>{error}</p>
            </div>
          )}
          {result?.answer && (
            <article className="answer-card">
              <div className="answer-meta">
                <span>{result.answer.intent}</span>
                <span>{result.state}</span>
                <span>Request {result.requestId}</span>
              </div>
              <h2>AdSage response</h2>
              <p>{result.answer.text}</p>
              <h3>Evidence</h3>
              {result.answer.citations.length ? (
                <ul>
                  {result.answer.citations.map((citation) => (
                    <li key={citation.evidenceId}>{citation.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-evidence">
                  No governed evidence was retrieved in Phase 1.
                </p>
              )}
              <h3>Limitations</h3>
              <ul>
                {result.answer.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </article>
          )}
        </section>

        <form className="composer" onSubmit={(event) => void ask(event)}>
          <label className="sr-only" htmlFor="question">
            Ask an advertising analytics question
          </label>
          <textarea
            id="question"
            placeholder="Ask about campaigns, metrics, datasets, or lineage…"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            maxLength={4000}
            disabled={loading}
          />
          <div className="composer-footer">
            <span>{question.length.toLocaleString()} / 4,000</span>
            <button
              className="send"
              type="submit"
              disabled={!question.trim() || loading}
              aria-label="Send question"
            >
              ↑
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
