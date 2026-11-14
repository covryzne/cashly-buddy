"use client";
import { autofillHydrationProps } from "./browser-autofill";

import { useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Info,
  Mail,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoCredentials } from "@/mocks/fixtures/auth";
import { AuthPasswordField } from "./auth-password-field";
import { GoogleSignInButton } from "./google-sign-in-button";
import { registerSchema, type RegisterValues } from "./register-schema";

const emptyValues: RegisterValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<RegisterValues>(emptyValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterValues, string>>
  >({});
  const [complete, setComplete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  function change(field: keyof RegisterValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === "password" ? { confirmPassword: undefined } : {}),
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof RegisterValues;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      const first = (
        ["name", "email", "password", "confirmPassword"] as const
      ).find((field) => nextErrors[field]);
      const id =
        first === "confirmPassword"
          ? "register-confirm-password"
          : `register-${first}`;
      formRef.current?.querySelector<HTMLInputElement>(`#${id}`)?.focus();
      return;
    }
    // Local validation only. Clear all input instead of storing an account/session.
    setValues(emptyValues);
    setErrors({});
    setComplete(true);
    requestAnimationFrame(() =>
      successRef.current?.focus({ preventScroll: true }),
    );
  }

  if (complete) {
    return (
      <div className="register-preview-success">
        <span className="auth-preview-icon">
          <Check size={28} />
        </span>
        <span className="pill">Pratinjau pendaftaran</span>
        <h3 ref={successRef} tabIndex={-1}>
          Formmu sudah siap!
        </h3>
        <p>
          Akun belum dibuat dan data tidak disimpan. Sekarang kamu bisa
          menjelajahi Cashly dengan data contoh.
        </p>
        <Button
          className="auth-full-button"
          disabled={isPending}
          onClick={() => startTransition(() => router.push("/beranda"))}
        >
          {isPending ? "Membuka Beranda…" : "Jelajahi demo"}
          <ArrowRight size={18} />
        </Button>
        <button className="text-button" onClick={() => setComplete(false)}>
          Coba form lagi
        </button>
        <Link className="text-button" href="/login">
          Kembali ke masuk
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="login-demo-notice" id="register-demo-notice">
        <Info size={18} />
        <p>
          Pratinjau pendaftaran. Gunakan data contoh, bukan email atau kata
          sandi asli. Belum ada akun yang dibuat.
        </p>
      </div>
      <GoogleSignInButton />
      <div className="auth-divider">
        <span>atau daftar dengan email</span>
      </div>
      <form
        {...autofillHydrationProps}
        ref={formRef}
        className="login-form register-form"
        onSubmit={submit}
        noValidate
        method="post"
        aria-describedby="register-demo-notice"
      >
        <div className="form-field">
          <label htmlFor="register-name">Nama panggilan</label>
          <div className="input-wrap">
            <UserRound size={19} aria-hidden="true" />
            <Input
              {...autofillHydrationProps}
              id="register-name"
              autoComplete="off"
              placeholder="Mochi boleh panggil kamu siapa?"
              value={values.name}
              onChange={(event) => change("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "register-name-error" : undefined}
              required
            />
          </div>
          {errors.name && (
            <p className="field-error" id="register-name-error">
              {errors.name}
            </p>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="register-email">Email</label>
          <div className="input-wrap">
            <Mail size={19} aria-hidden="true" />
            <Input
              {...autofillHydrationProps}
              id="register-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="nama@email.com"
              value={values.email}
              onChange={(event) => change("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
              required
            />
          </div>
          {errors.email && (
            <p className="field-error" id="register-email-error">
              {errors.email}
            </p>
          )}
        </div>
        <AuthPasswordField
          id="register-password"
          label="Kata sandi"
          value={values.password}
          onChange={(value) => change("password", value)}
          error={errors.password}
        />
        <AuthPasswordField
          id="register-confirm-password"
          label="Konfirmasi kata sandi"
          value={values.confirmPassword}
          onChange={(value) => change("confirmPassword", value)}
          error={errors.confirmPassword}
        />
        <Button type="submit" className="login-submit">
          Simulasikan buat akun
          <ArrowRight size={19} />
        </Button>
        <Button
          variant="secondary"
          className="fill-demo"
          onClick={() => {
            setValues({
              name: "Nara",
              ...demoCredentials,
              confirmPassword: demoCredentials.password,
            });
            setErrors({});
          }}
        >
          <WandSparkles size={18} />
          Isi data contoh
        </Button>
      </form>
      <p className="login-register">
        Sudah kenal Cashly?{" "}
        <Link className="text-button" href="/login">
          Masuk
        </Link>
      </p>
    </>
  );
}
