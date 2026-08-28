"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { api } from "../../../convex/_generated/api";

export default function CreateCompanyPage() {
    const router = useRouter();
    const viewer = useQuery(api.companies.viewer);
    const createCompany = useMutation(api.companies.create);
    const [name, setName] = useState("");
    const [includeDemoData, setIncludeDemoData] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Enter a company name.");
            return;
        }

        setError("");
        setIsSubmitting(true);
        try {
            await createCompany({ name: trimmedName, includeDemoData });
            router.replace("/");
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Unable to create the company.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (viewer === undefined) {
        return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Loading...</main>;
    }

    return (
        <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-900">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Company Brain</p>
                <h1 className="mt-2 text-2xl font-bold">Create Your Company</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">Set up a company workspace. You will be its owner.</p>
                <label className="mt-6 block text-sm font-semibold text-slate-800" htmlFor="company-name">Company name</label>
                <input id="company-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" maxLength={100} placeholder="Example: DublinBrew" required />
                <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
                    <input type="checkbox" checked={includeDemoData} onChange={(event) => setIncludeDemoData(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                    <span>Add example dashboard data to this company</span>
                </label>
                {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
                <button type="submit" disabled={isSubmitting} className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Creating..." : "Create company"}</button>
            </form>
        </main>
    );
}