"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-storage";
import { API_BASE_URL } from "@/lib/config";

export const COMPANY_BRANDING_CHANGED_EVENT =
  "invoiceforge-company-branding-changed";

export type CompanyBranding = {
  id: string;
  name: string;
  subdomain?: string;
  gstin?: string | null;
  countryCode?: string | null;
  currency?: string | null;
  logoUrl?: string | null;
  logoAltText?: string | null;
};

type JwtPayload = {
  tenantId?: string;
};



export function useCompanyBranding() {
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const tenantId = readTenantId(token);

    if (!tenantId) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadBranding = () => {
      api
        .get<CompanyBranding>(`/company/${tenantId}/profile`)
        .then((response) => {
          if (active) setBranding(response.data);
        })
        .catch(() => {
          if (active) setBranding(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    loadBranding();
    window.addEventListener(COMPANY_BRANDING_CHANGED_EVENT, loadBranding);

    return () => {
      active = false;
      window.removeEventListener(COMPANY_BRANDING_CHANGED_EVENT, loadBranding);
    };
  }, []);

  return { branding, loading };
}

export function notifyCompanyBrandingChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COMPANY_BRANDING_CHANGED_EVENT));
  }
}

export function loadCompanyBranding(tenantId: string) {
  return api
    .get<CompanyBranding>(`/company/${tenantId}/profile`)
      .then((response) => {
        return response.data;
      });
}

export function CompanyLogo({
  branding,
  size = "md",
}: {
  branding?: Pick<CompanyBranding, "name" | "logoUrl" | "logoAltText"> | null;
  size?: "sm" | "md" | "lg";
}) {
  const classes =
    size === "lg"
      ? "h-14 w-14 text-base"
      : size === "sm"
        ? "h-8 w-8 text-xs"
        : "h-10 w-10 text-sm";
  const logoUrl = absoluteLogoUrl(branding?.logoUrl);

  if (logoUrl) {
    return (
      <span className={`${classes} grid shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white`}>
        <img
          src={logoUrl}
          alt={branding?.logoAltText || `${branding?.name ?? "Company"} logo`}
          className="h-full w-full object-contain p-1"
        />
      </span>
    );
  }

  return (
    <span className={`${classes} grid shrink-0 place-items-center rounded-md bg-teal-600 font-bold text-white`}>
      {companyInitials(branding?.name ?? "InvoiceForge")}
    </span>
  );
}

export function CompanyBrandHeader({
  branding,
  subtitle,
  compact = false,
}: {
  branding?: CompanyBranding | null;
  subtitle?: string;
  compact?: boolean;
}) {
  const name = branding?.name ?? "InvoiceForge";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <CompanyLogo branding={branding} size={compact ? "sm" : "md"} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">{name}</p>
        {subtitle ? (
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export function CompanyIdentityBlock({
  branding,
}: {
  branding?: CompanyBranding | null;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <CompanyLogo branding={branding} size="lg" />
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-slate-950">
          {branding?.name ?? "Company"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          GSTIN {branding?.gstin || "Not added"} | {branding?.currency || "INR"}
        </p>
      </div>
    </div>
  );
}

export function companyInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "IF";
}

export function absoluteLogoUrl(logoUrl?: string | null): string | null {
  if (!logoUrl) return null;
  if (/^https?:\/\//i.test(logoUrl) || logoUrl.startsWith("data:") || logoUrl.startsWith("blob:")) return logoUrl;
  if (logoUrl.startsWith("/uploads/")) {
    return `${apiAssetOrigin()}${logoUrl}`;
  }

  return `${apiAssetOrigin()}${logoUrl.startsWith("/") ? logoUrl : `/${logoUrl}`}`;
}

function apiAssetOrigin(): string {
  const trimmed = API_BASE_URL.replace(/\/$/, "");

  try {
    const url = new URL(trimmed, window.location.origin);
    url.pathname = url.pathname.replace(/\/api\/?$/u, "");
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return trimmed.replace(/\/api\/?$/u, "");
  }
}

function readTenantId(token: string | null): string {
  if (!token) return "";

  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(normalized)) as JwtPayload;
    return parsed.tenantId ?? "";
  } catch {
    return "";
  }
}
