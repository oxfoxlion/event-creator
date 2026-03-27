import { Suspense } from "react";

import { AdminDeckRouteClient } from "@/components/admin-deck-route-client";

type AdminDeckRoutePageProps = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function AdminDeckRoutePage({ params }: AdminDeckRoutePageProps) {
  const { deckId } = await params;

  return (
    <Suspense fallback={null}>
      <AdminDeckRouteClient deckId={deckId} />
    </Suspense>
  );
}
