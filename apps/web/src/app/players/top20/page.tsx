import type { Metadata } from "next";

import { AwardsView } from "@/components/players/awards-view";

export const metadata: Metadata = { title: "Top 20" };

export default function Top20Page() {
  return <AwardsView kind="TOP20" />;
}
