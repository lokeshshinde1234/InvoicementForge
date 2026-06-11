"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  featureCards,
  integrationCards,
  planCards,
  templateCards,
} from "@/components/marketing/site-data";

export type MarketingContent = {
  features: typeof featureCards;
  productModules: Array<[string, string]>;
  integrations: string[];
  industries: string[];
  templates: typeof templateCards;
  plans: typeof planCards;
};

export const fallbackMarketingContent: MarketingContent = {
  features: featureCards,
  productModules: [
    ["Proposal editor", "Reusable content blocks, pricing tables, terms, timelines, and client-ready layouts."],
    ["Deal rooms", "Secure proposal links where clients can review, comment, sign, and download."],
    ["Revenue handoff", "Approved proposals can move into invoice and payment workflows without retyping."],
    ["Team control", "Workspace structure, tenant-aware auth, and a foundation for roles and permissions."],
  ],
  integrations: integrationCards,
  industries: ["Agencies", "Consultants", "Service businesses"],
  templates: templateCards,
  plans: planCards,
};

export function useMarketingContent() {
  const [content, setContent] = useState<MarketingContent>(fallbackMarketingContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .get<MarketingContent>("/marketing/site")
      .then((response) => {
        if (active) setContent(response.data);
      })
      .catch(() => {
        if (active) setContent(fallbackMarketingContent);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { content, loading };
}
