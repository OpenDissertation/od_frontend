"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { useMemo, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const supportedInstitutions = ["Princeton University", "UNSW"];
const normalizedInstitutions = {
  "princeton university": "Princeton University",
  unsw: "UNSW",
  "university of new south wales": "UNSW",
};

function normalizeInstitution(institution) {
  return (
    normalizedInstitutions[
      institution.toLowerCase().replace(/\s+/g, " ").trim()
    ] || null
  );
}

function parseSelections(text) {
  return text
    .split(/\n|;/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(/\s+[-—|]\s+/);
      return {
        author: parts[0]?.trim() || entry,
        institution: normalizeInstitution(parts[1]?.trim() || "") || "",
      };
    });
}

async function apiFetch(path, init) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // Keep generic message when the back-end returns non-JSON.
    }
    throw new Error(detail);
  }
  return response.json();
}

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to OpenDissertation. Please specify the author(s) and institution(s) whose PhD dissertation(s) you want to learn more about. I currently support Princeton University (2011 - 2015) and University of New South Wales (UNSW). Use one line per author, for example: `Jane Doe - Princeton University`.",
    },
  ]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("collecting");
  const [sessionId, setSessionId] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  const placeholder = useMemo(() => {
    if (phase === "collecting") return "Ada Lovelace - Princeton University";
    if (phase === "chatting")
      return "Ask about methods, findings, implications...";
    if (phase === "confirming")
      return "Yes, ask another question / No, end session";
    return "This OpenDissertation session has ended.";
  }, [phase]);

  function append(message) {
    setMessages((current) => [...current, message]);
    setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        }),
      0,
    );
  }

  async function handleCollecting(text) {
    const dissertations = parseSelections(text);
    const invalid = dissertations.filter((item) => !item.institution);
    if (!dissertations.length || invalid.length) {
      append({
        role: "assistant",
        content: `Please provide author(s) with supported institution(s): ${supportedInstitutions.join(" or ")}. Example: \`Author Name - UNSW\`.`,
      });
      return;
    }

    setPhase("downloading");
    append({
      role: "assistant",
      content:
        "I am downloading the dissertation file(s) now. This may take a moment...",
    });
    const download = await apiFetch("/api/v1/dissertations/download", {
      method: "POST",
      body: JSON.stringify({ dissertations }),
    });
    const downloaded = download.results.filter(
      (result) => result.status === "downloaded" && result.file_path,
    );
    const missing = download.results.filter(
      (result) => result.status !== "downloaded",
    );
    if (missing.length) {
      append({
        role: "assistant",
        content: `I could not find or download these dissertation(s): ${missing
          .map(
            (item) =>
              `${item.author} (${item.institution})${item.detail ? ` — ${item.detail}` : ""}`,
          )
          .join("; ")}. Please try another author and institution.`,
      });
    }
    if (!downloaded.length) {
      setPhase("collecting");
      return;
    }

    const newSessionId = crypto.randomUUID();
    await apiFetch("/api/v1/session/init", {
      method: "POST",
      body: JSON.stringify({
        session_id: newSessionId,
        file_paths: downloaded.flatMap((item) =>
          item.file_path ? [item.file_path] : [],
        ),
      }),
    });
    setSessionId(newSessionId);
    setPhase("chatting");
    append({
      role: "assistant",
      content: `I loaded ${downloaded.length} dissertation(s): ${downloaded
        .map((item) => item.title || item.author)
        .join(
          "; ",
        )}. What details about the dissertation(s) would you like to learn more about?`,
    });
  }

  async function terminateSession() {
    await apiFetch(`/api/v1/session/${sessionId}`, { method: "DELETE" });
    setPhase("ended");
    append({
      role: "assistant",
      content:
        "Thank you for using OpenDissertation. This session is now closed.",
    });
  }

  async function handleChatting(text) {
    const reply = await apiFetch("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, question: text }),
    });
    setPhase("confirming");
    append({
      role: "assistant",
      content: `${reply.answer}\n\nWould you like to ask another question about the loaded dissertation(s)?`,
    });
  }

  async function handleConfirming(text) {
    if (/\b(no|nothing|done|quit|exit|goodbye)\b/i.test(text)) {
      await terminateSession();
      return;
    }
    setPhase("chatting");
    await handleChatting(text);
  }

  async function onSubmit(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy || phase === "ended") return;
    setInput("");
    append({ role: "user", content: text });
    setBusy(true);
    try {
      if (phase === "collecting") await handleCollecting(text);
      else if (phase === "chatting") await handleChatting(text);
      else if (phase === "confirming") await handleConfirming(text);
    } catch (error) {
      append({
        role: "assistant",
        content: `Sorry, I could not complete that request. ${error instanceof Error ? error.message : "Please try again later."}`,
      });
      if (phase === "collecting" || phase === "downloading")
        setPhase("collecting");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="panel">
        <header className="brand">
          <Image
            src="/opendissertation-logo.svg"
            alt="OpenDissertation logo"
            width={84}
            height={84}
          />
          <div>
            <p>OpenDissertation</p>
            <h1>Ask the universe of dissertations.</h1>
          </div>
        </header>
        <div className="chat" ref={scrollRef}>
          {messages.map((message, index) => (
            <article className={`bubble ${message.role}`} key={index}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </article>
          ))}
        </div>
        <form onSubmit={onSubmit} className="composer">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder}
            disabled={busy || phase === "ended"}
          />
          <button disabled={busy || phase === "ended"}>
            {busy ? "Working..." : phase === "ended" ? "Ended" : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}
