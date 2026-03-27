import { EventPageClient } from "@/components/event-page-client";

type EventPageProps = {
  params: Promise<{
    eventSlug: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const { eventSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialTab = resolvedSearchParams?.tab === "cards" ? "cards" : "info";

  return <EventPageClient eventSlug={eventSlug} mode="event" initialTab={initialTab} />;
}
