import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = { title: "Lupa kata sandi · Cashly" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell mode="forgot-password">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
