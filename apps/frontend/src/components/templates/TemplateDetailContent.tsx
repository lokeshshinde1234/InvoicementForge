import Link from "next/link";
import { templateCards } from "@/components/marketing/site-data";
import { UseTemplateButton } from "./UseTemplateButton";

type Template = (typeof templateCards)[number];

const featureLabels = [
  "Drag and drop ready",
  "E-signature compatible",
  "Analytics supported",
  "Team collaboration",
  "Client portal ready",
  "GST invoice friendly",
];

const sectionLabels = [
  "Cover page",
  "Problem and goals",
  "Scope of work",
  "Pricing options",
  "Timeline",
  "Terms and acceptance",
];

const users = ["Agencies", "Freelancers", "Startups", "Consultants", "Sales teams", "Finance teams"];

const themes = [
  {
    shell: "bg-[#f5f8ff]",
    hero: "bg-[linear-gradient(135deg,#e8f0ff_0%,#ffffff_48%,#edfdf8_100%)]",
    accent: "bg-blue-600",
    soft: "bg-blue-50 text-blue-700",
    title: "font-semibold",
  },
  {
    shell: "bg-[#fff7fb]",
    hero: "bg-[linear-gradient(135deg,#fff0f7_0%,#f5f3ff_52%,#ecfeff_100%)]",
    accent: "bg-fuchsia-600",
    soft: "bg-fuchsia-50 text-fuchsia-700",
    title: "font-black",
  },
  {
    shell: "bg-[#fafafa]",
    hero: "bg-[linear-gradient(135deg,#ffffff_0%,#f1f5f9_55%,#ecfdf5_100%)]",
    accent: "bg-slate-950",
    soft: "bg-slate-100 text-slate-700",
    title: "font-medium",
  },
  {
    shell: "bg-[#fffbeb]",
    hero: "bg-[linear-gradient(135deg,#fef3c7_0%,#ffffff_48%,#f0fdfa_100%)]",
    accent: "bg-amber-600",
    soft: "bg-amber-50 text-amber-800",
    title: "font-semibold",
  },
];

export function getTemplateBySlug(slug: string): Template | undefined {
  return templateCards.find((template) => template.slug === slug);
}

export function getRelatedTemplates(slug: string): Template[] {
  return templateCards.filter((template) => template.slug !== slug).slice(0, 3);
}

export function TemplateDetailContent({
  template,
  dashboard = false,
}: {
  template: Template;
  dashboard?: boolean;
}) {
  const index = templateCards.findIndex((item) => item.slug === template.slug);
  const theme = themes[Math.max(index, 0) % themes.length];
  const relatedTemplates = getRelatedTemplates(template.slug);
  const detailHrefPrefix = dashboard ? "/dashboard/templates" : "/templates";

  return (
    <div className={dashboard ? "" : theme.shell}>
      <section className={`relative overflow-hidden ${theme.hero} ${dashboard ? "rounded-lg border border-slate-200" : "border-b border-slate-200"} px-4 py-10 sm:px-6 lg:px-8`}>
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-md px-3 py-1 text-xs font-semibold ${theme.soft}`}>
                {template.category}
              </span>
              <span className="rounded-md bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                Trending
              </span>
              <span className="rounded-md bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                4.8 stars
              </span>
            </div>
            <h1 className={`mt-5 text-4xl tracking-tight text-slate-950 sm:text-6xl ${theme.title}`}>
              {template.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {template.description} Preview the structure, sections, and buyer experience before opening it in the editor.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <UseTemplateButton slug={template.slug} />
              <a href="#live-preview" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-md">
                Live preview
              </a>
              <button className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900">
                Favorite
              </button>
              <button className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900">
                Share
              </button>
            </div>
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-3 text-sm">
              {[
                ["Pages", `${6 + (index % 3)}`],
                ["Uses", `${1200 + index * 318}+`],
                ["Sections", `${sectionLabels.length}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className={`absolute -left-4 top-8 h-24 w-24 rounded-lg ${theme.accent} opacity-20 blur-2xl`} />
            <div className="relative rounded-lg border border-white/80 bg-white/70 p-4 shadow-2xl shadow-slate-950/15 backdrop-blur">
              <img
                src={template.image}
                alt={`${template.title} full preview`}
                className="aspect-[4/3] w-full rounded-md object-cover shadow-lg transition duration-500 hover:scale-[1.02]"
              />
              <div className="mt-4 grid grid-cols-3 gap-3">
                {["Desktop", "Tablet", "Mobile"].map((label) => (
                  <div key={label} className="rounded-md border border-slate-200 bg-white p-3 text-center text-xs font-semibold text-slate-600">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Preview gallery</p>
                <h2 className="mt-2 text-2xl font-semibold">Cover, content, and closing pages</h2>
              </div>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Lazy-ready mockups
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((offset) => (
                <div key={offset} className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img
                    src={template.image}
                    alt={`${template.title} preview ${offset + 1}`}
                    className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Template information</p>
            <dl className="mt-5 grid gap-3 text-sm">
              {[
                ["Category", template.category],
                ["Best for", users[index % users.length]],
                ["Included pages", `${6 + (index % 3)} pages`],
                ["Editor support", "Proposal builder, e-signature, analytics"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 rounded-md bg-slate-50 px-4 py-3">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Features</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featureLabels.map((feature, featureIndex) => (
                <div key={feature} className="rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-md">
                  <span className={`grid h-8 w-8 place-items-center rounded-md text-xs font-bold text-white ${theme.accent}`}>
                    {featureIndex + 1}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{feature}</h3>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Who should use it</p>
            <div className="mt-5 grid gap-3">
              {users.slice(0, 5).map((user) => (
                <div key={user} className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold">
                  {user}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Sections included</p>
              <h2 className="mt-2 text-2xl font-semibold">A complete proposal flow</h2>
            </div>
            <UseTemplateButton slug={template.slug} variant="secondary" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {sectionLabels.map((section, sectionIndex) => (
              <div key={section} className="group rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{section}</span>
                  <span className="text-xs text-slate-400">0{sectionIndex + 1}</span>
                </div>
                <div className="mt-4 h-24 rounded-md bg-white p-3">
                  <div className={`h-3 w-2/3 rounded ${theme.accent}`} />
                  <div className="mt-3 h-2 w-full rounded bg-slate-200" />
                  <div className="mt-2 h-2 w-4/5 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="live-preview" className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Live interactive demo</p>
            <h2 className="mt-2 text-2xl font-semibold">Read-only proposal preview</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Scroll through a simulated buyer-facing document before committing it to your workspace.
            </p>
            <div className="mt-5 flex gap-2">
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold">Zoom in</button>
              <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold">Full screen</button>
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-950 p-4 shadow-sm">
            <div className="space-y-4 rounded-md bg-white p-5">
              {[template.title, "Scope of work", "Pricing", "Timeline", "Acceptance"].map((page, pageIndex) => (
                <div key={page} className="rounded-lg border border-slate-200 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Page {pageIndex + 1}</p>
                  <h3 className="mt-2 text-xl font-semibold">{page}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    This section is designed to help buyers scan, compare, approve, and sign with confidence.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Reviews</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {["Very polished out of the box.", "Helped us quote faster.", "Clients understood the offer immediately."].map((quote, quoteIndex) => (
              <figure key={quote} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <blockquote className="text-sm leading-6 text-slate-700">"{quote}"</blockquote>
                <figcaption className="mt-4 text-xs font-semibold text-slate-500">Customer {quoteIndex + 1}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Related templates</p>
              <h2 className="mt-2 text-2xl font-semibold">Recommended next</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {relatedTemplates.map((related) => (
              <Link
                key={related.slug}
                href={`${detailHrefPrefix}/${related.slug}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-md"
              >
                <img src={related.image} alt="" className="aspect-[3/2] w-full object-cover" loading="lazy" />
                <div className="p-4">
                  <p className="text-sm font-semibold">{related.title}</p>
                  <p className="mt-2 text-xs text-slate-500">{related.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={`mt-6 rounded-lg p-8 text-white ${theme.accent}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Start using this template</h2>
              <p className="mt-2 text-sm text-white/80">Customize in minutes and move directly into your proposal workflow.</p>
            </div>
            <UseTemplateButton slug={template.slug} variant="secondary" />
          </div>
        </section>
      </section>
    </div>
  );
}
