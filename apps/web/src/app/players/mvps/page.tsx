import type { Metadata } from "next";

import { AwardsView } from "@/components/players/awards-view";

export const metadata: Metadata = { title: "MVPs" };

export default function MvpsPage() {
  return <AwardsView kind="MVP" />;
}
