import { Suspense } from "react";
import { AuthForm } from "@/components/marketing/AuthForm";

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
