import { memo } from "react";
import {
  Move,
  Eye,
  Volume2,
  Flag,
  RefreshCw,
  Hand,
  Plus,
  Variable,
  FunctionSquare,
  PenTool,
  Gamepad2,
  Code2,
} from "lucide-react";

interface SidebarCategory {
  name: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

const SIDEBAR_CATEGORIES: SidebarCategory[] = [
  { name: "Motion",    label: "Motion",    color: "#4c97ff", icon: <Move size={18} strokeWidth={2.2} /> },
  { name: "Looks",     label: "Looks",     color: "#9966ff", icon: <Eye size={18} strokeWidth={2.2} /> },
  { name: "Sound",     label: "Sound",     color: "#cf63cf", icon: <Volume2 size={18} strokeWidth={2.2} /> },
  { name: "Events",    label: "Events",    color: "#ffbf00", icon: <Flag size={18} strokeWidth={2.2} /> },
  { name: "Control",   label: "Control",   color: "#ffab19", icon: <RefreshCw size={18} strokeWidth={2.2} /> },
  { name: "Sensing",   label: "Sensing",   color: "#5cb1d6", icon: <Hand size={18} strokeWidth={2.2} /> },
  { name: "Operators", label: "Operators", color: "#59c059", icon: <Plus size={18} strokeWidth={2.2} /> },
  { name: "Variables", label: "Variables", color: "#ff8c1a", icon: <Variable size={18} strokeWidth={2.2} /> },
  { name: "Functions", label: "Functions", color: "#ff6680", icon: <FunctionSquare size={18} strokeWidth={2.2} /> },
  { name: "Drawing",   label: "Drawing",   color: "#e8a0d6", icon: <PenTool size={18} strokeWidth={2.2} /> },
  { name: "Game",      label: "Game",      color: "#4caf50", icon: <Gamepad2 size={18} strokeWidth={2.2} /> },
  { name: "Advanced",  label: "Advanced",  color: "#795548", icon: <Code2 size={18} strokeWidth={2.2} /> },
];

interface Props {
  activeCategory: string | null;
  onSelectCategory: (name: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

function CategorySidebar({
  activeCategory,
  onSelectCategory,
  searchQuery,
}: Props) {
  const q = searchQuery?.toLowerCase().trim() || "";

  return (
    <div
      style={{
        width: 150,
        minWidth: 150,
        maxWidth: 150,
        background: "#f8fafc",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        height: "100%",
        paddingTop: 8,
        paddingBottom: 8,
      }}
      className="scrollbar-thin"
    >
      {SIDEBAR_CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.name;
        const matchesSearch = q && (cat.name.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q));

        return (
          <button
            key={cat.name}
            onClick={() => onSelectCategory(cat.name)}
            title={cat.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "7px 12px 7px 12px",
              border: "none",
              borderRadius: 0,
              cursor: "pointer",
              background: isActive ? `${cat.color}18` : matchesSearch ? `${cat.color}12` : "transparent",
              borderLeft: isActive ? `4px solid ${cat.color}` : matchesSearch ? `4px dashed ${cat.color}` : "4px solid transparent",
              transition: "all 0.15s ease",
              textAlign: "left",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = `${cat.color}0d`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }
            }}
          >
            {/* Colored circle icon */}
            <span
              style={{
                width: 34,
                height: 34,
                minWidth: 34,
                borderRadius: "50%",
                background: isActive ? cat.color : `${cat.color}28`,
                color: isActive ? "#fff" : cat.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                boxShadow: isActive ? `0 3px 10px ${cat.color}60` : "none",
              }}
            >
              {cat.icon}
            </span>
            {/* Category name */}
            <span
              style={{
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? cat.color : "#475569",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: 0.1,
                transition: "color 0.15s ease",
                userSelect: "none",
                whiteSpace: "nowrap",
              }}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default memo(CategorySidebar);
