'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  AudioLines,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FluidOrb from '@/components/ui/fluid-orb';
import {
  VoiceNote,
  type VoiceNoteHandle,
} from '@/components/detent/components/voicenote/VoiceNote';
import { useVoiceRecorder } from './use-voice-recorder';
import { ChatReceiptFlow } from './chat-receipt-flow';
import { PROTOTYPE_VOICE_TRANSCRIPT } from './voice-transcript';

export function VoiceReceiptFlow({
  onBack,
  onClose,
  onChat,
}: {
  onBack: () => void;
  onClose: () => void;
  onChat: () => void;
}) {
  const voice = useVoiceRecorder();
  const [text, setText] = useState('');
  const [example, setExample] = useState(false);
  const [approved, setApproved] = useState<string | null>(null);
  const player = useRef<VoiceNoteHandle>(null);
  const content = useRef<HTMLDivElement>(null);
  const busy = ['recording', 'requesting', 'stopping'].includes(voice.status);
  const ready = voice.status === 'ready' || example;
  useEffect(() => {
    const viewport = window.visualViewport;
    const dialog = content.current?.closest<HTMLElement>('dialog');
    if (!viewport || !dialog || approved !== null) return;
    const resize = () =>
      dialog.style.setProperty('--voice-height', `${viewport.height}px`);
    resize();
    viewport.addEventListener('resize', resize);
    return () => {
      viewport.removeEventListener('resize', resize);
      dialog.style.removeProperty('--voice-height');
    };
  }, [approved]);
  const timer = `${Math.floor(voice.seconds / 60)
    .toString()
    .padStart(2, '0')}:${(voice.seconds % 60).toString().padStart(2, '0')}`;
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) player.current?.pause();
    };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, []);
  function reset() {
    player.current?.pause();
    voice.reset();
    setText('');
    setExample(false);
  }
  function review() {
    if (!ready) return;
    player.current?.pause();
    const transcript = text.trim() || PROTOTYPE_VOICE_TRANSCRIPT;
    setText(transcript);
    setApproved(transcript);
  }
  if (approved !== null)
    return (
      <ChatReceiptFlow
        initialText={approved}
        onSourceChange={setText}
        source="voice"
        onEditSource={() => setApproved(null)}
        onStartOver={() => {
          reset();
          setApproved(null);
        }}
        onBack={() => setApproved(null)}
        onClose={onClose}
      />
    );
  return (
    <Dialog
      title="Voice note kilat"
      variant="screen"
      className="scan-flow voice-flow"
      onBack={onBack}
      onClose={onClose}
      footer={
        <div className="voice-footer">
          {ready ? (
            <Button onClick={review} disabled={!ready}>
              <Sparkles size={18} /> Tinjau pengeluaran <ArrowRight size={17} />
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                voice.reset();
                onChat();
              }}
            >
              <MessageCircle size={18} /> Catat lewat chat
            </Button>
          )}
          <p>
            <ShieldCheck size={13} /> Rekaman tetap di perangkatmu.
          </p>
        </div>
      }
    >
      <div ref={content} className="voice-content">
        <div className="voice-intro">
          <div className="voice-mochi">
            <Image
              src="/mascot/mochi-crown-transparent.webp"
              alt="Mochi siap mendengarkan"
              width={76}
              height={76}
            />
            <span>
              <AudioLines size={17} />
            </span>
          </div>
          <span className="pill">Cerita lewat suara</span>
          <h3>
            {ready
              ? 'Dengarkan, lalu rapikan.'
              : voice.status === 'recording'
                ? 'Mochi mendengarkan…'
                : 'Belanja apa hari ini?'}
          </h3>
          <p>
            {ready
              ? 'Putar kembali rekamanmu, lalu tinjau rincian pengeluaran.'
              : 'Sebutkan pembelian dan nominalnya. Santai saja, satu per satu.'}
          </p>
        </div>
        <section className="voice-recorder" aria-label="Perekam pengeluaran">
          <div className="voice-status" role="status">
            {voice.status === 'recording' ? (
              <>
                <i /> Sedang merekam
              </>
            ) : voice.status === 'requesting' ? (
              'Menunggu izin mikrofon'
            ) : voice.status === 'stopping' ? (
              'Menyiapkan rekaman'
            ) : voice.status === 'ready' ? (
              'Rekaman siap diputar'
            ) : example ? (
              'Contoh catatan dipilih'
            ) : (
              'Siap saat kamu siap'
            )}
          </div>
          <div className="voice-timer" aria-label={`${voice.seconds} detik`}>
            {timer}
            <span> / 01:00</span>
          </div>
          {!ready && (
            <button
              className={`voice-record-button ${voice.status === 'recording' ? 'is-recording' : ''}`}
              style={{ '--voice-level': voice.level } as CSSProperties}
              disabled={
                voice.status === 'requesting' || voice.status === 'stopping'
              }
              aria-label={
                voice.status === 'recording'
                  ? 'Hentikan rekaman'
                  : 'Mulai rekam'
              }
              aria-pressed={voice.status === 'recording'}
              aria-busy={
                voice.status === 'requesting' || voice.status === 'stopping'
              }
              onClick={() =>
                voice.status === 'recording' ? voice.stop() : void voice.start()
              }
            >
              <FluidOrb
                size={160}
                color="var(--primary)"
                className="voice-orb"
                aria-hidden="true"
              />
            </button>
          )}
          {voice.audioUrl && (
            <VoiceNote
              ref={player}
              src={voice.audioUrl}
              duration={voice.duration}
              peaks={voice.peaks}
              words={[]}
              defaultTranscript={false}
            />
          )}
          <p className="voice-record-hint">
            {voice.status === 'recording'
              ? 'Ketuk orb untuk selesai. Maksimal 60 detik.'
              : busy
                ? 'Izinkan mikrofon melalui browsermu.'
                : ready
                  ? 'Belum pas? Kamu bisa mulai lagi.'
                  : 'Ketuk untuk mulai merekam.'}
          </p>
          {ready && (
            <Button variant="ghost" onClick={reset}>
              <RotateCcw size={16} /> Rekam ulang
            </Button>
          )}
        </section>
        {voice.error && (
          <div className="voice-error" role="alert">
            {voice.error}
          </div>
        )}
        {/* {!ready && !busy && (
          <div className="voice-example">
            <p>“Habis beli Nescafe coffee dua belas ribu.”</p>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                voice.reset();
                setExample(true);
                setText("Habis beli Nescafe coffee 12k");
              }}
            >
              Coba contoh catatan <ArrowRight size={14} />
            </button>
          </div>
        )} */}
      </div>
    </Dialog>
  );
}
