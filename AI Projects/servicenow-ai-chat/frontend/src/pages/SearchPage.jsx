import React, { useState } from "react";
import TicketList from "../components/TicketList.jsx";

export default function SearchPage({ searchTickets, onTicketSelect }) {
  const [query, setQuery] = useState("hallucination");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await searchTickets(query);
      setTickets(response.tickets || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>Ticket Search</h2>
      <form className="search-form" onSubmit={submit}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search summary, description, or ticket ID" />
        <button disabled={loading}>Search</button>
      </form>
      {error && <div className="error">{error}</div>}
      <TicketList tickets={tickets} onTicketSelect={onTicketSelect} />
    </section>
  );
}
