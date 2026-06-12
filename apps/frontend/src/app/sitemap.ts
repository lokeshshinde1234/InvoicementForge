import type { MetadataRoute } from "next";
import { templateCards } from "@/components/marketing/site-data";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://invoicementforge.up.railway.app";

const publicRoutes = [
  "",
  "/product",
  "/features",
  "/templates",
  "/integrations",
  "/pricing",
  "/customers",
  "/security",
  "/privacy",
  "/contact",
  "/demo",
  "/about",
  "/help",
  "/docs",
  "/blog",
  "/careers",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...publicRoutes.map((route, index) => ({
      url: `${siteUrl}${route}`,
      lastModified,
      changeFrequency: index === 0 ? ("weekly" as const) : ("monthly" as const),
      priority: index === 0 ? 1 : 0.7,
    })),
    ...templateCards.map((template) => ({
      url: `${siteUrl}/templates/${template.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
