import { Suspense } from "react";

import { AdminEventEditorClient } from "@/components/admin-event-editor-client";

export default function AdminNewEventPage() {
  return (
    <Suspense fallback={null}>
      <AdminEventEditorClient />
    </Suspense>
  );
}
