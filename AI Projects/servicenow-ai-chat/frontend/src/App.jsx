import React, { useEffect, useState } from "react";
import { getHealth, rebuildIndex, searchTickets, sendChat, syncJira, syncMock } from "./api/client.js";
import ChatPage from "./pages/ChatPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import TicketDetail from "./pages/TicketDetail.jsx";

const views = [
  { id: "chat", label: "Chat" },
  { id: "search", label: "Search" },
  { id: "ticket", label: "Ticket" }
];

export default function App() {
  const [view, setView] = useState("chat");
  const [health, setHealth] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState("AICB-110");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function refreshHealth() {
    try {
      setHealth(await getHealth());
    } catch (error) {
      setNotice(error.response?.data?.detail || error.message);
    }
  }

  async function runAction(action) {
    setBusy(true);
    setNotice("");
    try {
      const data = action === "mock" ? await syncMock() : action === "jira" ? await syncJira() : await rebuildIndex();
      const label = action === "mock" ? "Synced mock" : action === "jira" ? "Synced Jira" : "Rebuilt index";
      setNotice(`${label}: ${JSON.stringify(data)}`);
      await refreshHealth();
    } catch (error) {
      setNotice(error.response?.data?.detail || error.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refreshHealth();
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h1>Jira RAG</h1>
          <p>{health ? `${health.tickets} tickets / ${health.indexed_chunks} chunks` : "Checking backend..."}</p>
        </div>
        <nav>
          {views.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-actions">
          <button onClick={() => runAction("mock")} disabled={busy}>Sync mock</button>
          <button onClick={() => runAction("jira")} disabled={busy}>Sync Jira</button>
          <button onClick={() => runAction("index")} disabled={busy}>Rebuild index</button>
        </div>
      </aside>

      <main>
        {notice && <div className="notice">{notice}</div>}
        {view === "chat" && <ChatPage sendChat={sendChat} onTicketSelect={(id) => { setSelectedTicketId(id); setView("ticket"); }} />}
        {view === "search" && <SearchPage searchTickets={searchTickets} onTicketSelect={(id) => { setSelectedTicketId(id); setView("ticket"); }} />}
        {view === "ticket" && <TicketDetail ticketId={selectedTicketId} setTicketId={setSelectedTicketId} />}
      </main>
    </div>
  );
}
