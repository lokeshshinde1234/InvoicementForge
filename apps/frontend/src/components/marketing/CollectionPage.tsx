import Link from "next/link";
import { SimpleMarketingPage } from "@/components/marketing/MarketingPage";

type CollectionPageProps = {
  label: string;
  title: string;
  copy: string;
  cards: Array<{
    title: string;
    body: string;
    meta?: string;
    href?: string;
  }>;
  primaryAction?: {
    label: string;
    href: string;
  };
};

export function CollectionPage({
  label,
  title,
  copy,
  cards,
  primaryAction = { label: "Start free trial", href: "/signup" },
}: CollectionPageProps) {
  return (
    <SimpleMarketingPage label={label} title={title} copy={copy}>
      <section className="mobile-section mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const content = (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  {card.meta ?? label}
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {card.body}
                </p>
              </>
            );

            return card.href ? (
              <Link
                key={card.title}
                href={card.href}
                className="mobile-card hover-lift rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                {content}
              </Link>
            ) : (
              <article
                key={card.title}
                className="mobile-card hover-lift rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                {content}
              </article>
            );
          })}
        </div>

        <div className="mobile-card mt-8 rounded-2xl border border-slate-200 bg-slate-950 p-8 text-white sm:mt-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">
            InvoiceForge workflow
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Proposal to payment, without changing systems.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Start with a template, invite the client into a secure review flow,
            collect approval and signature, convert the accepted scope into an
            invoice, and export clean accounting data.
          </p>
          <Link
            href={primaryAction.href}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
          >
            {primaryAction.label}
          </Link>
        </div>
      </section>
    </SimpleMarketingPage>
  );
}
