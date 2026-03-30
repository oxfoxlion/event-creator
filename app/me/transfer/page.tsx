import { ParticipantTransferQrClient } from "@/components/participant-transfer-qr-client";

type TransferPageProps = {
  searchParams?: Promise<{
    eventSlug?: string;
  }>;
};

export default async function TransferPage({ searchParams }: TransferPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <ParticipantTransferQrClient eventSlug={resolvedSearchParams?.eventSlug} />;
}
