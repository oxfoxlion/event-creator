export type SessionUser = {
  id: string;
  discord_user_id: string;
  discord_username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  organizer_event_ids: string[];
};

export type AssignedCardContent = {
  deck_item_id: string | null;
  display_mode: "center" | "content";
  title: string;
  center_text: string | null;
  content_markdown: string;
};

export type EventCard = {
  id: string;
  event_id: string;
  card_type: "pass" | "game";
  display_mode: "center" | "content";
  title: string;
  center_text: string | null;
  content_markdown: string;
  style_variant: string;
  claim_rule: "required" | "optional";
  claim_limit: number | null;
  publish_rule: "immediate" | "scheduled";
  publish_at: string | null;
  status: "active" | "archived";
  distribution_mode: "direct" | "deck_draw";
  usage_rule: "participant_markable" | "admin_only";
  transfer_rule: "non_transferable" | "participant_transferable";
  deck_id: string | null;
  is_active: boolean;
  is_claimed: boolean;
  claim_id: string | null;
  claimed_at?: string | null;
  usage_status?: "unused" | "used";
  used_at?: string | null;
  is_available: boolean;
  is_published: boolean;
  is_claim_limit_reached: boolean;
  is_deck_exhausted: boolean;
  claimed_count: number;
  remaining_deck_quantity: number;
  assigned_card: AssignedCardContent | null;
};

export type ParticipantEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  checkin_opens_at: string | null;
  checkin_closes_at: string | null;
  created_at: string;
  updated_at: string;
  is_checked_in: boolean;
  checked_in_at?: string | null;
  checkin_window_status?: "upcoming" | "open" | "closed";
  can_check_in?: boolean;
  requires_login_for_checkin?: boolean;
  public_path?: string;
  share_url?: string;
  cards: EventCard[];
};

export type JoinedEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  checkin_opens_at: string | null;
  checkin_closes_at: string | null;
  created_at: string;
  updated_at: string;
  checked_in_at: string;
  claimed_card_count: number;
};

export type OwnedClaim = {
  claim_id: string;
  event_id: string;
  event_slug: string;
  event_title: string;
  card_id: string;
  deck_id: string | null;
  deck_item_id: string | null;
  claimed_at: string;
  used_at: string | null;
  usage_status: "unused" | "used";
  usage_rule: "participant_markable" | "admin_only";
  transfer_rule: "non_transferable" | "participant_transferable";
  card: {
    display_mode: "center" | "content";
    title: string;
    center_text: string | null;
    content_markdown: string;
  };
};

export type AdminEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  checkin_opens_at: string | null;
  checkin_closes_at: string | null;
  created_at: string;
  updated_at: string;
  role?: string;
};

export type AdminEventShare = {
  event: {
    id: string;
    slug: string;
    title: string;
    status: string;
  };
  public_path: string;
  share_url: string;
  qr_code_value: string;
};

export type AdminDeckItem = {
  id: string;
  deck_id: string;
  display_mode: "center" | "content";
  title: string;
  center_text: string | null;
  content_markdown: string;
  total_quantity: number;
  remaining_quantity: number;
  created_at: string;
  updated_at: string;
};

export type AdminDeckSlot = {
  id: string;
  deck_id: string;
  deck_item_id: string;
  slot_order: number;
  availability_status: "available" | "disabled";
  claim_id: string | null;
  created_at: string;
  updated_at: string;
  title: string;
  display_mode: "center" | "content";
  claimed_at: string | null;
  usage_status: "unused" | "used" | null;
  used_at: string | null;
  user_id: string | null;
  display_name: string | null;
  discord_username: string | null;
};

export type AdminDeck = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  deck_rule: "single_card" | "random_draw";
  claim_rule: "required" | "optional";
  claim_limit: number | null;
  publish_rule: "immediate" | "scheduled";
  publish_at: string | null;
  usage_rule: "participant_markable" | "admin_only";
  transfer_rule: "non_transferable" | "participant_transferable";
  status: "active" | "archived";
  is_active: boolean;
  source_card_id: string | null;
  claim_count: number;
  created_at: string;
  updated_at: string;
  card: {
    id: string;
    card_type: "pass" | "game";
    display_mode: "center" | "content";
    title: string;
    center_text: string | null;
    content_markdown: string;
    style_variant: string;
    distribution_mode: "direct" | "deck_draw";
  } | null;
  cards: AdminDeckItem[];
  slots: AdminDeckSlot[];
};

export type AdminClaim = {
  claim_id: string;
  claimed_at: string;
  used_at: string | null;
  usage_status: "unused" | "used";
  event_id: string;
  event_slug: string;
  event_title: string;
  card_id: string;
  card_title: string;
  display_mode: "center" | "content";
  usage_rule: "participant_markable" | "admin_only";
  user_id: string;
  display_name: string | null;
  discord_username: string | null;
  deck_item_id: string | null;
  assigned_title: string | null;
  assigned_display_mode: "center" | "content" | null;
};

export type ParticipantTransferTokenPayload = {
  user: SessionUser;
  token: string;
  participant: {
    id: string;
    display_name: string;
    discord_username: string;
    avatar_url: string | null;
  };
  event: {
    id: string;
    slug: string;
    title: string;
    checked_in_at: string;
  };
};

export type ParticipantTransferPreview = {
  message: string;
  claim: {
    claim_id: string;
    event_id: string;
    event_slug: string;
    event_title: string;
    card_id: string;
    usage_status: "unused" | "used";
    card: {
      display_mode: "center" | "content";
      title: string;
      center_text: string | null;
      content_markdown: string;
    };
  };
  target: {
    id: string;
    display_name: string | null;
    discord_username: string | null;
    avatar_url: string | null;
    event_id: string;
    event_slug: string;
    event_title: string;
    checked_in_at: string;
  };
};

type ApiResult<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001").replace(/\/+$/, "");
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${getApiBase()}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return {
        data: null,
        error: payload?.message || "請求失敗",
        status: response.status,
      };
    }

    return {
      data: payload as T,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "網路連線失敗",
      status: 500,
    };
  }
}

export function buildDiscordLoginUrl(redirectTo: string) {
  const redirectPath = redirectTo.startsWith("/") ? redirectTo : "/me/events";
  const params = new URLSearchParams({
    redirect_to: redirectPath,
  });

  return `${getApiBase()}/event_creator/auth/discord/start?${params.toString()}`;
}

export async function getCurrentUser() {
  return apiFetch<{ user: SessionUser }>("/event_creator/auth/me");
}

export async function postLogout() {
  return apiFetch<{ message: string }>("/event_creator/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getParticipantEvent(eventSlug: string) {
  return apiFetch<{ user: SessionUser | null; event: ParticipantEvent }>(`/event_creator/events/${eventSlug}`);
}

export async function postCheckin(eventSlug: string) {
  return apiFetch<{
    message: string;
    checkin: { id: string; event_id: string; user_id: string; checked_in_at: string };
    auto_claims: Array<{ id: string; card_id: string; claimed_at: string }>;
    event: ParticipantEvent;
  }>(`/event_creator/events/${eventSlug}/checkin`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function claimEventCard(eventSlug: string, cardId: string) {
  return apiFetch<{
    message: string;
    claim: { id?: string; card_id?: string; claimed_at?: string } | null;
    card: EventCard | null;
  }>(`/event_creator/events/${eventSlug}/cards/${cardId}/claim`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getParticipantEventCards(eventSlug: string) {
  return apiFetch<{
    event: {
      id: string;
      slug: string;
      title: string;
    };
    cards: EventCard[];
  }>(`/event_creator/events/${eventSlug}/cards`);
}

export async function getParticipantTransferToken(eventSlug: string) {
  return apiFetch<ParticipantTransferTokenPayload>(
    `/event_creator/me/transfer-token?eventSlug=${encodeURIComponent(eventSlug)}`,
  );
}

export async function previewParticipantCardTransfer(claimId: string, token: string) {
  return apiFetch<ParticipantTransferPreview>(`/event_creator/me/cards/${claimId}/transfer-preview`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function transferParticipantCard(claimId: string, token: string) {
  return apiFetch<{
    message: string;
    claim: {
      claim_id: string;
      event_id: string;
      card_id: string;
      user_id: string;
      claimed_at: string;
      used_at: string | null;
      usage_status: "unused" | "used";
    };
    target: ParticipantTransferPreview["target"];
  }>(`/event_creator/me/cards/${claimId}/transfer`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function getJoinedEvents() {
  return apiFetch<{ user: SessionUser; events: JoinedEvent[] }>("/event_creator/me/events");
}

export async function getOwnedClaims() {
  return apiFetch<{ user: SessionUser; claims: OwnedClaim[] }>("/event_creator/me/cards");
}

export async function getAdminEvents() {
  return apiFetch<{ user: SessionUser; events: AdminEvent[] }>("/event_creator/admin/events");
}

export async function createAdminEvent(payload: {
  title: string;
  slug?: string;
  description?: string;
  status?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  checkin_opens_at?: string | null;
  checkin_closes_at?: string | null;
}) {
  return apiFetch<{ message: string; event: AdminEvent }>("/event_creator/admin/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminEvent(eventId: string) {
  return apiFetch<{ event: AdminEvent }>(`/event_creator/admin/events/${eventId}`);
}

export async function getAdminEventShare(eventId: string) {
  return apiFetch<{ share: AdminEventShare }>(`/event_creator/admin/events/${eventId}/share`);
}

export async function updateAdminEvent(
  eventId: string,
  payload: {
    title: string;
    slug?: string;
    description?: string;
    status?: string;
    starts_at?: string | null;
    ends_at?: string | null;
  },
) {
  return apiFetch<{ message: string; event: AdminEvent }>(`/event_creator/admin/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCheckinSettings(
  eventId: string,
  payload: {
    starts_at?: string | null;
    ends_at?: string | null;
    checkin_opens_at?: string | null;
    checkin_closes_at?: string | null;
  },
) {
  return apiFetch<{ message: string; event: AdminEvent }>(
    `/event_creator/admin/events/${eventId}/checkin-settings`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export async function getAdminDecks(eventId: string) {
  return apiFetch<{ decks: AdminDeck[] }>(`/event_creator/admin/events/${eventId}/decks`);
}

export async function getAdminDeck(eventId: string, deckId: string) {
  return apiFetch<{ deck: AdminDeck }>(`/event_creator/admin/events/${eventId}/decks/${deckId}`);
}

export async function createAdminDeck(
  eventId: string,
  payload: {
    title: string;
    description?: string | null;
    deck_rule: "single_card" | "random_draw";
    claim_rule?: "required" | "optional";
    claim_limit?: number | null;
    publish_rule?: "immediate" | "scheduled";
    publish_at?: string | null;
    usage_rule?: "participant_markable" | "admin_only";
    transfer_rule?: "non_transferable" | "participant_transferable";
    status?: "active" | "archived";
    is_active?: boolean;
    card: {
      title: string;
      display_mode: "center" | "content";
      center_text?: string | null;
      content_markdown?: string;
      style_variant?: string;
    };
    items?: Array<{
      display_mode: "center" | "content";
      title: string;
      center_text?: string | null;
      content_markdown?: string;
      total_quantity: number;
    }>;
  },
) {
  return apiFetch<{ message: string; deck: AdminDeck }>(`/event_creator/admin/events/${eventId}/decks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminDeck(
  eventId: string,
  deckId: string,
  payload: {
    title?: string;
    description?: string | null;
    deck_rule?: "single_card" | "random_draw";
    claim_rule?: "required" | "optional";
    claim_limit?: number | null;
    publish_rule?: "immediate" | "scheduled";
    publish_at?: string | null;
    usage_rule?: "participant_markable" | "admin_only";
    transfer_rule?: "non_transferable" | "participant_transferable";
    status?: "active" | "archived";
    is_active?: boolean;
    card?: {
      title?: string;
      display_mode?: "center" | "content";
      center_text?: string | null;
      content_markdown?: string;
      style_variant?: string;
    };
    items?: Array<{
      display_mode: "center" | "content";
      title: string;
      center_text?: string | null;
      content_markdown?: string;
      total_quantity: number;
    }>;
  },
) {
  return apiFetch<{ message: string; deck: AdminDeck }>(
    `/event_creator/admin/events/${eventId}/decks/${deckId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export async function getAdminClaimManagement() {
  return apiFetch<{ claims: AdminClaim[] }>("/event_creator/admin/cards");
}

export async function markAdminClaimUsed(
  claimId: string,
  payload: { usage_status?: "unused" | "used" } = {},
) {
  return apiFetch<{ message: string; claim: { claim_id: string; usage_status: string; used_at: string } }>(
    `/event_creator/admin/card-claims/${claimId}/use`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function markAdminCardSlotStatus(
  slotId: string,
  payload: { availability_status?: "available" | "disabled" } = {},
) {
  return apiFetch<{ message: string; slot: { slot_id: string; availability_status: string } }>(
    `/event_creator/admin/card-slots/${slotId}/status`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
