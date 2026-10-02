import { ArrowLeft, ImagePlus, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { getBuiltinBackdrops, readFileAsDataURL } from "../utils/helpers";

const BACKDROP_CATEGORY_GROUPS = {
  Basic: ["Blank", "Stage"],
  Outdoors: ["Forest", "Beach", "Underwater", "Garden", "Desert"],
  Space: ["Space", "Night"],
  Places: ["City", "Castle"],
  Fun: ["Rainbow"],
  Sky: ["Sky", "Snow"],
} as const;

const BACKDROP_CATEGORIES = ["All", ...Object.keys(BACKDROP_CATEGORY_GROUPS)];

function getBackdropCategory(name: string) {
  return Object.entries(BACKDROP_CATEGORY_GROUPS).find(([, names]) =>
    (names as readonly string[]).includes(name)
  )?.[0] ?? "Basic";
}

export default function StagePanel() {
  const { project, setBackdrop, addBackdrop, deleteBackdrop } = useEditorStore();
  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const builtinBackdrops = useMemo(() => getBuiltinBackdrops(), []);
  const filteredBackdrops = builtinBackdrops.filter((backdrop) => {
    const matchesCategory = activeCategory === "All" || getBackdropCategory(backdrop.name) === activeCategory;
    const matchesSearch = backdrop.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleChooseBuiltin = (backdrop: { name: string; dataUrl: string }) => {
    const currentBackdrops = useEditorStore.getState().project.backdrops;
    const existingIndex = currentBackdrops.findIndex((item) => item.dataUrl === backdrop.dataUrl);
    if (existingIndex >= 0) {
      setBackdrop(existingIndex);
    } else {
      addBackdrop(backdrop.name, backdrop.dataUrl);
      setBackdrop(currentBackdrops.length);
    }
    setShowPicker(false);
  };

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      const currentCount = useEditorStore.getState().project.backdrops.length;
      addBackdrop(file.name.replace(/\.[^.]+$/, ""), dataUrl);
      setBackdrop(currentCount);
      setShowPicker(false);
    } catch {
      window.alert("This image could not be opened.");
    }
    e.target.value = "";
  };

  return (
    <aside className="relative flex w-[36%] min-w-32 max-w-[210px] shrink-0 flex-col gap-2 border-l border-gray-200 bg-white p-2">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-xs font-semibold text-gray-700">Backdrops</h2>
          <p className="text-[10px] text-gray-400">{project.backdrops.length} total</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            className="btn-ghost h-7 w-7 p-0"
            onClick={() => setShowPicker(true)}
            title="Choose a backdrop"
          >
            <ImagePlus size={15} />
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-1.5 overflow-x-hidden overflow-y-auto scrollbar-thin">
        {project.backdrops.map((backdrop, index) => (
          <div key={backdrop.id} className="group relative h-14 w-16 shrink-0">
            <button
              className={`h-full w-full overflow-hidden rounded-lg border-2 transition-colors ${
                project.currentBackdrop === index
                  ? "border-kite-500"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              onClick={() => setBackdrop(index)}
              title={backdrop.name}
              aria-label={`Choose backdrop ${backdrop.name}`}
              aria-pressed={project.currentBackdrop === index}
            >
              <img src={backdrop.dataUrl} alt="" className="h-full w-full object-cover" />
            </button>
            {project.backdrops.length > 1 && (
              <button
                className="absolute right-0.5 top-0.5 hidden rounded bg-white/90 p-1 text-red-600 shadow group-hover:block focus:block"
                onClick={() => deleteBackdrop(index)}
                title={`Delete backdrop ${backdrop.name}`}
                aria-label={`Delete backdrop ${backdrop.name}`}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        <button
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-kite-400 hover:text-kite-600"
          onClick={() => setShowPicker(true)}
          title="Add a backdrop"
        >
          <Plus size={18} />
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
            aria-labelledby="backdrop-library-title"
            className="flex h-[min(780px,calc(100dvh-24px))] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-6">
              <button
                className="btn-ghost h-9 w-9 shrink-0 p-0"
                onClick={() => setShowPicker(false)}
                title="Back to stage"
                aria-label="Back to stage"
              >
                <ArrowLeft size={19} />
              </button>
              <div className="min-w-0 flex-1">
                <h2 id="backdrop-library-title" className="text-base font-bold text-gray-900 sm:text-lg">Choose a backdrop</h2>
                <p className="text-xs text-gray-500">{filteredBackdrops.length} scenes available</p>
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
                title="Upload a custom backdrop"
              >
                <Upload size={15} />
                <span className="hidden sm:inline">Upload my backdrop</span>
                <span className="sm:hidden">Upload</span>
              </button>
              <button
                className="btn-ghost h-9 w-9 shrink-0 p-0"
                onClick={() => setShowPicker(false)}
                title="Close backdrop library"
                aria-label="Close backdrop library"
              >
                <X size={18} />
              </button>
            </header>

            <div className="shrink-0 space-y-3 border-b border-gray-100 px-4 py-3 sm:px-6">
              <label className="relative block">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search backdrops..."
                  aria-label="Search backdrops"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-kite-400 focus:bg-white"
                />
              </label>
              <div className="flex gap-2 overflow-x-auto scrollbar-thin" role="tablist" aria-label="Backdrop categories">
                {BACKDROP_CATEGORIES.map((category) => (
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
              {filteredBackdrops.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {filteredBackdrops.map((backdrop) => {
                    const selected = project.backdrops.some(
                      (item, index) => index === project.currentBackdrop && item.dataUrl === backdrop.dataUrl
                    );
                    return (
                      <button
                        key={backdrop.name}
                        className={`overflow-hidden rounded-xl border-2 bg-gray-50 text-left transition-colors hover:border-kite-400 ${
                          selected ? "border-kite-500" : "border-gray-200"
                        }`}
                        onClick={() => handleChooseBuiltin(backdrop)}
                        title={`Choose ${backdrop.name}`}
                        aria-pressed={selected}
                      >
                        <img src={backdrop.dataUrl} alt="" className="aspect-video w-full object-cover" />
                        <span className="block truncate px-2 py-1.5 text-xs font-medium text-gray-600">{backdrop.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-gray-500">No backdrops found. Try another search.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}