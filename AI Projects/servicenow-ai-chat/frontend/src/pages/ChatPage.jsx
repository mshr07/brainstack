import React, { useState } from "react";
import TicketList from "../components/TicketList.jsx";

const examples = [
  "Which critical tickets are unresolved?",
  "Which tickets are blocked and why?",
  "Suggest a solution for AICB-110",
  "What is the status of aicb-104?"
];

export default function ChatPage({ sendChat, onTicketSelect }) {
  const [question, setQuestion] = useState(examples[0]);
  const [messages, setMessages] = useState([]);
  const [relevantTickets, setRelevantTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!question.trim()) return;
    const userQuestion = question.trim();
    setMessages((items) => [...items, { role: "user", content: userQuestion }]);
    setLoading(true);
    setError("");
    try {
      const response = await sendChat(userQuestion);
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          content: response.answer,
          confidence: response.confidence,
          ticketIds: response.ticket_ids
        }
      ]);
      setRelevantTickets(response.relevant_tickets || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-grid">
      <div className="panel chat-panel">
        <header>
          <h2>Chat</h2>
          <div className="examples">
            {examples.map((item) => (
              <button key={item} onClick={() => setQuestion(item)}>{item}</button>
            ))}
          </div>
        </header>

        <div className="messages">
          {messages.map((message, index) => (
            <article key={index} className={`message ${message.role}`}>
              <pre>{message.content}</pre>
              {message.confidence && <small>Confidence: {message.confidence}</small>}
            </article>
          ))}
          {loading && <div className="message assistant">Thinking from ticket data...</div>}
          {error && <div className="error">{error}</div>}
        </div>

        <form className="chat-form" onSubmit={submit}>
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about Jira tickets" />
          <button disabled={loading}>Send</button>
        </form>
      </div>

      <aside className="panel">
        <h2>Relevant tickets</h2>
        <TicketList tickets={relevantTickets} onTicketSelect={onTicketSelect} />
      </aside>
    </section>
  );
}
