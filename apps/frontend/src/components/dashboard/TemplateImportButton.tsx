"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importTemplateFile } from "@/lib/custom-templates";

export function TemplateImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const template = await importTemplateFile(file);
      router.push(`/proposals/new?template=${encodeURIComponent(template.slug)}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not import this template file.",
      );
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,application/pdf,.json,.pdf"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <BrowseTemplateIcon />
        {loading ? "Importing..." : "Browse template"}
      </button>
      {error ? (
        <p className="max-w-xs text-xs font-medium text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}

function BrowseTemplateIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M3 5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2H3Z" />
      <path d="M3 9h18l-2 10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
      <path d="M9 14h6" />
    </svg>
  );
}
