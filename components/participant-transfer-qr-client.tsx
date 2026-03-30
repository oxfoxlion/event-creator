"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";

import { ParticipantShell } from "@/components/participant-shell";
import { Button } from "@/components/ui/button";
import { getParticipantTransferToken } from "@/lib/eventCreatorApi";

type ParticipantTransferQrClientProps = {
  eventSlug?: string;
};

export function ParticipantTransferQrClient({ eventSlug }: ParticipantTransferQrClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(Boolean(eventSlug));
  const [token, setToken] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventSlug) {
      return;
    }

    const targetEventSlug = eventSlug;
    let cancelled = false;

    async function loadTransferToken() {
      setLoading(true);
      const result = await getParticipantTransferToken(targetEventSlug);

      if (cancelled) {
        return;
      }

      if (result.status === 401) {
        router.replace(`/login?redirect_to=${encodeURIComponent(`/me/transfer?eventSlug=${targetEventSlug}`)}`);
        return;
      }

      if (!result.data) {
        setError(result.error || "讀取交換 QR code 失敗");
        setLoading(false);
        return;
      }

      setToken(result.data.token);
      setEventTitle(result.data.event.title);
      setError(null);
      setLoading(false);
    }

    void loadTransferToken();

    return () => {
      cancelled = true;
    };
  }, [eventSlug, router]);

  async function handleCopy() {
    if (!token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(token);
      setMessage("transfer token 已複製");
      setError(null);
    } catch {
      setError("無法複製 transfer token");
    }
  }

  return (
    <ParticipantShell
      title="我的交換 QR"
      description="請將這個 QR code 給對方掃描，對方確認後就能把可轉讓的卡片轉給你。"
    >
      {!eventSlug ? (
        <section className="rounded-4xl border border-border/80 bg-card/85 p-8">
          <h2 className="text-2xl font-semibold text-foreground">尚未指定活動</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            交換 QR code 需要綁定單一活動。請從活動頁的卡片列表開啟，才能顯示正確的 participant QR code。
          </p>
          <div className="mt-5">
            <Button asChild className="rounded-full px-6">
              <Link href="/me/events">回到參與過的活動</Link>
            </Button>
          </div>
        </section>
      ) : loading ? (
        <section className="rounded-4xl border border-border/80 bg-card/85 p-8 text-sm text-muted-foreground">
          正在產生這場活動的交換 QR code...
        </section>
      ) : token ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <div className="rounded-4xl border border-border/80 bg-card/90 p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{eventTitle}</p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">請對方掃描這個 QR code</h2>
            <div className="mt-6 flex justify-center rounded-[2rem] border border-border/70 bg-white p-6">
              <QRCode value={token} size={280} />
            </div>
          </div>

          <div className="rounded-4xl border border-border/80 bg-card/85 p-8">
            <h3 className="text-xl font-semibold text-foreground">交換說明</h3>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              <li>1. 讓要轉出卡片的人開啟卡片的 `轉讓` 功能。</li>
              <li>2. 對方掃描這個 QR code，或貼上底下的 transfer token。</li>
              <li>3. 對方確認你的身分後，卡片就會轉到你的帳號。</li>
            </ol>

            <div className="mt-6 rounded-3xl border border-border/70 bg-background/65 p-4">
              <p className="text-sm font-medium text-foreground">手動 transfer token</p>
              <textarea
                className="mt-3 min-h-28 w-full rounded-2xl border border-input bg-background px-4 py-3 text-xs leading-6"
                value={token}
                readOnly
              />
              <div className="mt-3 flex flex-wrap gap-3">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => void handleCopy()}>
                  <Copy className="size-4" />
                  <span>複製 transfer token</span>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/events/${eventSlug}?tab=cards`}>回到活動卡片列表</Link>
                </Button>
              </div>
            </div>
            {message ? <p className="mt-4 text-sm text-primary">{message}</p> : null}
            {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
          </div>
        </section>
      ) : (
        <section className="rounded-4xl border border-border/80 bg-card/85 p-8">
          <h2 className="text-2xl font-semibold text-foreground">無法產生交換 QR code</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {error || "目前沒有可顯示的 transfer token。"}
          </p>
        </section>
      )}
    </ParticipantShell>
  );
}
