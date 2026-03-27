import { CardPageClient } from "@/components/card-page-client";

type CardPageProps = {
  params: Promise<{
    eventSlug: string;
    cardId: string;
  }>;
};

export default async function CardPage({ params }: CardPageProps) {
  const { eventSlug, cardId } = await params;

  return <CardPageClient eventSlug={eventSlug} cardId={cardId} />;
}
