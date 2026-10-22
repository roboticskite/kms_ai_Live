import { useRef, useState, useEffect, useCallback } from "react";
import * as Blockly from "blockly";
import { Home, Minus, Palette, Play, Plus, Search, Square, Trash2, Eye, EyeOff, X, Variable as VarIcon } from "lucide-react";
import { useEditorStore } from "./store/editorStore";
import { RuntimeEngine } from "./engine/runtime";
import { initializeRuntimeState } from "./engine/spriteState";
import BlocklyWorkspace, { type BlocklyWorkspaceHandle } from "./components/BlocklyWorkspace";
import TopBar from "./components/TopBar";
import StagePanel from "./components/StagePanel";
import StageCanvas from "./components/StageCanvas";
import SpritePanel from "./components/SpritePanel";
import AIPanel from "./components/AIPanel";
import LessonsPanel from "./components/LessonsPanel";
import GalleryPanel from "./components/GalleryPanel";
import TeacherDashboard from "./components/TeacherDashboard";
import SettingsPanel from "./components/SettingsPanel";
import HelpPanel from "./components/HelpPanel";
import CategorySidebar from "./components/CategorySidebar";
import type { RuntimeSpriteState } from "./types";

export default function App() {
  const blocklyRef = useRef<BlocklyWorkspaceHandle>(null);
  const engineRef = useRef<RuntimeEngine | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>("Motion");
  const [workspaceTheme, setWorkspaceTheme] = useState<"default" | "dark">("default");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [runtimeState, setRuntimeState] = useState(() => {
    const project = useEditorStore.getState().project;
    const state = initializeRuntimeState(project);
    return {
      sprites: state.sprites as Record<string, RuntimeSpriteState>,
      clones: state.clones,
      backdrop: state.backdrop,
      variables: state.variables,
      gameOver: false,
      levelComplete: false,
      answer: "",
      asking: null as string | null,
    };
  });
  const stageSize = { width: 480, height: 360 };
  const [showVarPanel, setShowVarPanel] = useState(false);
  const [newVarName, setNewVarName] = useState("");

  const penCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const askResolverRef = useRef<((ans: string) => void) | null>(null);

  const {
    project,
    isRunning,
    isBeginnerMode,
    showAIPanel,
    showLessons,
    showGallery,
    showTeacherDashboard,
    showSettings,
    showHelp,
    fullscreen,
    toggleFullscreen,
    searchQuery,
    setSearchQuery,
    setRunning,
    selectedSpriteId,
    addVariable,
    deleteVariable,
    toggleVariableVisible,
    updateSpriteBlocks,
    updateSprite,
  } = useEditorStore();

  const prevSpriteIdRef = useRef<string | null>(selectedSpriteId);

  // Sync workspace blocks when switching sprites
  useEffect(() => {
    const prevId = prevSpriteIdRef.current;
    if (prevId && prevId !== selectedSpriteId) {
      const currentXml = blocklyRef.current?.getXml();
      if (currentXml) {
        updateSpriteBlocks(prevId, currentXml);
      }
    }
    prevSpriteIdRef.current = selectedSpriteId;

    if (selectedSpriteId) {
      const currentSprite = useEditorStore.getState().project.sprites.find((s) => s.id === selectedSpriteId);
      if (currentSprite) {
        if (currentSprite.blocks && currentSprite.blocks.trim()) {
          blocklyRef.current?.setXml(currentSprite.blocks);
        } else {
          blocklyRef.current?.clear();
        }
      }
    }
  }, [selectedSpriteId, updateSpriteBlocks]);

  useEffect(() => {
    if (isRunning) return;
    const state = initializeRuntimeState(project);
    setRuntimeState((previous) => ({ ...previous, sprites: state.sprites, clones: [] }));
  }, [project, isRunning]);

  const stateUpdateScheduledRef = useRef(false);
  const onStateChange = useCallback(() => {
    if (!engineRef.current || stateUpdateScheduledRef.current) return;
    stateUpdateScheduledRef.current = true;
    requestAnimationFrame(() => {
      stateUpdateScheduledRef.current = false;
      if (!engineRef.current) return;
    const ctx = engineRef.current.ctx;
    setRuntimeState({
      sprites: { ...ctx.sprites },
      clones: [...ctx.clones],
      backdrop: ctx.backdrop,
      variables: { ...ctx.variables },
      gameOver: ctx.gameOver,
      levelComplete: ctx.levelComplete,
      answer: ctx.answer,
      asking: (ctx as any)._asking ?? null,
      });
    });
  }, []);

  const handleAsk = useCallback((question: string): Promise<string> => {
    return new Promise((resolve) => {
      askResolverRef.current = resolve;
      setRuntimeState((prev) => ({ ...prev, asking: question }));
    });
  }, []);

  const handleAnswerSubmit = useCallback((answer: string) => {
    setRuntimeState((prev) => ({ ...prev, asking: null, answer }));
    if (askResolverRef.current) {
      askResolverRef.current(answer);
      askResolverRef.current = null;
    }
  }, []);

  const handleRun = useCallback(() => {
    const ws = blocklyRef.current?.getWorkspace();
    if (!ws) return;
    const activeSpriteId = useEditorStore.getState().selectedSpriteId;
    if (activeSpriteId) {
      const xml = blocklyRef.current?.getXml() || "";
      useEditorStore.getState().updateSpriteBlocks(activeSpriteId, xml);
    }
    const currentProject = useEditorStore.getState().project;
    const engine = new RuntimeEngine(currentProject, onStateChange);
    if (penCanvasRef.current) {
      engine.setPenCanvas(penCanvasRef.current);
    }
    engine.setAskCallback(handleAsk);
    engineRef.current = engine;
    setRunning(true);
    engine.run(ws as Blockly.Workspace, { type: "flag" }, activeSpriteId);
  }, [onStateChange, setRunning, handleAsk]);

  const handleStop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setRunning(false);
    const currentProject = useEditorStore.getState().project;
    const state = initializeRuntimeState(currentProject);
    setRuntimeState({
      sprites: state.sprites as Record<string, RuntimeSpriteState>,
      clones: state.clones,
      backdrop: state.backdrop,
      variables: state.variables,
      gameOver: false,
      levelComplete: false,
      answer: "",
      asking: null,
    });
  }, [setRunning]);

  const handleRestart = useCallback(() => {
    handleStop();
    setTimeout(() => handleRun(), 100);
  }, [handleStop, handleRun]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && useEditorStore.getState().fullscreen) {
        useEditorStore.getState().toggleFullscreen();
        return;
      }
      if (engineRef.current && !engineRef.current.ctx.stopAll) {
        engineRef.current.handleKeyDown(e.key);
        engineRef.current.run(null, { type: "key", key: e.key });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current?.handleKeyUp(e.key);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const handleSpriteClick = useCallback((spriteId: string) => {
    if (engineRef.current && !engineRef.current.ctx.stopAll) {
      engineRef.current.run(null, { type: "clicked", spriteId });
    }
  }, []);

  const handleSpritePositionChange = useCallback((spriteId: string, x: number, y: number) => {
    const runtimeSprite = engineRef.current?.ctx.sprites[spriteId];
    if (runtimeSprite) {
      runtimeSprite.x = x;
      runtimeSprite.y = y;
      engineRef.current?.ctx.onStateChange();
      return;
    }
    setRuntimeState((previous) => {
      const sprite = previous.sprites[spriteId];
      if (!sprite) return previous;
      return { ...previous, sprites: { ...previous.sprites, [spriteId]: { ...sprite, x, y } } };
    });
  }, []);

  const handleSpritePositionCommit = useCallback((spriteId: string, x: number, y: number) => {
    updateSprite(spriteId, { x, y });
  }, [updateSprite]);

  const handleMouseMove = useCallback((x: number, y: number) => {
    engineRef.current?.handleMouseMove(x, y);
  }, []);

  const handleMouseDown = useCallback(() => {
    engineRef.current?.handleMouseDown();
  }, []);

  const handleMouseUp = useCallback(() => {
    engineRef.current?.handleMouseUp();
  }, []);

  const handleZoomIn = useCallback(() => {
    blocklyRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    blocklyRef.current?.zoomOut();
  }, []);

  const handleResetView = useCallback(() => {
    blocklyRef.current?.center();
  }, []);

  const visibleVariables = project.variables
    .filter((v) => v.visible)
    .map((v) => ({ name: v.name, value: runtimeState.variables[v.name] ?? v.value }));

  const handleAddVariable = () => {
    if (newVarName.trim()) {
      addVariable(newVarName.trim());
      setNewVarName("");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <TopBar
        onRun={handleRun}
        onStop={handleStop}
        onRestart={handleRestart}
        blocklyRef={blocklyRef as any}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left panel - Category sidebar + Blockly workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar: search + variables */}
          <div className="flex items-center gap-1 px-2 py-2 bg-white border-b border-gray-200 shrink-0">
            <div className="relative min-w-0 flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="blocks-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blocks..."
                className="w-full min-w-0 pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-kite-400"
              />
            </div>
            <button
              className={`btn-ghost shrink-0 px-2 text-xs ${showVarPanel ? "bg-orange-100 text-orange-700" : ""}`}
              onClick={() => setShowVarPanel(!showVarPanel)}
            >
              <VarIcon size={14} /> Variables
            </button>
            <div className="ml-auto flex shrink-0 items-center gap-0.5">
              <button className="btn-ghost h-8 w-8 rounded-full p-0" onClick={handleResetView} title="Reset block workspace">
                <Home size={15} />
              </button>
              <button className="btn-ghost h-8 w-8 rounded-full p-0" onClick={handleZoomIn} title="Zoom in">
                <Plus size={15} />
              </button>
              <button className="btn-ghost h-8 w-8 rounded-full p-0" onClick={handleZoomOut} title="Zoom out">
                <Minus size={15} />
              </button>
              <button className="btn-ghost h-8 w-8 rounded-full p-0" onClick={() => blocklyRef.current?.deleteSelected()} title="Delete selected block">
                <Trash2 size={15} />
              </button>
              <div className="relative">
                <button
                  className="btn-ghost h-8 w-8 rounded-full p-0"
                  onClick={() => setThemeMenuOpen((open) => !open)}
                  title="Workspace theme"
                  style={{ background: workspaceTheme === "dark" ? "#111827" : "#7c3aed", color: "white" }}
                >
                  <Palette size={14} />
                </button>
                {themeMenuOpen && (
                  <div className="absolute right-0 top-9 z-30 w-28 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                    <button
                      className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs hover:bg-gray-100"
                      onClick={() => {
                        setWorkspaceTheme("default");
                        setThemeMenuOpen(false);
                      }}
                    >
                      Default
                    </button>
                    <button
                      className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs hover:bg-gray-100"
                      onClick={() => {
                        setWorkspaceTheme("dark");
                        setThemeMenuOpen(false);
                      }}
                    >
                      Dark
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Variables mini-panel */}
          {showVarPanel && (
            <div className="px-3 py-2 bg-orange-50 border-b border-orange-100 shrink-0 animate-slide-up">
              <div className="flex gap-2 mb-2">
                <input
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="Variable name..."
                  className="flex-1 px-2 py-1 text-sm border border-orange-200 rounded-lg outline-none focus:border-orange-400"
                  onKeyDown={(e) => e.key === "Enter" && handleAddVariable()}
                />
                <button className="btn-primary text-xs py-1" onClick={handleAddVariable}>
                  <Plus size={14} /> Create
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {project.variables.length === 0 && (
                  <p className="text-xs text-gray-400">No variables yet. Create one above!</p>
                )}
                {project.variables.map((v) => (
                  <div key={v.id} className="flex items-center justify-between bg-white rounded-lg px-2 py-1.5 text-sm">
                    <span className="font-medium text-gray-700">{v.name}</span>
                    <span className="text-gray-400 text-xs">{String(v.value)}</span>
                    <div className="flex gap-1">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600"
                        onClick={() => toggleVariableVisible(v.id)}
                        title={v.visible ? "Hide" : "Show"}
                      >
                        {v.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-500"
                        onClick={() => deleteVariable(v.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blockly workspace + custom sidebar */}
          <div className="flex-1 min-h-0 flex relative">
            {/* Custom category sidebar */}
            <CategorySidebar
              activeCategory={activeCategory}
              onSelectCategory={(name: string) => {
                setActiveCategory(name);
                // Let Blockly render first, then open category
                setTimeout(() => {
                  blocklyRef.current?.selectCategory(name);
                }, 50);
              }}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            {/* Blockly workspace */}
            <div className="flex flex-1 min-h-0 flex-col relative workspace-shell" data-theme={workspaceTheme}>
              <BlocklyWorkspace
                ref={blocklyRef}
                beginnerMode={isBeginnerMode}
                searchQuery={searchQuery}
                activeCategory={activeCategory || "Motion"}
                onCategoryChange={(name) => setActiveCategory(name)}
              />
            </div>
          </div>
        </div>

        {/* Right panel - Stage */}
        <div
          className={`flex flex-col bg-white border-l border-gray-200 shrink-0 ${
            fullscreen
              ? "fixed inset-0 z-50 w-full min-w-full max-w-full bg-black"
              : "w-[clamp(320px,30vw,440px)] min-w-[320px] max-w-[440px]"
          }`}
        >
          <div className={`relative flex-1 flex items-center justify-center ${fullscreen ? "min-h-0 bg-black p-0" : "min-h-0 overflow-hidden bg-gray-100 p-2"}`}>
            <StageCanvas
              project={project}
              runtimeState={isRunning ? runtimeState : { ...runtimeState, backdrop: project.currentBackdrop }}
              onSpriteClick={handleSpriteClick}
              onSpritePositionChange={handleSpritePositionChange}
              onSpritePositionCommit={handleSpritePositionCommit}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              fullscreen={fullscreen}
              stageSize={stageSize}
              visibleVariables={visibleVariables}
              onMountPenCanvas={(c) => {
                penCanvasRef.current = c;
              }}
              onAnswerSubmit={handleAnswerSubmit}
            />
            {fullscreen && (
              <div className="absolute right-5 top-5 z-[60] flex items-center gap-2">
                <button
                  className={`flex h-10 items-center gap-2 rounded-full px-4 font-semibold text-white shadow-lg transition-colors ${
                    isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                  }`}
                  onClick={isRunning ? handleStop : handleRun}
                  title={isRunning ? "Stop" : "Run"}
                  aria-label={isRunning ? "Stop" : "Run"}
                >
                  {isRunning ? <Square size={15} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  {isRunning ? "Stop" : "Run"}
                </button>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg hover:bg-gray-100"
                  onClick={toggleFullscreen}
                  title="Exit fullscreen"
                  aria-label="Exit fullscreen"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
          {!fullscreen && (
            <div className="flex h-[255px] shrink-0 min-h-0 border-t border-gray-200">
              <div className="flex-1 min-w-0">
                <SpritePanel />
              </div>
              <StagePanel />
            </div>
          )}
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <AIPanel blocklyRef={blocklyRef as any} onClose={() => useEditorStore.getState().toggleAIPanel()} />
        )}

        {/* Lessons Panel */}
        {showLessons && <LessonsPanel onClose={() => useEditorStore.getState().toggleLessons()} />}
      </div>

      {/* Modals */}
      {showGallery && <GalleryPanel onClose={() => useEditorStore.getState().toggleGallery()} />}
      {showTeacherDashboard && <TeacherDashboard onClose={() => useEditorStore.getState().toggleTeacherDashboard()} />}
      {showSettings && <SettingsPanel onClose={() => useEditorStore.getState().toggleSettings()} />}
      {showHelp && <HelpPanel onClose={() => useEditorStore.getState().toggleHelp()} />}
    </div>
  );
}
