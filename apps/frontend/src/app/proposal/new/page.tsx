import { redirect } from "next/navigation";

export default async function SingularNewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const params = await searchParams;
  const suffix = params.template
    ? `?template=${encodeURIComponent(params.template)}`
    : "";

  redirect(`/proposals/new${suffix}`);
}
