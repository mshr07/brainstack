import React from "react";

export default function TicketList({ tickets, onTicketSelect }) {
  if (!tickets?.length) {
    return <div className="empty">No tickets to show.</div>;
  }

  return (
    <div className="ticket-list">
      {tickets.map((ticket) => (
        <button key={ticket.ticket_id} className="ticket-row" onClick={() => onTicketSelect(ticket.ticket_id)}>
          <strong>{ticket.ticket_id}</strong>
          <span>{ticket.summary}</span>
          <small>{ticket.status} · {ticket.priority} · {ticket.assignee || "Unassigned"}</small>
        </button>
      ))}
    </div>
  );
}
