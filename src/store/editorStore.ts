import { create } from "zustand";
import type { ProjectData, SpriteData, BackdropData, Variable } from "../types";
import { generateId, generateSpriteId, getBuiltinSprites, getBuiltinBackdrops, svgToCostume } from "../utils/helpers";

interface EditorState {
  project: ProjectData;
  selectedSpriteId: string | null;
  isRunning: boolean;
  isBeginnerMode: boolean;
  showAIPanel: boolean;
  showLessons: boolean;
  showGallery: boolean;
  showTeacherDashboard: boolean;
  showSettings: boolean;
  showHelp: boolean;
  fullscreen: boolean;
  undoStack: string[];
  redoStack: string[];
  zoom: number;
  searchQuery: string;
  promptHistory: { role: "user" | "assistant"; content: string }[];
  lessonProgress: Record<number, number>;
  galleryProjects: { id: string; name: string; creator: string; thumbnail: string; likes: number; liked: boolean }[];

  setProject: (project: ProjectData) => void;
  setProjectName: (name: string) => void;
  selectSprite: (id: string) => void;
  addSprite: (name: string, dataUrl: string, width?: number, height?: number) => void;
  deleteSprite: (id: string) => void;
  duplicateSprite: (id: string) => void;
  renameSprite: (id: string, name: string) => void;
  updateSprite: (id: string, updates: Partial<SpriteData>) => void;
  addCostume: (spriteId: string, name: string, dataUrl: string, width: number, height: number) => void;
  addBackdrop: (name: string, dataUrl: string) => void;
  setBackdrop: (index: number) => void;
  deleteBackdrop: (index: number) => void;
  addVariable: (name: string, spriteScoped?: boolean, spriteId?: string) => void;
  deleteVariable: (id: string) => void;
  toggleVariableVisible: (id: string) => void;
  setRunning: (running: boolean) => void;
  toggleBeginnerMode: () => void;
  toggleAIPanel: () => void;
  toggleLessons: () => void;
  toggleGallery: () => void;
  toggleTeacherDashboard: () => void;
  toggleSettings: () => void;
  toggleHelp: () => void;
  toggleFullscreen: () => void;
  setZoom: (zoom: number) => void;
  setSearchQuery: (q: string) => void;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  addPromptMessage: (msg: { role: "user" | "assistant"; content: string }) => void;
  setLessonProgress: (lessonId: number, progress: number) => void;
  toggleGalleryLike: (id: string) => void;
}

function createDefaultProject(): ProjectData {
  const builtinSprites = getBuiltinSprites();
  const catSprite = builtinSprites[1];
  const kiteSprite = builtinSprites[0];

  return {
    projectName: "My First Project",
    sprites: [
      {
        id: generateSpriteId(),
        name: "Cat",
        x: 0,
        y: 0,
        direction: 90,
        size: 100,
        visible: true,
        costumes: [{ id: generateId("costume"), name: "cat", dataUrl: catSprite.dataUrl, width: 80, height: 80 }],
        currentCostume: 0,
        rotationStyle: "all-around",
        layerOrder: 0,
        variables: {},
        blocks: "",
        volume: 100,
        effects: { color: 0, brightness: 0, ghost: 0 },
      },
    ],
    backdrops: getBuiltinBackdrops().map((b) => ({ id: generateId("backdrop"), name: b.name, dataUrl: b.dataUrl })),
    currentBackdrop: 0,
    variables: [],
    scripts: "",
    sounds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const STORAGE_KEY = "kite_robotics_projects";
const CURRENT_KEY = "kite_robotics_current";

function saveCurrent(project: ProjectData) {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(project));
  } catch (e) {
    console.error("Failed to save current project", e);
  }
}

function loadCurrent(): ProjectData | null {
  try {
    const data = localStorage.getItem(CURRENT_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load current project", e);
  }
  return null;
}

export function listSavedProjects(): { name: string; data: ProjectData; savedAt: number }[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveProjectToList(project: ProjectData) {
  const projects = listSavedProjects();
  const existing = projects.findIndex((p) => p.name === project.projectName);
  const entry = { name: project.projectName, data: project, savedAt: Date.now() };
  if (existing >= 0) projects[existing] = entry;
  else projects.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function deleteProjectFromList(name: string) {
  const projects = listSavedProjects().filter((p) => p.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

const initialProject = loadCurrent() ?? createDefaultProject();

export const useEditorStore = create<EditorState>((set, get) => ({
  project: initialProject,
  selectedSpriteId: initialProject.sprites[0]?.id ?? null,
  isRunning: false,
  isBeginnerMode: false,
  showAIPanel: false,
  showLessons: false,
  showGallery: false,
  showTeacherDashboard: false,
  showSettings: false,
  showHelp: false,
  fullscreen: false,
  undoStack: [],
  redoStack: [],
  zoom: 100,
  searchQuery: "",
  promptHistory: [],
  lessonProgress: {},
  galleryProjects: [
    { id: "1", name: "Catch the Apple", creator: "Alice", thumbnail: "", likes: 42, liked: false },
    { id: "2", name: "Maze Runner", creator: "Bob", thumbnail: "", likes: 35, liked: false },
    { id: "3", name: "Space Shooter", creator: "Charlie", thumbnail: "", likes: 58, liked: false },
    { id: "4", name: "Flappy Bird", creator: "Dana", thumbnail: "", likes: 72, liked: false },
    { id: "5", name: "Platformer", creator: "Eve", thumbnail: "", likes: 49, liked: false },
    { id: "6", name: "Car Racing", creator: "Frank", thumbnail: "", likes: 31, liked: false },
  ],

  setProject: (project) => {
    saveCurrent(project);
    set({ project, selectedSpriteId: project.sprites[0]?.id ?? null, undoStack: [], redoStack: [] });
  },

  setProjectName: (name) => {
    const project = { ...get().project, projectName: name, updatedAt: Date.now() };
    saveCurrent(project);
    set({ project });
  },

  selectSprite: (id) => set({ selectedSpriteId: id }),

  addSprite: (name, dataUrl, width = 80, height = 80) => {
    const project = get().project;
    const newSprite: SpriteData = {
      id: generateSpriteId(),
      name: name + (project.sprites.length + 1),
      x: 0,
      y: 0,
      direction: 90,
      size: 100,
      visible: true,
      costumes: [{ id: generateId("costume"), name: name.toLowerCase(), dataUrl, width, height }],
      currentCostume: 0,
      rotationStyle: "all-around",
      layerOrder: project.sprites.length,
      variables: {},
      blocks: "",
      volume: 100,
      effects: { color: 0, brightness: 0, ghost: 0 },
    };
    const updated = { ...project, sprites: [...project.sprites, newSprite], updatedAt: Date.now() };
    saveCurrent(updated);
    set({ project: updated, selectedSpriteId: newSprite.id });
  },

  deleteSprite: (id) => {
    const project = get().project;
    if (project.sprites.length <= 1) return;
    const updated = { ...project, sprites: project.sprites.filter((s) => s.id !== id), updatedAt: Date.now() };
    saveCurrent(updated);
    const newSel = updated.sprites[0]?.id ?? null;
    set({ project: updated, selectedSpriteId: newSel });
  },

  duplicateSprite: (id) => {
    const project = get().project;
    const sprite = project.sprites.find((s) => s.id === id);
    if (!sprite) return;
    const copy: SpriteData = {
      ...sprite,
      id: generateSpriteId(),
      name: sprite.name + "_copy",
      costumes: sprite.costumes.map((c) => ({ ...c, id: generateId("costume") })),
      layerOrder: project.sprites.length,
    };
    const updated = { ...project, sprites: [...project.sprites, copy], updatedAt: Date.now() };
    saveCurrent(updated);
    set({ project: updated, selectedSpriteId: copy.id });
  },

  renameSprite: (id, name) => {
    const project = get().project;
    const updated = {
      ...project,
      sprites: project.sprites.map((s) => (s.id === id ? { ...s, name } : s)),
      updatedAt: Date.now(),
    };
    saveCurrent(updated);
    set({ project: updated });
  },

  updateSprite: (id, updates) => {
    const project = get().project;
    const updated = {
      ...project,
      sprites: project.sprites.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      updatedAt: Date.now(),
    };
    saveCurrent(updated);
    set({ project: updated });
  },

  addCostume: (spriteId, name, dataUrl, width, height) => {
    const project = get().project;
    const updated = {
      ...project,
      sprites: project.sprites.map((s) =>
        s.id === spriteId
          ? { ...s, costumes: [...s.costumes, { id: generateId("costume"), name, dataUrl, width, height }] }
          : s
      ),
      updatedAt: Date.now(),
    };
    saveCurrent(updated);
    set({ project: updated });
  },

  addBackdrop: (name, dataUrl) => {
    const project = get().project;
    const updated = {
      ...project,
      backdrops: [...project.backdrops, { id: generateId("backdrop"), name, dataUrl }],
      updatedAt: Date.now(),
    };
    saveCurrent(updated);
    set({ project: updated });
  },

  setBackdrop: (index) => {
    const project = get().project;
    if (index < 0 || index >= project.backdrops.length) return;
    const updated = { ...project, currentBackdrop: index, updatedAt: Date.now() };
    saveCurrent(updated);
    set({ project: updated });
  },

  deleteBackdrop: (index) => {
    const project = get().project;
    if (project.backdrops.length <= 1 || index < 0 || index >= project.backdrops.length) return;
    const backdrops = project.backdrops.filter((_, backdropIndex) => backdropIndex !== index);
    const currentBackdrop =
      index < project.currentBackdrop
        ? project.currentBackdrop - 1
        : index === project.currentBackdrop
          ? Math.min(index, backdrops.length - 1)
          : project.currentBackdrop;
    const updated = { ...project, backdrops, currentBackdrop, updatedAt: Date.now() };
    saveCurrent(updated);
    set({ project: updated });
  },

  addVariable: (name, spriteScoped = false, spriteId) => {
    const project = get().project;
    const newVar: Variable = { id: generateId("var"), name, value: 0, visible: true, spriteScoped, spriteId };
    const updated = { ...project, variables: [...project.variables, newVar], updatedAt: Date.now() };
    saveCurrent(updated);
    set({ project: updated });
  },

  deleteVariable: (id) => {
    const project = get().project;
    const updated = { ...project, variables: project.variables.filter((v) => v.id !== id), updatedAt: Date.now() };
    saveCurrent(updated);
    set({ project: updated });
  },

  toggleVariableVisible: (id) => {
    const project = get().project;
    const updated = {
      ...project,
      variables: project.variables.map((v) => (v.id === id ? { ...v, visible: !v.visible } : v)),
      updatedAt: Date.now(),
    };
    saveCurrent(updated);
    set({ project: updated });
  },

  setRunning: (running) => set({ isRunning: running }),

  toggleBeginnerMode: () => set((s) => ({ isBeginnerMode: !s.isBeginnerMode })),
  toggleAIPanel: () => set((s) => ({ showAIPanel: !s.showAIPanel })),
  toggleLessons: () => set((s) => ({ showLessons: !s.showLessons })),
  toggleGallery: () => set((s) => ({ showGallery: !s.showGallery })),
  toggleTeacherDashboard: () => set((s) => ({ showTeacherDashboard: !s.showTeacherDashboard })),
  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),

  setZoom: (zoom) => set({ zoom: Math.max(50, Math.min(200, zoom)) }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  pushUndo: () => {
    const project = get().project;
    const xml = JSON.stringify(project);
    set((s) => ({ undoStack: [...s.undoStack.slice(-49), xml], redoStack: [] }));
  },

  undo: () => {
    const { undoStack, project } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    const currentXml = JSON.stringify(project);
    const restored = JSON.parse(prev);
    saveCurrent(restored);
    set((s) => ({
      project: restored,
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, currentXml],
      selectedSpriteId: restored.sprites[0]?.id ?? null,
    }));
  },

  redo: () => {
    const { redoStack, project } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const currentXml = JSON.stringify(project);
    const restored = JSON.parse(next);
    saveCurrent(restored);
    set((s) => ({
      project: restored,
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, currentXml],
      selectedSpriteId: restored.sprites[0]?.id ?? null,
    }));
  },

  addPromptMessage: (msg) => set((s) => ({ promptHistory: [...s.promptHistory, msg] })),
  setLessonProgress: (lessonId, progress) => set((s) => ({ lessonProgress: { ...s.lessonProgress, [lessonId]: progress } })),
  toggleGalleryLike: (id) => set((s) => ({
    galleryProjects: s.galleryProjects.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ),
  })),
}));
