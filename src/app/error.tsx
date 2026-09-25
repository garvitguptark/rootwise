"use client";

import { useEffect } from "react";
import { Button, ButtonLink, PageShell } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <PageShell className="flex flex-col items-center py-28 text-center">
      <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-3">Something broke</p>
      <h1 className="mt-3 font-serif text-[44px] leading-tight">Sorry — that didn&rsquo;t work.</h1>
      <p className="mt-2 max-w-md text-ink-2">
        Your progress is saved on this device. Try again, or head back to your courses.
      </p>
      <div className="mt-7 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/courses" variant="secondary">
          My courses
        </ButtonLink>
      </div>
    </PageShell>
  );
}
