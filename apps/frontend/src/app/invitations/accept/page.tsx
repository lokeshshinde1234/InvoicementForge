import { AuthUtilityPage } from "@/components/auth/AuthUtilityPage";

export default function InvitationAcceptPage() {
  return (
    <AuthUtilityPage
      label="Workspace invitation"
      title="Accept your InvoiceForge invite"
      copy="Confirm your invite, set a password, and join the correct company workspace."
      fields={[
        { label: "Invite email", type: "email", placeholder: "you@company.com" },
        { label: "Invite code", placeholder: "Invitation code" },
        { label: "Password", type: "password", placeholder: "Create password" },
      ]}
      submitLabel="Join workspace"
      footer="Need to use another account?"
    />
  );
}
