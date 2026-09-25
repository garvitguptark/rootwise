"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Eyebrow, PageShell } from "@/components/ui";

export default function JoinCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const go = () => clean.length === 6 && router.push(`/join/${clean}`);
  return (
    <PageShell className="max-w-lg py-16">
      <Eyebrow>Join a class</Eyebrow>
      <Card className="mt-4 p-6">
        <h1 className="font-serif text-[34px] leading-tight">Enter your class code</h1>
        <label htmlFor="class-code" className="sr-only">
          Class code
        </label>
        <input
          id="class-code"
          value={clean}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="ABC234"
          autoFocus
          className="mt-4 h-14 w-full rounded-xl border border-line-2 bg-surface px-4 text-center font-mono text-[26px] tracking-[0.3em] uppercase outline-none focus:border-ink"
        />
        <Button size="lg" className="mt-4 w-full" disabled={clean.length !== 6} onClick={go}>
          Continue <ArrowRight className="size-4" />
        </Button>
      </Card>
    </PageShell>
  );
}
