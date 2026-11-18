import { Suspense } from "react";
import EmailVerificationForm from "./email-verification-form";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-surface" />}>
      <EmailVerificationForm />
    </Suspense>
  );
}
