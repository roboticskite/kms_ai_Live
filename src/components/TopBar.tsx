import { useState, useRef } from "react";
import {
  Play,
  Square,
  Save,
  Undo2,
  Redo2,
  Settings,
  HelpCircle,
  Maximize2,
  Minimize2,
  Plus,
  FolderOpen,
  Download,
  Upload,
  Sparkles,
  GraduationCap,
  Images,
  Users,
  Menu,
  RotateCcw,
} from "lucide-react";
import { useEditorStore } from "../store/editorStore";
import { downloadJSON, readFileAsText } from "../utils/helpers";
import { createBlankProject } from "../utils/exampleProjects";

interface Props {
  onRun: () => void;
  onStop: () => void;
  onRestart: () => void;
  blocklyRef: React.MutableRefObject<any>;
}

export default function TopBar({ onRun, onStop, onRestart, blocklyRef }: Props) {
  const {
    project,
    setProjectName,
    isRunning,
    toggleSettings,
    toggleHelp,
    toggleFullscreen,
    fullscreen,
    setProject,
    toggleAIPanel,
    showAIPanel,
    toggleLessons,
    showLessons,
    toggleGallery,
    showGallery,
    toggleTeacherDashboard,
    showTeacherDashboard,
  } = useEditorStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const xml = blocklyRef.current?.getXml() ?? "";
    const projectData = { ...project, scripts: xml, updatedAt: Date.now() };
    const dataStr = JSON.stringify(projectData, null, 2);
    localStorage.setItem("kite_robotics_current", dataStr);
    const projects = JSON.parse(localStorage.getItem("kite_robotics_projects") || "[]");
    const existing = projects.findIndex((p: any) => p.name === project.projectName);
    const entry = { name: project.projectName, data: projectData, savedAt: Date.now() };
    if (existing >= 0) projects[existing] = entry;
    else projects.push(entry);
    localStorage.setItem("kite_robotics_projects", JSON.stringify(projects));
    setSavedMsg("Saved!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const handleNew = () => {
    if (confirm("Start a new project? Unsaved changes will be lost.")) {
      const blank = createBlankProject("New Project");
      setProject(blank);
      blocklyRef.current?.clear();
      setMenuOpen(false);
    }
  };

  const handleExport = () => {
    const xml = blocklyRef.current?.getXml() ?? "";
    const data = { ...project, scripts: xml };
    downloadJSON(data, `${project.projectName.replace(/\s+/g, "_")}.json`);
    setMenuOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const data = JSON.parse(text);
      setProject(data);
      if (data.scripts) blocklyRef.current?.setXml(data.scripts);
      setMenuOpen(false);
    } catch {
      alert("Failed to import project. Make sure it's a valid Kite Robotics file.");
    }
    e.target.value = "";
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 gap-2 z-30 relative shrink-0">
      {/* Logo & Menu */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src="/KITE_Logo1.png" alt="Kite Robotics" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg text-kite-700 hidden sm:block">Kite Robotics</span>
        </div>

        <div className="relative">
          <button
            className="btn-ghost"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={18} />
            <span className="hidden md:block">File</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20 animate-fade-in">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2" onClick={handleNew}>
                  <Plus size={16} /> New Project
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2" onClick={handleSave}>
                  <Save size={16} /> Save Project
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> Import Project
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2" onClick={handleExport}>
                  <Download size={16} /> Export Project (.json)
                </button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Project Name */}
      <div className="flex-1 flex items-center justify-center max-w-xs">
        <input
          value={project.projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="text-center font-medium text-gray-700 bg-transparent border border-transparent hover:border-gray-200 focus:border-kite-300 rounded-lg px-3 py-1 outline-none w-full text-sm"
          placeholder="Project name"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {savedMsg && <span className="text-xs text-green-600 font-medium mr-2 animate-fade-in">{savedMsg}</span>}

        <button
          className="btn-ghost hover:bg-gray-100"
          onClick={() => blocklyRef.current?.undo()}
          title="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button
          className="btn-ghost hover:bg-gray-100"
          onClick={() => blocklyRef.current?.redo()}
          title="Redo"
        >
          <Redo2 size={18} />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {!isRunning ? (
          <button className="btn-success" onClick={onRun} title="Run">
            <Play size={18} fill="currentColor" />
            <span className="hidden sm:block">Run</span>
          </button>
        ) : (
          <button className="btn-danger" onClick={onStop} title="Stop">
            <Square size={16} fill="currentColor" />
            <span className="hidden sm:block">Stop</span>
          </button>
        )}
        <button className="btn-ghost" onClick={onRestart} title="Restart">
          <RotateCcw size={18} />
        </button>
        <button className="btn-secondary" onClick={handleSave} title="Save">
          <Save size={16} />
          <span className="hidden sm:block">Save</span>
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button className={`btn-ghost ${showAIPanel ? "bg-kite-100 text-kite-700" : ""}`} onClick={toggleAIPanel} title="AI Assistant">
          <Sparkles size={18} />
        </button>
        <button className={`btn-ghost ${showLessons ? "bg-kite-100 text-kite-700" : ""}`} onClick={toggleLessons} title="Lessons">
          <GraduationCap size={18} />
        </button>
        <button className={`btn-ghost ${showGallery ? "bg-kite-100 text-kite-700" : ""}`} onClick={toggleGallery} title="Gallery">
          <Images size={18} />
        </button>
        <button className={`btn-ghost ${showTeacherDashboard ? "bg-kite-100 text-kite-700" : ""}`} onClick={toggleTeacherDashboard} title="Teacher">
          <Users size={18} />
        </button>
        <button className="btn-ghost" onClick={toggleSettings} title="Settings">
          <Settings size={18} />
        </button>
        <button className="btn-ghost" onClick={toggleHelp} title="Help">
          <HelpCircle size={18} />
        </button>
        <button className="btn-ghost" onClick={toggleFullscreen} title="Fullscreen">
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
    </div>
  );
}
