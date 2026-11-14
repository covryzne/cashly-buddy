"use client";
import { autofillHydrationProps } from "./browser-autofill";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Info,
  Mail,
  MailCheck,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoCredentials } from "@/mocks/fixtures/auth";
import { forgotPasswordSchema } from "./forgot-password-schema";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [complete, setComplete] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (complete) confirmationRef.current?.focus({ preventScroll: true });
  }, [complete]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      formRef.current
        ?.querySelector<HTMLInputElement>("#forgot-password-email")
        ?.focus();
      return;
    }
    // Prototype only: no request, delivery claim, account lookup or persistence.
    setEmail("");
    setError(undefined);
    setComplete(true);
  }

  return (
    <>
      <div className="login-demo-notice" id="forgot-password-notice">
        <Info size={18} />
        <p>
          Pratinjau pemulihan. Gunakan email contoh. Pengiriman tautan reset
          belum aktif.
        </p>
      </div>
      {complete ? (
        <div className="auth-provider-preview">
          <span className="auth-preview-icon">
            <MailCheck size={28} />
          </span>
          <span className="pill">Simulasi selesai</span>
          <h3 ref={confirmationRef} tabIndex={-1}>
            Form pemulihan sudah siap.
          </h3>
          <p>
            Format emailmu sudah valid. Email pemulihan belum dikirim dan kata
            sandi belum diubah.
          </p>
          <p>
            Data yang kamu isi tidak disimpan. Nanti, tautan pemulihan akan
            diproses setelah layanan akun diaktifkan.
          </p>
          <Button
            variant="secondary"
            className="auth-full-button"
            onClick={() => {
              setComplete(false);
              requestAnimationFrame(() =>
                formRef.current
                  ?.querySelector<HTMLInputElement>("#forgot-password-email")
                  ?.focus({ preventScroll: true }),
              );
            }}
          >
            Gunakan email lain
          </Button>
        </div>
      ) : (
        <form
          {...autofillHydrationProps}
          ref={formRef}
          className="login-form forgot-password-form"
          onSubmit={submit}
          noValidate
          method="post"
          aria-describedby="forgot-password-notice"
        >
          <div className="form-field">
            <label htmlFor="forgot-password-email">Email</label>
            <div className="input-wrap">
              <Mail size={19} aria-hidden="true" />
              <Input
                {...autofillHydrationProps}
                id="forgot-password-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="nama@email.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(undefined);
                }}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error ? "forgot-password-email-error" : undefined
                }
              />
            </div>
            {error && (
              <p className="field-error" id="forgot-password-email-error">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" className="login-submit">
            Simulasikan kirim tautan
            <ArrowRight size={19} />
          </Button>
          <Button
            variant="secondary"
            className="fill-demo"
            onClick={() => {
              setEmail(demoCredentials.email);
              setError(undefined);
            }}
          >
            <WandSparkles size={18} />
            Isi data contoh
          </Button>
        </form>
      )}
      <p className="login-register">
        <Link className="text-button" href="/login">
          <ArrowLeft size={15} aria-hidden="true" />
          Kembali ke masuk
        </Link>
      </p>
    </>
  );
}
