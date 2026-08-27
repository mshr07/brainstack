import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

describe("App", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps the workspace behind an explicit token", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Welcome to AdSage" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Ask the governed data lake" }),
    ).not.toBeInTheDocument();
  });

  it("renders the honest Phase 1 response and empty evidence state", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          runId: crypto.randomUUID(),
          conversationId: crypto.randomUUID(),
          requestId: "request-test-1234",
          state: "completed",
          answer: {
            text: "No SQL was generated.",
            intent: "metadata",
            citations: [],
            limitations: ["Phase 1 only."],
          },
        }),
        { status: 202, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<App />);
    await user.type(
      screen.getByLabelText("Local access token"),
      "a-local-token",
    );
    await user.click(screen.getByRole("button", { name: "Continue securely" }));
    await user.type(
      screen.getByLabelText("Ask an advertising analytics question"),
      "Which columns define ROAS?",
    );
    await user.click(screen.getByRole("button", { name: "Send question" }));

    expect(
      await screen.findByText("No SQL was generated."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No governed evidence was retrieved in Phase 1."),
    ).toBeInTheDocument();
    expect(screen.getByText("Phase 1 only.")).toBeInTheDocument();
  });

  it("shows a safe error state", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: "Analysis is unavailable.",
          requestId: "request-1",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/problem+json" },
        },
      ),
    );
    render(<App />);
    await user.type(
      screen.getByLabelText("Local access token"),
      "a-local-token",
    );
    await user.click(screen.getByRole("button", { name: "Continue securely" }));
    await user.type(
      screen.getByLabelText("Ask an advertising analytics question"),
      "Compare spend yesterday.",
    );
    await user.click(screen.getByRole("button", { name: "Send question" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Analysis is unavailable.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("request-1");
  });
});
