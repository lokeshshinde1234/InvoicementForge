import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
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
}) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  return {
    title: template ? `${template.title} Template | InvoiceForge` : "Template | InvoiceForge",
    description: template?.description,
  };
}

export default async function DashboardTemplateDetailPage({
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
    <DashboardShell active="Templates">
      <TemplateDetailContent template={template} dashboard />
    </DashboardShell>
  );
}
