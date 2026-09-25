import { ButtonLink, PageShell } from "@/components/ui";

export default function NotFound() {
  return (
    <PageShell className="flex flex-col items-center py-28 text-center">
      <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-3">404</p>
      <h1 className="mt-3 font-serif text-[44px] leading-tight">This page has a gap.</h1>
      <p className="mt-2 max-w-sm text-ink-2">We couldn&rsquo;t find what you were looking for — but we can find what you&rsquo;re missing in maths or circuits.</p>
      <div className="mt-7 flex gap-3">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/courses" variant="secondary">
          Browse courses
        </ButtonLink>
      </div>
    </PageShell>
  );
}
