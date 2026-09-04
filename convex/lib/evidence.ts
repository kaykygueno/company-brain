// The shared contract every collection adapter targets (website, Google
// Business, and future news/social adapters). An adapter's job ends here: it
// turns whatever it collected into a list of these drafts. Discovery owns
// what happens next — writing them through `discovery.recordEvidence`
// (evidence, plus at most one directly-attached candidate) or, for evidence
// that only becomes meaningful in aggregate, through
// `knowledgeCandidates.create` against a summary draft's evidenceId.
//
// Keeping this shape independent of any one adapter's internals is what lets
// discovery.ts stay a thin orchestrator instead of growing a special case per
// source: it only ever needs to loop over EvidenceDraft[] and call the same
// two mutations.
import type { Infer } from "convex/values";
import type { evidenceMetadata, knowledgeType } from "../schema";

export type EvidenceMetadata = Infer<typeof evidenceMetadata>;
export type KnowledgeType = Infer<typeof knowledgeType>;

export interface CandidateDraft {
    type: KnowledgeType;
    statement: string;
    confidence: number;
}

export interface EvidenceDraft {
    content: string;
    sourceUrl?: string;
    metadata?: EvidenceMetadata;
    // Most evidence (a single review, a single page) should NOT carry a
    // candidate — that's the "don't turn every review into knowledge" rule
    // made structural rather than just a convention. Only evidence that is
    // itself authoritative (an official page, Google's own aggregate rating)
    // or that summarizes many independent pieces of evidence (a theme
    // aggregation) should set this.
    candidate?: CandidateDraft;
}

// A minimal, adapter-agnostic view of the company being researched. Adapters
// depend on this instead of the full Convex `companies` document so they stay
// decoupled from the database schema.
export interface CollectorCompany {
    name: string;
    website?: string;
    country?: string;
    industry?: string;
}
