import React, { useEffect, useState } from "react";
import { getTicket } from "../api/client.js";

export default function TicketDetail({ ticketId, setTicketId }) {
  const [ticket, setTicket] = useState(null);
  const [input, setInput] = useState(ticketId);
  const [error, setError] = useState("");

  async function load(id) {
    setError("");
    try {
      setTicket(await getTicket(id));
    } catch (err) {
      setTicket(null);
      setError(err.response?.data?.detail || err.message);
    }
  }

  useEffect(() => {
    setInput(ticketId);
    load(ticketId);
  }, [ticketId]);

  function submit(event) {
    event.preventDefault();
    setTicketId(input.trim().toUpperCase());
  }

  return (
    <section className="panel detail-panel">
      <form className="search-form" onSubmit={submit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} />
        <button>Open</button>
      </form>
      {error && <div className="error">{error}</div>}
      {ticket && (
        <article>
          <h2>{ticket.ticket_id}</h2>
          <h3>{ticket.summary}</h3>
          <dl className="metadata">
            <div><dt>Status</dt><dd>{ticket.status}</dd></div>
            <div><dt>Priority</dt><dd>{ticket.priority}</dd></div>
            <div><dt>Assignee</dt><dd>{ticket.assignee || "Unassigned"}</dd></div>
            <div><dt>Sprint</dt><dd>{ticket.sprint || "None"}</dd></div>
            <div><dt>Updated</dt><dd>{ticket.updated_at || "Unknown"}</dd></div>
          </dl>
          <h3>Description</h3>
          <p>{ticket.description}</p>
          <h3>Comments</h3>
          <div className="comments">
            {ticket.comments.map((comment, index) => (
              <div key={index} className="comment">
                <strong>{comment.author || "Unknown"}</strong>
                <small>{comment.created_at}</small>
                <p>{comment.body}</p>
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}
