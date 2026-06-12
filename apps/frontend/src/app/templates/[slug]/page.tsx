import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { templateCards } from "@/components/marketing/site-data";
import {
  getTemplateBySlug,
  TemplateDetailContent,
} from "@/components/templates/TemplateDetailContent";

export function generateStaticParams() {
  return templateCards.map((template) => ({ slug: template.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  return {
    title: template ? `${template.title} Proposal Template` : "Proposal Template",
    description: template?.description,
    alternates: {
      canonical: `/templates/${slug}`,
    },
    openGraph: template
      ? {
          title: `${template.title} Proposal Template`,
          description: template.description,
          url: `/templates/${slug}`,
          images: [{ url: template.image, alt: template.title }],
        }
      : undefined,
  };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  if (!template) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <TemplateDetailContent template={template} />
      <SiteFooter />
    </main>
  );
}
