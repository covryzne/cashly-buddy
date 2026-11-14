"use client";

import { useEffect, useRef, useId, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";

export function Dialog({
  title,
  children,
  onClose,
  onBack,
  description,
  variant = "default",
  className = "",
  footer,
  headerActions,
  background,
  showCloseButton = true,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  description?: ReactNode;
  variant?: "default" | "sheet" | "screen";
  className?: string;
  footer?: ReactNode;
  headerActions?: ReactNode;
  background?: ReactNode;
  showCloseButton?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog dialog-${variant} ${className}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      {background}
      {variant === "sheet" && (
        <div className="sheet-handle" aria-hidden="true" />
      )}
      <div className="dialog-header">
        {onBack && (
          <button
            className="icon-button dialog-back"
            aria-label="Kembali"
            title="Kembali"
            onClick={onBack}
          >
            <ArrowLeft size={21} />
          </button>
        )}
        <div className="dialog-heading-copy">
          <h2 id={titleId}>{title}</h2>
          {description && (
            <p id={descriptionId} className="dialog-description">
              {description}
            </p>
          )}
        </div>
        {headerActions}
        {showCloseButton && (
          <button
            className="icon-button"
            aria-label="Tutup dialog"
            onClick={onClose}
            autoFocus
          >
            <X size={22} />
          </button>
        )}
      </div>
      <div className="dialog-content">{children}</div>
      {footer && <div className="dialog-footer">{footer}</div>}
    </dialog>
  );
}
