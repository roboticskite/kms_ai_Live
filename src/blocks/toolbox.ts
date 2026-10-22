import * as Blockly from "blockly";
import { CATEGORIES } from "./categories";
import type { CategoryName } from "../types";

interface ToolboxCategory {
  name: string;
  colour: string;
  blocks: { type: string }[];
}

export const TOOLBOX_CATEGORIES: ToolboxCategory[] = [
  {
    name: "Motion",
    colour: "#4c97ff",
    blocks: [
      { type: "motion_move_steps" },
      { type: "motion_turn_clockwise" },
      { type: "motion_turn_counter" },
      { type: "motion_goto_xy" },
      { type: "motion_glide_xy" },
      { type: "motion_change_x" },
      { type: "motion_change_y" },
      { type: "motion_set_x" },
      { type: "motion_set_y" },
      { type: "motion_point_direction" },
      { type: "motion_x" },
      { type: "motion_y" },
      { type: "motion_direction" },
    ],
  },
  {
    name: "Looks",
    colour: "#9966ff",
    blocks: [
      { type: "looks_say" },
      { type: "looks_say_for" },
      { type: "looks_show" },
      { type: "looks_hide" },
      { type: "looks_change_size" },
      { type: "looks_set_size" },
      { type: "looks_next_costume" },
      { type: "looks_change_costume" },
      { type: "looks_change_color" },
      { type: "looks_switch_backdrop" },
      { type: "looks_size" },
    ],
  },
  {
    name: "Sound",
    colour: "#cf63cf",
    blocks: [
      { type: "sound_play" },
      { type: "sound_start" },
      { type: "sound_stop_all" },
      { type: "sound_change_volume" },
      { type: "sound_set_volume" },
      { type: "sound_play_note" },
    ],
  },
  {
    name: "Events",
    colour: "#ffbf00",
    blocks: [
      { type: "event_when_flag" },
      { type: "event_when_key" },
      { type: "event_when_clicked" },
      { type: "event_when_start" },
      { type: "event_broadcast" },
      { type: "event_broadcast_wait" },
      { type: "event_when_receive" },
    ],
  },
  {
    name: "Control",
    colour: "#ffab19",
    blocks: [
      { type: "control_wait" },
      { type: "control_repeat" },
      { type: "control_forever" },
      { type: "control_if" },
      { type: "control_if_else" },
      { type: "control_repeat_until" },
      { type: "control_stop" },
      { type: "control_create_clone" },
      { type: "control_delete_clone" },
      { type: "control_when_start_as_clone" },
    ],
  },
  {
    name: "Sensing",
    colour: "#5cb1d6",
    blocks: [
      { type: "sensing_key_pressed" },
      { type: "sensing_mouse_down" },
      { type: "sensing_mouse_x" },
      { type: "sensing_mouse_y" },
      { type: "sensing_touching" },
      { type: "sensing_touching_color" },
      { type: "sensing_touching_edge" },
      { type: "sensing_touching_mouse" },
      { type: "sensing_bounce_off_edge" },
      { type: "sensing_distance" },
      { type: "sensing_ask" },
      { type: "sensing_answer" },
      { type: "sensing_timer" },
      { type: "sensing_reset_timer" },
    ],
  },
  {
    name: "Operators",
    colour: "#59c059",
    blocks: [
      { type: "operators_add" },
      { type: "operators_subtract" },
      { type: "operators_multiply" },
      { type: "operators_divide" },
      { type: "operators_random" },
      { type: "operators_greater" },
      { type: "operators_less" },
      { type: "operators_equal" },
      { type: "operators_and" },
      { type: "operators_or" },
      { type: "operators_not" },
      { type: "operators_join" },
      { type: "operators_length" },
      { type: "operators_mod" },
      { type: "operators_round" },
    ],
  },
  {
    name: "Variables",
    colour: "#ff8c1a",
    blocks: [
      { type: "variables_create" },
      { type: "variables_set" },
      { type: "variables_change" },
      { type: "variables_show" },
      { type: "variables_hide" },
      { type: "variables_get" },
    ],
  },
  {
    name: "Functions",
    colour: "#ff6680",
    blocks: [
      { type: "procedures_def" },
      { type: "procedures_call" },
      { type: "procedures_return" },
    ],
  },
  {
    name: "Drawing",
    colour: "#e8b1d6",
    blocks: [
      { type: "drawing_pen_down" },
      { type: "drawing_pen_up" },
      { type: "drawing_set_color" },
      { type: "drawing_set_size" },
      { type: "drawing_clear" },
      { type: "drawing_stamp" },
    ],
  },
  {
    name: "Game",
    colour: "#4caf50",
    blocks: [
      { type: "game_set_score" },
      { type: "game_change_score" },
      { type: "game_score" },
      { type: "game_set_health" },
      { type: "game_change_health" },
      { type: "game_set_lives" },
      { type: "game_change_lives" },
      { type: "game_set_gravity" },
      { type: "game_jump" },
      { type: "game_apply_gravity" },
      { type: "game_move_player" },
      { type: "game_random_move" },
      { type: "game_game_over" },
      { type: "game_level_complete" },
    ],
  },
  {
    name: "Advanced",
    colour: "#795548",
    blocks: [
      { type: "advanced_js" },
      { type: "advanced_console_log" },
      { type: "advanced_list_create" },
      { type: "advanced_list_add" },
      { type: "advanced_list_length" },
      { type: "advanced_math_func" },
      { type: "advanced_wait_until" },
    ],
  },
];

export function buildToolboxJson(): any {
  const obj: any = {
    kind: "categoryToolbox",
    contents: [],
  };
  for (const cat of TOOLBOX_CATEGORIES) {
    obj.contents.push({
      kind: "category",
      name: cat.name,
      colour: cat.colour,
      contents: cat.blocks.map((b) => ({ kind: "block", type: b.type })),
    });
  }
  return obj;
}

export function buildBeginnerToolboxJson(): any {
  const beginnerCategories = ["Motion", "Looks", "Events", "Control", "Sound", "Game"];
  const obj: any = {
    kind: "categoryToolbox",
    contents: [],
  };
  for (const cat of TOOLBOX_CATEGORIES) {
    if (!beginnerCategories.includes(cat.name)) continue;
    obj.contents.push({
      kind: "category",
      name: cat.name,
      colour: cat.colour,
      contents: cat.blocks.map((b) => ({ kind: "block", type: b.type })),
    });
  }
  return obj;
}

export function buildSingleCategoryToolbox(categoryName: string, beginnerMode: boolean = false): any {
  let cat = TOOLBOX_CATEGORIES.find(c => c.name.toLowerCase() === categoryName.toLowerCase());

  if (!cat) {
    cat = TOOLBOX_CATEGORIES[0];
  }

  return {
    kind: "flyoutToolbox",
    contents: cat.blocks.map(b => ({ kind: "block", type: b.type }))
  };
}

const BLOCK_SEARCH_TEXT = new Map<string, string>();

export function buildSearchToolbox(query: string, beginnerMode: boolean = false): {
  toolbox: any;
  firstCategory: string | null;
} {
  const normalizedQuery = query.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  const beginnerCategories = ["Motion", "Looks", "Events", "Control", "Sound", "Game"];
  let searchWorkspace: Blockly.Workspace | null = null;

  for (const category of TOOLBOX_CATEGORIES) {
    for (const { type } of category.blocks) {
      if (BLOCK_SEARCH_TEXT.has(type)) continue;
      searchWorkspace ??= new Blockly.Workspace();
      const block = searchWorkspace.newBlock(type);
      BLOCK_SEARCH_TEXT.set(
        type,
        `${type} ${block.toString(1000)} ${block.getTooltip()}`.toLowerCase().replace(/\s+/g, " ")
      );
      block.dispose(false);
    }
  }
  searchWorkspace?.dispose();

  const contents = TOOLBOX_CATEGORIES.flatMap((category) => {
    if (beginnerMode && !beginnerCategories.includes(category.name)) return [];

    const matchingBlocks = category.blocks.filter(({ type }) =>
      BLOCK_SEARCH_TEXT.get(type)?.includes(normalizedQuery)
    );

    return matchingBlocks.length
      ? [{
          kind: "category",
          name: category.name,
          colour: category.colour,
          contents: matchingBlocks.map(({ type }) => ({ kind: "block", type })),
        }]
      : [];
  });

  return {
    toolbox: { kind: "categoryToolbox", contents },
    firstCategory: contents[0]?.name ?? null,
  };
}
