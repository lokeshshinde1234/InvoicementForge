"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlockForm } from "@/components/editor/SortableBlock";
import { SignaturePad } from "@/components/signature/SignaturePad";
import { downloadPortalPdf } from "@/lib/pdf-download";
import { API_BASE_URL } from "@/lib/config";

type ProposalBlock = {
  id: string;
  type:
    | "cover"
    | "clientInfo"
    | "companyInfo"
    | "summary"
    | "problem"
    | "solution"
    | "scope"
    | "pricing"
    | "timeline"
    | "terms"
    | "signature";
  order: number;
  content: Record<string, unknown>;
};

type PortalProposal = {
  id: string;
  title: string;
  status: string;
  blocks: ProposalBlock[];
  totalAmount: number | string;
  validUntil: string | null;
  signedAt: string | null;
  signatureData: string | null;
  signatureIp?: string | null;
  signatureMethod?: string | null;
  aadhaarEsignStatus?: string | null;
  aadhaarEsignReference?: string | null;
  aadhaarEsignRequestedAt?: string | null;
  aadhaarEsignCompletedAt?: string | null;
  approvalStatus?: "pending" | "approved" | "rejected";
  aadhaarDocumentAttached?: boolean;
  approvedByClientId?: string | null;
  approvedAt?: string | null;
  aadhaarDocument?: AadhaarDocument | null;
  auditTrail?: Array<{
    id: string;
    event: string;
    actor: string;
    at: string;
    ip?: string | null;
  }>;
  notes: string | null;
  terms: string | null;
};

type AadhaarDocument = {
  id: string;
  documentType: "aadhaar";
  fileName: string;
  fileMimeType: string;
  fileSize: number;
  uploadedAt: string;
  status: "uploaded" | "approved" | "removed";
};

type PageParams = {
  params: Promise<{
    id: string;
  }>;
};

export default function ClientProposalReviewPage({ params }: PageParams) {
  const { id } = use(params);
  const router = useRouter();
  const [proposal, setProposal] = useState<PortalProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [changeMessage, setChangeMessage] = useState("");
  const [signatureDraft, setSignatureDraft] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [approvalConfirmOpen, setApprovalConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    "approve" | "request-changes" | "sign" | null
  >(null);

  useEffect(() => {
    const token = window.localStorage.getItem("portalClientToken");

    if (!token) {
      router.replace("/portal/login");
      return;
    }

    fetch(`${API_BASE_URL}/portal/proposals/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(body.message || "Proposal unavailable.");
        }

        const loadedProposal = body as PortalProposal;
        setProposal(loadedProposal);
        setSignatureDraft(loadedProposal.signatureData ?? "");
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Proposal unavailable.",
        );
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const sortedBlocks = useMemo(
    () => [...(proposal?.blocks ?? [])].sort((a, b) => a.order - b.order),
    [proposal],
  );
  const hasSignature = Boolean(signatureDraft.trim() || proposal?.signatureData);
  const aadhaarDocument = proposal?.aadhaarDocument ?? null;
  const isApproved =
    proposal?.approvalStatus === "approved" || proposal?.status === "APPROVED";

  useEffect(() => {
    if (!proposal?.aadhaarDocument) {
      setPreviewUrl("");
      return;
    }

    let objectUrl = "";
    const token = window.localStorage.getItem("portalClientToken");

    if (!token) return;

    fetch(`${API_BASE_URL}/portal/proposals/${id}/aadhaar/preview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) return;
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => undefined);

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, proposal?.aadhaarDocument]);

  async function submitProposalAction(
    action: "approve" | "request-changes" | "sign",
    signatureMethod: "DRAWN" | "AADHAAR_ESIGN" = "DRAWN",
  ) {
    if (action === "approve" && !aadhaarDocument) {
      setActionMessage("Aadhaar document required before approval.");
      return;
    }

    if (action === "sign" && !signatureDraft.trim()) {
      setActionMessage("Add and submit a signature before approving this proposal.");
      return;
    }

    const token = window.localStorage.getItem("portalClientToken");

    if (!token) {
      router.replace("/portal/login");
      return;
    }

    setActionLoading(action);
    setActionMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/portal/proposals/${id}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          action === "request-changes"
            ? { message: changeMessage }
            : action === "sign" || action === "approve"
              ? { signatureData: signatureDraft, signatureMethod }
              : {},
        ),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || "Could not update proposal.");
      }

      const updatedProposal = body as PortalProposal;
      setProposal(updatedProposal);
      setSignatureDraft(updatedProposal.signatureData ?? signatureDraft);
      setActionMessage(body.message || "Proposal updated successfully.");

      if (action === "request-changes") {
        setChangeMessage("");
      }
    } catch (requestError) {
      setActionMessage(
        requestError instanceof Error
          ? requestError.message
          : "Could not update proposal.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  function uploadAadhaarDocument(file: File | null) {
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const lowerName = file.name.toLowerCase();

    if (
      !allowedTypes.includes(file.type) ||
      !allowedExtensions.some((extension) => lowerName.endsWith(extension))
    ) {
      setActionMessage("Invalid file type. Upload PDF, JPG, JPEG, or PNG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setActionMessage("File too large. Maximum size is 5MB.");
      return;
    }

    const token = window.localStorage.getItem("portalClientToken");
    if (!token) {
      router.replace("/portal/login");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    setDocumentLoading(true);
    setUploadProgress(0);
    setActionMessage("");

    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE_URL}/portal/proposals/${id}/aadhaar/upload`);
    request.setRequestHeader("Authorization", `Bearer ${token}`);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      setDocumentLoading(false);
      const body = readJson(request.responseText);

      if (request.status < 200 || request.status >= 300) {
        setActionMessage(body.message || "Upload failed.");
        return;
      }

      setProposal((current) =>
        current
          ? {
              ...current,
              aadhaarDocument: body.aadhaarDocument,
              aadhaarDocumentAttached: true,
            }
          : current,
      );
      setDocumentPreviewOpen(true);
      setUploadProgress(100);
      setActionMessage(body.message || "Aadhaar document uploaded successfully.");
    };
    request.onerror = () => {
      setDocumentLoading(false);
      setActionMessage("Upload failed.");
    };
    request.send(formData);
  }

  async function removeAadhaarDocument() {
    const token = window.localStorage.getItem("portalClientToken");

    if (!token) {
      router.replace("/portal/login");
      return;
    }

    setDocumentLoading(true);
    setActionMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/portal/proposals/${id}/aadhaar/remove`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || "Could not remove document.");
      }

      setProposal((current) =>
        current
          ? {
              ...current,
              aadhaarDocument: null,
              aadhaarDocumentAttached: false,
            }
          : current,
      );
      setPreviewUrl("");
      setDocumentPreviewOpen(false);
      setUploadProgress(0);
      setActionMessage(body.message || "Aadhaar document removed.");
    } catch (requestError) {
      setActionMessage(
        requestError instanceof Error
          ? requestError.message
          : "Could not remove document.",
      );
    } finally {
      setDocumentLoading(false);
    }
  }

  async function downloadPdf() {
    const token = window.localStorage.getItem("portalClientToken");

    if (!token) {
      router.replace("/portal/login");
      return;
    }

    setDownloadLoading(true);
    setActionMessage("");

    try {
      await downloadPortalPdf({
        path: `/portal/proposals/${id}/pdf`,
        filename: `${proposal?.title ?? "proposal"}.pdf`,
        token,
        baseUrl: API_BASE_URL,
      });
    } catch (requestError) {
      setActionMessage(
        requestError instanceof Error
          ? requestError.message
          : "Could not download PDF.",
      );
    } finally {
      setDownloadLoading(false);
    }
  }

  if (loading) {
    return <PortalLoading label="Loading proposal..." />;
  }

  if (error || !proposal) {
    return <PortalError title="Proposal unavailable" message={error} />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f2efe8] text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.92),rgba(237,248,244,0.78)_42%,rgba(255,249,239,0.88)),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:auto,42px_42px,42px_42px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-3">
          <Link href="/portal/dashboard" className="inline-flex rounded-md bg-white/75 px-3 py-2 text-sm font-semibold text-teal-800 shadow-sm ring-1 ring-white/80">
            Back to portal
          </Link>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloadLoading}
            className="inline-flex rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {downloadLoading ? "Downloading..." : "Download PDF"}
          </button>
        </div>

        <header className="mt-4 overflow-hidden rounded-lg border border-white/80 bg-white shadow-2xl shadow-slate-950/10">
          <div className="bg-slate-950 px-4 py-5 text-white sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-wide text-teal-200">
                Proposal review
              </p>
              <StatusPill status={proposal.status} />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="px-4 pb-5 sm:px-6 sm:pb-6">
              <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-4xl">
                {proposal.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Read the proposal details, review scope and terms, then choose
                the next action for your vendor.
              </p>
            </div>
            <div className="mx-6 mb-6 rounded-md bg-teal-50 px-4 py-3 text-teal-950 ring-1 ring-teal-100 lg:mx-6">
              <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                Total amount
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatCurrency(proposal.totalAmount)}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {sortedBlocks.length > 0 ? (
              sortedBlocks.map((block, index) => (
                <TemplateBlockPreview
                  key={block.id}
                  block={block}
                  index={index}
                  signatureData={signatureDraft || proposal.signatureData}
                  signatureMeta={getSignatureMeta(proposal, signatureDraft)}
                />
              ))
            ) : (
              <EmptyPanel message="No proposal sections were shared yet." />
            )}

            {proposal.notes || proposal.terms ? (
              <section className="overflow-hidden rounded-lg border border-white/80 bg-white shadow-xl shadow-slate-950/10">
                <div className="border-b border-slate-200 bg-[#fff8ec] px-5 py-4">
                  <h2 className="text-lg font-semibold">Notes and terms</h2>
                </div>
                <div className="p-5">
                {proposal.notes ? (
                  <p className="mt-3 text-sm leading-7 text-slate-600">{proposal.notes}</p>
                ) : null}
                {proposal.terms ? (
                  <p className="mt-3 text-sm leading-7 text-slate-600">{proposal.terms}</p>
                ) : null}
                </div>
              </section>
            ) : null}

            <section className="overflow-hidden rounded-lg border border-white/80 bg-white shadow-xl shadow-slate-950/10">
              <div className="border-b border-slate-200 bg-[#eefbf7] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Aadhaar document for approval
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      This document is private and visible only to you.
                    </p>
                  </div>
                  <span className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                    {aadhaarDocument ? aadhaarDocument.status : "Required"}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(event) => {
                    uploadAadhaarDocument(event.target.files?.[0] ?? null);
                    event.currentTarget.value = "";
                  }}
                />

                {!aadhaarDocument ? (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={documentLoading || isApproved}
                      className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {documentLoading
                        ? "Uploading..."
                        : "Upload Aadhaar Document for Approval"}
                    </button>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Upload a PDF, JPG, JPEG, or PNG file up to 5MB.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="rounded-md border border-teal-200 bg-teal-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-teal-950">
                            {aadhaarDocument.fileName}
                          </p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-teal-700">
                            {formatFileSize(aadhaarDocument.fileSize)} | Uploaded{" "}
                            {new Date(aadhaarDocument.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setDocumentPreviewOpen(true)}
                            className="h-9 rounded-md bg-white px-3 text-xs font-semibold text-teal-800 ring-1 ring-teal-200"
                          >
                            Preview Document
                          </button>
                          <a
                            href={previewUrl || undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white ring-1 ring-slate-950"
                          >
                            Open File
                          </a>
                          {!isApproved ? (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={documentLoading}
                              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 disabled:opacity-70"
                            >
                              Re-upload
                            </button>
                          ) : null}
                          {!isApproved ? (
                            <button
                              type="button"
                              onClick={removeAadhaarDocument}
                              disabled={documentLoading}
                              className="h-9 rounded-md border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 disabled:opacity-70"
                            >
                              Remove Document
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {documentPreviewOpen && previewUrl ? (
                      <div
                        className="overflow-hidden rounded-md border border-slate-200 bg-slate-50"
                        onContextMenu={(event) => event.preventDefault()}
                      >
                        {aadhaarDocument.fileMimeType === "application/pdf" ? (
                          <PdfInlinePreview src={previewUrl} />
                        ) : (
                          <ImageInlinePreview src={previewUrl} />
                        )}
                      </div>
                    ) : documentPreviewOpen ? (
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                        Loading private preview...
                      </div>
                    ) : (
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        Click Preview Document to confirm the uploaded Aadhaar document here.
                      </div>
                    )}
                  </div>
                )}

                {documentLoading || uploadProgress > 0 ? (
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Upload progress {uploadProgress}%
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-white/80 bg-white shadow-xl shadow-slate-950/10">
              <div className="border-b border-slate-200 bg-[#fff8ec] px-5 py-4">
                <h2 className="text-lg font-semibold">Client signature</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Draw your signature, submit it for preview, then approve the
                  proposal to save it.
                </p>
              </div>
              <div className="p-5">
                {signatureDraft || proposal.signatureData ? (
                  <div className="mb-5 rounded-md border border-teal-200 bg-teal-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                      Signature preview
                    </p>
                    <div className="mt-3 rounded-md border border-white bg-white p-3">
                      <img
                        src={signatureDraft || proposal.signatureData || ""}
                        alt="Client signature preview"
                        className="max-h-28 w-auto object-contain"
                      />
                    </div>
                  </div>
                ) : null}
                <SignaturePad
                  disabled={actionLoading !== null}
                  onSign={(signatureData) => {
                    setSignatureDraft(signatureData);
                    setActionMessage(
                      "Signature added. Click Approve proposal to save it.",
                    );
                  }}
                />
              </div>
            </section>
          </div>

          <aside className="h-fit overflow-hidden rounded-lg border border-white/80 bg-white shadow-2xl shadow-slate-950/10">
            <div className="bg-teal-600 px-5 py-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-teal-100">
                Client decision
              </p>
              <p className="mt-2 text-lg font-semibold">{formatStatus(proposal.status)}</p>
            </div>
            <div className="p-5">
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => setApprovalConfirmOpen(true)}
                disabled={actionLoading !== null || !aadhaarDocument || isApproved}
                className="h-11 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {actionLoading === "approve" ? "Approving..." : "Approve Proposal"}
              </button>
              <textarea
                value={changeMessage}
                onChange={(event) => setChangeMessage(event.target.value)}
                rows={4}
                placeholder="Optional note for requested changes"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
              />
              <button
                type="button"
                onClick={() => submitProposalAction("request-changes")}
                disabled={actionLoading !== null}
                className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {actionLoading === "request-changes" ? "Sending..." : "Request changes"}
              </button>
              <button
                type="button"
                onClick={() => submitProposalAction("sign")}
                disabled={actionLoading !== null || !hasSignature}
                className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {actionLoading === "sign" ? "Signing..." : "Sign document"}
              </button>
              {!aadhaarDocument && !isApproved ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                  Aadhaar document required before approval.
                </p>
              ) : null}
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <EvidenceRow label="Method" value={proposal.signatureMethod ?? "Not signed"} />
              <EvidenceRow
                label="Timestamp"
                value={
                  proposal.approvedAt
                    ? new Date(proposal.approvedAt).toLocaleString()
                    : proposal.signedAt
                      ? new Date(proposal.signedAt).toLocaleString()
                      : "Not approved"
                }
              />
              <EvidenceRow
                label="Aadhaar document"
                value={aadhaarDocument ? "Attached privately" : "Not uploaded"}
              />
            </div>
            {proposal.auditTrail?.length ? (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Audit trail
                </p>
                <div className="mt-2 space-y-2">
                  {proposal.auditTrail.slice().reverse().map((entry) => (
                    <div key={entry.id} className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-900">{entry.event.replace(/_/g, " ")}</p>
                      <p className="mt-1">
                        {entry.actor} · {new Date(entry.at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {actionMessage ? (
              <p className="mt-4 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm leading-6 text-teal-800">
                {actionMessage}
              </p>
            ) : null}
            </div>
          </aside>
        </section>
        {approvalConfirmOpen ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/55 px-4 pt-20 sm:pt-24">
            <div className="w-full max-w-md rounded-lg border border-white/80 bg-white p-5 shadow-2xl shadow-slate-950/30">
              <h2 className="text-lg font-semibold">Approve proposal</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Are you sure you want to approve this proposal with the attached
                Aadhaar document?
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setApprovalConfirmOpen(false)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApprovalConfirmOpen(false);
                    void submitProposalAction("approve");
                  }}
                  className="h-10 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Approve Proposal
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function TemplateBlockPreview({
  block,
  index,
  signatureData,
  signatureMeta,
}: {
  block: ProposalBlock;
  index: number;
  signatureData?: string | null;
  signatureMeta?: string | null;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/80 bg-white shadow-xl shadow-slate-950/10">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-amber-50 px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-slate-950 text-sm font-bold text-white">
          {index + 1}
        </span>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-800">
          {formatLabel(block.type)}
        </p>
      </div>
      <div className="p-5">
        <BlockForm
          block={block}
          readOnly
          signatureData={block.type === "signature" ? signatureData : null}
          signatureMeta={block.type === "signature" ? signatureMeta : null}
          onChange={() => undefined}
        />
      </div>
    </section>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-white px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function PdfInlinePreview({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading PDF preview...");

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    if (!src || !container) {
      return;
    }

    const previewContainer = container;
    previewContainer.replaceChildren();
    setStatus("Loading PDF preview...");

    async function renderPdf() {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.mjs",
          import.meta.url,
        ).toString();

        const response = await fetch(src);
        const data = new Uint8Array(await response.arrayBuffer());
        const pdf = await pdfjs.getDocument({
          data,
          useSystemFonts: true,
        }).promise;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return;

          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });
          const maxWidth = Math.min(previewContainer.clientWidth || 760, 900);
          const scale = maxWidth / viewport.width;
          const scaledViewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Canvas preview is unavailable.");
          }

          canvas.width = Math.floor(scaledViewport.width);
          canvas.height = Math.floor(scaledViewport.height);
          canvas.className = "mx-auto mb-4 max-w-full rounded-md bg-white shadow-sm";
          previewContainer.appendChild(canvas);

          await page.render({
            canvas,
            canvasContext: context,
            viewport: scaledViewport,
          }).promise;
        }

        if (!cancelled) {
          setStatus("");
        }
      } catch {
        if (!cancelled) {
          setStatus("Could not render PDF preview inside the portal.");
        }
      }
    }

    void renderPdf();

    return () => {
      cancelled = true;
      previewContainer.replaceChildren();
    };
  }, [src]);

  return (
    <div className="max-h-[640px] overflow-auto bg-slate-100 p-3">
      {status ? (
        <div className="grid h-[220px] place-items-center bg-white px-5 text-center">
          <p className="text-sm font-semibold text-slate-700">{status}</p>
        </div>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
}

function ImageInlinePreview({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Loading image preview...");

  useEffect(() => {
    let cancelled = false;

    async function renderImage() {
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const image = await createImageBitmap(blob);
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        if (!canvas || !context || cancelled) {
          image.close();
          return;
        }

        const maxWidth = Math.min(canvas.parentElement?.clientWidth || 760, 900);
        const scale = Math.min(1, maxWidth / image.width);
        canvas.width = Math.floor(image.width * scale);
        canvas.height = Math.floor(image.height * scale);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        image.close();
        setStatus("");
      } catch {
        if (!cancelled) {
          setStatus("Could not render image preview inside the portal.");
        }
      }
    }

    void renderImage();

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div className="max-h-[640px] overflow-auto bg-slate-100 p-3">
      {status ? (
        <div className="grid h-[220px] place-items-center bg-white px-5 text-center">
          <p className="text-sm font-semibold text-slate-700">{status}</p>
        </div>
      ) : null}
      <canvas ref={canvasRef} className="mx-auto max-w-full rounded-md bg-white shadow-sm" />
    </div>
  );
}

function getSignatureMeta(
  proposal: PortalProposal,
  signatureDraft: string,
): string | null {
  if (!signatureDraft && !proposal.signatureData) {
    return null;
  }

  if (proposal.status === "APPROVED") {
    return proposal.signedAt
      ? `Client approved on ${new Date(proposal.signedAt).toLocaleString()}`
      : "Client approved";
  }

  if (proposal.status === "SIGNED" || proposal.status === "CONVERTED") {
    return proposal.signedAt
      ? `Client signed on ${new Date(proposal.signedAt).toLocaleString()}`
      : "Client signed";
  }

  return signatureDraft ? "Signature ready for approval" : "Client signature captured";
}

function PortalLoading({ label }: { label: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f0e8] px-4 text-slate-950">
      <div className="rounded-lg border border-white/80 bg-white/85 px-5 py-4 text-sm font-semibold shadow-xl shadow-slate-950/10">
        {label}
      </div>
    </main>
  );
}

function PortalError({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f0e8] px-4 text-slate-950">
      <div className="max-w-md rounded-lg border border-white/80 bg-white p-7 text-center shadow-xl shadow-slate-950/10">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {message || "Please return to the portal dashboard."}
        </p>
        <Link
          href="/portal/dashboard"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back to portal
        </Link>
      </div>
    </main>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white/75 px-5 py-10 text-center text-sm font-semibold text-slate-600">
      {message}
    </div>
  );
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readJson(value: string): { message?: string; aadhaarDocument?: AadhaarDocument } {
  try {
    return JSON.parse(value) as {
      message?: string;
      aadhaarDocument?: AadhaarDocument;
    };
  } catch {
    return {};
  }
}

function formatLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/20">
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}
