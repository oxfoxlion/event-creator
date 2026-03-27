import { Suspense } from "react";

import { AdminDeckRouteClient } from "@/components/admin-deck-route-client";

export default function AdminNewDeckRoutePage() {
  return (
    <Suspense fallback={null}>
      <AdminDeckRouteClient />
    </Suspense>
  );
}
