import { Suspense } from "react";

import { AdminEventEditorClient } from "@/components/admin-event-editor-client";

type AdminEventPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function AdminEventPage({ params }: AdminEventPageProps) {
  const { eventId } = await params;

  return (
    <Suspense fallback={null}>
      <AdminEventEditorClient eventId={eventId} />
    </Suspense>
  );
}
