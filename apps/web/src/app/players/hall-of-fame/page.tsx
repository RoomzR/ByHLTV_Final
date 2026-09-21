import type { Metadata } from "next";

import { AwardsView } from "@/components/players/awards-view";

export const metadata: Metadata = { title: "Hall of Fame" };

export default function HallOfFamePage() {
  return <AwardsView kind="HALL_OF_FAME" />;
}
