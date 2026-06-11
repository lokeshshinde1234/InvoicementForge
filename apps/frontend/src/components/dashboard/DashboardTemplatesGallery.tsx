"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { templateCards } from "@/components/marketing/site-data";
import {
  CUSTOM_TEMPLATE_EVENT,
  deleteCompanyTemplate,
  getCustomTemplateCards,
  getHiddenTemplateSlugs,
  type CustomTemplateCard,
} from "@/lib/custom-templates";

export function DashboardTemplatesGallery({
  manageMode = false,
}: {
  manageMode?: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateCard[]>([]);
  const [hiddenTemplateSlugs, setHiddenTemplateSlugs] = useState<string[]>([]);
  const allTemplates = useMemo(
    () => [
      ...customTemplates,
      ...templateCards.filter(
        (template) => !hiddenTemplateSlugs.includes(template.slug),
      ),
    ],
    [customTemplates, hiddenTemplateSlugs],
  );
  const categoryOptions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(allTemplates.map((template) => template.category))),
    ],
    [allTemplates],
  );

  useEffect(() => {
    const loadCompanyTemplates = () => {
      setCustomTemplates(getCustomTemplateCards());
      setHiddenTemplateSlugs(getHiddenTemplateSlugs());
    };

    loadCompanyTemplates();
    window.addEventListener(CUSTOM_TEMPLATE_EVENT, loadCompanyTemplates);
    window.addEventListener("storage", loadCompanyTemplates);

    return () => {
      window.removeEventListener(CUSTOM_TEMPLATE_EVENT, loadCompanyTemplates);
      window.removeEventListener("storage", loadCompanyTemplates);
    };
  }, []);

  const visibleTemplates = useMemo(() => {
    if (activeCategory === "All") {
      return allTemplates;
    }

    return allTemplates.filter(
      (template) => template.category === activeCategory,
    );
  }, [activeCategory, allTemplates]);

  function handleDeleteTemplate(slug: string) {
    deleteCompanyTemplate(slug);
    setCustomTemplates(getCustomTemplateCards());
    setHiddenTemplateSlugs(getHiddenTemplateSlugs());
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2" aria-label="Template categories">
        {categoryOptions.map((category) => {
          const isActive = category === activeCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={isActive}
              className={`rounded-md border px-3 py-2 text-sm font-semibold shadow-sm transition ${
                isActive
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-sm font-medium text-slate-500">
        Showing {visibleTemplates.length}{" "}
        {visibleTemplates.length === 1 ? "template" : "templates"}
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {visibleTemplates.map((template) => (
          <article
            key={template.slug}
            className={`group relative overflow-hidden rounded-lg border bg-white shadow-sm transition ${
              manageMode
                ? "border-slate-300 shadow-md ring-1 ring-slate-200"
                : "border-slate-200 hover:-translate-y-1 hover:border-teal-400 hover:shadow-md"
            }`}
          >
            {manageMode ? (
              <button
                type="button"
                onClick={() => handleDeleteTemplate(template.slug)}
                aria-label={`Delete ${template.title} template from this company workspace`}
                title="Delete from this company workspace"
                className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-slate-950 text-white shadow-lg shadow-slate-950/20 transition hover:scale-105 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <MinusIcon />
              </button>
            ) : null}
            <Link
              href={
                "custom" in template
                  ? `/proposals/new?template=${encodeURIComponent(template.slug)}`
                  : `/dashboard/templates/${template.slug}`
              }
              onClick={(event) => {
                if (manageMode) {
                  event.preventDefault();
                }
              }}
              className="relative block overflow-hidden bg-[#eef8f4]"
            >
              {template.image ? (
                <img
                  src={template.image}
                  alt={`${template.title} template preview`}
                  className="aspect-[3/2] w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="grid aspect-[3/2] place-items-center bg-[linear-gradient(135deg,#ecfeff,#f8fafc)] p-6 text-center">
                  <div>
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-teal-600 text-sm font-black text-white">
                      {template.title.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-teal-700">
                      Imported template
                    </p>
                  </div>
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                {template.category}
              </span>
            </Link>
            <div className="p-5">
              <h2 className="text-base font-semibold">
                <Link
                  href={
                    "custom" in template
                      ? `/proposals/new?template=${encodeURIComponent(template.slug)}`
                      : `/dashboard/templates/${template.slug}`
                  }
                  onClick={(event) => {
                    if (manageMode) {
                      event.preventDefault();
                    }
                  }}
                  className="hover:text-teal-700"
                >
                  {template.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {template.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function MinusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2.4"
    >
      <path d="M6 12h12" />
    </svg>
  );
}
