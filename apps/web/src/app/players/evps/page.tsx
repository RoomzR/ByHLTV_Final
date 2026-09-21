import type { Metadata } from "next";

import { AwardsView } from "@/components/players/awards-view";

export const metadata: Metadata = { title: "EVPs" };

export default function EvpsPage() {
  return <AwardsView kind="EVP" />;
}
