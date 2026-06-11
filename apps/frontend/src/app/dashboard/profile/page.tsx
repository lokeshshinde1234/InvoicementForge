"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-storage";
import {
  absoluteLogoUrl,
  CompanyIdentityBlock,
  notifyCompanyBrandingChanged,
  type CompanyBranding,
} from "@/components/branding/CompanyBranding";

export default function ProfilePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [company, setCompany] = useState<CompanyBranding | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoStatus, setLogoStatus] = useState("");
  const [logoError, setLogoError] = useState("");
  const [logoLoading, setLogoLoading] = useState(false);
  const logoPreviewRef = useRef("");
  const profile = useMemo(() => {
    if (typeof window === "undefined") {
      return {};
    }

    const token = getAuthToken();
    if (!token) {
      return {};
    }

    try {
      const payload = token.split(".")[1];
      return JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
        email?: string;
        role?: string;
        tenantId?: string;
      };
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getAuthToken();
    const tenantId = profile.tenantId;
    if (!token || !tenantId) return;
    api.get<CompanyBranding>(`/company/${tenantId}/profile`).then((response) => {
      setCompany(response.data);
    }).catch(() => undefined);
  }, [profile.tenantId]);

  useEffect(() => {
    return () => {
      if (logoPreviewRef.current) {
        URL.revokeObjectURL(logoPreviewRef.current);
      }
    };
  }, []);

  const displayCompany = useMemo<CompanyBranding | null>(() => {
    if (!logoPreview) return company;

    return {
      ...(company ?? {
        id: profile.tenantId ?? "",
        name: "Company",
      }),
      logoUrl: logoPreview,
      logoAltText: logoFile?.name
        ? `Selected logo preview: ${logoFile.name}`
        : "Selected company logo preview",
    };
  }, [company, logoFile?.name, logoPreview, profile.tenantId]);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post<{ message: string }>("/company-owner/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(response.data.message);
    } catch (requestError) {
      if (typeof requestError === "object" && requestError !== null && "response" in requestError) {
        const apiMessage = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
        setError(apiMessage ?? "Could not update password.");
      } else {
        setError("Could not update password.");
      }
    } finally {
      setLoading(false);
    }
  }

  function selectLogo(file: File | null) {
    setLogoError("");
    setLogoStatus("");

    if (logoPreviewRef.current) {
      URL.revokeObjectURL(logoPreviewRef.current);
      logoPreviewRef.current = "";
    }

    if (!file) {
      setLogoFile(null);
      setLogoPreview("");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setLogoError("Invalid file type. Upload PNG, JPG, JPEG, WEBP, or SVG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo file is too large.");
      return;
    }

    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    logoPreviewRef.current = previewUrl;
    setLogoPreview(previewUrl);
  }

  async function saveLogo() {
    if (!logoFile || !profile.tenantId) return;
    setLogoLoading(true);
    setLogoError("");
    setLogoStatus("");

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("logo", logoFile);
      formData.append("logoAltText", `${company?.name ?? "Company"} logo`);
      const response = await fetch(`${api.defaults.baseURL}/company/${profile.tenantId}/logo`, {
        method: company?.logoUrl ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
        body: formData,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || "Upload failed.");
      }
      const updatedCompany = body as CompanyBranding;
      setCompany(updatedCompany);
      selectLogo(null);
      notifyCompanyBrandingChanged();
      setLogoStatus("Company logo updated successfully.");
    } catch (requestError) {
      setLogoError(requestError instanceof Error ? requestError.message : "Upload failed.");
    } finally {
      setLogoLoading(false);
    }
  }

  async function removeLogo() {
    if (!profile.tenantId || !window.confirm("Remove this company logo?")) return;
    setLogoLoading(true);
    setLogoError("");
    setLogoStatus("");

    try {
      const response = await api.delete<CompanyBranding>(`/company/${profile.tenantId}/logo`);
      setCompany(response.data);
      selectLogo(null);
      notifyCompanyBrandingChanged();
      setLogoStatus("Company logo removed.");
    } catch (requestError) {
      setLogoError("Could not remove company logo.");
    } finally {
      setLogoLoading(false);
    }
  }

  return (
    <DashboardShell active="Profile">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Account profile
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Your authenticated workspace identity and role information.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ProfileCard label="Email" value={profile.email || "Not available"} />
          <ProfileCard label="Role" value={profile.role || "Not available"} />
          <ProfileCard label="Tenant ID" value={profile.tenantId || "Not available"} />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Company logo</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Upload, replace, or remove the logo shown across dashboard pages, client portal pages, and PDFs.
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
            <CompanyIdentityBlock branding={displayCompany} />
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-slate-300 bg-white p-3">
                {logoPreview || company?.logoUrl ? (
                  <img
                    src={logoPreview || absoluteLogoUrl(company?.logoUrl) || ""}
                    alt="Company logo preview"
                    className="max-h-24 max-w-48 object-contain"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-500">No logo uploaded</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-teal-600">
                  {company?.logoUrl ? "Replace logo" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="sr-only"
                    onChange={(event) => selectLogo(event.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="button"
                  onClick={saveLogo}
                  disabled={!logoFile || logoLoading}
                  className="h-10 rounded-md bg-teal-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {logoLoading ? "Saving..." : "Save logo"}
                </button>
                {company?.logoUrl ? (
                  <button
                    type="button"
                    onClick={removeLogo}
                    disabled={logoLoading}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-red-700 hover:border-red-300 disabled:opacity-60"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                PNG, JPG, JPEG, WEBP, or safe SVG. Max 2MB.
              </p>
              {logoStatus ? <p className="mt-3 rounded-md bg-teal-50 p-3 text-sm text-teal-800">{logoStatus}</p> : null}
              {logoError ? <p className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{logoError}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Update password</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This updates only your company owner account password.
          </p>
          <form onSubmit={updatePassword} className="mt-5 grid max-w-xl gap-4">
            <input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
            <input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
            <input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal-500" />
            <p className="text-xs text-slate-500">
              Use uppercase, lowercase, number, and special character.
            </p>
            {message ? <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-800">{message}</p> : null}
            {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
            <button disabled={loading} className="h-11 w-fit rounded-md bg-teal-600 px-5 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </DashboardShell>
  );
}

function ProfileCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-3 break-all text-base font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}
