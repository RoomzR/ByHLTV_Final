import type { Metadata } from "next";

import { PlayersView } from "@/components/players/players-view";

export const metadata: Metadata = { title: "Retired Players" };

export default function RetiredPlayersPage() {
  return (
    <PlayersView
      status="RETIRED"
      titleKey="players.retiredTitle"
      subtitleKey="players.retiredSubtitle"
    />
  );
}
