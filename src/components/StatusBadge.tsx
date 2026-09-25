import type { NodeView } from "./KnowledgeGraph";
import { Badge } from "./ui";

export function StatusBadge({ view }: { view: NodeView | undefined }) {
  if (!view) return <Badge>Not assessed</Badge>;
  if (view.status === "mastered") return <Badge tone="good">{view.verdict === "inferred" ? "Solid · inferred" : "Solid"}</Badge>;
  if (view.status === "shaky") return <Badge tone="warn">Shaky</Badge>;
  if (view.status === "gap")
    return view.verdict === "blocked" ? (
      <Badge tone="bad">Blocked</Badge>
    ) : (
      <Badge tone="bad" className="font-semibold">
        Root gap
      </Badge>
    );
  return <Badge>Not assessed</Badge>;
}
