export type CategoryName =
  | "motion"
  | "looks"
  | "sound"
  | "events"
  | "control"
  | "sensing"
  | "operators"
  | "variables"
  | "functions"
  | "drawing"
  | "game"
  | "advanced";

export interface CategoryDef {
  name: CategoryName;
  label: string;
  color: string;
  colorSecondary: string;
  icon: string;
}

export interface Costume {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface SpriteData {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: number;
  size: number;
  visible: boolean;
  costumes: Costume[];
  currentCostume: number;
  rotationStyle: "all-around" | "left-right" | "none";
  layerOrder: number;
  variables: Record<string, RuntimeValue>;
  blocks: string;
  volume: number;
  effects: {
    color: number;
    brightness: number;
    ghost: number;
  };
}

export interface BackdropData {
  id: string;
  name: string;
  dataUrl: string;
  color?: string;
}

export type RuntimeValue = number | string | boolean;

export interface Variable {
  id: string;
  name: string;
  value: RuntimeValue;
  visible: boolean;
  spriteScoped: boolean;
  spriteId?: string;
}

export interface ProjectData {
  projectName: string;
  sprites: SpriteData[];
  backdrops: BackdropData[];
  currentBackdrop: number;
  variables: Variable[];
  scripts: string;
  sounds: SoundData[];
  createdAt: number;
  updatedAt: number;
}

export interface SoundData {
  id: string;
  name: string;
  dataUrl: string;
  duration: number;
}

export interface RuntimeState {
  sprites: Record<string, RuntimeSpriteState>;
  variables: Record<string, RuntimeValue>;
  clones: RuntimeSpriteState[];
  backdrop: number;
  timer: number;
  answer: string;
  running: boolean;
  messages: string[];
}

export interface RuntimeSpriteState {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: number;
  size: number;
  visible: boolean;
  costumeIndex: number;
  costumes: Costume[];
  rotationStyle: "all-around" | "left-right" | "none";
  layerOrder: number;
  volume: number;
  effects: {
    color: number;
    brightness: number;
    ghost: number;
  };
  saying: string | null;
  sayTimer: number;
  variables: Record<string, RuntimeValue>;
  vx: number;
  vy: number;
  gravity: number;
  health: number;
  lives: number;
  score: number;
  isClone: boolean;
  parentId?: string;
  penDown: boolean;
  penColor: string;
  penSize: number;
}

export interface BlocklyBlockDef {
  type: string;
  category: CategoryName;
  tooltip: string;
  beginnerTooltip?: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  steps: LessonStep[];
  challenge: string;
  hintBlocks: string[];
}

export interface LessonStep {
  instruction: string;
  completed: boolean;
}

export interface GalleryProject {
  id: string;
  name: string;
  creator: string;
  thumbnail: string;
  likes: number;
  liked: boolean;
  projectData: ProjectData;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClassItem {
  id: string;
  name: string;
  studentsCount: number;
  assignmentsCount: number;
}

export interface StudentItem {
  id: string;
  name: string;
  className: string;
  progress: number;
  projects: number;
}

export interface AssignmentItem {
  id: string;
  title: string;
  className: string;
  due: string;
  submitted: number;
  total: number;
}

export interface ChallengeItem {
  id: string;
  title: string;
  desc: string;
  submissions: number;
}
