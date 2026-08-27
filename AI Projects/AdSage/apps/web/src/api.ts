export interface Citation {
  evidenceId: string;
  title: string;
  sourceVersion?: string;
  uri?: string;
}

export interface RunAccepted {
  runId: string;
  conversationId: string;
  requestId: string;
  state:
    | "accepted"
    | "running"
    | "clarification"
    | "unsafe"
    | "approval_required"
    | "completed"
    | "failed"
    | "budget_exceeded";
  answer?: {
    text: string;
    intent:
      | "documentation"
      | "metadata"
      | "analytical"
      | "clarification"
      | "unsafe";
    citations: Citation[];
    limitations: string[];
  };
}

interface Problem {
  title?: string;
  detail?: string;
  requestId?: string;
}

const configuredPlatformUrl: unknown = import.meta.env.VITE_PLATFORM_API_URL;
const platformUrl =
  typeof configuredPlatformUrl === "string" ? configuredPlatformUrl : "";

export async function submitQuestion(
  token: string,
  conversationId: string,
  question: string,
): Promise<RunAccepted> {
  const requestId = crypto.randomUUID();
  const response = await fetch(
    `${platformUrl}/v1/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `web-${crypto.randomUUID()}`,
        "X-Request-Id": requestId,
      },
      body: JSON.stringify({
        question,
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language,
      }),
    },
  );
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as Problem;
    const suffix = problem.requestId ? ` Request ${problem.requestId}.` : "";
    throw new Error(
      `${problem.detail ?? problem.title ?? "The request failed."}${suffix}`,
    );
  }
  return (await response.json()) as RunAccepted;
}
