"use client";

import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth-storage";

export function UseTemplateButton({
  slug,
  variant = "primary",
}: {
  slug: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();

  function handleUseTemplate() {
    const editorPath = `/proposals/new?template=${encodeURIComponent(slug)}`;
    window.localStorage.setItem("selectedTemplate", slug);

    if (getAuthToken()) {
      router.push(editorPath);
      return;
    }

    router.push(`/signup?next=${encodeURIComponent(editorPath)}`);
  }

  return (
    <button
      type="button"
      onClick={handleUseTemplate}
      className={
        variant === "secondary"
          ? "inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-md"
          : "inline-flex h-11 items-center justify-center rounded-md bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700"
      }
    >
      Use this template
    </button>
  );
}
