"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { clearAuthToken, setAuthToken } from "@/lib/auth-storage";

type Mode = "login" | "signup";

type AuthResponse = {
  access_token: string;
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(
    null,
  );
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [gstin, setGstin] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoError, setLogoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";
  const title = isSignup ? "Start your free trial" : "Log in to InvoiceForge";
  const submitText = isSignup ? "Create account" : "Log in";
  const next = searchParams?.get("next");
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const signupHref = next
    ? `/signup?next=${encodeURIComponent(next)}`
    : "/signup";

  const suggestedSubdomain = useMemo(() => slugify(tenantName), [tenantName]);
  const workspaceSubdomain = subdomain || suggestedSubdomain;

  useEffect(() => {
    if (!isSignup || subdomainEdited || !suggestedSubdomain) {
      return;
    }

    setSubdomain(suggestedSubdomain);
  }, [isSignup, subdomainEdited, suggestedSubdomain]);

  useEffect(() => {
    if (!isSignup || !workspaceSubdomain || workspaceSubdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setCheckingSubdomain(true);

      try {
        await api.get(
          `/tenants/by-subdomain/${encodeURIComponent(workspaceSubdomain)}`,
          { signal: controller.signal },
        );
        setSubdomainAvailable(false);
      } catch (availabilityError: unknown) {
        const status =
          typeof availabilityError === "object" &&
          availabilityError !== null &&
          "response" in availabilityError
            ? (availabilityError as { response?: { status?: number } }).response
                ?.status
            : undefined;

        setSubdomainAvailable(status === 404 ? true : null);
      } finally {
        setCheckingSubdomain(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [isSignup, workspaceSubdomain]);

  function generateSubdomain() {
    const base = slugify(tenantName || email.split("@")[0] || "workspace");
    const suffix = Math.random().toString(36).slice(2, 6);
    setSubdomain(`${base || "workspace"}-${suffix}`.slice(0, 32));
    setSubdomainEdited(true);
  }

  function handleLogoChange(file: File | null) {
    setLogoError("");

    if (!file) {
      setLogoFile(null);
      setLogoPreview("");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setLogoError("Upload PNG, JPG, JPEG, WEBP, or SVG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo must be 2MB or smaller.");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = isSignup
        ? {
            email,
            password,
            firstName,
            lastName,
            tenantName,
            subdomain: workspaceSubdomain,
            gstin: gstin || null,
            countryCode: "IN",
            currency: "INR",
          }
        : { email, password };

      const response = await api.post<AuthResponse>(
        isSignup ? "/auth/register" : "/auth/login",
        payload,
      );

      if (isSignup) {
        if (logoFile) {
          const tenantId = readTenantIdFromToken(response.data.access_token);
          if (tenantId) {
            await uploadCompanyLogo(tenantId, logoFile, response.data.access_token).catch(() => undefined);
          }
        }
        clearAuthToken();
        router.push(loginHref);
        return;
      }

      setAuthToken(response.data.access_token);
      const role = readRoleFromToken(response.data.access_token);
      const defaultRedirect =
        role === "SUPERADMIN"
          ? "/superadmin"
          : role === "MEMBER"
            ? "/dashboard/team/my-tasks"
            : "/dashboard";
      router.push(next ?? defaultRedirect);
    } catch (submitError: unknown) {
      const message =
        typeof submitError === "object" &&
        submitError !== null &&
        "response" in submitError
          ? (submitError as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;
      setError(message ?? "Authentication failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12 sm:px-8 lg:px-10">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-10 shadow-xl shadow-slate-900/10 sm:p-12">
          <Link
            href="/"
            className="group mb-6 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] font-bold uppercase tracking-[0.16em] text-slate-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-950 hover:text-white hover:shadow-lg hover:shadow-slate-950/15"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-700 transition duration-200 group-hover:-translate-x-0.5 group-hover:bg-white/15 group-hover:text-white">
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.25"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h13" />
              </svg>
            </span>
            Back
          </Link>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{isSignup ? "Free trial" : "Welcome back"}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">Create proposals, collect signatures, and convert to invoices.</p>
            </div>
            {/* removed top login prompt; moved to form footer */}
          </div>

          <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-3">
              {isSignup ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600" />
                    <input required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600" />
                  </div>
                  <input required value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Company name" className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600" />
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        required
                        minLength={3}
                        value={workspaceSubdomain}
                        onChange={(e) => {
                          setSubdomain(slugify(e.target.value));
                          setSubdomainEdited(true);
                        }}
                        placeholder="Workspace subdomain"
                        className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600"
                      />
                      <button
                        type="button"
                        onClick={generateSubdomain}
                        className="h-11 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-teal-600"
                      >
                        Suggest
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Your workspace URL will be {workspaceSubdomain || "your-company"}.invoiceforge.app
                    </p>
                    {checkingSubdomain ? (
                      <p className="text-xs text-slate-500">Checking availability...</p>
                    ) : null}
                    {subdomainAvailable === true ? (
                      <p className="text-xs font-medium text-emerald-700">Workspace URL is available.</p>
                    ) : null}
                    {subdomainAvailable === false ? (
                      <p className="text-xs font-medium text-red-700">
                        This workspace URL is already taken. Click Suggest or type another one.
                      </p>
                    ) : null}
                  </div>
                  <input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="GSTIN (optional)" className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600" />
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Company logo</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Logo is optional. You can add or update it later from company profile.
                        </p>
                      </div>
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Company logo preview"
                          className="h-14 w-20 rounded-md border border-slate-200 bg-white object-contain p-1"
                        />
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="inline-flex h-10 cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-teal-600">
                        {logoFile ? "Change logo" : "Upload logo"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                          className="sr-only"
                          onChange={(event) => handleLogoChange(event.target.files?.[0] ?? null)}
                        />
                      </label>
                      {logoFile ? (
                        <button
                          type="button"
                          onClick={() => handleLogoChange(null)}
                          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-red-300 hover:text-red-700"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    {logoError ? (
                      <p className="mt-2 text-xs font-medium text-red-700">{logoError}</p>
                    ) : null}
                  </div>
                </>
              ) : null}

              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email" className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600" />
              <input required minLength={8} type="password" autoComplete={isSignup?"new-password":"current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isSignup ? "Create a strong password" : "Password"} className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600" />
              <div className="text-xs text-slate-500">Use at least 8 characters including a number or symbol.</div>
            </div>

            {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <button type="submit" disabled={loading || (isSignup && subdomainAvailable === false)} className="h-12 w-full rounded-md bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">{loading ? "Please wait..." : submitText}</button>
          </form>

          <div className="mt-6 grid gap-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Secure workspace access is currently available with email and password.
            </div>
            <div className="mt-2 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <div className="">By continuing you agree to our <Link href="/privacy" className="text-teal-700 font-semibold">Privacy Policy</Link></div>
              <div className="">
                {isSignup ? (
                  <span>Have an account? <Link href={loginHref} className="font-semibold text-teal-700">Log in</Link></span>
                ) : (
                  <span><Link href="/forgot-password" className="font-semibold text-teal-700">Forgot password?</Link> · Need an account? <Link href={signupHref} className="font-semibold text-teal-700">Sign up</Link></span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

async function uploadCompanyLogo(tenantId: string, file: File, token: string) {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";
  const formData = new FormData();
  formData.append("logo", file);
  formData.append("logoAltText", `${tenantId} company logo`);

  const response = await fetch(`${apiBase}/company/${tenantId}/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Company was created, but logo upload failed.");
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

function readRoleFromToken(token: string): string {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(normalized)) as { role?: string };
    return parsed.role ?? "";
  } catch {
    return "";
  }
}

function readTenantIdFromToken(token: string): string {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(normalized)) as { tenantId?: string };
    return parsed.tenantId ?? "";
  } catch {
    return "";
  }
}
