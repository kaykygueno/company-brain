"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CompanyBrainLayout } from "@/components/company-brain-layout";

type Message = {
  sender: "ai" | "manager" | "user";
  text: string;
  isLoading?: boolean;
};

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-3 mt-0 text-xl font-semibold text-inherit">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-3 mt-0 text-lg font-semibold text-inherit">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-2 mt-0 text-base font-semibold text-inherit">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 last:mb-0 leading-7 text-[0.95rem] text-inherit">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-3 ml-5 list-disc space-y-2 leading-7 text-[0.95rem] text-inherit">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-2 leading-7 text-[0.95rem] text-inherit">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="pl-1 text-inherit">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-inherit">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-inherit">{children}</em>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      className="font-medium underline decoration-current/60 underline-offset-2 text-inherit"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="mb-3 border-l-2 border-slate-300 pl-3 italic text-inherit">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[0.85em] text-inherit">
      {children}
    </code>
  ),
};

const normalizeMarkdownText = (value: string) =>
  value
    .replace(/â€™/g, "’")
    .replace(/â€˜/g, "‘")
    .replace(/â€œ/g, "“")
    .replace(/â€/g, "”")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€¢/g, "•")
    .replace(/â¢/g, "•")
    .replace(/â…/g, "…")
    .replace(/Â/g, "")
    .replace(/â(?=[A-Za-z0-9])/g, "");

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

      const normalizedResponse = normalizeMarkdownText(data.response);

      setMessages((currentMessages) => {
        const filteredMessages = currentMessages.filter((message) => !message.isLoading);
        return [...filteredMessages, { sender: "ai", text: normalizedResponse }];
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

        <div className="flex h-[560px] flex-col gap-4 p-5">
          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => {
                const isAIMessage = message.sender === "ai";
                const isUserMessage = message.sender === "user";
                const isManagerMessage = message.sender === "manager";

                return (
                  <div
                    key={`${message.sender}-${index}`}
                    className={[
                      "flex w-full",
                      isAIMessage || isManagerMessage ? "justify-start" : "justify-end",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "max-w-[min(82%,38rem)] rounded-2xl px-4 py-3 shadow-sm",
                        isAIMessage
                          ? "bg-white text-slate-800 ring-1 ring-slate-200"
                          : isManagerMessage
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-sky-100 text-sky-900",
                      ].join(" ")}
                    >
                      {isAIMessage ? (
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[8px] font-bold text-white">
                            CB
                          </span>
                          Company Brain
                        </div>
                      ) : null}

                      {message.isLoading ? (
                        <div className="flex items-center gap-2 py-1 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:0ms]" />
                            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
                            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
                          </div>
                          <span className="font-medium">Company Brain is thinking...</span>
                        </div>
                      ) : isAIMessage ? (
                        <div className="markdown-body text-sm leading-7 text-slate-700">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {normalizeMarkdownText(message.text)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words text-sm leading-6">
                          {message.text}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <form className="mt-auto flex gap-3 rounded-xl border border-slate-200 bg-white p-3" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question about the business..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
