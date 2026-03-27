"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Pencil } from "lucide-react";
import QRCode from "react-qr-code";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import {
  AdminDeck,
  AdminEvent,
  AdminEventShare,
  createAdminEvent,
  getAdminDecks,
  getAdminEvent,
  getAdminEventShare,
  updateAdminCheckinSettings,
  updateAdminEvent,
} from "@/lib/eventCreatorApi";

type AdminEventEditorClientProps = {
  eventId?: string;
};

export function AdminEventEditorClient({ eventId }: AdminEventEditorClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = !eventId;
  const activeTab = isNew ? "info" : searchParams.get("tab") === "share" ? "share" : searchParams.get("tab") === "decks" ? "decks" : "info";
  const [infoMode, setInfoMode] = useState<"view" | "edit">(isNew ? "edit" : "view");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [shareLoading, setShareLoading] = useState(Boolean(eventId));
  const [decksLoading, setDecksLoading] = useState(Boolean(eventId));
  const [share, setShare] = useState<AdminEventShare | null>(null);
  const [decks, setDecks] = useState<AdminDeck[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decksError, setDecksError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    status: "draft",
    starts_at: "",
    ends_at: "",
    checkin_opens_at: "",
    checkin_closes_at: "",
  });
  const qrCodeWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!eventId) {
      setShare(null);
      setShareLoading(false);
      return;
    }
    const currentEventId = eventId;

    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      const result = await getAdminEvent(currentEventId);

      if (cancelled) {
        return;
      }

      if (result.status === 401) {
        router.replace(`/login?redirect_to=${encodeURIComponent(`/admin/events/${currentEventId}`)}`);
        return;
      }

      if (!result.data) {
        setError(result.error || "讀取活動失敗");
        setLoading(false);
        return;
      }

      const event = result.data.event;
      setForm({
        title: event.title,
        slug: event.slug,
        description: event.description || "",
        status: event.status,
        starts_at: toDatetimeLocal(event.starts_at),
        ends_at: toDatetimeLocal(event.ends_at),
        checkin_opens_at: toDatetimeLocal(event.checkin_opens_at),
        checkin_closes_at: toDatetimeLocal(event.checkin_closes_at),
      });
      setError(null);
      setLoading(false);
    }

    void loadEvent();
    return () => {
      cancelled = true;
    };
  }, [eventId, router]);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    const targetEventId = eventId;
    let cancelled = false;

    async function loadShare() {
      setShareLoading(true);
      const result = await getAdminEventShare(targetEventId);

      if (cancelled) {
        return;
      }

      if (result.status === 401) {
        router.replace(`/login?redirect_to=${encodeURIComponent(`/admin/events/${targetEventId}`)}`);
        return;
      }

      if (!result.data) {
        setShare(null);
        setShareLoading(false);
        return;
      }

      setShare(result.data.share);
      setShareLoading(false);
    }

    void loadShare();

    return () => {
      cancelled = true;
    };
  }, [eventId, router]);

  useEffect(() => {
    if (!eventId) {
      setDecks([]);
      setDecksLoading(false);
      return;
    }

    const targetEventId = eventId;
    let cancelled = false;

    async function loadDecks() {
      setDecksLoading(true);
      const result = await getAdminDecks(targetEventId);

      if (cancelled) {
        return;
      }

      if (result.status === 401) {
        router.replace(`/login?redirect_to=${encodeURIComponent(`/admin/events/${targetEventId}?tab=decks`)}`);
        return;
      }

      if (!result.data) {
        setDecks([]);
        setDecksError(result.error || "讀取活動牌組失敗");
        setDecksLoading(false);
        return;
      }

      setDecks(result.data.decks);
      setDecksError(null);
      setDecksLoading(false);
    }

    void loadDecks();

    return () => {
      cancelled = true;
    };
  }, [eventId, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      let currentEvent: AdminEvent | null = null;

      if (isNew) {
        const created = await createAdminEvent({
          title: form.title,
          slug: form.slug,
          description: form.description,
          status: form.status,
          starts_at: toIsoOrNull(form.starts_at),
          ends_at: toIsoOrNull(form.ends_at),
          checkin_opens_at: toIsoOrNull(form.checkin_opens_at),
          checkin_closes_at: toIsoOrNull(form.checkin_closes_at),
        });

        if (!created.data) {
          setError(created.error || "建立活動失敗");
          setSaving(false);
          return;
        }

        currentEvent = created.data.event;
        setMessage("活動已建立");
        router.replace(`/admin/events/${currentEvent.id}`);
      } else if (eventId) {
        const updated = await updateAdminEvent(eventId, {
          title: form.title,
          slug: form.slug,
          description: form.description,
          status: form.status,
          starts_at: toIsoOrNull(form.starts_at),
          ends_at: toIsoOrNull(form.ends_at),
        });

        if (!updated.data) {
          setError(updated.error || "更新活動失敗");
          setSaving(false);
          return;
        }

        currentEvent = updated.data.event;
        const checkinUpdated = await updateAdminCheckinSettings(eventId, {
          starts_at: toIsoOrNull(form.starts_at),
          ends_at: toIsoOrNull(form.ends_at),
          checkin_opens_at: toIsoOrNull(form.checkin_opens_at),
          checkin_closes_at: toIsoOrNull(form.checkin_closes_at),
        });

        if (!checkinUpdated.data) {
          setError(checkinUpdated.error || "更新簽到時間失敗");
          setSaving(false);
          return;
        }

        const shareResult = await getAdminEventShare(eventId);
        if (shareResult.data) {
          setShare(shareResult.data.share);
        }

        setMessage("活動設定已更新");
        setInfoMode("view");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title={isNew ? "建立活動" : "活動設定"}
      description={isNew ? "先建立活動基本資料，再進到牌組與分享設定。" : "管理活動基本資料、分享入口與這場活動使用的牌組。"}
      eventId={eventId}
    >
      {!isNew ? (
        <section className="rounded-4xl border border-border/80 bg-card/85 p-3">
          <div className="flex flex-wrap gap-2">
            <EventTab href={`/admin/events/${eventId}`} active={activeTab === "info"}>
              活動資訊
            </EventTab>
            <EventTab href={`/admin/events/${eventId}?tab=share`} active={activeTab === "share"}>
              分享
            </EventTab>
            <EventTab href={`/admin/events/${eventId}?tab=decks`} active={activeTab === "decks"}>
              活動牌組
            </EventTab>
          </div>
        </section>
      ) : null}

      {activeTab === "info" ? (
      <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
        {loading ? <p className="text-sm text-muted-foreground">活動資料載入中...</p> : null}
        {!loading ? (
          <div className="grid gap-6">
            {!isNew ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant={infoMode === "view" ? "default" : "outline"}
                  size="icon"
                  className="rounded-full"
                  onClick={() => setInfoMode("view")}
                >
                  <Eye className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={infoMode === "edit" ? "default" : "outline"}
                  size="icon"
                  className="rounded-full"
                  onClick={() => setInfoMode("edit")}
                >
                  <Pencil className="size-4" />
                </Button>
              </div>
            ) : null}

            {infoMode === "view" && !isNew ? (
              <div className="grid gap-3">
                <Field label="活動標題">
                  <ReadOnlyValue>{form.title}</ReadOnlyValue>
                </Field>
                <Field label="活動 slug">
                  <ReadOnlyValue>{form.slug || "尚未設定"}</ReadOnlyValue>
                </Field>
                <Field label="活動描述">
                  <ReadOnlyValue multiline>{form.description || "尚未填寫活動描述。"}</ReadOnlyValue>
                </Field>
                <Field label="狀態">
                  <ReadOnlyValue>{translateEventStatus(form.status)}</ReadOnlyValue>
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="活動開始時間">
                    <ReadOnlyValue>{formatLocalDatetime(form.starts_at, "尚未設定")}</ReadOnlyValue>
                  </Field>
                  <Field label="活動結束時間">
                    <ReadOnlyValue>{formatLocalDatetime(form.ends_at, "尚未設定")}</ReadOnlyValue>
                  </Field>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="簽到開始時間">
                    <ReadOnlyValue>{formatLocalDatetime(form.checkin_opens_at, "尚未設定")}</ReadOnlyValue>
                  </Field>
                  <Field label="簽到結束時間">
                    <ReadOnlyValue>{formatLocalDatetime(form.checkin_closes_at, "尚未設定")}</ReadOnlyValue>
                  </Field>
                </div>
              </div>
            ) : (
              <form className="grid gap-6" onSubmit={handleSubmit}>
                <Field label="活動標題">
                  <input
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    required
                  />
                </Field>

                <Field label="活動 slug">
                  <input
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={form.slug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                    placeholder="event-2026-demo"
                  />
                </Field>

                <Field label="活動描述">
                  <textarea
                    className="min-h-32 rounded-2xl border border-input bg-background px-4 py-3"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </Field>

                <Field label="狀態">
                  <select
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="draft">草稿</option>
                    <option value="published">已發布</option>
                    <option value="archived">已封存</option>
                  </select>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="活動開始時間">
                    <input
                      type="datetime-local"
                      className="rounded-2xl border border-input bg-background px-4 py-3"
                      value={form.starts_at}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, starts_at: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="活動結束時間">
                    <input
                      type="datetime-local"
                      className="rounded-2xl border border-input bg-background px-4 py-3"
                      value={form.ends_at}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, ends_at: event.target.value }))
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="簽到開始時間">
                    <input
                      type="datetime-local"
                      className="rounded-2xl border border-input bg-background px-4 py-3"
                      value={form.checkin_opens_at}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, checkin_opens_at: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="簽到結束時間">
                    <input
                      type="datetime-local"
                      className="rounded-2xl border border-input bg-background px-4 py-3"
                      value={form.checkin_closes_at}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, checkin_closes_at: event.target.value }))
                      }
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button className="rounded-full px-6" disabled={saving}>
                    {saving ? "儲存中..." : isNew ? "建立活動" : "儲存設定"}
                  </Button>
                </div>
              </form>
            )}
            {message ? <p className="text-sm text-primary">{message}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : null}
      </section>
      ) : null}
      {!isNew && activeTab === "share" ? (
        <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">分享活動</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              將分享連結或 QR code 提供給參加者，他們可先查看活動資訊，再於簽到時間內完成簽到。
            </p>
          </div>
          {shareLoading ? <p className="mt-6 text-sm text-muted-foreground">分享資訊載入中...</p> : null}
          {!shareLoading && share ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">活動公開頁連結</span>
                  <input
                    className="rounded-2xl border border-input bg-background px-4 py-3 text-sm"
                    value={share.share_url}
                    readOnly
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full px-5"
                    onClick={() => void copyToClipboard(share.share_url, setMessage, setError)}
                  >
                    複製連結
                  </Button>
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <a href={share.share_url} target="_blank" rel="noreferrer">
                      開啟公開頁
                    </a>
                  </Button>
                </div>
              </div>
              <div className="rounded-3xl border border-border/80 bg-background/70 p-5">
                <p className="text-sm font-medium text-foreground">活動 QR code</p>
                <div className="mt-4 flex flex-col items-center gap-4">
                  <div
                    ref={qrCodeWrapperRef}
                    className="rounded-3xl border border-border/80 bg-white p-3"
                  >
                    <QRCode
                      value={share.qr_code_value}
                      size={224}
                      bgColor="transparent"
                      fgColor="#111827"
                      level="M"
                    />
                  </div>
                  <Button
                    type="button"
                    className="rounded-full px-5"
                    onClick={() =>
                      downloadQrCodeSvg(
                        qrCodeWrapperRef.current,
                        `${share.event.slug}-qrcode.svg`,
                        setMessage,
                        setError,
                      )
                    }
                  >
                    下載 QR code
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
      {!isNew && activeTab === "decks" ? (
        <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">活動牌組</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                這裡只顯示這場活動掛載的牌組；真正編輯牌組內容時，請進入獨立牌組頁。
              </p>
            </div>
            <Button asChild className="rounded-full px-5">
              <Link href={`/admin/decks/new?eventId=${eventId}`}>新增牌組</Link>
            </Button>
          </div>
          {decksLoading ? <p className="mt-6 text-sm text-muted-foreground">活動牌組載入中...</p> : null}
          {decksError ? <p className="mt-6 text-sm text-destructive">{decksError}</p> : null}
          {!decksLoading && !decksError ? (
            <div className="mt-6 grid gap-4">
              {decks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/80 bg-background/65 p-8 text-center text-muted-foreground">
                  這場活動目前還沒有任何牌組，先建立第一組吧。
                </div>
              ) : (
                decks.map((deck) => (
                  <article key={deck.id} className="rounded-3xl border border-border/80 bg-background/70 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {deck.deck_rule === "single_card" ? "單一卡片牌組" : "隨機抽卡牌組"}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-foreground">{deck.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                          {deck.description || "尚未填寫牌組描述。"}
                        </p>
                      </div>
                      <div className="rounded-full border border-border/80 bg-card px-3 py-1 text-xs font-medium text-foreground/84">
                        {deck.status === "active" ? "啟用中" : "已封存"}
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button asChild className="rounded-full px-5">
                        <Link href={`/admin/decks/${deck.id}?eventId=${eventId}`}>管理牌組</Link>
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : null}
        </section>
      ) : null}
    </AdminShell>
  );
}

function EventTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
        active ? "bg-foreground text-background" : "bg-background/80 text-foreground hover:bg-background"
      }`}
    >
      {children}
    </Link>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function ReadOnlyValue({
  children,
  multiline = false,
}: {
  children: ReactNode;
  multiline?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/45 bg-background/55 px-4 py-3 text-foreground/90 ${
        multiline ? "min-h-32 whitespace-pre-wrap" : ""
      }`}
    >
      {children}
    </div>
  );
}

function translateEventStatus(status: string) {
  switch (status) {
    case "published":
      return "已發布";
    case "archived":
      return "已封存";
    default:
      return "草稿";
  }
}

function formatLocalDatetime(value: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("zh-TW");
}

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}T${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
}

function toIsoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

async function copyToClipboard(
  value: string,
  setMessage: (message: string | null) => void,
  setError: (message: string | null) => void,
) {
  try {
    await navigator.clipboard.writeText(value);
    setError(null);
    setMessage("分享連結已複製");
  } catch {
    setError("複製連結失敗");
  }
}

function downloadQrCodeSvg(
  wrapper: HTMLDivElement | null,
  filename: string,
  setMessage: (message: string | null) => void,
  setError: (message: string | null) => void,
) {
  const svg = wrapper?.querySelector("svg");
  if (!svg) {
    setError("找不到可下載的 QR code");
    return;
  }

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  setError(null);
  setMessage("QR code 已下載");
}
