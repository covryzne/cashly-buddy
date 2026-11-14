"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  CircleHelp,
  CheckCircle2,
  ImagePlus,
  Lightbulb,
  LoaderCircle,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Store,
  Zap,
  ZapOff,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/finance/money-display";
import { ReceiptReview } from "@/components/finance/receipt-review";
import { ReceiptScanSuccess } from "@/components/finance/receipt-scan-success";
import { exampleReceipt } from "@/mocks/fixtures/receipt";
import {
  blankReceipt,
  receiptAmounts,
  receiptSchema,
  type ReceiptDraft,
  type ReceiptPhoto,
} from "./receipt-schema";
import { captureReceipt, useReceiptCamera } from "./use-receipt-camera";

type Step = "permission" | "camera" | "review" | "success" | "help";

export function ScanReceiptFlow({
  onBack,
  onClose,
}: {
  onBack: () => void;
  onClose: () => void;
}) {
  const camera = useReceiptCamera();
  const [step, setStep] = useState<Step>("permission");
  const [photo, setPhoto] = useState<ReceiptPhoto | null>(null);
  const photoRef = useRef<ReceiptPhoto | null>(null);
  const objectUrls = useRef(new Set<string>());
  const [draft, setDraft] = useState<ReceiptDraft>(blankReceipt);
  const [confirmed, setConfirmed] = useState<ReceiptDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraParent = useRef<"permission" | "review" | "success">(
    "permission",
  );
  const job = useRef({ version: 0 });
  const alive = useRef(true);
  const formId = useId();
  useEffect(() => {
    alive.current = true;
    const pendingJob = job.current;
    const ownedUrls = objectUrls.current;
    return () => {
      alive.current = false;
      pendingJob.version++;
      ownedUrls.forEach((url) => URL.revokeObjectURL(url));
      ownedUrls.clear();
    };
  }, []);
  useEffect(() => {
    const video = videoRef.current;
    if (step !== "camera" || !video || !camera.stream) return;
    video.srcObject = camera.stream;
    return () => {
      video.pause();
      video.srcObject = null;
    };
  }, [step, camera.stream]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const dialog = document.querySelector<HTMLDialogElement>(".scan-flow");
      if (dialog) dialog.scrollTop = 0;
      dialog
        ?.querySelector<HTMLElement>('[aria-label="Kembali"]')
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [step]);
  const createUrl = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    objectUrls.current.add(url);
    return url;
  };
  const revokeUrl = (url: string) => {
    if (objectUrls.current.delete(url)) URL.revokeObjectURL(url);
  };
  const releasePendingPhotos = () => {
    objectUrls.current.forEach((url) => {
      if (url !== photoRef.current?.url) revokeUrl(url);
    });
  };
  const replacePhoto = (next: ReceiptPhoto) => {
    if (photoRef.current?.url) revokeUrl(photoRef.current.url);
    photoRef.current = next;
    setPhoto(next);
  };
  const go = (next: Step) => {
    job.current.version++;
    setBusy(false);
    setMessage("");
    if (next !== "camera") camera.stop();
    setStep(next);
  };
  const openCamera = (parent: "permission" | "review" | "success") => {
    cameraParent.current = parent;
    setVideoReady(false);
    go("camera");
    void camera.request();
  };
  const goBack = () => {
    if (step === "permission") {
      camera.stop();
      onBack();
    } else if (step === "camera") go(cameraParent.current);
    else if (step === "help") openCamera(cameraParent.current);
    else if (step === "success") go("review");
    else openCamera("review");
  };
  const chooseExample = () => {
    camera.stop();
    replacePhoto({ source: "example", url: null });
    setDraft(exampleReceipt());
    setErrors({});
    go("review");
  };
  const openGallery = () => {
    job.current.version++;
    setBusy(false);
    setMessage("");
    releasePendingPhotos();
    camera.stop();
    fileRef.current?.click();
  };
  const takePhoto = async () => {
    if (!videoRef.current || busy || !videoReady) return;
    const requestId = ++job.current.version;
    setBusy(true);
    setMessage("");
    try {
      const blob = await captureReceipt(videoRef.current, frameRef.current);
      if (!alive.current || requestId !== job.current.version) return;
      replacePhoto({ source: "camera", url: createUrl(blob) });
      setDraft(exampleReceipt());
      setErrors({});
      go("review");
    } catch (error) {
      if (alive.current && requestId === job.current.version)
        setMessage(
          error instanceof Error ? error.message : "Foto belum dapat diambil.",
        );
    } finally {
      if (alive.current && requestId === job.current.version) setBusy(false);
    }
  };
  const chooseFile = async (file: File) => {
    const requestId = ++job.current.version;
    setBusy(false);
    setMessage("");
    releasePendingPhotos();
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Pilih foto JPEG, PNG, atau WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Ukuran foto maksimal 10 MB. Pilih foto yang lebih kecil.");
      return;
    }
    setBusy(true);
    const url = createUrl(file);
    try {
      const image = new window.Image();
      image.src = url;
      await image.decode();
      if (
        !image.naturalWidth ||
        image.naturalWidth * image.naturalHeight > 32000000
      )
        throw new Error(
          "Foto terlalu besar. Gunakan gambar maksimal 32 megapiksel.",
        );
      if (!alive.current || requestId !== job.current.version) {
        revokeUrl(url);
        return;
      }
      replacePhoto({ source: "gallery", url });
      setDraft(blankReceipt());
      setErrors({});
      go("review");
    } catch (error) {
      revokeUrl(url);
      if (alive.current && requestId === job.current.version)
        setMessage(
          error instanceof Error && error.message.includes("megapiksel")
            ? error.message
            : "Foto tidak bisa dibaca. Pilih gambar lain yang tidak rusak.",
        );
    } finally {
      if (alive.current && requestId === job.current.version) setBusy(false);
    }
  };
  const submit = () => {
    const result = receiptSchema.safeParse(draft);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues)
        next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
      requestAnimationFrame(() =>
        document.getElementById(`scan-${Object.keys(next)[0]}`)?.focus(),
      );
      return;
    }
    setConfirmed(result.data);
    setErrors({});
    go("success");
  };
  const total = receiptAmounts(draft).total;
  const title = {
    permission: "Scan struk",
    camera: "AI OCR Scanner",
    review: "Review struk",
    success: "Konfirmasi demo",
    help: "Panduan scan",
  }[step];
  return (
    <Dialog
      title={title}
      variant={step === "permission" ? "sheet" : "screen"}
      className={`scan-flow scan-flow-${step} ${camera.status === "ready" ? "scan-camera-running" : ""}`}
      onBack={goBack}
      onClose={onClose}
      showCloseButton={step !== "camera"}
      description={
        step === "camera" ? (
          <span className="scan-camera-status">
            {camera.status === "ready"
              ? "Kamera aktif · Demo"
              : camera.status === "requesting"
                ? "Menunggu izin browser"
                : "Kamera belum aktif"}
          </span>
        ) : undefined
      }
      background={
        step === "camera" ? (
          <div className="scan-camera-feed">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Pratinjau kamera struk"
              onCanPlay={() => setVideoReady(true)}
              onError={() =>
                setMessage(
                  "Tampilan kamera belum siap. Coba aktifkan lagi atau pilih galeri.",
                )
              }
            />
          </div>
        ) : undefined
      }
      headerActions={
        step === "camera" ? (
          <>
            <button
              className="icon-button"
              aria-label="Lampu kamera"
              aria-pressed={camera.torch}
              disabled={!camera.supportsTorch || camera.status !== "ready"}
              title={
                camera.supportsTorch
                  ? "Nyalakan atau matikan lampu"
                  : "Lampu tidak didukung kamera ini"
              }
              onClick={() => void camera.toggleTorch()}
            >
              {camera.torch ? <Zap size={20} /> : <ZapOff size={20} />}
            </button>
            <button
              className="icon-button"
              aria-label="Panduan scan"
              onClick={() => go("help")}
            >
              <CircleHelp size={19} />
            </button>
          </>
        ) : undefined
      }
      footer={
        step === "review" ? (
          <div className="scan-review-actions">
            <Button type="submit" form={formId}>
              <ShieldCheck size={18} />
              Simulasikan simpan{" "}
              <MoneyDisplay
                amountIdr={(total > BigInt(0) ? total : BigInt(0)).toString()}
              />
            </Button>
            <small>Belum disimpan ke buku kas.</small>
          </div>
        ) : step === "success" ? (
          <div className="scan-success-actions">
            <Button onClick={onClose}>Kembali ke Beranda</Button>
            <Button variant="secondary" onClick={() => openCamera("success")}>
              <ScanLine size={17} />
              Scan lagi
            </Button>
          </div>
        ) : step === "camera" ? (
          <div className="scan-camera-controls">
            <div>
              <button
                className="scan-gallery-button"
                aria-label="Buka galeri"
                onClick={openGallery}
              >
                <ImagePlus size={24} />
              </button>
              <small>Buka galeri</small>
            </div>
            <button
              className="scan-shutter"
              aria-label="Ambil foto struk"
              disabled={camera.status !== "ready" || !videoReady || busy}
              onClick={() => void takePhoto()}
            >
              <span className="scan-shutter-inner">
                {busy ? (
                  <LoaderCircle className="scan-spin" size={28} />
                ) : (
                  <span className="scan-capture-glyph">
                    <ScanLine size={30} />
                    <ReceiptText size={16} />
                  </span>
                )}
              </span>
            </button>
            <div aria-hidden="true" />
          </div>
        ) : undefined
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label="Pilih foto struk"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void chooseFile(file);
        }}
      />
      {message && (
        <p className="scan-form-alert" role="alert">
          {message}
        </p>
      )}
      {busy && step !== "camera" && (
        <p className="scan-loading" role="status">
          <LoaderCircle size={18} className="scan-spin" />
          Menyiapkan foto…
        </p>
      )}
      {step === "permission" && (
        <div className="scan-permission">
          <div className="scan-permission-mochi">
            <Image
              src="/mascot/mochi-crown-transparent.webp"
              alt="Mochi menemani scan struk"
              width={100}
              height={100}
            />
            <span>
              <Camera size={17} />
            </span>
            <Sparkles className="scan-mochi-sparkle" size={22} />
          </div>
          <span className="pill">
            <ShieldCheck size={13} />
            Izin perangkat
          </span>
          <h3>Izinkan Akses Kamera</h3>
          <p>Foto struk belanja, lalu tinjau rinciannya bersama Mochi.</p>
          <Button onClick={() => openCamera("permission")}>
            <Camera size={18} />
            Izinkan kamera
          </Button>
          <Button variant="secondary" onClick={openGallery}>
            <ImagePlus size={18} />
            Pilih dari galeri
          </Button>
          <button className="text-button" onClick={chooseExample}>
            <ReceiptText size={15} />
            Coba struk contoh
          </button>
          <Button variant="ghost" onClick={onBack}>
            Nanti saja
          </Button>
          <small>
            Durasi izin diatur oleh browser. Foto tetap di perangkat pada
            prototipe ini.
          </small>
        </div>
      )}
      {step === "camera" && (
        <div className="scan-camera-view">
          <p className="scan-camera-hint">
            <span className="scan-hint-mochi">
              <Image
                src="/mascot/mochi-crown-transparent.webp"
                alt=""
                width={28}
                height={28}
              />
            </span>
            Arahkan kamera pas ke strukmu ya! <Sparkles size={15} />
          </p>
          <div ref={frameRef} className="scan-viewfinder">
            <div className="scan-frame" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            {camera.status === "ready" && (
              <>
                <span className="scan-laser-window" aria-hidden="true">
                  <span className="scan-guide-line" />
                </span>
                <span className="scan-crosshair" aria-hidden="true" />
                <div className="scan-merchant-tag">
                  <Store size={14} />
                  <strong>Indomaret Point</strong>
                  <small>Demo</small>
                </div>
                <div className="scan-total-tag">
                  <CheckCircle2 size={15} />
                  <strong>Total: Rp47.500</strong>
                </div>
              </>
            )}
            {camera.status !== "ready" && (
              <div className="scan-camera-placeholder">
                {camera.status === "requesting" ? (
                  <>
                    <LoaderCircle size={30} className="scan-spin" />
                    <p role="status">
                      Pilih Izinkan pada permintaan kamera browser.
                    </p>
                    <Button variant="secondary" onClick={camera.stop}>
                      Batalkan permintaan
                    </Button>
                  </>
                ) : (
                  <>
                    <Camera size={34} />
                    <p role={camera.error ? "alert" : undefined}>
                      {camera.error ||
                        "Kamera dijeda. Aktifkan saat kamu siap mengambil foto."}
                    </p>
                    <Button
                      onClick={() => {
                        setVideoReady(false);
                        void camera.request();
                      }}
                    >
                      Aktifkan kamera
                    </Button>
                    <button
                      className="scan-example-button"
                      onClick={chooseExample}
                    >
                      Coba struk contoh
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {camera.error && camera.status === "ready" && (
            <p role="alert" className="scan-camera-warning">
              {camera.error}
            </p>
          )}
          <p className="scan-light-tip">
            <Lightbulb size={17} />
            Pastikan struk cukup terang & tidak terlipat
          </p>
        </div>
      )}
      {step === "review" && photo && (
        <ReceiptReview
          draft={draft}
          photo={photo}
          errors={errors}
          formId={formId}
          onChange={(next) => {
            setDraft(next);
            setErrors({});
          }}
          onSubmit={submit}
          onRetake={() => openCamera("review")}
        />
      )}
      {step === "success" && confirmed && (
        <ReceiptScanSuccess draft={confirmed} />
      )}
      {step === "help" && (
        <div className="scan-help">
          <span className="story-icon">
            <Lightbulb size={28} />
          </span>
          <h3>Struk jelas, review lebih mudah.</h3>
          <ol>
            <li>Letakkan struk di permukaan rata dan cukup terang.</li>
            <li>Pastikan nama toko, tanggal, item, dan total masuk bingkai.</li>
            <li>
              Ambil foto, lalu periksa nominal dan kategori sebelum melanjutkan.
            </li>
          </ol>
          <p className="scan-demo-notice">
            Kamera berhenti saat panduan dibuka. Tekan Kembali untuk
            mengaktifkannya lagi.
          </p>
          <Button variant="secondary" onClick={openGallery}>
            <ImagePlus size={18} />
            Pilih dari galeri
          </Button>
        </div>
      )}
    </Dialog>
  );
}
