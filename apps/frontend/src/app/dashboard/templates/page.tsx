import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardTemplatesWorkspace } from "@/components/dashboard/DashboardTemplatesWorkspace";

export default function DashboardTemplatesPage() {
  return (
    <DashboardShell active="Templates">
      <DashboardTemplatesWorkspace />
    </DashboardShell>
  );
}
