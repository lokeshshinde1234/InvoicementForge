"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { clearAuthToken, setAuthToken } from "@/lib/auth-storage";

type Mode = "login" | "signup";
type AuthResponse = { access_token: string };

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [gstin, setGstin] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoError, setLogoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";
  const next = searchParams?.get("next");
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
  const suggestedSubdomain = useMemo(() => slugify(tenantName), [tenantName]);
  const workspaceSubdomain = subdomain || suggestedSubdomain;

  useEffect(() => {
    if (isSignup && !subdomainEdited && suggestedSubdomain) {
      setSubdomain(suggestedSubdomain);
    }
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
        await api.get(`/tenants/by-subdomain/${encodeURIComponent(workspaceSubdomain)}`, {
          signal: controller.signal,
        });
        setSubdomainAvailable(false);
      } catch (availabilityError: unknown) {
        const status =
          typeof availabilityError === "object" &&
          availabilityError !== null &&
          "response" in availabilityError
            ? (availabilityError as { response?: { status?: number } }).response?.status
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
            await uploadCompanyLogo(
              tenantId,
              logoFile,
              response.data.access_token,
            ).catch(() => undefined);
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
          ? (submitError as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(message ?? "Authentication failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
        <AuthBrandPanel isSignup={isSignup} />

        <section className="flex min-w-0 items-center justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
          <div className={`w-full ${isSignup ? "max-w-2xl" : "max-w-md"}`}>
            <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
              <BrandLink />
              <Link
                href={isSignup ? loginHref : signupHref}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
              >
                {isSignup ? "Log in" : "Create account"}
              </Link>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/8 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                {isSignup ? "14-day free trial" : "Company workspace"}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {isSignup ? "Create your company account" : "Welcome back"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isSignup
                  ? "Set up the essentials now. Branding, tax, and team settings can be refined later."
                  : "Enter your company account details to continue to your workspace."}
              </p>

              <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  {isSignup ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <AuthField label="First name">
                          <input required autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Your first name" className={inputClassName} />
                        </AuthField>
                        <AuthField label="Last name">
                          <input required autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Your last name" className={inputClassName} />
                        </AuthField>
                      </div>

                      <AuthField label="Company name">
                        <input required autoComplete="organization" value={tenantName} onChange={(event) => setTenantName(event.target.value)} placeholder="Acme Consulting" className={inputClassName} />
                      </AuthField>

                      <AuthField
                        label="Workspace address"
                        hint={`Your team will use ${workspaceSubdomain || "your-company"}.invoiceforge.app`}
                      >
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <input
                            required
                            minLength={3}
                            value={workspaceSubdomain}
                            onChange={(event) => {
                              setSubdomain(slugify(event.target.value));
                              setSubdomainEdited(true);
                            }}
                            placeholder="your-company"
                            className={inputClassName}
                          />
                          <button type="button" onClick={generateSubdomain} className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700">
                            Suggest address
                          </button>
                        </div>
                        {checkingSubdomain ? <p className="mt-2 text-xs text-slate-500">Checking availability...</p> : null}
                        {subdomainAvailable === true ? <p className="mt-2 text-xs font-semibold text-emerald-700">Workspace address is available.</p> : null}
                        {subdomainAvailable === false ? <p className="mt-2 text-xs font-semibold text-red-700">This address is taken. Choose another or use Suggest address.</p> : null}
                      </AuthField>

                      <AuthField label="GSTIN" hint="Optional. You can add this later in company settings.">
                        <input value={gstin} onChange={(event) => setGstin(event.target.value)} placeholder="22AAAAA0000A1Z5" className={inputClassName} />
                      </AuthField>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Company logo</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">Optional. PNG, JPG, WEBP or SVG up to 2MB.</p>
                          </div>
                          {logoPreview ? <img src={logoPreview} alt="Company logo preview" className="h-14 w-20 rounded-xl border border-slate-200 bg-white object-contain p-1" /> : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-teal-600">
                            {logoFile ? "Change logo" : "Upload logo"}
                            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" className="sr-only" onChange={(event) => handleLogoChange(event.target.files?.[0] ?? null)} />
                          </label>
                          {logoFile ? <button type="button" onClick={() => handleLogoChange(null)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-red-300 hover:text-red-700">Remove</button> : null}
                        </div>
                        {logoError ? <p className="mt-2 text-xs font-medium text-red-700">{logoError}</p> : null}
                      </div>
                    </>
                  ) : null}

                  <AuthField label="Work email">
                    <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className={inputClassName} />
                  </AuthField>

                  <AuthField
                    label={isSignup ? "Create password" : "Password"}
                    hint={isSignup ? "Use at least 8 characters, including a number or symbol." : undefined}
                  >
                    <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100">
                      <input
                        required
                        minLength={8}
                        type={showPassword ? "text" : "password"}
                        autoComplete={isSignup ? "new-password" : "current-password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={isSignup ? "Create a strong password" : "Enter your password"}
                        className="h-12 min-w-0 flex-1 px-3 text-sm outline-none"
                      />
                      <button type="button" onClick={() => setShowPassword((current) => !current)} className="w-16 border-l border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50">
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </AuthField>
                </div>

                {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
                <button type="submit" disabled={loading || (isSignup && subdomainAvailable === false)} className="h-12 w-full rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Please wait..." : isSignup ? "Create company account" : "Log in securely"}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  {isSignup ? (
                    <p>Already have an account? <Link href={loginHref} className="font-bold text-teal-700">Log in</Link></p>
                  ) : (
                    <>
                      <Link href="/forgot-password" className="font-bold text-teal-700">Forgot password?</Link>
                      <p>New to InvoiceForge? <Link href={signupHref} className="font-bold text-teal-700">Create account</Link></p>
                    </>
                  )}
                </div>
                {!isSignup ? (
                  <Link href="/portal/login" className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:bg-teal-50">
                    <span>Are you a client?</span>
                    <span className="text-teal-700">Open client login</span>
                  </Link>
                ) : null}
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  By continuing, you agree to our <Link href="/privacy" className="font-semibold text-slate-700 underline underline-offset-2">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function BrandLink() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-950/15">IF</span>
      <span className="font-bold tracking-tight">InvoiceForge</span>
    </Link>
  );
}

function AuthBrandPanel({ isSignup }: { isSignup: boolean }) {
  return (
    <aside className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.35),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(251,191,36,0.20),transparent_28%)]" />
      <div className="brand-dots absolute inset-0 opacity-10" />
      <Link href="/" className="relative inline-flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-sm font-black text-slate-950">IF</span>
        <span className="text-lg font-bold">InvoiceForge</span>
      </Link>
      <div className="relative max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
          {isSignup ? "Built for growing service teams" : "Your revenue workspace"}
        </p>
        <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight xl:text-5xl">
          {isSignup ? "One workspace from first proposal to final payment." : "Pick up every proposal, invoice, and client conversation."}
        </h2>
        <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
          Manage branded documents, GST-ready billing, approvals, payments, and client access without switching tools.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {["Secure access", "GST-ready", "Client portal"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <span className="mb-3 block h-2 w-2 rounded-full bg-cyan-300" />
              <p className="text-sm font-bold">{item}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="relative text-xs text-slate-400">Secure company access. Your workspace data stays scoped to your organization.</p>
    </aside>
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
    return (JSON.parse(window.atob(normalized)) as { role?: string }).role ?? "";
  } catch {
    return "";
  }
}

function readTenantIdFromToken(token: string): string {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return (JSON.parse(window.atob(normalized)) as { tenantId?: string }).tenantId ?? "";
  } catch {
    return "";
  }
}
