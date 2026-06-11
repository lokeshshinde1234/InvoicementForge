"use client";

import { Input } from "@/components/ui/input";
import type { BlockProps, SignatureContent } from "../types";

export function SignatureBlock({
  content,
  onChange,
  readOnly = false,
  signatureData,
  signatureMeta,
}: BlockProps<SignatureContent>) {
  const heading = asText(content.heading, "Approval");
  const acceptanceText = asText(content.acceptanceText);
  const signerName = asText(content.signerName, "Authorized signer");
  const signerTitle = asText(content.signerTitle, "Client representative");

  if (readOnly) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-semibold">{heading}</h2>
        <p className="mt-4 leading-7 text-slate-600">
          {acceptanceText}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-dashed border-slate-300 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Signature
            </p>
            {signatureData ? (
              <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
                <img
                  src={signatureData}
                  alt="Client signature"
                  className="max-h-24 w-auto object-contain"
                />
                {signatureMeta ? (
                  <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                    {signatureMeta}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className={signatureData ? "mt-4 border-b border-slate-300" : "mt-8 border-b border-slate-300"} />
          </div>
          <div className="rounded-md bg-slate-50 p-5">
            <p className="font-semibold">{signerName}</p>
            <p className="mt-1 text-sm text-slate-500">{signerTitle}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <Input
        value={heading}
        placeholder="Signature heading"
        onChange={(event) =>
          onChange({ ...content, heading: event.target.value })
        }
      />
      <textarea
        value={acceptanceText}
        placeholder="Acceptance text"
        className="min-h-28 rounded-md border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
        onChange={(event) =>
          onChange({ ...content, acceptanceText: event.target.value })
        }
      />
      <Input
        value={signerName}
        placeholder="Signer name"
        onChange={(event) =>
          onChange({ ...content, signerName: event.target.value })
        }
      />
      <Input
        value={signerTitle}
        placeholder="Signer title"
        onChange={(event) =>
          onChange({ ...content, signerTitle: event.target.value })
        }
      />
    </div>
  );
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
