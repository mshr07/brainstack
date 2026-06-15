import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

export async function getHealth() {
  const { data } = await api.get("/health");
  return data;
}

export async function syncMock() {
  const { data } = await api.post("/sync/mock");
  return data;
}

export async function syncJira() {
  const { data } = await api.post("/sync/jira/incremental");
  return data;
}

export async function rebuildIndex() {
  const { data } = await api.post("/index/rebuild");
  return data;
}

export async function sendChat(question) {
  const { data } = await api.post("/chat", { question });
  return data;
}

export async function searchTickets(query) {
  const { data } = await api.get("/tickets/search", { params: { q: query } });
  return data;
}

export async function getTicket(ticketId) {
  const { data } = await api.get(`/tickets/${ticketId}`);
  return data;
}

export async function getAnalytics(path) {
  const { data } = await api.get(path);
  return data;
}
