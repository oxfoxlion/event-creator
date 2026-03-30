"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Eye, Pencil, Plus, RectangleEllipsis, Ticket, Trash2 } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { CardPreviewModal } from "@/components/card-preview-modal";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AdminClaim,
  AdminEvent,
  AdminDeckSlot,
  createAdminDeck,
  getAdminEvents,
  getAdminClaimManagement,
  getAdminDeck,
  markAdminCardSlotStatus,
  markAdminClaimUsed,
  updateAdminDeck,
} from "@/lib/eventCreatorApi";

type AdminDeckEditorClientProps = {
  eventId: string;
  deckId?: string;
  events?: AdminEvent[];
  onEventChange?: (eventId: string) => void;
};

type DeckRule = "single_card" | "random_draw";
type DisplayMode = "center" | "content";
type ClaimRule = "required" | "optional";
type PublishRule = "immediate" | "scheduled";
type UsageRule = "participant_markable" | "admin_only";
type TransferRule = "non_transferable" | "participant_transferable";
type DeckStatus = "active" | "archived";

type DeckCardDraft = {
  id: string;
  title: string;
  display_mode: DisplayMode;
  center_text: string;
  content_markdown: string;
  total_quantity: string;
};

const initialInfoForm = {
  title: "",
  description: "",
  deck_rule: "single_card" as DeckRule,
  claim_rule: "optional" as ClaimRule,
  claim_limit: "",
  publish_rule: "immediate" as PublishRule,
  publish_at: "",
  usage_rule: "admin_only" as UsageRule,
  transfer_rule: "non_transferable" as TransferRule,
  status: "active" as DeckStatus,
  is_active: true,
};

const defaultCardDraft = (): DeckCardDraft => ({
  id: createDraftId(),
  title: "通行卡",
  display_mode: "center",
  center_text: "PASS",
  content_markdown: "",
  total_quantity: "1",
});

let draftCardSequence = 0;

export function AdminDeckEditorClient({ eventId, deckId, events = [], onEventChange }: AdminDeckEditorClientProps) {
  const router = useRouter();
  const isNew = !deckId;
  const [tab, setTab] = useState<"info" | "cards">("info");
  const [infoMode, setInfoMode] = useState<"view" | "edit">(isNew ? "edit" : "view");
  const [infoForm, setInfoForm] = useState(initialInfoForm);
  const [cards, setCards] = useState<DeckCardDraft[]>([defaultCardDraft()]);
  const [slots, setSlots] = useState<AdminDeckSlot[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(cards[0]?.id || null);
  const [sourceCardId, setSourceCardId] = useState<string | null>(null);
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [pendingClaimId, setPendingClaimId] = useState<string | null>(null);
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewCard, setPreviewCard] = useState<{
    title: string;
    display_mode: "center" | "content";
    center_text: string | null;
    content_markdown: string;
  } | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyEvents, setCopyEvents] = useState<AdminEvent[]>([]);
  const [copyTargetEventId, setCopyTargetEventId] = useState("");
  const [copyLoading, setCopyLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const loadDeckData = useCallback(async (targetDeckId: string, options?: { preserveMessage?: boolean }) => {
    const [deckResult, claimsResult] = await Promise.all([
      getAdminDeck(eventId, targetDeckId),
      getAdminClaimManagement(),
    ]);

    if (deckResult.status === 401 || claimsResult.status === 401) {
      router.replace(`/login?redirect_to=${encodeURIComponent(`/admin/decks/${targetDeckId}?eventId=${eventId}`)}`);
      return false;
    }

    if (!deckResult.data) {
      setError(deckResult.error || "讀取牌組失敗");
      return false;
    }

    const nextDeck = deckResult.data.deck;
    const nextCards =
      nextDeck.deck_rule === "single_card"
        ? [
            {
              id: nextDeck.card?.id || createDraftId(),
              title: nextDeck.card?.title || nextDeck.title,
              display_mode: nextDeck.card?.display_mode || "center",
              center_text: nextDeck.card?.center_text || "",
              content_markdown: nextDeck.card?.content_markdown || "",
              total_quantity: "1",
            },
          ]
        : nextDeck.cards.map((item) => ({
            id: item.id,
            title: item.title,
            display_mode: item.display_mode,
            center_text: item.center_text || "",
            content_markdown: item.content_markdown || "",
            total_quantity: String(item.total_quantity),
          }));

    setInfoForm({
      title: nextDeck.title,
      description: nextDeck.description || "",
      deck_rule: nextDeck.deck_rule,
      claim_rule: nextDeck.claim_rule,
      claim_limit: nextDeck.claim_limit ? String(nextDeck.claim_limit) : "",
      publish_rule: nextDeck.publish_rule,
      publish_at: nextDeck.publish_at || "",
      usage_rule: nextDeck.usage_rule,
      transfer_rule: nextDeck.transfer_rule,
      status: nextDeck.status,
      is_active: nextDeck.is_active,
    });
    setCards(nextCards.length > 0 ? nextCards : [defaultCardDraft()]);
    setSelectedCardId(nextCards[0]?.id || null);
    setSourceCardId(nextDeck.source_card_id);
    setClaims(claimsResult.data?.claims || []);
    setSlots(nextDeck.slots || []);
    setError(null);
    if (!options?.preserveMessage) {
      setMessage(null);
    }
    return true;
  }, [eventId, router]);

  useEffect(() => {
    if (isNew || !deckId) {
      return;
    }

    const targetDeckId = deckId;
    let cancelled = false;

    async function loadDeck() {
      setLoading(true);
      await loadDeckData(targetDeckId);
      if (cancelled) {
        return;
      }
      setLoading(false);
    }

    void loadDeck();

    return () => {
      cancelled = true;
    };
  }, [deckId, isNew, loadDeckData]);

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) || cards[0] || null,
    [cards, selectedCardId],
  );

  const filteredClaims = useMemo(
    () => (sourceCardId ? claims.filter((claim) => claim.card_id === sourceCardId) : []),
    [claims, sourceCardId],
  );
  const deckCardSlots = useMemo(
    () => {
      if (infoForm.deck_rule === "random_draw") {
        const activeCardIds = new Set(cards.map((card) => card.id));
        return [...slots]
          .filter((slot) => activeCardIds.has(slot.deck_item_id))
          .sort((left, right) => {
            const leftOrder = Number(left.slot_order || 0);
            const rightOrder = Number(right.slot_order || 0);
            if (leftOrder !== rightOrder) {
              return leftOrder - rightOrder;
            }
            return left.id.localeCompare(right.id);
          })
          .map((slot) => ({
          id: slot.id,
          title: slot.title,
          slotIndex: slot.slot_order,
          quantity: cards.find((card) => card.id === slot.deck_item_id)?.total_quantity || "1",
          claim: slot.claim_id
            ? {
                claim_id: slot.claim_id,
                claimed_at: slot.claimed_at || "",
                usage_status: slot.usage_status || "unused",
                user_id: slot.user_id || "",
                display_name: slot.display_name,
                discord_username: slot.discord_username,
                assigned_title: slot.title,
              }
            : null,
          slot,
          previewCard: (() => {
            const sourceCard = cards.find((card) => card.id === slot.deck_item_id);
            if (!sourceCard) {
              return null;
            }

            return {
              title: sourceCard.title || slot.title || "未命名卡片",
              display_mode: sourceCard.display_mode,
              center_text: sourceCard.center_text,
              content_markdown: sourceCard.content_markdown,
            };
          })(),
        }));
      }

      return filteredClaims.map((claim, index) => ({
        id: claim.claim_id,
        title: claim.assigned_title || claim.card_title,
        slotIndex: index + 1,
        quantity: "1",
        claim,
        slot: null,
        previewCard: cards[0]
          ? {
              title: cards[0].title,
              display_mode: cards[0].display_mode,
              center_text: cards[0].center_text,
              content_markdown: cards[0].content_markdown,
            }
          : null,
      }));
    },
    [cards, filteredClaims, infoForm.deck_rule, slots],
  );

  function buildPayload() {
    const normalizedCards =
      infoForm.deck_rule === "single_card"
        ? [cards[0] || defaultCardDraft()]
        : cards.filter((card) => card.title.trim());

    const primaryCard = normalizedCards[0] || defaultCardDraft();

    return {
      title: infoForm.title,
      description: infoForm.description || null,
      deck_rule: infoForm.deck_rule,
      claim_rule: infoForm.claim_rule,
      claim_limit: infoForm.claim_limit ? Number(infoForm.claim_limit) : null,
      publish_rule: infoForm.publish_rule,
      publish_at: infoForm.publish_rule === "scheduled" ? infoForm.publish_at || null : null,
      usage_rule: infoForm.usage_rule,
      transfer_rule: infoForm.transfer_rule,
      status: infoForm.status,
      is_active: infoForm.is_active,
      card: {
        title: primaryCard.title,
        display_mode: primaryCard.display_mode,
        center_text: primaryCard.display_mode === "center" ? primaryCard.center_text : null,
        content_markdown: primaryCard.display_mode === "content" ? primaryCard.content_markdown : "",
      },
      items:
        infoForm.deck_rule === "random_draw"
          ? normalizedCards.map((card) => ({
              id: card.id.startsWith("draft-") ? null : card.id,
              display_mode: card.display_mode,
              title: card.title,
              center_text: card.display_mode === "center" ? card.center_text : null,
              content_markdown: card.display_mode === "content" ? card.content_markdown : "",
              total_quantity: Number(card.total_quantity || "1"),
            }))
          : [],
    };
  }

  async function openCopyModal() {
    setCopyModalOpen(true);
    setCopyError(null);

    if (copyEvents.length > 0) {
      setCopyTargetEventId((current) => current || "");
      return;
    }

    setCopyLoading(true);
    const result = await getAdminEvents();
    setCopyLoading(false);

    if (result.status === 401) {
      router.replace(`/login?redirect_to=${encodeURIComponent(deckId ? `/admin/decks/${deckId}?eventId=${eventId}` : "/admin/decks")}`);
      return;
    }

    if (!result.data) {
      setCopyError(result.error || "讀取活動列表失敗");
      return;
    }

    setCopyEvents(result.data.events);
    setCopyTargetEventId("");
  }

  function closeCopyModal() {
    if (copying) {
      return;
    }

    setCopyModalOpen(false);
    setCopyError(null);
  }

  async function handleCopyDeck() {
    if (!copyTargetEventId) {
      setCopyError("請先選擇要複製到哪一個活動。");
      return;
    }

    setCopying(true);
    setCopyError(null);

    const payload = buildPayload();
    const result = await createAdminDeck(copyTargetEventId, {
      ...payload,
      items:
        payload.items?.map((item) => ({
          display_mode: item.display_mode,
          title: item.title,
          center_text: item.center_text,
          content_markdown: item.content_markdown,
          total_quantity: item.total_quantity,
        })) || [],
    });

    setCopying(false);

    if (!result.data) {
      setCopyError(result.error || "複製牌組失敗");
      return;
    }

    setCopyModalOpen(false);
    router.push(`/admin/decks/${result.data.deck.id}?eventId=${copyTargetEventId}`);
  }

  async function handleSaveInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persistDeck(isNew ? "牌組已建立" : "牌組資訊已更新");
    if (!isNew) {
      setInfoMode("view");
    }
  }

  async function handleSaveCards() {
    await persistDeck("牌組卡片已更新");
  }

  async function persistDeck(successMessage: string) {
    if (!eventId) {
      setError("請先選擇所屬活動");
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    const payload = buildPayload();
    const result = isNew
      ? await createAdminDeck(eventId, payload)
      : await updateAdminDeck(eventId, deckId!, payload);

    setSaving(false);

    if (!result.data) {
      setError(result.error || (isNew ? "建立牌組失敗" : "更新牌組失敗"));
      return;
    }

    setMessage(successMessage);
    setError(null);

    if (isNew) {
      router.replace(`/admin/decks/${result.data.deck.id}?eventId=${eventId}`);
      return;
    }

    await loadDeckData(deckId!, { preserveMessage: true });
  }

  function updateSelectedCard(patch: Partial<DeckCardDraft>) {
    if (!selectedCard) {
      return;
    }

    setCards((current) =>
      current.map((card) => (card.id === selectedCard.id ? { ...card, ...patch } : card)),
    );
  }

  function addBlankCard() {
    const nextCard = defaultCardDraft();

    if (infoForm.deck_rule === "single_card") {
      setCards([nextCard]);
      setSelectedCardId(nextCard.id);
      return;
    }

    setCards((current) => [...current, nextCard]);
    setSelectedCardId(nextCard.id);
  }

  function duplicateCard(cardId: string) {
    if (infoForm.deck_rule === "single_card") {
      return;
    }

    const source = cards.find((card) => card.id === cardId);
    if (!source) {
      return;
    }

    const copied = {
      ...source,
      id: createDraftId(),
      title: `${source.title} 副本`,
    };

    setCards((current) => [...current, copied]);
    setSelectedCardId(copied.id);
  }

  function removeCard(cardId: string) {
    if (infoForm.deck_rule === "single_card") {
      return;
    }

    setCards((current) => {
      const nextCards = current.filter((card) => card.id !== cardId);
      if (selectedCardId === cardId) {
        setSelectedCardId(nextCards[0]?.id || null);
      }
      return nextCards.length > 0 ? nextCards : [defaultCardDraft()];
    });
  }

  async function handleClaimUpdate(claimId: string, usageStatus: "used" | "unused") {
    setPendingClaimId(claimId);
    const result = await markAdminClaimUsed(claimId, { usage_status: usageStatus });
    setPendingClaimId(null);

    if (!result.data) {
      setError(result.error || "更新卡片狀態失敗");
      return;
    }

    const refreshed = deckId ? await loadDeckData(deckId, { preserveMessage: true }) : false;
    if (refreshed) {
      setMessage("卡片狀態已更新");
      setError(null);
    } else {
      setError("重新載入核銷資料失敗");
    }
  }

  async function handleSlotUpdate(slotId: string, availabilityStatus: "available" | "disabled") {
    setPendingSlotId(slotId);
    const result = await markAdminCardSlotStatus(slotId, { availability_status: availabilityStatus });
    setPendingSlotId(null);

    if (!result.data) {
      setError(result.error || "更新卡片狀態失敗");
      return;
    }

    const refreshed = deckId ? await loadDeckData(deckId, { preserveMessage: true }) : false;
    if (refreshed) {
      setMessage("卡片狀態已更新");
      setError(null);
    } else {
      setError("重新載入核銷資料失敗");
    }
  }

  return (
    <AdminShell
      title={isNew ? "新增牌組" : "牌組管理"}
      description={isNew ? "先建立牌組資訊，再到卡片列表管理牌組中的卡片。" : "用 Tab 分開管理牌組資訊、卡片列表與核銷。"}
      eventId={eventId}
    >
      <section className="rounded-4xl border border-border/80 bg-card/85 p-3">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "info"} onClick={() => setTab("info")} icon={<RectangleEllipsis className="size-4" />}>
            牌組資訊
          </TabButton>
          {!isNew ? (
            <TabButton active={tab === "cards"} onClick={() => setTab("cards")} icon={<Ticket className="size-4" />}>
              卡片列表
            </TabButton>
          ) : null}
        </div>
      </section>

      {loading ? <section className="rounded-4xl border border-border/80 bg-card/85 p-6 text-sm text-muted-foreground">牌組資料載入中...</section> : null}

      {!loading && tab === "info" ? (
        <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">牌組資訊</h2>
              <p className="mt-2 text-sm text-muted-foreground">這裡只管理牌組規則，不直接編輯卡片內容。</p>
            </div>
            {!isNew ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full px-4"
                  onClick={openCopyModal}
                >
                  <Copy className="size-4" />
                  <span>複製牌組</span>
                </Button>
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
          </div>

          {infoMode === "view" && !isNew ? (
            <div className="mt-6 grid gap-3">
              <Field label="牌組名稱">
                <ReadOnlyValue>{infoForm.title}</ReadOnlyValue>
              </Field>
              <Field label="牌組描述">
                <ReadOnlyValue multiline>{infoForm.description || "尚未填寫牌組描述。"}</ReadOnlyValue>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="牌組規則">
                  <ReadOnlyValue>{translateDeckRule(infoForm.deck_rule)}</ReadOnlyValue>
                </Field>
                <Field label="領取規則">
                  <ReadOnlyValue>{translateClaimRule(infoForm.claim_rule)}</ReadOnlyValue>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="領取上限">
                  <ReadOnlyValue>{infoForm.claim_limit || "不限"}</ReadOnlyValue>
                </Field>
                <Field label="發布規則">
                  <ReadOnlyValue>{translatePublishRule(infoForm.publish_rule)}</ReadOnlyValue>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="發布時間">
                  <ReadOnlyValue>{infoForm.publish_at || "未設定"}</ReadOnlyValue>
                </Field>
                <Field label="使用規則">
                  <ReadOnlyValue>{translateUsageRule(infoForm.usage_rule)}</ReadOnlyValue>
                </Field>
                <Field label="牌組狀態">
                  <ReadOnlyValue>{translateDeckStatus(infoForm.status)}</ReadOnlyValue>
                </Field>
              </div>
              <Field label="轉讓規則">
                <ReadOnlyValue>{translateTransferRule(infoForm.transfer_rule)}</ReadOnlyValue>
              </Field>
            </div>
          ) : (
            <form className="mt-6 grid gap-4" onSubmit={handleSaveInfo}>
              {isNew ? (
                <Field label="所屬活動">
                  <select
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={eventId}
                    onChange={(event) => onEventChange?.(event.target.value)}
                    required
                  >
                    <option value="">請選擇活動</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
              <Field label="牌組名稱">
                <input
                  className="rounded-2xl border border-input bg-background px-4 py-3"
                  value={infoForm.title}
                  onChange={(event) => setInfoForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </Field>
              <Field label="牌組描述">
                <textarea
                  className="min-h-28 rounded-2xl border border-input bg-background px-4 py-3"
                  value={infoForm.description}
                  onChange={(event) => setInfoForm((current) => ({ ...current, description: event.target.value }))}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="牌組規則">
                  <select
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={infoForm.deck_rule}
                    onChange={(event) =>
                      setInfoForm((current) => ({
                        ...current,
                        deck_rule: event.target.value as DeckRule,
                      }))
                    }
                  >
                    <option value="single_card">單一卡片牌組</option>
                    <option value="random_draw">隨機抽卡牌組</option>
                  </select>
                </Field>
                <Field label="領取規則">
                  <select
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={infoForm.claim_rule}
                    onChange={(event) =>
                      setInfoForm((current) => ({
                        ...current,
                        claim_rule: event.target.value as ClaimRule,
                      }))
                    }
                  >
                    <option value="optional">可自行領取</option>
                    <option value="required">系統自動發放</option>
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="領取上限">
                  <input
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={infoForm.claim_limit}
                    onChange={(event) => setInfoForm((current) => ({ ...current, claim_limit: event.target.value }))}
                    placeholder="留空代表不限"
                  />
                </Field>
                <Field label="發布規則">
                  <select
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={infoForm.publish_rule}
                    onChange={(event) =>
                      setInfoForm((current) => ({
                        ...current,
                        publish_rule: event.target.value as PublishRule,
                      }))
                    }
                  >
                    <option value="immediate">立即發布</option>
                    <option value="scheduled">指定時間發布</option>
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="發布時間">
                  <input
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={infoForm.publish_at}
                    onChange={(event) => setInfoForm((current) => ({ ...current, publish_at: event.target.value }))}
                    placeholder="2026-03-27T18:00:00+08:00"
                    disabled={infoForm.publish_rule !== "scheduled"}
                  />
                </Field>
                <Field label="使用規則">
                  <select
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={infoForm.usage_rule}
                    onChange={(event) =>
                      setInfoForm((current) => ({
                        ...current,
                        usage_rule: event.target.value as UsageRule,
                      }))
                    }
                  >
                    <option value="admin_only">僅限後台標記使用</option>
                    <option value="participant_markable">允許參加者自行標記使用</option>
                  </select>
                </Field>
                <Field label="牌組狀態">
                  <select
                    className="rounded-2xl border border-input bg-background px-4 py-3"
                    value={infoForm.status}
                    onChange={(event) =>
                      setInfoForm((current) => ({
                        ...current,
                        status: event.target.value as DeckStatus,
                      }))
                    }
                  >
                    <option value="active">啟用中</option>
                    <option value="archived">已封存</option>
                  </select>
                </Field>
              </div>
              <Field label="轉讓規則">
                <select
                  className="rounded-2xl border border-input bg-background px-4 py-3"
                  value={infoForm.transfer_rule}
                  onChange={(event) =>
                    setInfoForm((current) => ({
                      ...current,
                      transfer_rule: event.target.value as TransferRule,
                    }))
                  }
                >
                  <option value="non_transferable">不可轉讓</option>
                  <option value="participant_transferable">可由 participant 互相轉讓</option>
                </select>
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button className="rounded-full px-6" disabled={saving || (isNew && !eventId)}>
                  {isNew && !eventId ? "請先選擇活動" : saving ? "儲存中..." : isNew ? "建立牌組" : "儲存牌組資訊"}
                </Button>
              </div>
            </form>
          )}
          {message ? <p className="mt-4 text-sm text-primary">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </section>
      ) : null}

      {!loading && !isNew && tab === "cards" ? (
        <section className="grid gap-6">
          <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">卡片列表</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  在這裡管理牌組中的卡片內容、模板、複製與核銷。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="rounded-full px-4" onClick={addBlankCard}>
                  <Plus className="size-4" />
                  <span>新增卡片</span>
                </Button>
              </div>
            </div>

            {infoForm.deck_rule === "single_card" ? (
              <p className="mt-4 text-sm text-muted-foreground">單一卡片牌組只維護 1 張卡片，但仍可在下方完整編輯其內容。</p>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-h-[30rem] space-y-3 overflow-y-auto pr-2">
                {cards.map((card, index) => (
                  <article
                    key={card.id}
                    className={`rounded-3xl border p-4 transition-colors ${selectedCardId === card.id ? "border-foreground bg-background/85" : "border-border/80 bg-background/65"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        className="min-w-0 text-left"
                        onClick={() => setSelectedCardId(card.id)}
                      >
                        <p className="truncate font-medium text-foreground">{card.title || `卡片 ${index + 1}`}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {card.display_mode === "center" ? "置中卡片" : "內容卡片"}
                          {infoForm.deck_rule === "random_draw" ? ` / ${card.total_quantity || "1"} 張` : ""}
                        </p>
                      </button>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => setSelectedCardId(card.id)}>
                          <Pencil className="size-4" />
                        </Button>
                        {infoForm.deck_rule === "random_draw" ? (
                          <>
                            <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => duplicateCard(card.id)}>
                              <Copy className="size-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => removeCard(card.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <section className="rounded-3xl border border-border/80 bg-background/70 p-5">
                {selectedCard ? (
                  <div className="grid gap-4">
                    <Field label="卡片標題">
                      <input
                        className="rounded-2xl border border-input bg-background px-4 py-3"
                        value={selectedCard.title}
                        onChange={(event) => updateSelectedCard({ title: event.target.value })}
                      />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="顯示模式">
                        <select
                          className="rounded-2xl border border-input bg-background px-4 py-3"
                          value={selectedCard.display_mode}
                          onChange={(event) =>
                            updateSelectedCard({ display_mode: event.target.value as DisplayMode })
                          }
                        >
                          <option value="center">僅顯示置中文字</option>
                          <option value="content">標題與內容</option>
                        </select>
                      </Field>
                      {infoForm.deck_rule === "random_draw" ? (
                        <Field label="卡片張數">
                          <input
                            className="rounded-2xl border border-input bg-background px-4 py-3"
                            value={selectedCard.total_quantity}
                            onChange={(event) => updateSelectedCard({ total_quantity: event.target.value })}
                          />
                        </Field>
                      ) : null}
                    </div>
                    {selectedCard.display_mode === "center" ? (
                      <Field label="置中文字">
                        <textarea
                          className="min-h-32 rounded-2xl border border-input bg-background px-4 py-3"
                          value={selectedCard.center_text}
                          onChange={(event) => updateSelectedCard({ center_text: event.target.value })}
                        />
                      </Field>
                    ) : (
                      <Field label="卡片內容">
                        <textarea
                          className="min-h-56 rounded-2xl border border-input bg-background px-4 py-3"
                          value={selectedCard.content_markdown}
                          onChange={(event) => updateSelectedCard({ content_markdown: event.target.value })}
                        />
                      </Field>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button className="rounded-full px-6" disabled={saving} onClick={handleSaveCards}>
                        {saving ? "儲存中..." : "儲存卡片列表"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">請先從左側選擇一張卡片。</p>
                )}
              </section>
            </div>
          </section>

          {!isNew ? (
            <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">卡片核銷</h2>
                <p className="mt-2 text-sm text-muted-foreground">下方會依照牌組卡片設定的張數，展開成一張一張可管理的實體卡片。</p>
              </div>
              <div className="mt-5 overflow-hidden rounded-3xl border border-border/80 bg-background/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Title</TableHead>
                      <TableHead className="min-w-[160px]">領取人</TableHead>
                      <TableHead className="min-w-[180px]">領取時間</TableHead>
                      <TableHead className="min-w-[120px]">狀態</TableHead>
                      <TableHead className="min-w-[180px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deckCardSlots.map(({ id, title, slotIndex, quantity, claim, slot, previewCard: rowPreviewCard }) => (
                      <TableRow key={id}>
                        <TableCell className="whitespace-nowrap">
                          <div>
                            <p className="font-medium text-foreground">{title || "未命名卡片"}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              第 {slotIndex} 張{Number(quantity) > 1 ? ` / 共 ${quantity} 張` : ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {claim ? claim.display_name || claim.discord_username || claim.user_id : "未領取"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {claim ? new Date(claim.claimed_at).toLocaleString("zh-TW") : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {claim
                            ? translateUsageStatus(claim.usage_status)
                            : slot?.availability_status === "disabled"
                              ? "已停用"
                              : "待發放"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {rowPreviewCard ? (
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-full px-5"
                                onClick={() => setPreviewCard(rowPreviewCard)}
                              >
                                預覽
                              </Button>
                            ) : null}
                            {claim && claim.usage_status === "unused" ? (
                              <Button
                                className="rounded-full px-5"
                                disabled={pendingClaimId === claim.claim_id}
                                onClick={() => handleClaimUpdate(claim.claim_id, "used")}
                              >
                                {pendingClaimId === claim.claim_id ? "更新中..." : "標記為已使用"}
                              </Button>
                            ) : claim && claim.usage_status !== "unused" ? (
                              <Button
                                variant="outline"
                                className="rounded-full px-5"
                                disabled={pendingClaimId === claim.claim_id}
                                onClick={() => handleClaimUpdate(claim.claim_id, "unused")}
                              >
                                {pendingClaimId === claim.claim_id ? "更新中..." : "還原為未使用"}
                              </Button>
                            ) : slot && slot.availability_status === "available" ? (
                              <Button
                                variant="outline"
                                className="rounded-full px-5"
                                disabled={pendingSlotId === slot.id}
                                onClick={() => handleSlotUpdate(slot.id, "disabled")}
                              >
                                {pendingSlotId === slot.id ? "更新中..." : "停用"}
                              </Button>
                            ) : slot && slot.availability_status === "disabled" ? (
                              <Button
                                variant="outline"
                                className="rounded-full px-5"
                                disabled={pendingSlotId === slot.id}
                                onClick={() => handleSlotUpdate(slot.id, "available")}
                              >
                                {pendingSlotId === slot.id ? "更新中..." : "還原可發放"}
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ) : null}

          {message ? <p className="text-sm text-primary">{message}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </section>
      ) : null}

      {previewCard ? (
        <CardPreviewModal
          title="卡片預覽"
          card={previewCard}
          onClose={() => setPreviewCard(null)}
        />
      ) : null}

      {copyModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
            aria-label="關閉牌組複製視窗"
            onClick={closeCopyModal}
          />
          <div className="relative z-10 w-full max-w-lg rounded-4xl border border-border/80 bg-card/95 p-6 shadow-[0_40px_140px_-60px_rgba(20,20,20,0.5)]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">牌組複製</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">選擇要複製到哪一個活動</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                會複製目前牌組的規則與卡片內容，不會帶入既有的領取與核銷紀錄。
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <Field label="目標活動">
                <select
                  className="rounded-2xl border border-input bg-background px-4 py-3"
                  value={copyTargetEventId}
                  onChange={(event) => setCopyTargetEventId(event.target.value)}
                  disabled={copyLoading || copying}
                >
                  <option value="">請選擇活動</option>
                  {copyEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}{event.id === eventId ? "（目前活動）" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              {copyLoading ? <p className="text-sm text-muted-foreground">活動列表載入中...</p> : null}
              {copyError ? <p className="text-sm text-destructive">{copyError}</p> : null}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-full px-5" onClick={closeCopyModal} disabled={copying}>
                取消
              </Button>
              <Button type="button" className="rounded-full px-5" onClick={handleCopyDeck} disabled={copying || copyLoading || !copyTargetEventId}>
                {copying ? "複製中..." : "完成"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function TabButton({
  active,
  children,
  icon,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${active ? "bg-foreground text-background" : "bg-background/80 text-foreground hover:bg-background"}`}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </button>
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
        multiline ? "min-h-28 whitespace-pre-wrap" : ""
      }`}
    >
      {children}
    </div>
  );
}

function translateDeckRule(value: DeckRule) {
  return value === "single_card" ? "單一卡片牌組" : "隨機抽卡牌組";
}

function translateClaimRule(value: ClaimRule) {
  return value === "required" ? "系統自動發放" : "可自行領取";
}

function translatePublishRule(value: PublishRule) {
  return value === "immediate" ? "立即發布" : "指定時間發布";
}

function translateUsageRule(value: UsageRule) {
  return value === "admin_only" ? "僅限後台標記使用" : "允許參加者自行標記使用";
}

function translateDeckStatus(value: DeckStatus) {
  return value === "active" ? "啟用中" : "已封存";
}

function translateTransferRule(value: TransferRule) {
  return value === "participant_transferable" ? "可由 participant 互相轉讓" : "不可轉讓";
}

function translateUsageStatus(status: string) {
  switch (status) {
    case "unused":
      return "未使用";
    case "used":
      return "已使用";
    case "closed":
      return "已停用";
    default:
      return status;
  }
}

function createDraftId() {
  draftCardSequence += 1;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `draft-${crypto.randomUUID()}`;
  }
  return `draft-${Date.now().toString(36)}-${draftCardSequence.toString(36)}`;
}
