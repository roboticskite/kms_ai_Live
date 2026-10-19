import { create } from "zustand";
import type { ProjectData, SpriteData, BackdropData, Variable, ClassItem, StudentItem, AssignmentItem, ChallengeItem } from "../types";
import { generateId, generateSpriteId, getBuiltinSprites, getBuiltinBackdrops } from "../utils/helpers";
import { EXAMPLE_PROJECTS } from "../utils/exampleProjects";

export interface GalleryProjectItem {
  id: string;
  name: string;
  creator: string;
  thumbnail: string;
  likes: number;
  liked: boolean;
  projectData: ProjectData;
}

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
  zoom: number;
  searchQuery: string;
  promptHistory: { role: "user" | "assistant"; content: string }[];
  lessonProgress: Record<number, number>;
  galleryProjects: GalleryProjectItem[];

  // Settings
  soundEffectsEnabled: boolean;
  autoSaveEnabled: boolean;
  geminiApiKey: string;

  // Teacher Dashboard data
  classes: ClassItem[];
  students: StudentItem[];
  assignments: AssignmentItem[];
  challenges: ChallengeItem[];

  setProject: (project: ProjectData) => void;
  setProjectName: (name: string) => void;
  selectSprite: (id: string) => void;
  updateSpriteBlocks: (id: string, blocksXml: string) => void;
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
  addPromptMessage: (msg: { role: "user" | "assistant"; content: string }) => void;
  setLessonProgress: (lessonId: number, progress: number) => void;

  // Gallery
  toggleGalleryLike: (id: string) => void;
  publishToGallery: (project: ProjectData, creator?: string) => void;

  // Settings
  setSoundEffectsEnabled: (enabled: boolean) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setGeminiApiKey: (key: string) => void;

  // Teacher Dashboard actions
  addClass: (name: string) => void;
  removeClass: (id: string) => void;
  addStudent: (name: string, className: string) => void;
  removeStudent: (id: string) => void;
  addAssignment: (title: string, className: string, due: string) => void;
  removeAssignment: (id: string) => void;
  addChallenge: (title: string, desc: string) => void;
  removeChallenge: (id: string) => void;
  importTeacherData: (data: { classes: ClassItem[]; students: StudentItem[]; assignments: AssignmentItem[]; challenges: ChallengeItem[] }) => void;
}

const DEFAULT_STARTER_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="control_forever">
        <statement name="DO">
          <block type="motion_move_steps">
            <field name="STEPS">10</field>
            <next>
              <block type="motion_turn_clockwise">
                <field name="DEGREES">15</field>
              </block>
            </next>
          </block>
        </statement>
      </block>
    </next>
  </block>
  <block type="event_when_flag" x="280" y="30">
    <next>
      <block type="looks_say">
        <field name="TEXT">Hello! 🚀</field>
        <next>
          <block type="control_wait">
            <field name="SECS">2</field>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

function createDefaultProject(): ProjectData {
  const builtinSprites = getBuiltinSprites();
  const catSprite = builtinSprites[1];

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
        blocks: DEFAULT_STARTER_XML,
        volume: 100,
        effects: { color: 0, brightness: 0, ghost: 0 },
      },
    ],
    backdrops: getBuiltinBackdrops().map((b) => ({ id: generateId("backdrop"), name: b.name, dataUrl: b.dataUrl })),
    currentBackdrop: 0,
    variables: [],
    scripts: DEFAULT_STARTER_XML,
    sounds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const STORAGE_KEY = "kite_robotics_projects";
const CURRENT_KEY = "kite_robotics_current";
const GALLERY_KEY = "kite_robotics_gallery";
const TEACHER_KEY = "kite_robotics_teacher";
const SETTINGS_KEY = "kite_robotics_settings";

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

function buildInitialGallery(): GalleryProjectItem[] {
  try {
    const saved = localStorage.getItem(GALLERY_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}

  const creators = ["Alice", "Bob", "Charlie", "Dana", "Eve", "Frank"];
  return EXAMPLE_PROJECTS.map((ex, i) => ({
    id: String(i + 1),
    name: ex.name,
    creator: creators[i % creators.length],
    thumbnail: "",
    likes: 25 + i * 11,
    liked: false,
    projectData: ex.data,
  }));
}

function buildInitialTeacherData() {
  try {
    const saved = localStorage.getItem(TEACHER_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    classes: [
      { id: "1", name: "Intro to Coding", studentsCount: 24, assignmentsCount: 5 },
      { id: "2", name: "Advanced Game Design", studentsCount: 15, assignmentsCount: 3 },
    ],
    students: [
      { id: "1", name: "Alice Johnson", className: "Intro to Coding", progress: 85, projects: 4 },
      { id: "2", name: "Bob Smith", className: "Intro to Coding", progress: 60, projects: 2 },
      { id: "3", name: "Charlie Brown", className: "Advanced Game Design", progress: 92, projects: 7 },
      { id: "4", name: "Dana White", className: "Intro to Coding", progress: 45, projects: 1 },
      { id: "5", name: "Eve Davis", className: "Advanced Game Design", progress: 78, projects: 5 },
    ],
    assignments: [
      { id: "1", title: "Lesson 1: Move a Character", className: "Intro to Coding", due: "2026-11-01", submitted: 18, total: 24 },
      { id: "2", title: "Build a Catch Game", className: "Intro to Coding", due: "2026-11-08", submitted: 12, total: 24 },
      { id: "3", title: "Platform Game", className: "Advanced Game Design", due: "2026-11-15", submitted: 10, total: 15 },
    ],
    challenges: [
      { id: "1", title: "Speed Coder", desc: "Build a game in 10 blocks or less", submissions: 8 },
      { id: "2", title: "Maze Master", desc: "Create a maze with 3 levels and keys", submissions: 5 },
    ],
  };
}

function loadInitialSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    soundEffectsEnabled: true,
    autoSaveEnabled: true,
    geminiApiKey: "",
  };
}

const initialProject = loadCurrent() ?? createDefaultProject();
const initialTeacher = buildInitialTeacherData();
const initialSettings = loadInitialSettings();

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
  zoom: 100,
  searchQuery: "",
  promptHistory: [],
  lessonProgress: {},
  galleryProjects: buildInitialGallery(),

  soundEffectsEnabled: initialSettings.soundEffectsEnabled ?? true,
  autoSaveEnabled: initialSettings.autoSaveEnabled ?? true,
  geminiApiKey: initialSettings.geminiApiKey ?? "",

  classes: initialTeacher.classes,
  students: initialTeacher.students,
  assignments: initialTeacher.assignments,
  challenges: initialTeacher.challenges,

  setProject: (project) => {
    saveCurrent(project);
    set({ project, selectedSpriteId: project.sprites[0]?.id ?? null });
  },

  setProjectName: (name) => {
    const project = { ...get().project, projectName: name, updatedAt: Date.now() };
    saveCurrent(project);
    set({ project });
  },

  selectSprite: (id) => set({ selectedSpriteId: id }),

  updateSpriteBlocks: (id, blocksXml) => {
    const project = get().project;
    const updated = {
      ...project,
      sprites: project.sprites.map((s) => (s.id === id ? { ...s, blocks: blocksXml } : s)),
      scripts: id === project.sprites[0]?.id ? blocksXml : project.scripts,
      updatedAt: Date.now(),
    };
    if (get().autoSaveEnabled) {
      saveCurrent(updated);
    }
    set({ project: updated });
  },

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
      blocks: DEFAULT_STARTER_XML,
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
    if (get().autoSaveEnabled) {
      saveCurrent(updated);
    }
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

  addPromptMessage: (msg) => set((s) => ({ promptHistory: [...s.promptHistory, msg] })),
  setLessonProgress: (lessonId, progress) => set((s) => ({ lessonProgress: { ...s.lessonProgress, [lessonId]: progress } })),

  // Gallery
  toggleGalleryLike: (id) => {
    const gallery = get().galleryProjects.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    );
    try {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
    } catch {}
    set({ galleryProjects: gallery });
  },

  publishToGallery: (project, creator = "You") => {
    const newEntry: GalleryProjectItem = {
      id: generateId("gallery"),
      name: project.projectName || "My Project",
      creator,
      thumbnail: "",
      likes: 1,
      liked: true,
      projectData: JSON.parse(JSON.stringify(project)),
    };
    const gallery = [newEntry, ...get().galleryProjects];
    try {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
    } catch {}
    set({ galleryProjects: gallery });
  },

  // Settings
  setSoundEffectsEnabled: (enabled) => {
    set({ soundEffectsEnabled: enabled });
    try {
      const s = { ...loadInitialSettings(), soundEffectsEnabled: enabled };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {}
  },

  setAutoSaveEnabled: (enabled) => {
    set({ autoSaveEnabled: enabled });
    try {
      const s = { ...loadInitialSettings(), autoSaveEnabled: enabled };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {}
  },

  setGeminiApiKey: (key) => {
    set({ geminiApiKey: key });
    try {
      const s = { ...loadInitialSettings(), geminiApiKey: key };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {}
  },

  // Teacher Dashboard
  addClass: (name) => {
    const classes = [...get().classes, { id: generateId("class"), name, studentsCount: 0, assignmentsCount: 0 }];
    set({ classes });
    try {
      const s = { ...buildInitialTeacherData(), classes };
      localStorage.setItem(TEACHER_KEY, JSON.stringify(s));
    } catch {}
  },

  removeClass: (id) => {
    const classes = get().classes.filter((c) => c.id !== id);
    set({ classes });
    try {
      const s = { ...buildInitialTeacherData(), classes };
      localStorage.setItem(TEACHER_KEY, JSON.stringify(s));
    } catch {}
  },

  addStudent: (name, className) => {
    const students = [...get().students, { id: generateId("student"), name, className, progress: 0, projects: 0 }];
    const classes = get().classes.map((c) => c.name === className ? { ...c, studentsCount: c.studentsCount + 1 } : c);
    set({ students, classes });
    try {
      const s = { classes, students, assignments: get().assignments, challenges: get().challenges };
      localStorage.setItem(TEACHER_KEY, JSON.stringify(s));
    } catch {}
  },

  removeStudent: (id) => {
    const st = get().students.find((s) => s.id === id);
    const students = get().students.filter((s) => s.id !== id);
    const classes = get().classes.map((c) => c.name === st?.className ? { ...c, studentsCount: Math.max(0, c.studentsCount - 1) } : c);
    set({ students, classes });
    try {
      const s = { classes, students, assignments: get().assignments, challenges: get().challenges };
      localStorage.setItem(TEACHER_KEY, JSON.stringify(s));
    } catch {}
  },

  addAssignment: (title, className, due) => {
    const targetClass = get().classes.find((c) => c.name === className);
    const total = targetClass?.studentsCount || 20;
    const assignments = [...get().assignments, { id: generateId("assign"), title, className, due, submitted: 0, total }];
    const classes = get().classes.map((c) => c.name === className ? { ...c, assignmentsCount: c.assignmentsCount + 1 } : c);
    set({ assignments, classes });
    try {
      const s = { classes, students: get().students, assignments, challenges: get().challenges };
      localStorage.setItem(TEACHER_KEY, JSON.stringify(s));
    } catch {}
  },

  removeAssignment: (id) => {
    const a = get().assignments.find((x) => x.id === id);
    const assignments = get().assignments.filter((x) => x.id !== id);
    const classes = get().classes.map((c) => c.name === a?.className ? { ...c, assignmentsCount: Math.max(0, c.assignmentsCount - 1) } : c);
    set({ assignments, classes });
    try {
      const s = { classes, students: get().students, assignments, challenges: get().challenges };
      localStorage.setItem(TEACHER_KEY, JSON.stringify(s));
    } catch {}
  },

  addChallenge: (title, desc) => {
    const challenges = [...get().challenges, { id: generateId("chal"), title, desc, submissions: 0 }];
    set({ challenges });
    try {
      const s = { classes: get().classes, students: get().students, assignments: get().assignments, challenges };
      localStorage.setItem(TEACHER_KEY, JSON.stringify(s));
    } catch {}
  },

  removeChallenge: (id) => {
    const challenges = get().challenges.filter((c) => c.id !== id);
    set({ challenges });
    try {
      const s = { classes: get().classes, students: get().students, assignments: get().assignments, challenges };
      localStorage.setItem(TEACHER_KEY, JSON.stringify(s));
    } catch {}
  },

  importTeacherData: (data) => {
    set({
      classes: data.classes || [],
      students: data.students || [],
      assignments: data.assignments || [],
      challenges: data.challenges || [],
    });
    try {
      localStorage.setItem(TEACHER_KEY, JSON.stringify(data));
    } catch {}
  },
}));
