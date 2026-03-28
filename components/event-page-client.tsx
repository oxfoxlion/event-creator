"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CardPreviewModal } from "@/components/card-preview-modal";
import { ParticipantShell } from "@/components/participant-shell";
import { Button } from "@/components/ui/button";
import {
  EventCard,
  ParticipantEvent,
  SessionUser,
  buildDiscordLoginUrl,
  claimEventCard,
  getParticipantEvent,
  getParticipantEventCards,
  postCheckin,
} from "@/lib/eventCreatorApi";

type EventPageClientProps = {
  eventSlug: string;
  mode?: "share" | "event";
  initialTab?: "info" | "cards";
};

export function EventPageClient({
  eventSlug,
  mode = "event",
  initialTab = "info",
}: EventPageClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState<ParticipantEvent | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [cards, setCards] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<EventCard | null>(null);
  const currentPath = mode === "share" ? `/share/${eventSlug}` : `/events/${eventSlug}`;
  const activeTab = mode === "share" ? "info" : initialTab;

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      const eventResult = await getParticipantEvent(eventSlug);

      if (cancelled) {
        return;
      }

      if (!eventResult.data) {
        setError(eventResult.error || "讀取活動失敗");
        setLoading(false);
        return;
      }

      let nextCards: EventCard[] = [];

      if (mode === "event" && eventResult.data.event.is_checked_in) {
        const cardsResult = await getParticipantEventCards(eventSlug);

        if (cancelled) {
          return;
        }

        if (cardsResult.status === 401) {
          router.replace(`/login?redirect_to=${encodeURIComponent(`${currentPath}?tab=cards`)}`);
          return;
        }

        if (!cardsResult.data) {
          setError(cardsResult.error || "讀取活動卡片失敗");
          setLoading(false);
          return;
        }

        nextCards = cardsResult.data.cards;
      }

      setUser(eventResult.data.user);
      setEvent(eventResult.data.event);
      setCards(nextCards);
      setModalOpen(
        mode === "event" &&
          initialTab === "cards" &&
          nextCards.some((card) => !card.is_claimed && card.claim_rule === "optional" && card.is_available),
      );
      setError(null);
      setLoading(false);
    }

    void loadEvent();

    return () => {
      cancelled = true;
    };
  }, [currentPath, eventSlug, initialTab, mode, router]);

  const claimableCards = useMemo(
    () => cards.filter((card) => !card.is_claimed && card.claim_rule === "optional"),
    [cards],
  );
  const ownedCards = useMemo(() => cards.filter((card) => card.is_claimed), [cards]);

  async function refreshEventAndCards(nextMessage?: string) {
    const [eventResult, cardsResult] = await Promise.all([
      getParticipantEvent(eventSlug),
      getParticipantEventCards(eventSlug),
    ]);

    if (!eventResult.data || !cardsResult.data) {
      setError(eventResult.error || cardsResult.error || "更新活動資料失敗");
      return;
    }

    setUser(eventResult.data.user);
    setEvent(eventResult.data.event);
    setCards(cardsResult.data.cards);
    setModalOpen(cardsResult.data.cards.some((card) => !card.is_claimed && card.claim_rule === "optional" && card.is_available));
    setMessage(nextMessage || null);
    setError(null);
  }

  async function handleCheckin() {
    setPendingAction("checkin");
    const result = await postCheckin(eventSlug);
    setPendingAction(null);

    if (!result.data) {
      if (result.status === 401) {
        router.replace(`/login?redirect_to=${encodeURIComponent(currentPath)}`);
        return;
      }
      setError(result.error || "簽到失敗");
      return;
    }

    setEvent(result.data.event);
    setError(null);
    const nextMessage =
      result.data.auto_claims.length > 0
        ? `簽到完成，系統已自動發放 ${result.data.auto_claims.length} 張必領卡。`
        : "簽到完成。";
    setMessage(nextMessage);
    router.push(`/events/${eventSlug}?tab=cards`);
  }

  async function handleClaim(cardId: string) {
    setPendingAction(cardId);
    const result = await claimEventCard(eventSlug, cardId);
    setPendingAction(null);

    if (!result.data) {
      setError(result.error || "領卡失敗");
      return;
    }

    setModalOpen(false);
    await refreshEventAndCards(
      result.data.card?.assigned_card ? `你抽到了「${result.data.card.assigned_card.title}」。` : "領卡成功。",
    );
  }

  if (loading) {
    return <StateShell title="活動頁載入中" description="正在讀取活動資料與你的簽到狀態。" />;
  }

  if (!event) {
    return <StateShell title="找不到活動" description={error || "目前沒有可顯示的活動資料。"} />;
  }

  return (
    <ParticipantShell
      title={event.title}
      description={
        event.description ||
        (mode === "share"
          ? "查看活動資訊、簽到時間與分享入口，並在開放時段完成簽到。"
          : "查看活動資訊、完成簽到，並在同一頁切換活動資訊與卡片列表。")
      }
    >
      {mode === "event" ? (
        <section className="rounded-4xl border border-border/80 bg-card/85 p-3">
          <div className="flex flex-wrap gap-2">
            <ActivityTab href={`/events/${eventSlug}`} active={activeTab === "info"}>
              活動資訊
            </ActivityTab>
            <ActivityTab href={`/events/${eventSlug}?tab=cards`} active={activeTab === "cards"} disabled={!event.is_checked_in}>
              卡片列表
            </ActivityTab>
          </div>
        </section>
      ) : null}

      {activeTab === "info" ? (
        <section className="grid gap-6">
          <div className="rounded-4xl border border-border/80 bg-secondary/55 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">簽到</p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              {event.is_checked_in
                ? "你已經完成簽到"
                : !user
                  ? "登入後即可參加活動"
                  : event.can_check_in
                    ? "目前可進行簽到"
                    : "目前尚未開放簽到"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {mode === "share"
                ? "分享頁只提供活動資訊與簽到。完成簽到後，系統會帶你進入活動頁查看卡片列表。"
                : "在這裡查看活動資訊與簽到時間；完成簽到後可切換到卡片列表。"}
            </p>
            <dl className="mt-5 grid gap-3 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <dt>活動開始時間</dt>
                <dd>{formatDateTime(event.starts_at, "尚未設定")}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <dt>簽到開始時間</dt>
                <dd>{formatDateTime(event.checkin_opens_at, "尚未設定")}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <dt>簽到截止時間</dt>
                <dd>{formatDateTime(event.checkin_closes_at, "尚未設定")}</dd>
              </div>
            </dl>
            <div className="mt-6">
              {!user ? (
                <Button asChild size="lg" className="rounded-full px-6">
                  <a href={buildDiscordLoginUrl(currentPath)}>使用 Discord 登入參加活動</a>
                </Button>
              ) : !event.is_checked_in ? (
                <Button
                  size="lg"
                  className="rounded-full px-6"
                  disabled={!event.can_check_in || pendingAction === "checkin"}
                  onClick={handleCheckin}
                >
                  {pendingAction === "checkin"
                    ? "簽到中..."
                    : event.can_check_in
                      ? "我要簽到"
                      : translateCheckinActionLabel(event.checkin_window_status || "open")}
                </Button>
              ) : null}
            </div>
            {!user ? (
              <p className="mt-4 text-sm text-muted-foreground">
                先登入後再回到這個活動頁，就能在簽到時間內完成簽到與領卡。
              </p>
            ) : null}
            {message ? <p className="mt-4 text-sm text-primary">{message}</p> : null}
            {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
          </div>
        </section>
      ) : null}

      {mode === "event" && activeTab === "cards" ? (
        <>
          {modalOpen ? (
            <ClaimPromptModal
              cards={claimableCards.filter((card) => card.is_available)}
              pendingAction={pendingAction}
              onClose={() => setModalOpen(false)}
              onClaim={handleClaim}
            />
          ) : null}
          {previewCard ? (
            <CardPreviewModal
              card={{
                title: previewCard.assigned_card?.title || previewCard.title,
                display_mode: previewCard.assigned_card?.display_mode || previewCard.display_mode,
                center_text: previewCard.assigned_card?.center_text || previewCard.center_text,
                content_markdown: previewCard.assigned_card?.content_markdown || previewCard.content_markdown,
              }}
              onClose={() => setPreviewCard(null)}
            />
          ) : null}

          <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <Badge label={`可領取 ${claimableCards.filter((card) => card.is_available).length} 張`} />
              <Badge label={`已擁有 ${ownedCards.length} 張`} />
              <Badge label={`狀態：${translateEventStatus(event.status)}`} />
            </div>
            {message ? <p className="mt-4 text-sm text-primary">{message}</p> : null}
            {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <CardListSection
              title="可領取的卡片"
              description="只顯示這場活動目前可選擇領取的卡片。"
              emptyMessage="目前沒有可領取的卡片。"
              cards={claimableCards}
              eventSlug={eventSlug}
              pendingAction={pendingAction}
              onClaim={handleClaim}
              onPreview={setPreviewCard}
            />
            <CardListSection
              title="已擁有的卡片"
              description="你在這場活動中已經取得的卡片會集中顯示在這裡。"
              emptyMessage="你目前還沒有擁有任何這場活動的卡片。"
              cards={ownedCards}
              eventSlug={eventSlug}
              pendingAction={pendingAction}
              onClaim={handleClaim}
              onPreview={setPreviewCard}
            />
          </section>
        </>
      ) : null}
    </ParticipantShell>
  );
}

function translateCheckinActionLabel(status: "upcoming" | "open" | "closed") {
  switch (status) {
    case "upcoming":
      return "尚未開放簽到";
    case "closed":
      return "簽到已截止";
    default:
      return "我要簽到";
  }
}

function formatDateTime(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return new Date(value).toLocaleString("zh-TW");
}

function ActivityTab({
  href,
  active,
  disabled = false,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: string;
}) {
  const className = `inline-flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
    active
      ? "bg-foreground text-background"
      : disabled
        ? "cursor-not-allowed bg-background/70 text-muted-foreground"
        : "bg-background/80 text-foreground hover:bg-background"
  }`;

  if (disabled) {
    return (
      <span aria-disabled="true" className={className}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function CardListSection({
  title,
  description,
  emptyMessage,
  cards,
  eventSlug,
  pendingAction,
  onClaim,
  onPreview,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  cards: EventCard[];
  eventSlug: string;
  pendingAction: string | null;
  onClaim: (cardId: string) => void;
  onPreview: (card: EventCard) => void;
}) {
  return (
    <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-5 space-y-3">
        {cards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 bg-background/65 p-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          cards.map((card) => (
            <article key={card.id} className="rounded-3xl border border-border/80 bg-background/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-foreground">{card.assigned_card?.title || card.title}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {!card.is_claimed ? (
                    <Button
                      className="rounded-full px-5"
                      disabled={!card.is_available || pendingAction === card.id}
                      onClick={() => onClaim(card.id)}
                    >
                      {pendingAction === card.id ? "領取中..." : "領取卡片"}
                    </Button>
                  ) : null}
                  {card.is_claimed ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="hidden rounded-full px-5 md:inline-flex"
                        onClick={() => onPreview(card)}
                      >
                        查看卡片
                      </Button>
                      <Button asChild variant="outline" className="rounded-full px-5 md:hidden">
                        <Link href={`/events/${eventSlug}/cards/${card.id}`}>查看卡片</Link>
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ClaimPromptModal({
  cards,
  pendingAction,
  onClose,
  onClaim,
}: {
  cards: EventCard[];
  pendingAction: string | null;
  onClose: () => void;
  onClaim: (cardId: string) => void;
}) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
        aria-label="關閉提示"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-4xl border border-border/80 bg-card/95 p-6 shadow-[0_40px_140px_-60px_rgba(20,20,20,0.5)]">
        <h2 className="text-2xl font-semibold text-foreground">你有尚未領取的卡片</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          這場活動目前有可領取的卡片。你可以直接在這裡領取，或稍後再到活動頁操作。
        </p>
        <div className="mt-5 space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/80 bg-background/70 px-4 py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{card.title}</p>
              </div>
              <Button
                className="rounded-full px-5"
                disabled={pendingAction === card.id}
                onClick={() => onClaim(card.id)}
              >
                {pendingAction === card.id ? "領取中..." : "立即領取"}
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="outline" className="rounded-full px-5" onClick={onClose}>
            稍後再說
          </Button>
        </div>
      </div>
    </div>
  );
}

function translateEventStatus(status: string) {
  switch (status) {
    case "draft":
      return "草稿";
    case "published":
      return "進行中";
    case "archived":
      return "已封存";
    default:
      return status;
  }
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border/80 bg-background/85 px-3 py-1 text-xs font-medium text-foreground/82">
      {label}
    </span>
  );
}

function StateShell({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="max-w-xl rounded-4xl border border-border/80 bg-card/85 p-10 text-center backdrop-blur">
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground">{description}</p>
      </div>
    </main>
  );
}
