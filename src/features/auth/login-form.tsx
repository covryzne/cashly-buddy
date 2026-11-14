"use client";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Info, Mail, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoCredentials } from "@/mocks/fixtures/auth";
import { loginSchema, type LoginValues } from "./login-schema";
import { AuthPasswordField } from "./auth-password-field";
import { GoogleSignInButton } from "./google-sign-in-button";

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginValues | "form", string>>
  >({});
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof LoginValues;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      formRef.current
        ?.querySelector<HTMLInputElement>(
          `#login-${nextErrors.email ? "email" : "password"}`,
        )
        ?.focus();
      return;
    }
    if (
      parsed.data.email !== demoCredentials.email ||
      parsed.data.password !== demoCredentials.password
    ) {
      setErrors({
        form: "Gunakan akun contoh untuk menjelajahi demo. Pilih ‘Isi data contoh’ di bawah.",
      });
      return;
    }
    setErrors({});
    // Navigation only: no credentials sent, persisted, or used as a session.
    startTransition(() => router.push("/beranda"));
  }
  function change(field: keyof LoginValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }
  return (
    <>
      <div className="login-demo-notice" id="login-demo-notice">
        <Info size={18} />
        <p>
          Ini pratinjau Cashly. Gunakan data contoh dan hindari kata sandi asli.
        </p>
      </div>
      <GoogleSignInButton />
      <div className="auth-divider">
        <span>atau masuk dengan email</span>
      </div>
      <form
        ref={formRef}
        className="login-form"
        onSubmit={submit}
        noValidate
        method="post"
        aria-describedby="login-demo-notice"
        aria-busy={isPending}
      >
        <div className="form-field">
          <label htmlFor="login-email">Email</label>
          <div className="input-wrap">
            <Mail size={19} aria-hidden="true" />
            <Input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="nama@email.com"
              value={values.email}
              onChange={(event) => change("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              required
              disabled={isPending}
            />
          </div>
          {errors.email && (
            <p className="field-error" id="login-email-error">
              {errors.email}
            </p>
          )}
        </div>
        <AuthPasswordField
          id="login-password"
          label="Kata sandi"
          value={values.password}
          onChange={(value) => change("password", value)}
          error={errors.password}
          disabled={isPending}
          labelAction={
            <Link className="text-button" href="/forgot-password">
              Lupa kata sandi?
            </Link>
          }
        />
        {errors.form && (
          <p role="alert" className="form-error">
            {errors.form}
          </p>
        )}
        <Button type="submit" className="login-submit" disabled={isPending}>
          {isPending ? "Membuka Beranda…" : "Masuk ke demo"}
          <ArrowRight size={19} />
        </Button>
        <Button
          variant="secondary"
          className="fill-demo"
          disabled={isPending}
          onClick={() => {
            setValues(demoCredentials);
            setErrors({});
          }}
        >
          <WandSparkles size={18} />
          Isi data contoh
        </Button>
      </form>
      <p className="login-register">
        Baru kenal Cashly?{" "}
        <Link className="text-button" href="/register">
          Buat akun
        </Link>
      </p>
    </>
  );
}
