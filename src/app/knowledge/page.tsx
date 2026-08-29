"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { CompanyBrainLayout } from "@/components/company-brain-layout";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

const typeLabels: Record<string, string> = {
  FACT: "Facts",
  PROCESS: "Processes",
  RULE: "Rules",
  DECISION: "Decisions",
  REASON: "Reasons",
  LESSON: "Lessons",
  RISK: "Risks",
  GOAL: "Goals",
};

const typeColors: Record<string, string> = {
  FACT: "bg-sky-100 text-sky-800",
  RULE: "bg-violet-100 text-violet-800",
  PROCESS: "bg-amber-100 text-amber-800",
  DECISION: "bg-emerald-100 text-emerald-800",
  REASON: "bg-teal-100 text-teal-800",
  LESSON: "bg-orange-100 text-orange-800",
  RISK: "bg-red-100 text-red-800",
  GOAL: "bg-indigo-100 text-indigo-800",
};

type Toast = { id: string; kind: "approved" | "rejected"; message: string };

export default function KnowledgePage() {
  const viewer = useQuery(api.companies.viewer);
  const pendingCandidates = useQuery(api.knowledgeCandidates.list, { status: "PENDING" });
  const knowledgeItems = useQuery(api.knowledge.list, { status: "active" });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const canReview = viewer?.role === "Owner" || viewer?.role === "Admin";

  const pushToast = (kind: Toast["kind"], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((current) => [...current, { id, kind, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const counts = (knowledgeItems ?? []).reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <CompanyBrainLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Company Intelligence</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Company Knowledge</h2>
          <p className="mt-2 text-sm text-slate-600">
            {(knowledgeItems ?? []).length} approved item{(knowledgeItems ?? []).length === 1 ? "" : "s"} captured
            through AI interviews and manual input.
          </p>
        </div>

        {/* Toasts make the outcome of an approve/reject action unmistakable, even though the
            underlying candidate disappears from the pending queue as soon as it resolves. */}
        {toasts.length > 0 ? (
          <div className="space-y-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={[
                  "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm",
                  toast.kind === "approved"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800",
                ].join(" ")}
              >
                <span aria-hidden="true">{toast.kind === "approved" ? "✅" : "🚫"}</span>
                {toast.message}
              </div>
            ))}
          </div>
        ) : null}

        <section id="knowledge-review" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Knowledge Review</h3>
              <p className="mt-1 text-sm text-slate-600">
                Candidates proposed by AI interviews and other sources. Nothing here becomes company knowledge until
                an Owner or Admin approves it.
              </p>
            </div>
            {pendingCandidates !== undefined ? (
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {pendingCandidates.length} pending
              </span>
            ) : null}
          </div>

          {!canReview && viewer !== undefined ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Only company Owners and Admins can approve or reject candidates. You can still see what has been
              proposed below.
            </p>
          ) : null}

          <div className="mt-4 space-y-4">
            {pendingCandidates === undefined ? (
              <p className="text-sm text-slate-500">Loading candidates...</p>
            ) : pendingCandidates.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No pending candidates right now.
              </p>
            ) : (
              pendingCandidates.map((candidate) => (
                <CandidateReviewCard
                  key={candidate._id}
                  candidate={candidate}
                  canReview={canReview}
                  onApproved={() => pushToast("approved", `"${candidate.statement}" was approved — now part of Company Knowledge.`)}
                  onRejected={() => pushToast("rejected", `"${candidate.statement}" was rejected and removed from the pending queue.`)}
                />
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Approved Knowledge</h3>

          {knowledgeItems !== undefined && knowledgeItems.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {Object.entries(typeLabels).map(([type, label]) => (
                <div key={type} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{counts[type] ?? 0}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {knowledgeItems === undefined ? (
              <p className="text-sm text-slate-500">Loading knowledge...</p>
            ) : knowledgeItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 md:col-span-2">
                No approved knowledge yet. Approve a candidate above to see it appear here.
              </p>
            ) : (
              knowledgeItems
                .slice()
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((item) => (
                  <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
                          typeColors[item.type] ?? "bg-slate-100 text-slate-700",
                        ].join(" ")}
                      >
                        {item.type}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{item.confidence}% confidence</span>
                    </div>

                    <h4 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.statement}</p>

                    <dl className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Source</dt>
                        <dd className="font-medium text-slate-700">
                          {item.sourceType}
                          {item.sourceReference ? ` · ${item.sourceReference}` : ""}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Provided by</dt>
                        <dd className="font-medium text-slate-700">{item.providedBy}</dd>
                      </div>
                    </dl>
                  </article>
                ))
            )}
          </div>
        </section>
      </div>
    </CompanyBrainLayout>
  );
}

function CandidateReviewCard({
  candidate,
  canReview,
  onApproved,
  onRejected,
}: {
  candidate: Doc<"knowledgeCandidates">;
  canReview: boolean;
  onApproved: () => void;
  onRejected: () => void;
}) {
  const approve = useMutation(api.knowledgeCandidates.approve);
  const reject = useMutation(api.knowledgeCandidates.reject);
  const [isWorking, setIsWorking] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleApprove = async () => {
    setActionError("");
    setIsWorking(true);
    try {
      await approve({ candidateId: candidate._id });
      onApproved();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to approve this candidate.");
      setIsWorking(false);
    }
  };

  const handleReject = async () => {
    setActionError("");
    setIsWorking(true);
    try {
      await reject({ candidateId: candidate._id });
      onRejected();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to reject this candidate.");
      setIsWorking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={[
              "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
              typeColors[candidate.type] ?? "bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            {candidate.type}
          </span>
          <span className="text-xs font-medium text-slate-500">{candidate.confidence}% confidence</span>
        </div>
        <span className="text-xs text-slate-400">
          Proposed by {candidate.generatedBy} · {new Date(candidate.createdAt).toLocaleString()}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-800">{candidate.statement}</p>

      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Evidence</p>
        <p className="mt-1 text-xs italic text-slate-600">“{candidate.evidence}”</p>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Source: {candidate.sourceType}
        {candidate.sourceReference ? ` · ${candidate.sourceReference}` : ""}
      </p>

      {canReview ? (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isWorking}
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={isWorking}
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      ) : null}

      {actionError ? <p className="mt-2 text-xs text-red-700">{actionError}</p> : null}
    </div>
  );
}
