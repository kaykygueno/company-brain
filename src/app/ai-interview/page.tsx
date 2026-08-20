"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CompanyBrainLayout } from "@/components/company-brain-layout";

type Message = {
  sender: "ai" | "manager" | "user";
  text: string;
  isLoading?: boolean;
};

const starterMessages: Message[] = [
  {
    sender: "ai",
    text: "Welcome back. I’d like to understand how DublinBrew makes decisions, what matters most to the business, and where knowledge is currently scattered.",
  },
  {
    sender: "manager",
    text: "We’ve grown from a small café brand into a regional beverage business. Our challenge is keeping the customer experience consistent while preserving the lessons we learn from each branch.",
  },
  {
    sender: "ai",
    text: "Great. Tell me about your most important supplier relationships, your typical customer experience issues, and any decisions that shaped your growth.",
  },
  {
    sender: "manager",
    text: "We rely on a small number of regional suppliers, and we’ve learned that delivery timing and packaging quality have a big impact on our reputation. We also keep a running record of which menu changes actually improve repeat purchases.",
  },
];

export default function AIInterviewPage() {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) {
      return;
    }

    setError("");
    setInput("");
    setIsLoading(true);

    setMessages((currentMessages) => [
      ...currentMessages,
      { sender: "user", text: trimmedInput },
      { sender: "ai", text: "Company Brain is thinking...", isLoading: true },
    ]);

    try {
      const response = await fetch("/api/company-brain-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to get a response from Company Brain.");
      }

      setMessages((currentMessages) => {
        const filteredMessages = currentMessages.filter((message) => !message.isLoading);
        return [...filteredMessages, { sender: "ai", text: data.response }];
      });
    } catch (caughtError) {
      setMessages((currentMessages) => {
        const filteredMessages = currentMessages.filter((message) => !message.isLoading);
        return [
          ...filteredMessages,
          {
            sender: "ai",
            text: "Sorry, I could not get a response right now.",
          },
        ];
      });

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while contacting Company Brain.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CompanyBrainLayout activePage="AI Interview">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Interview Session
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">AI Interview</h2>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Return to Dashboard
          </Link>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex h-[440px] flex-col gap-4 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.sender}-${index}`}
                className={[
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6",
                  message.sender === "ai"
                    ? "self-start bg-slate-900 text-white"
                    : message.sender === "manager"
                      ? "ml-auto bg-emerald-100 text-emerald-900"
                      : "ml-auto bg-sky-100 text-sky-900",
                ].join(" ")}
              >
                {message.text}
              </div>
            ))}
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <form className="flex gap-3" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question about the business..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              disabled={isLoading}
              aria-label="Chat message input"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </CompanyBrainLayout>
  );
}
