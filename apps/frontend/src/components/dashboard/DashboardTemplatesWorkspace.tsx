"use client";

import { useState } from "react";
import { DashboardTemplatesGallery } from "@/components/dashboard/DashboardTemplatesGallery";
import { TemplateImportButton } from "@/components/dashboard/TemplateImportButton";

export function DashboardTemplatesWorkspace() {
  const [manageMode, setManageMode] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Template gallery
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Choose a proposal template
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Start with a proven structure, then customize the proposal inside
            your logged-in InvoiceForge workspace.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => setManageMode((value) => !value)}
            aria-pressed={manageMode}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold shadow-sm transition ${
              manageMode
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
            }`}
          >
            <ManageTemplateIcon />
            {manageMode ? "Done managing" : "Manage template"}
          </button>
          <TemplateImportButton />
        </div>
      </div>

      <DashboardTemplatesGallery manageMode={manageMode} />
    </>
  );
}

function ManageTemplateIcon() {
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
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M9 3h6" />
    </svg>
  );
}
