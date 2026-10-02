import { useEffect, useMemo, useRef } from "react";

interface BlockLibrarySection {
  key: string;
  label: string;
  color: string;
  blocks: string[];
}

const BLOCK_LIBRARY: BlockLibrarySection[] = [
  {
    key: "motion",
    label: "Motion",
    color: "#4c97ff",
    blocks: [
      "move 10 steps",
      "move -10 steps",
      "turn right 15°",
      "turn left 15°",
      "go to x: 0 y: 0",
      "point in direction 90",
      "set x to 0",
      "set y to 0",
      "change x by 10",
      "change y by 10",
    ],
  },
  {
    key: "looks",
    label: "Looks",
    color: "#9966ff",
    blocks: [
      "say Hello!",
      "say Hello! for 2 seconds",
      "think Hmm...",
      "think Hmm... for 2 seconds",
      "show",
      "hide",
      "next costume",
      "switch costume to Tobi",
      "switch backdrop to backdrop1",
      "change size by 10",
    ],
  },
  {
    key: "sound",
    label: "Sound",
    color: "#cf63cf",
    blocks: [
      "play sound meow",
      "play sound pop",
      "stop all sounds",
      "change volume by 10",
      "set volume to 100",
      "volume",
    ],
  },
  {
    key: "events",
    label: "Events",
    color: "#ffbf00",
    blocks: [
      "when green flag clicked",
      "when this sprite clicked",
      "when key space pressed",
      "broadcast message1",
      "when I receive message1",
      "wait 1 seconds",
    ],
  },
  {
    key: "control",
    label: "Control",
    color: "#ffab19",
    blocks: [
      "wait 1 seconds",
      "repeat 10",
      "forever",
      "if on edge, bounce",
      "if <> then",
      "stop all",
    ],
  },
  {
    key: "sensing",
    label: "Sensing",
    color: "#5cb1d6",
    blocks: [
      "touching color ?",
      "distance to mouse-pointer",
      "key space pressed?",
      "ask and wait",
      "answer",
      "timer",
    ],
  },
  {
    key: "operators",
    label: "Operators",
    color: "#59c059",
    blocks: [
      "+",
      "-",
      "*",
      "/",
      "pick random 1 to 10",
      "join hello world",
      "<",
      ">",
      "=",
    ],
  },
  {
    key: "variables",
    label: "Variables",
    color: "#ff8c1a",
    blocks: [
      "set score to 0",
      "change score by 1",
      "score",
      "show variable score",
      "hide variable score",
      "make a variable",
    ],
  },
  {
    key: "functions",
    label: "Functions",
    color: "#ff6680",
    blocks: [
      "define my block",
      "call my block",
      "return",
      "broadcast message1",
    ],
  },
];

interface Props {
  activeCategory: string | null;
  onSelectCategory: (name: string) => void;
}

export default function BlockLibraryPanel({ activeCategory, onSelectCategory }: Props) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!activeCategory) return;
    const section = sectionRefs.current[activeCategory];
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeCategory]);

  const visibleSections = useMemo(
    () => BLOCK_LIBRARY.filter((section) => section.key === activeCategory || section.key === "motion" || section.key === "looks" || section.key === "events" || section.key === "control" || section.key === "sound" || section.key === "sensing" || section.key === "operators" || section.key === "variables" || section.key === "functions"),
    [activeCategory],
  );

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        background: "#f3f4f6",
        borderRight: "1px solid #e5e7eb",
        height: "100%",
        overflowY: "auto",
        scrollbarWidth: "thin",
        scrollBehavior: "smooth",
      }}
      className="scrollbar-thin"
    >
      <div style={{ padding: "10px 10px 18px" }}>
        {visibleSections.map((section) => {
          const isActive = activeCategory === section.key;
          const titleColor = section.color;

          return (
            <div
              key={section.key}
              ref={(node) => {
                sectionRefs.current[section.key] = node;
              }}
              style={{
                marginBottom: 18,
                padding: 0,
                borderRadius: 12,
                border: isActive ? `1px solid ${titleColor}55` : "1px solid transparent",
                background: isActive ? `${titleColor}12` : "transparent",
                scrollSnapAlign: "start",
              }}
            >
              <button
                type="button"
                onClick={() => onSelectCategory(section.key)}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  padding: "8px 10px 6px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 15,
                  color: titleColor,
                }}
              >
                {section.label}
              </button>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 8px 8px" }}>
                {section.blocks.map((block) => (
                  <div
                    key={`${section.key}-${block}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      minHeight: 34,
                      padding: "0 10px",
                      borderRadius: 14,
                      background: "#f8fafc",
                      border: `2px solid ${titleColor}`,
                      boxShadow: "inset 0 -2px 0 rgba(15, 23, 42, 0.05)",
                      color: "#111827",
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={block}
                  >
                    {block}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
