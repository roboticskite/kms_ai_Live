import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Search,
  Upload,
  X,
  Eye,
  EyeOff,
  MoveHorizontal,
  MoveVertical,
  RotateCw,
  Scaling,
} from "lucide-react";
import { useEditorStore } from "../store/editorStore";
import { getBuiltinSprites, readFileAsDataURL } from "../utils/helpers";
import { memo,  useMemo, useRef, useState  } from "react";

const SPRITE_CATEGORY_GROUPS = {
  Animals: ["Cat", "Bird", "Fish", "Butterfly", "Dinosaur", "Dog", "Rabbit", "Panda", "Tiger", "Bear", "Frog", "Penguin", "Turtle", "Owl", "Lion", "Monkey", "Elephant", "Giraffe", "Snake", "Octopus"],
  People: ["Boy", "Girl"],
  Fantasy: ["Ghost", "Ghost2", "Wizard", "Princess", "Dragon", "Unicorn"],
  Robots: ["Robot"],
  Space: ["Rocket", "Planet", "Astronaut", "Alien"],
  Food: ["Apple", "Cake", "Pizza", "Mushroom"],
  Vehicles: ["Car"],
} as const;

const SPRITE_CATEGORIES = ["All", ...Object.keys(SPRITE_CATEGORY_GROUPS), "Things"];

function getSpriteCategory(name: string) {
  return Object.entries(SPRITE_CATEGORY_GROUPS).find(([, names]) =>
    (names as readonly string[]).includes(name)
  )?.[0] ?? "Things";
}

function SpritePanel() {
  const {
    project,
    selectedSpriteId,
    selectSprite,
    addSprite,
    deleteSprite,
    duplicateSprite,
    updateSprite,
  } = useEditorStore();

  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [spriteSearch, setSpriteSearch] = useState("");
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const builtinSprites = useMemo(() => getBuiltinSprites(), []);
  const filteredSprites = builtinSprites.filter((sprite) => {
    const matchesCategory = activeCategory === "All" || getSpriteCategory(sprite.name) === activeCategory;
    const matchesSearch = sprite.name.toLowerCase().includes(spriteSearch.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      const image = new Image();
      image.onload = () => {
        addSprite(file.name.replace(/\.[^.]+$/, ""), dataUrl, image.width, image.height);
        setShowPicker(false);
      };
      image.onerror = () => window.alert("This image could not be opened.");
      image.src = dataUrl;
    } catch {
      window.alert("This image could not be opened.");
    }
    e.target.value = "";
  };

  return (
    <div className="relative h-full min-h-0 bg-white p-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Sprites</span>
        <button className="btn-ghost h-7 w-7 p-0" onClick={() => setShowPicker(true)} title="Add sprite">
          <Plus size={16} />
        </button>
      </div>

      {showPicker && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/45 p-3 sm:p-6"
          onMouseDown={(e) => e.target === e.currentTarget && setShowPicker(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sprite-library-title"
            className="flex h-[min(780px,calc(100dvh-24px))] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-6">
              <button
                className="btn-ghost h-9 w-9 shrink-0 p-0"
                onClick={() => setShowPicker(false)}
                title="Back to workspace"
                aria-label="Back to workspace"
              >
                <ArrowLeft size={19} />
              </button>
              <div className="min-w-0 flex-1">
                <h2 id="sprite-library-title" className="text-base font-bold text-gray-900 sm:text-lg">Choose a sprite</h2>
                <p className="text-xs text-gray-500">{filteredSprites.length} sprites available</p>
              </div>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCustomUpload}
              />
              <button
                className="btn-primary h-9 shrink-0 px-2.5 text-xs sm:px-3"
                onClick={() => uploadInputRef.current?.click()}
                title="Upload a custom sprite"
              >
                <Upload size={15} />
                <span className="hidden sm:inline">Upload custom sprite</span>
                <span className="sm:hidden">Upload</span>
              </button>
              <button
                className="btn-ghost h-9 w-9 shrink-0 p-0"
                onClick={() => setShowPicker(false)}
                title="Close sprite library"
                aria-label="Close sprite library"
              >
                <X size={18} />
              </button>
            </header>

            <div className="shrink-0 space-y-3 border-b border-gray-100 px-4 py-3 sm:px-6">
              <label className="relative block">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={spriteSearch}
                  onChange={(e) => setSpriteSearch(e.target.value)}
                  placeholder={'Search sprites, e.g. "cat", "robot", "space"'}
                  aria-label="Search sprites"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-kite-400 focus:bg-white"
                />
              </label>
              <div className="flex gap-2 overflow-x-auto scrollbar-thin" role="tablist" aria-label="Sprite categories">
                {SPRITE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    role="tab"
                    aria-selected={activeCategory === category}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      activeCategory === category
                        ? "bg-kite-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {filteredSprites.length > 0 ? (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 lg:grid-cols-8">
                  {filteredSprites.map((sprite) => (
                    <button
                      key={sprite.name}
                      className="flex aspect-square min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-2 transition-colors hover:border-kite-400 hover:bg-kite-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kite-400"
                      onClick={() => {
                        addSprite(sprite.name, sprite.dataUrl, sprite.width, sprite.height);
                        setShowPicker(false);
                      }}
                      title={`Add ${sprite.name}`}
                    >
                      <img src={sprite.dataUrl} alt="" className="min-h-0 w-full flex-1 object-contain" />
                      <span className="max-w-full truncate text-xs font-medium text-gray-600">{sprite.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-gray-500">No sprites found. Try another search.</p>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {project.sprites.map((sprite) => (
          <div
            key={sprite.id}
            className={`relative shrink-0 w-16 h-16 rounded-xl border-2 cursor-pointer transition-all group ${
              selectedSpriteId === sprite.id ? "border-kite-500 bg-kite-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
            }`}
            onClick={() => selectSprite(sprite.id)}
          >
            <div className="w-full h-full p-2 flex items-center justify-center">
              <img
                src={sprite.costumes[sprite.currentCostume]?.dataUrl ?? ""}
                alt={sprite.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 text-xs px-1 py-0.5 bg-black/50 text-white truncate rounded-b-lg">
              {sprite.name}
            </div>
            <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
              <button
                className="p-1 bg-white/80 rounded shadow-sm hover:bg-white"
                onClick={(e) => { e.stopPropagation(); duplicateSprite(sprite.id); }}
                title="Duplicate"
              >
                <Copy size={12} />
              </button>
              {project.sprites.length > 1 && (
                <button
                  className="p-1 bg-white/80 rounded shadow-sm hover:bg-white text-red-500"
                  onClick={(e) => { e.stopPropagation(); deleteSprite(sprite.id); }}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedSpriteId && (
        <SpriteProperties
          spriteId={selectedSpriteId}
          onUpdate={updateSprite}
        />
      )}
    </div>
  );
}

function SpriteProperties({
  spriteId,
  onUpdate,
}: {
  spriteId: string;
  onUpdate: (id: string, updates: any) => void;
}) {
  const { project } = useEditorStore();
  const [openControl, setOpenControl] = useState<string | null>(null);
  const sprite = project.sprites.find((s) => s.id === spriteId);
  if (!sprite) return null;

  const controls = [
    { key: "x", label: "X", icon: MoveHorizontal, min: -240, max: 240 },
    { key: "y", label: "Y", icon: MoveVertical, min: -180, max: 180 },
    { key: "size", label: "Size", icon: Scaling, min: 1, max: 300 },
    { key: "direction", label: "Direction", icon: RotateCw, min: -180, max: 180 },
  ] as const;

  return (
    <div className="grid min-w-0 grid-cols-2 items-center gap-1.5 text-[11px] text-gray-600">
      <div className="flex h-7 items-center gap-1">
        <span>Show</span>
        <button
          className={`rounded-l border p-1 ${sprite.visible ? "border-kite-400 bg-kite-50 text-kite-700" : "border-gray-200 text-gray-400"}`}
          onClick={() => onUpdate(spriteId, { visible: true })}
          title="Show sprite"
          aria-label="Show sprite"
          aria-pressed={sprite.visible}
        >
          <Eye size={14} />
        </button>
        <button
          className={`rounded-r border border-l-0 p-1 ${!sprite.visible ? "border-kite-400 bg-kite-50 text-kite-700" : "border-gray-200 text-gray-400"}`}
          onClick={() => onUpdate(spriteId, { visible: false })}
          title="Hide sprite"
          aria-label="Hide sprite"
          aria-pressed={!sprite.visible}
        >
          <EyeOff size={14} />
        </button>
      </div>

      {controls.map(({ key, label, icon: Icon, min, max }) => (
        <div key={key} className="relative">
          <button
            className="flex h-7 min-w-0 items-center justify-between gap-1 rounded-full border border-gray-200 bg-white px-2 text-xs hover:border-kite-400"
            onClick={() => setOpenControl((current) => current === key ? null : key)}
            aria-expanded={openControl === key}
            title={`Adjust ${label.toLowerCase()}`}
          >
            <Icon size={13} />
            <span>{label}</span>
            <span className="min-w-6 text-center font-medium text-gray-800">{Math.round(sprite[key])}</span>
          </button>
          {openControl === key && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-48 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-700">
                <span>{label}</span>
                <span>{Math.round(sprite[key])}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step="1"
                value={sprite[key]}
                onChange={(e) => onUpdate(spriteId, { [key]: Number(e.target.value) })}
                aria-label={`${label} slider`}
                className="w-full accent-kite-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>{min}</span>
                <span>{max}</span>
              </div>
            </div>
          )}
        </div>
      ))}

    </div>
  );
}

export default memo(SpritePanel);
