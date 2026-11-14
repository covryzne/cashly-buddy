"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function GoogleSignInButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        className="google-sign-in"
        onClick={() => setOpen(true)}
      >
        <Image src="/branding/google-g.png" width={20} height={20} alt="" />
        Lanjutkan dengan Google
      </Button>
      {open && (
        <Dialog title="Lanjutkan dengan Google" onClose={() => setOpen(false)}>
          <div className="auth-provider-preview">
            <span className="auth-preview-icon">
              <ShieldCheck size={28} />
            </span>
            <h3>Kenalan dulu lewat demo, yuk.</h3>
            <p>
              Google belum terhubung pada prototipe ini. Tidak ada akun Google
              yang dibuka atau data yang dikirim.
            </p>
            <p className="muted">
              Tutup jendela ini dan pilih Isi data contoh untuk mencoba Cashly.
            </p>
            <Button className="auth-full-button" onClick={() => setOpen(false)}>
              Kembali ke form
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
