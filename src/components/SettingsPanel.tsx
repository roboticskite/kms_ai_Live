import { X, Settings, Sparkles, Volume2, Monitor, Key, Check } from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "../store/editorStore";

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    isBeginnerMode,
    toggleBeginnerMode,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
    autoSaveEnabled,
    setAutoSaveEnabled,
    geminiApiKey,
    setGeminiApiKey,
  } = useEditorStore();

  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || "");
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(apiKeyInput.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-kite-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Settings size={22} className="text-kite-600" />
            <span className="font-bold text-lg text-gray-800">Platform Settings</span>
          </div>
          <button className="btn-ghost p-1.5" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Beginner Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-kite-500" />
              <div>
                <div className="font-semibold text-gray-800 text-sm">Beginner Mode</div>
                <div className="text-xs text-gray-500">Simplified block set for young learners</div>
              </div>
            </div>
            <button
              onClick={toggleBeginnerMode}
              className={`w-11 h-6 rounded-full transition-colors relative ${isBeginnerMode ? "bg-kite-500" : "bg-gray-300"}`}
              title="Toggle beginner mode"
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 left-0.5 ${isBeginnerMode ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2.5">
              <Volume2 size={18} className="text-purple-500" />
              <div>
                <div className="font-semibold text-gray-800 text-sm">Sound Effects</div>
                <div className="text-xs text-gray-500">Audio playback for games, blocks, and UI</div>
              </div>
            </div>
            <button
              onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${soundEffectsEnabled ? "bg-kite-500" : "bg-gray-300"}`}
              title="Toggle sound effects"
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 left-0.5 ${soundEffectsEnabled ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {/* Auto-save */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2.5">
              <Monitor size={18} className="text-green-500" />
              <div>
                <div className="font-semibold text-gray-800 text-sm">Auto-Save Projects</div>
                <div className="text-xs text-gray-500">Save workspace edits continuously to local storage</div>
              </div>
            </div>
            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${autoSaveEnabled ? "bg-kite-500" : "bg-gray-300"}`}
              title="Toggle auto-save"
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 left-0.5 ${autoSaveEnabled ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {/* Gemini API Key */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-amber-500" />
              <div className="font-semibold text-gray-800 text-sm">Google Gemini AI Key (Optional)</div>
            </div>
            <p className="text-[11px] text-gray-500">
              Provide your own Gemini API key for live generative AI assistant capabilities.
            </p>
            <form onSubmit={handleSaveApiKey} className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white outline-none focus:border-kite-500"
              />
              <button type="submit" className="btn-primary text-xs py-1.5 px-3">
                {keySaved ? <Check size={13} /> : null}
                {keySaved ? "Saved" : "Save"}
              </button>
            </form>
          </div>

          <div className="pt-2 border-t border-gray-100 text-center">
            <h3 className="font-bold text-gray-700 text-xs mb-1">Kite Robotics Platform v1.0</h3>
            <p className="text-[11px] text-gray-400">
              Built for interactive visual robotics and game development education.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
