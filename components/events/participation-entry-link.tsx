"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ParticipationEntryLink({ type, targetId, title }: { type: "event" | "exhibition"; targetId: string; title: string }) {
  const [available, setAvailable] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    fetch(`/api/participation/${type}/${targetId}`).then(response => { if (active) setAvailable(response.ok); }).catch(() => { if (active) setAvailable(false); });
    return () => { active = false; };
  }, [type, targetId]);

  if (!available) return null;
  return <section className="my-8 rounded-xl border border-orange/30 bg-orange/5 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-orange">Registration open</p><h2 className="mt-2 text-xl font-bold">Join {title}</h2><p className="mt-1 text-sm text-muted">Complete the participation form to send your request to the organizers.</p><Link href={`/participate/${type}/${targetId}`} className="button button-primary mt-4 inline-flex items-center gap-2">Open registration form<ArrowRight size={16}/></Link></section>;
}
