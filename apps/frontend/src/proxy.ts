import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = "invoiceforge.app";
const SKIPPED_SUBDOMAINS = new Set(["www", "app"]);

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";
  const subdomain = extractSubdomain(hostname);

  if (!subdomain || SKIPPED_SUBDOMAINS.has(subdomain)) {
    return NextResponse.next();
  }

  const tenant = await fetchTenant(subdomain);
  const requestHeaders = new Headers(request.headers);

  if (tenant?.tenantId) {
    requestHeaders.set("x-tenant-id", tenant.tenantId);
    requestHeaders.set("x-tenant-subdomain", subdomain);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

function extractSubdomain(hostname: string): string | null {
  if (!hostname.endsWith(ROOT_DOMAIN) || hostname === ROOT_DOMAIN) {
    return null;
  }

  const subdomain = hostname.slice(0, -ROOT_DOMAIN.length - 1);

  return subdomain.includes(".") ? null : subdomain.toLowerCase();
}

async function fetchTenant(
  subdomain: string,
): Promise<{ tenantId: string } | null> {
  const apiBaseUrl =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  try {
    const response = await fetch(
      `${apiBaseUrl}/tenants/by-subdomain/${encodeURIComponent(subdomain)}`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as { tenantId: string };
  } catch {
    return null;
  }
}
