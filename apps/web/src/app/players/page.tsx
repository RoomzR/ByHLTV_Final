import type { Metadata } from "next";

import { PlayersView } from "@/components/players/players-view";

export const metadata: Metadata = { title: "Players" };

export default function PlayersPage() {
  return <PlayersView />;
}
