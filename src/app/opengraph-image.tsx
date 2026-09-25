import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Rootwise — Students don't fail topics. They fail prerequisites.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (f: string) => readFile(join(process.cwd(), "assets/og", f));

/** Social preview card: the headline plus a miniature knowledge graph with one root gap lit. */
export default async function Image() {
  const [serif, serifItalic, sans, sansBold] = await Promise.all([
    font("instrument-serif-latin-400-normal.woff"),
    font("instrument-serif-latin-400-italic.woff"),
    font("geist-sans-latin-400-normal.woff"),
    font("geist-sans-latin-600-normal.woff"),
  ]);
  const node = (x: number, y: number, label: string, kind: "ok" | "root" | "blocked") => (
    <div
      key={label}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 170,
        height: 50,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        paddingLeft: 16,
        fontSize: 18,
        fontFamily: "Geist",
        fontWeight: 600,
        background: kind === "root" ? "#d0382e" : kind === "blocked" ? "#fbe5e2" : "#e2f2e9",
        color: kind === "root" ? "#fff" : "#16201b",
        border: `2px ${kind === "blocked" ? "dashed" : "solid"} ${kind === "ok" ? "#2f9e6b" : "#d0382e"}`,
      }}
    >
      {label}
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f4ee", padding: 64, position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Instrument Serif", fontSize: 40, color: "#16201b" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#16201b", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: "#e5484d" }} />
            </div>
            Rootwise
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 70, fontFamily: "Instrument Serif", fontSize: 76, lineHeight: 1.02, color: "#16201b" }}>
            <span>Students don&apos;t fail topics.</span>
            <span style={{ display: "flex" }}>
              They fail&nbsp;<span style={{ fontFamily: "Instrument Serif Italic", color: "#a3291f" }}>prerequisites.</span>
            </span>
          </div>
          <div style={{ marginTop: 36, fontFamily: "Geist", fontSize: 26, color: "#4b5750", lineHeight: 1.4, display: "flex" }}>
            An AI diagnostic tutor that traces every wrong answer to the concept that&apos;s really missing.
          </div>
        </div>
        <div style={{ position: "absolute", right: 64, top: 110, width: 420, height: 420, display: "flex" }}>
          {node(125, 0, "Word problems", "blocked")}
          {node(20, 95, "Solving", "blocked")}
          {node(230, 95, "Formula", "ok")}
          {node(20, 190, "Factorising", "blocked")}
          {node(230, 190, "Standard form", "ok")}
          {node(20, 285, "Product–sum", "root")}
          {node(230, 285, "Brackets", "ok")}
          <div style={{ position: "absolute", left: 32, top: 258, background: "#d0382e", color: "#fff", fontFamily: "Geist", fontWeight: 600, fontSize: 13, letterSpacing: 2, padding: "3px 10px", borderRadius: 10, display: "flex" }}>
            ROOT GAP
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
        { name: "Instrument Serif Italic", data: serifItalic, style: "normal", weight: 400 },
        { name: "Geist", data: sans, style: "normal", weight: 400 },
        { name: "Geist", data: sansBold, style: "normal", weight: 600 },
      ],
    },
  );
}
