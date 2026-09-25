"use client";

import clsx from "clsx";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buildGraph, layers } from "@/lib/engine/graph";
import type { ConceptStatus } from "@/lib/engine/types";
import type { Course } from "@/lib/schema";

export interface NodeView {
  p: number;
  status: ConceptStatus;
  verdict?: string;
  evidence?: string;
}

interface Props {
  course: Course;
  view?: Record<string, NodeView | undefined>;
  activeId?: string | null;
  focusIds?: string[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  appearing?: boolean;
  className?: string;
  /** Minimum rendered width before the graph scrolls horizontally (small screens). */
  minWidth?: number;
  /** Vertical spacing between layers. */
  density?: "comfortable" | "compact";
  label?: string;
}

const W = 156;
const GAP_X = 26;
const PAD = 20;
const TOP = 30;

interface Layout {
  pos: Map<string, { x: number; y: number; layer: number }>;
  width: number;
  height: number;
  edges: { from: string; to: string; fromOffset: number; toOffset: number }[];
}

function computeLayout(course: Course, H: number, GAP_Y: number): Layout {
  const g = buildGraph(course.concepts);
  const layer = layers(g);
  const maxLayer = Math.max(0, ...layer.values());
  const rows: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const id of g.ids) rows[layer.get(id)!].push(id);

  // Barycentric ordering to reduce edge crossings (a few up/down sweeps).
  const order = new Map<string, number>();
  const setOrder = () => rows.forEach((r) => r.forEach((id, i) => order.set(id, i - (r.length - 1) / 2)));
  setOrder();
  const avg = (xs: number[], fallback: number) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : fallback);
  for (let iter = 0; iter < 4; iter++) {
    for (let l = 1; l <= maxLayer; l++) {
      rows[l].sort((a, b) => avg(g.prereqs.get(a)!.map((p) => order.get(p)!), order.get(a)!) - avg(g.prereqs.get(b)!.map((p) => order.get(p)!), order.get(b)!));
      setOrder();
    }
    for (let l = maxLayer - 1; l >= 0; l--) {
      rows[l].sort((a, b) => avg(g.dependents.get(a)!.map((p) => order.get(p)!), order.get(a)!) - avg(g.dependents.get(b)!.map((p) => order.get(p)!), order.get(b)!));
      setOrder();
    }
  }

  const maxCount = Math.max(...rows.map((r) => r.length));
  const width = maxCount * (W + GAP_X) - GAP_X + PAD * 2;
  const height = rows.length * (H + GAP_Y) - GAP_Y + PAD + TOP;
  const pos = new Map<string, { x: number; y: number; layer: number }>();
  rows.forEach((r, l) => {
    const rowWidth = r.length * (W + GAP_X) - GAP_X;
    const x0 = (width - rowWidth) / 2;
    const y = TOP + (maxLayer - l) * (H + GAP_Y); // foundations at the bottom — the roots
    r.forEach((id, i) => pos.set(id, { x: x0 + i * (W + GAP_X), y, layer: l }));
  });

  // Fan out edge endpoints so parallel edges don't overlap.
  const edges: Layout["edges"] = [];
  for (const id of g.ids) {
    const ps = [...g.prereqs.get(id)!].sort((a, b) => pos.get(a)!.x - pos.get(b)!.x);
    ps.forEach((p, i) => {
      const deps = [...g.dependents.get(p)!].sort((a, b) => pos.get(a)!.x - pos.get(b)!.x);
      const j = deps.indexOf(id);
      edges.push({
        from: p,
        to: id,
        toOffset: (i - (ps.length - 1) / 2) * 14,
        fromOffset: (j - (deps.length - 1) / 2) * 14,
      });
    });
  }
  return { pos, width, height, edges };
}

function wrap(name: string, max = 19): string[] {
  const words = name.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= max) cur = (cur + " " + w).trim();
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) {
    const second = lines.slice(1).join(" ");
    return [lines[0], second.length > max ? second.slice(0, max - 1) + "…" : second];
  }
  return lines.map((l) => (l.length > max + 2 ? l.slice(0, max) + "…" : l));
}

type Look = {
  fill: string;
  stroke: string;
  text: string;
  dash?: string;
  bar: string;
  icon?: "check" | "tilde" | "bang" | "target" | "dots";
  iconBg?: string;
  pulse?: string;
  tag?: string;
  opacity?: number;
  strokeWidth?: number;
  label: string;
};

function lookFor(v: NodeView | undefined, active: boolean): Look {
  if (active) {
    return { fill: "var(--accent-soft)", stroke: "var(--accent)", text: "var(--ink)", bar: "var(--accent)", pulse: "var(--accent)", strokeWidth: 2, icon: "dots", iconBg: "var(--accent)", label: "Being checked now" };
  }
  if (!v) return { fill: "var(--surface)", stroke: "var(--line-2)", text: "var(--ink-2)", bar: "var(--unknown)", label: "Not assessed yet" };
  switch (v.status) {
    case "mastered":
      return v.verdict === "inferred"
        ? { fill: "var(--good-soft)", stroke: "var(--good)", text: "var(--ink)", dash: "4 4", bar: "var(--good)", icon: "check", iconBg: "var(--good)", opacity: 0.9, label: "Solid (inferred)" }
        : { fill: "var(--good-soft)", stroke: "var(--good)", text: "var(--ink)", bar: "var(--good)", icon: "check", iconBg: "var(--good)", label: "Solid" };
    case "shaky":
      return { fill: "var(--warn-soft)", stroke: "var(--warn)", text: "var(--ink)", bar: "var(--warn)", icon: "tilde", iconBg: "var(--warn)", label: "Shaky" };
    case "gap":
      if (v.verdict === "root")
        return { fill: "var(--bad)", stroke: "var(--bad)", text: "#fff", bar: "rgba(255,255,255,.85)", icon: "target", iconBg: "#fff", pulse: "var(--bad)", tag: "ROOT GAP", strokeWidth: 2, label: "Root gap" };
      if (v.verdict === "blocked")
        return { fill: "var(--bad-soft)", stroke: "var(--bad)", text: "var(--ink)", dash: "5 4", bar: "var(--bad)", icon: "bang", iconBg: "var(--bad)", label: "Blocked by a gap below" };
      return { fill: "var(--bad-soft)", stroke: "var(--bad)", text: "var(--ink)", bar: "var(--bad)", icon: "bang", iconBg: "var(--bad)", label: "Likely gap" };
    case "probing":
      return { fill: "var(--surface)", stroke: "var(--line-2)", text: "var(--ink)", bar: "var(--accent)", label: "Assessed — not sure yet" };
    case "queued":
      return { fill: "var(--surface)", stroke: "var(--accent)", text: "var(--ink)", dash: "3 4", bar: "var(--accent)", label: "Queued" };
    default:
      return { fill: "var(--surface)", stroke: "var(--line-2)", text: "var(--ink-2)", bar: "var(--unknown)", label: "Not assessed yet" };
  }
}

function Icon({ kind, bg, x, y }: { kind: Look["icon"]; bg?: string; x: number; y: number }) {
  if (!kind) return null;
  const fg = kind === "target" ? "var(--bad)" : "#fff";
  return (
    <g transform={`translate(${x},${y})`} aria-hidden>
      <circle r="8" style={{ fill: bg }} />
      {kind === "check" && <path d="M-3.4 0.2 L-1 2.6 L3.6 -2.4" fill="none" stroke={fg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {kind === "tilde" && <path d="M-3.6 0.8 C-2 -1.8 -0.8 2.4 0.6 0 C1.6 -1.6 2.6 -0.8 3.6 -0.8" fill="none" stroke={fg} strokeWidth="1.7" strokeLinecap="round" />}
      {kind === "bang" && (
        <>
          <path d="M0 -3.8 V1" stroke={fg} strokeWidth="1.9" strokeLinecap="round" />
          <circle cy="3.4" r="1.05" fill={fg} />
        </>
      )}
      {kind === "target" && (
        <>
          <circle r="4.2" fill="none" stroke={fg} strokeWidth="1.5" />
          <circle r="1.6" fill={fg} />
        </>
      )}
      {kind === "dots" && [-3, 0, 3].map((cx, i) => <circle key={cx} cx={cx} r="1.1" fill={fg} className="typing-dot" style={{ animationDelay: `${i * 0.15}s` }} />)}
    </g>
  );
}

export function KnowledgeGraph({
  course,
  view = {},
  activeId,
  focusIds,
  selectedId,
  onSelect,
  appearing,
  className,
  minWidth = 620,
  label,
  density = "comfortable",
}: Props) {
  const H = density === "compact" ? 48 : 54;
  const layout = useMemo(() => computeLayout(course, H, density === "compact" ? 26 : 56), [course, H, density]);
  const [hover, setHover] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // On narrow screens the graph scrolls sideways: start centred, not at the left edge.
  useEffect(() => {
    const el = scroller.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [layout]);
  const uid = useId();
  const byId = useMemo(() => new Map(course.concepts.map((c) => [c.id, c])), [course]);
  const focus = new Set(focusIds ?? []);
  const hovered = hover ? byId.get(hover) : undefined;
  const hoverPos = hover ? layout.pos.get(hover) : undefined;

  const summary = course.concepts
    .map((c) => `${c.name}: ${lookFor(view[c.id], c.id === activeId).label}${view[c.id] ? ` (${Math.round(view[c.id]!.p * 100)}%)` : ""}`)
    .join("; ");

  return (
    <div ref={scroller} className={clsx("relative w-full overflow-x-auto scrollbar-thin", className)}>
      <div className="relative mx-auto" style={{ minWidth: Math.min(minWidth, layout.width), maxWidth: layout.width * 1.08 }}>
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="block h-auto w-full select-none"
          role={onSelect ? "group" : "img"}
          aria-labelledby={`${uid}-t ${uid}-d`}
        >
          <title id={`${uid}-t`}>{label ?? `Knowledge graph for ${course.title}`}</title>
          <desc id={`${uid}-d`}>{summary}</desc>

          {/* edges */}
          <g fill="none">
            {layout.edges.map((e) => {
              const a = layout.pos.get(e.from)!;
              const b = layout.pos.get(e.to)!;
              const x1 = a.x + W / 2 + e.fromOffset;
              const y1 = a.y;
              const x2 = b.x + W / 2 + e.toOffset;
              const y2 = b.y + H;
              const dy = y1 - y2;
              const d = `M ${x1} ${y1} C ${x1} ${y1 - dy * 0.5}, ${x2} ${y2 + dy * 0.5}, ${x2} ${y2}`;
              const va = view[e.from];
              const vb = view[e.to];
              const blocked = va?.status === "gap" && vb?.status === "gap";
              const solid = va?.status === "mastered" && vb?.status === "mastered";
              const touchesActive = activeId && (e.from === activeId || e.to === activeId);
              const touchesHover = hover && (e.from === hover || e.to === hover);
              const stroke = blocked ? "var(--bad)" : touchesActive || touchesHover ? "var(--accent)" : solid ? "var(--good)" : "var(--line-2)";
              return (
                <path
                  key={`${e.from}-${e.to}`}
                  d={d}
                  className={clsx("kg-edge", blocked && "kg-flow")}
                  style={{ stroke, opacity: blocked ? 0.9 : solid ? 0.55 : touchesActive || touchesHover ? 0.9 : 1 }}
                  strokeWidth={blocked || touchesActive ? 2 : 1.5}
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* nodes */}
          {course.concepts.map((c) => {
            const p = layout.pos.get(c.id)!;
            const v = view[c.id];
            const active = c.id === activeId;
            const look = lookFor(v, active);
            const lines = wrap(c.name);
            const selected = selectedId === c.id;
            const interactive = !!onSelect;
            const prob = v ? Math.max(0, Math.min(1, v.p)) : 0;
            return (
              <g
                key={c.id}
                transform={`translate(${p.x},${p.y})`}
                className={clsx("kg-node-group outline-none", interactive && "cursor-pointer")}
                style={{ opacity: look.opacity ?? 1 }}
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover((h) => (h === c.id ? null : h))}
                onFocus={() => setHover(c.id)}
                onBlur={() => setHover((h) => (h === c.id ? null : h))}
                onClick={interactive ? () => onSelect!(c.id) : undefined}
                onKeyDown={
                  interactive
                    ? (ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          onSelect!(c.id);
                        }
                      }
                    : undefined
                }
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-label={interactive ? `${c.name} — ${look.label}` : undefined}
              >
                <g className={appearing ? "kg-appear" : undefined} style={appearing ? { animationDelay: `${p.layer * 140 + 60}ms` } : undefined}>
                  {look.pulse && <rect width={W} height={H} rx={14} className="kg-pulse" style={{ fill: "none", stroke: look.pulse }} strokeWidth={3} />}
                  {(selected || focus.has(c.id)) && (
                    <rect x={-4} y={-4} width={W + 8} height={H + 8} rx={17} style={{ fill: "none", stroke: selected ? "var(--ink)" : "var(--accent)" }} strokeWidth={1.5} strokeDasharray={selected ? undefined : "2 3"} />
                  )}
                  <rect
                    width={W}
                    height={H}
                    rx={14}
                    className="kg-node"
                    style={{ fill: look.fill, stroke: look.stroke, filter: hover === c.id ? "drop-shadow(0 4px 10px rgb(0 0 0 / .12))" : undefined }}
                    strokeWidth={look.strokeWidth ?? 1.5}
                    strokeDasharray={look.dash}
                  />
                  <text
                    x={14}
                    y={lines.length > 1 ? H / 2 - 6 : H / 2 + 1}
                    style={{ fill: look.text, fontSize: 12.5, fontWeight: 560, letterSpacing: "-0.01em" }}
                    className="kg-node font-sans"
                  >
                    {lines.map((l, i) => (
                      <tspan key={i} x={14} dy={i === 0 ? 0 : 15}>
                        {l}
                      </tspan>
                    ))}
                  </text>
                  <rect x={14} y={H - 9} width={W - 28} height={3} rx={1.5} style={{ fill: look.fill === "var(--bad)" ? "rgba(255,255,255,.3)" : "var(--surface-3)" }} />
                  <rect
                    x={14}
                    y={H - 9}
                    width={(W - 28) * prob}
                    height={3}
                    rx={1.5}
                    style={{ fill: look.bar, transition: "width 600ms var(--ease-out)" }}
                  />
                  <Icon kind={look.icon} bg={look.iconBg} x={W - 4} y={4} />
                  {look.tag && (
                    <g transform={`translate(${W / 2 - 34},-22)`}>
                      <rect width={68} height={17} rx={8.5} style={{ fill: "var(--bad)" }} />
                      <text x={34} y={12} textAnchor="middle" style={{ fill: "#fff", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em" }} className="font-mono">
                        {look.tag}
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </svg>

        {hovered && hoverPos && (
          <div
            className="pointer-events-none absolute z-10 w-60 -translate-x-1/2 rounded-xl border border-line bg-surface p-3 text-left shadow-lift"
            style={{
              left: `${((hoverPos.x + W / 2) / layout.width) * 100}%`,
              top: `${((hoverPos.y + H + 8) / layout.height) * 100}%`,
            }}
            role="tooltip"
          >
            <p className="text-[13px] font-semibold leading-snug">{hovered.name}</p>
            <p className="mt-1 text-[12px] leading-snug text-ink-2">{hovered.summary}</p>
            <p className="mt-2 flex items-center justify-between font-mono text-[11px] text-ink-3">
              <span>{lookFor(view[hovered.id], hovered.id === activeId).label}</span>
              {view[hovered.id] && <span>{Math.round(view[hovered.id]!.p * 100)}% known</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusLegend({ className, compact }: { className?: string; compact?: boolean }) {
  const items: [string, string, string, string?][] = [
    ["Solid", "var(--good-soft)", "var(--good)"],
    ["Shaky", "var(--warn-soft)", "var(--warn)"],
    ["Root gap", "var(--bad)", "var(--bad)"],
    ["Blocked", "var(--bad-soft)", "var(--bad)", "3 2"],
    ["Checking", "var(--accent-soft)", "var(--accent)"],
    ["Not assessed", "var(--surface)", "var(--line-2)"],
  ];
  return (
    <ul className={clsx("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-2", className)} aria-label="Legend">
      {items.slice(0, compact ? 4 : items.length).map(([label, fill, stroke, dash]) => (
        <li key={label} className="flex items-center gap-1.5">
          <svg width="16" height="12" aria-hidden>
            <rect x="1" y="1" width="14" height="10" rx="3.5" style={{ fill, stroke }} strokeWidth="1.5" strokeDasharray={dash} />
          </svg>
          {label}
        </li>
      ))}
    </ul>
  );
}
