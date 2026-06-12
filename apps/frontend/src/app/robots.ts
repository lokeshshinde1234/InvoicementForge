import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://invoicementforge.up.railway.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/portal/",
        "/superadmin/",
        "/invitations/",
        "/subscription/",
        "/onboarding",
        "/login",
        "/register",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/otp-verification",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
