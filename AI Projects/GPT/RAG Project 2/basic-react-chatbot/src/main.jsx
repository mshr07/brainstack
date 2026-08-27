import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

// The page asks only for a question. Every other API value stays fixed here.
const API_URL = "http://127.0.0.1:8000/api/v1/ask";
const DEFAULT_OPTIONS = {
  top_k: 3,
  retriever: "chroma",
  rebuild: false,
};

function errorMessage(payload, status) {
  if (typeof payload?.detail === "string") return payload.detail;
  if (Array.isArray(payload?.detail)) {
    return payload.detail.map((item) => item.msg || "Invalid input").join(". ");
  }
  return `The request failed with status ${status}.`;
}

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! Ask me a question about the astronomy notes.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function generateAnswer(event) {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: cleanQuestion },
    ]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: cleanQuestion,
          ...DEFAULT_OPTIONS,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(errorMessage(payload, response.status));
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", text: payload.answer },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: error instanceof Error ? error.message : "Could not reach the API.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="chatbot">
        <header>
          <span className="status-dot" />
          <div>
            <h1>Astronomy RAG Chatbot</h1>
            <p>Answers from the backend knowledge folder</p>
          </div>
        </header>

        <div className="messages" aria-live="polite">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`message ${message.role} ${message.error ? "error" : ""}`}
            >
              {message.text}
            </div>
          ))}

          {loading && (
            <div className="message assistant thinking" role="status">
              Generating answer…
            </div>
          )}
          <div ref={chatEnd} />
        </div>

        <form onSubmit={generateAnswer}>
          <label htmlFor="question">Question</label>
          <div className="input-row">
            <input
              id="question"
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Type your question..."
              maxLength={4000}
              disabled={loading}
              autoComplete="off"
            />
            <button type="submit" disabled={loading || !question.trim()}>
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
