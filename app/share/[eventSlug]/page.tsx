import { EventPageClient } from "@/components/event-page-client";

type ShareEventPageProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export default async function ShareEventPage({ params }: ShareEventPageProps) {
  const { eventSlug } = await params;

  return <EventPageClient eventSlug={eventSlug} mode="share" />;
}
