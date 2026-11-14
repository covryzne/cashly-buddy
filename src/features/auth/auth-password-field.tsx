"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { autofillHydrationProps } from "./browser-autofill";

export function AuthPasswordField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  labelAction,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  labelAction?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const isConfirmation = id.endsWith("confirm-password");
  return (
    <div className="form-field">
      <div className="password-label-row">
        <label htmlFor={id}>{label}</label>
        {labelAction}
      </div>
      <div className="input-wrap">
        <LockKeyhole size={19} aria-hidden="true" />
        <Input
          {...autofillHydrationProps}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="off"
          placeholder={
            isConfirmation ? "Ulangi kata sandi" : "Minimal 8 karakter"
          }
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          required
          disabled={disabled}
        />
        <button
          type="button"
          className="icon-button password-toggle"
          disabled={disabled}
          aria-label={`${visible ? "Sembunyikan" : "Tampilkan"} ${isConfirmation ? "konfirmasi kata sandi" : "kata sandi"}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
