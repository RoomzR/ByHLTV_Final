import type { Metadata } from "next";

import { TransfersView } from "@/components/players/transfers-view";

export const metadata: Metadata = { title: "Transfers" };

export default function TransfersPage() {
  return <TransfersView />;
}
