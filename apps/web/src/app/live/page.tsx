import type { Metadata } from "next";

import { LiveView } from "@/components/matches/live-view";

export const metadata: Metadata = {
  title: "Live",
};

export default function LivePage() {
  return <LiveView />;
}
