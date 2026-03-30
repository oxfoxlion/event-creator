"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, LoaderCircle, QrCode, ScanLine, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  previewParticipantCardTransfer,
  transferParticipantCard,
  type EventCard,
  type ParticipantTransferPreview,
} from "@/lib/eventCreatorApi";

type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorResult[]>;
};

type WindowWithBarcodeDetector = typeof window & {
  BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
};

type ParticipantTransferModalProps = {
  eventSlug: string;
  claimId: string;
  card: EventCard;
  onClose: () => void;
  onTransferred: (message: string) => void;
};

export function ParticipantTransferModal({
  eventSlug,
  claimId,
  card,
  onClose,
  onTransferred,
}: ParticipantTransferModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const [token, setToken] = useState("");
  const [preview, setPreview] = useState<ParticipantTransferPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedCardTitle = useMemo(
    () => card.assigned_card?.title || card.title,
    [card.assigned_card?.title, card.title],
  );

  const handlePreview = useCallback(async (providedToken?: string) => {
    const nextToken = String(providedToken ?? token).trim();
    if (!nextToken) {
      setError("請先掃描 QR code 或貼上 transfer token。");
      return;
    }

    setLoadingPreview(true);
    setError(null);
    const result = await previewParticipantCardTransfer(claimId, nextToken);
    setLoadingPreview(false);

    if (!result.data) {
      setPreview(null);
      setError(result.error || "解析受讓者失敗");
      return;
    }

    setToken(nextToken);
    setPreview(result.data);
  }, [claimId, token]);

  const stopScanner = useCallback(() => {
    if (scanTimerRef.current) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    detectorRef.current = null;
    setScannerReady(false);
  }, []);

  useEffect(() => {
    const detectorCtor =
      typeof window !== "undefined" ? (window as WindowWithBarcodeDetector).BarcodeDetector : null;
    setScannerSupported(Boolean(detectorCtor && navigator.mediaDevices?.getUserMedia));

    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (!scannerOpen || !scannerSupported) {
      return;
    }

    let cancelled = false;

    async function startScanner() {
      try {
        const detectorCtor = (window as WindowWithBarcodeDetector).BarcodeDetector;
        if (!detectorCtor) {
          throw new Error("此裝置不支援相機掃描");
        }

        detectorRef.current = new detectorCtor({ formats: ["qr_code"] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setScannerReady(true);
        function queueNext() {
          scanTimerRef.current = window.setTimeout(() => {
            void scanOnce();
          }, 350);
        }

        async function scanOnce() {
          const detector = detectorRef.current;
          const video = videoRef.current;
          if (!detector || !video || video.readyState < 2) {
            if (!cancelled && scannerOpen) {
              queueNext();
            }
            return;
          }

          try {
            const codes = await detector.detect(video);
            const rawValue = codes?.[0]?.rawValue;
            if (rawValue) {
              const trimmed = String(rawValue).trim();
              setToken(trimmed);
              stopScanner();
              setScannerOpen(false);
              await handlePreview(trimmed);
              return;
            }
          } catch {}

          if (!cancelled && scannerOpen) {
            queueNext();
          }
        }

        queueNext();
      } catch (scanError) {
        setError(scanError instanceof Error ? scanError.message : "無法啟用相機掃描");
        setScannerOpen(false);
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [handlePreview, scannerOpen, scannerSupported, stopScanner]);

  async function handleTransfer() {
    if (!token) {
      setError("缺少 transfer token。");
      return;
    }

    setTransferring(true);
    setError(null);
    const result = await transferParticipantCard(claimId, token);
    setTransferring(false);

    if (!result.data) {
      setError(result.error || "卡片轉讓失敗");
      return;
    }

    onTransferred(`卡片已轉讓給 ${result.data.target.display_name || result.data.target.discord_username || "對方"}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 py-4 md:items-center md:px-6">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
        aria-label="關閉轉讓 modal"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-border/80 bg-card/96 shadow-[0_40px_140px_-60px_rgba(20,20,20,0.55)]">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-4 md:px-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">卡片交換</p>
            <h2 className="mt-2 text-xl font-semibold text-foreground md:text-2xl">{resolvedCardTitle}</h2>
          </div>
          <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          <div className="rounded-3xl border border-border/70 bg-background/65 px-4 py-4 text-sm leading-7 text-muted-foreground">
            請對方在自己的裝置開啟「我的交換 QR」，你掃描對方的 QR code 後，再確認是否把這張卡片轉給他。
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/me/transfer?eventSlug=${eventSlug}`}>我的交換 QR</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setError(null);
                setPreview(null);
                setScannerOpen(true);
              }}
              disabled={!scannerSupported}
            >
              <Camera className="size-4" />
              <span>{scannerSupported ? "啟用相機掃描" : "此裝置不支援相機掃描"}</span>
            </Button>
          </div>

          {scannerOpen ? (
            <div className="mt-5 overflow-hidden rounded-3xl border border-border/70 bg-foreground text-background">
              <div className="flex items-center justify-between border-b border-background/10 px-4 py-3">
                <p className="text-sm font-medium">掃描對方的交換 QR code</p>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full text-background hover:bg-background/10 hover:text-background"
                  onClick={() => {
                    stopScanner();
                    setScannerOpen(false);
                  }}
                >
                  關閉掃描
                </Button>
              </div>
              <div className="relative aspect-square w-full bg-black">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-[2rem] border border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.16)]" />
                </div>
                {!scannerReady ? (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 text-sm text-white">
                    <LoaderCircle className="size-4 animate-spin" />
                    正在啟動相機...
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-3xl border border-border/70 bg-background/65 p-4">
            <label className="text-sm font-medium text-foreground">手動貼上 transfer token</label>
            <textarea
              className="mt-3 min-h-28 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm"
              placeholder="若裝置無法直接掃描，可將 QR code 內容貼到這裡。"
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setPreview(null);
              }}
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <Button type="button" className="rounded-full" onClick={() => void handlePreview()} disabled={loadingPreview}>
                {loadingPreview ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <ScanLine className="size-4" />
                    解析受讓者
                  </>
                )}
              </Button>
            </div>
          </div>

          {preview ? (
            <div className="mt-5 rounded-3xl border border-primary/25 bg-primary/5 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">受讓者確認</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-secondary text-secondary-foreground">
                  {preview.target.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.target.avatar_url}
                      alt={preview.target.display_name || preview.target.discord_username || "participant 頭像"}
                      className="size-full object-cover"
                    />
                  ) : (
                    <QrCode className="size-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {preview.target.display_name || preview.target.discord_username || "未命名 participant"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    @{preview.target.discord_username || "unknown"} ・ {preview.target.event_title}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" className="rounded-full" onClick={() => void handleTransfer()} disabled={transferring}>
                  {transferring ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      轉讓中...
                    </>
                  ) : (
                    "確認轉讓"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setPreview(null);
                    setToken("");
                  }}
                  disabled={transferring}
                >
                  重新掃描
                </Button>
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
