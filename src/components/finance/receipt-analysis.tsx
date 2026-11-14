"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { AssetLoader } from "@/components/shared/asset-loader";
import {
  Camera,
  MessageCircle,
  Check,
  ClipboardCheck,
  ReceiptText,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";

export const RECEIPT_ANALYSIS_DURATION_MS = 2400;
const stages = [
  {
    title: "Foto struk siap",
    detail: "Disiapkan di perangkatmu",
    Icon: Camera,
    progress: 16,
  },
  {
    title: "Menyiapkan toko & tanggal",
    detail: "Periksa kembali nama toko dan tanggalnya",
    Icon: Store,
    progress: 44,
  },
  {
    title: "Merangkai nominal & rincian",
    detail: "Pastikan nominalnya sesuai strukmu",
    Icon: ReceiptText,
    progress: 76,
  },
  {
    title: "Menyiapkan halaman review",
    detail: "Sebentar lagi, cek rinciannya ya",
    Icon: ClipboardCheck,
    progress: 96,
  },
];

export function ReceiptAnalysis({
  example,
  source = "photo",
}: {
  example: boolean;
  source?: "photo" | "chat" | "voice";
}) {
  const fromChat = source !== "photo";
  const activeStages = fromChat
    ? [
        {
          title: "Catatan diterima",
          detail: "Pesanmu siap dirapikan",
          Icon: MessageCircle,
          progress: 16,
        },
        {
          ...stages[1],
          title: "Menyiapkan tanggal & kategori",
          detail: "Periksa kembali di rincian nanti",
        },
        { ...stages[2], detail: "Pastikan nominalnya sesuai catatanmu" },
        stages[3],
      ]
    : stages;
  const [stage, setStage] = useState(0);
  const gradientId = useId();
  useEffect(() => {
    const timers = stages
      .slice(1)
      .map((_, index) =>
        window.setTimeout(() => setStage(index + 1), (index + 1) * 600),
      );
    return () => timers.forEach(window.clearTimeout);
  }, []);
  const progress = stages[stage].progress;
  return (
    <div className="receipt-analysis">
      <div className="analysis-toast">
        <span />
        <Zap size={16} />
        {fromChat
          ? "Catatan diterima!"
          : example
            ? "Struk contoh siap!"
            : "Foto dijepret!"}{" "}
        Yuk, tinjau bersama Mochi
      </div>
      <section
        className="analysis-panel"
        aria-labelledby="receipt-analysis-title"
      >
        <div className="analysis-mochi" aria-hidden="true">
          <Image
            src="/mascot/mochi-crown-transparent.webp"
            alt=""
            width={112}
            height={112}
          />
          <span>
            <Sparkles size={20} />
          </span>
        </div>
        <span className="pill analysis-demo-badge">
          <span />
          {fromChat ? "Analisis catatan" : "Analisis struk"}
        </span>
        <h3 id="receipt-analysis-title">
          {fromChat
            ? "Mochi sedang merapikan catatanmu, tunggu ya!"
            : "Sedang menganalisis struk kamu, tunggu ya!"}
        </h3>
        <p className="analysis-description">
          {fromChat
            ? "Menyiapkan nama pembelian, nominal, dan rincian item untuk kamu tinjau."
            : "Menyiapkan nominal, merchant, dan rincian item untuk kamu tinjau."}
        </p>
        <div
          className="analysis-ring"
          role="progressbar"
          aria-label={
            fromChat ? "Progres analisis catatan" : "Progres analisis struk"
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`${progress}%, tahap ${stage + 1} dari 4`}
        >
          <svg
            width={112}
            height={112}
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradientId}>
                <stop stopColor="var(--primary, #7357e8)" />
                <stop offset="1" stopColor="var(--success, #237a56)" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--primary-soft, #ede7ff)"
              strokeWidth={6}
            />
            <circle
              className="analysis-ring-fill"
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={264}
              strokeDashoffset={264 * (1 - progress / 100)}
            />
          </svg>
          <div className="analysis-ring-label" aria-hidden="true">
            <strong>{progress}%</strong>
          </div>
        </div>
        <p className="analysis-live" role="status" aria-live="polite">
          {activeStages[stage].title}…
        </p>
        <ol
          className="analysis-stages"
          aria-label={
            fromChat ? "Tahap analisis catatan" : "Tahap analisis struk"
          }
        >
          {activeStages.map(({ title, detail, Icon }, index) => (
            <li
              key={title}
              className={
                index < stage
                  ? "is-done"
                  : index === stage
                    ? "is-active"
                    : "is-waiting"
              }
              aria-current={index === stage ? "step" : undefined}
            >
              <span className="analysis-step-icon" aria-hidden="true">
                {index < stage ? (
                  <Check size={18} />
                ) : index === stage ? (
                  <AssetLoader size={18} />
                ) : (
                  <Icon size={18} />
                )}
              </span>
              <div>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
              <span className="analysis-step-status">
                {index < stage
                  ? "Selesai"
                  : index === stage
                    ? "Aktif"
                    : "Antre"}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
