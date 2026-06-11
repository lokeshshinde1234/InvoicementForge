import { AuthUtilityPage } from "@/components/auth/AuthUtilityPage";

export default function OtpVerificationPage() {
  return (
    <AuthUtilityPage
      label="OTP verification"
      title="Verify your sign-in code"
      copy="Use the one-time password sent to your email or phone to continue securely."
      fields={[
        { label: "One-time code", placeholder: "6 digit code" },
      ]}
      submitLabel="Verify code"
    />
  );
}
