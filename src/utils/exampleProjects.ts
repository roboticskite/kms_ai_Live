import type { ProjectData, SpriteData } from "../types";
import { generateId, generateSpriteId, getBuiltinBackdrops, getBuiltinSprites } from "../utils/helpers";

function spriteFromBuiltin(name: string, builtinIndex: number, x: number, y: number, blocksXml: string = ""): SpriteData {
  const builtin = getBuiltinSprites()[builtinIndex] ?? getBuiltinSprites()[0];
  return {
    id: generateSpriteId(),
    name,
    x,
    y,
    direction: 90,
    size: 100,
    visible: true,
    costumes: [{ id: generateId("costume"), name: builtin.name.toLowerCase(), dataUrl: builtin.dataUrl, width: 80, height: 80 }],
    currentCostume: 0,
    rotationStyle: "all-around",
    layerOrder: 0,
    variables: {},
    blocks: blocksXml,
    volume: 100,
    effects: { color: 0, brightness: 0, ghost: 0 },
  };
}

export const CATCH_APPLE_BASKET_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="motion_goto_xy">
        <field name="X">0</field>
        <field name="Y">-140</field>
        <next>
          <block type="control_forever">
            <statement name="DO">
              <block type="control_if">
                <value name="CONDITION">
                  <block type="sensing_key_pressed">
                    <field name="KEY">ArrowLeft</field>
                  </block>
                </value>
                <statement name="DO">
                  <block type="motion_change_x">
                    <field name="DX">-12</field>
                  </block>
                </statement>
                <next>
                  <block type="control_if">
                    <value name="CONDITION">
                      <block type="sensing_key_pressed">
                        <field name="KEY">ArrowRight</field>
                      </block>
                    </value>
                    <statement name="DO">
                      <block type="motion_change_x">
                        <field name="DX">12</field>
                      </block>
                    </statement>
                  </block>
                </next>
              </block>
            </statement>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

export const CATCH_APPLE_APPLE_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="game_set_score">
        <field name="SCORE">0</field>
        <next>
          <block type="motion_goto_xy">
            <field name="X">0</field>
            <field name="Y">160</field>
            <next>
              <block type="control_forever">
                <statement name="DO">
                  <block type="motion_change_y">
                    <field name="DY">-6</field>
                    <next>
                      <block type="control_if">
                        <value name="CONDITION">
                          <block type="sensing_touching">
                            <field name="SPRITE">Basket</field>
                          </block>
                        </value>
                        <statement name="DO">
                          <block type="game_change_score">
                            <field name="VALUE">1</field>
                            <next>
                              <block type="sound_play">
                                <field name="SOUND">coin</field>
                                <next>
                                  <block type="motion_goto_xy">
                                    <field name="X">0</field>
                                    <field name="Y">160</field>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </statement>
                        <next>
                          <block type="control_if">
                            <value name="CONDITION">
                              <block type="sensing_touching_edge"></block>
                            </value>
                            <statement name="DO">
                              <block type="motion_goto_xy">
                                <field name="X">0</field>
                                <field name="Y">160</field>
                              </block>
                            </statement>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

export const BOUNCING_BALL_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="motion_point_direction">
        <field name="DIR">45</field>
        <next>
          <block type="control_forever">
            <statement name="DO">
              <block type="motion_move_steps">
                <field name="STEPS">8</field>
                <next>
                  <block type="sensing_bounce_off_edge">
                    <next>
                      <block type="control_if">
                        <value name="CONDITION">
                          <block type="sensing_touching_edge"></block>
                        </value>
                        <statement name="DO">
                          <block type="looks_change_color">
                            <field name="EFFECT">25</field>
                            <next>
                              <block type="sound_play">
                                <field name="SOUND">boing</field>
                              </block>
                            </next>
                          </block>
                        </statement>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </statement>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

export const SPACE_SHOOTER_SHIP_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="game_set_score">
        <field name="SCORE">0</field>
        <next>
          <block type="motion_goto_xy">
            <field name="X">0</field>
            <field name="Y">-120</field>
            <next>
              <block type="control_forever">
                <statement name="DO">
                  <block type="control_if">
                    <value name="CONDITION">
                      <block type="sensing_key_pressed">
                        <field name="KEY">ArrowLeft</field>
                      </block>
                    </value>
                    <statement name="DO">
                      <block type="motion_change_x">
                        <field name="DX">-8</field>
                      </block>
                    </statement>
                    <next>
                      <block type="control_if">
                        <value name="CONDITION">
                          <block type="sensing_key_pressed">
                            <field name="KEY">ArrowRight</field>
                          </block>
                        </value>
                        <statement name="DO">
                          <block type="motion_change_x">
                            <field name="DX">8</field>
                          </block>
                        </statement>
                      </block>
                    </next>
                  </block>
                </statement>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

export const SPACE_SHOOTER_ENEMY_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="motion_goto_xy">
        <field name="X">-120</field>
        <field name="Y">120</field>
        <next>
          <block type="motion_point_direction">
            <field name="DIR">90</field>
            <next>
              <block type="control_forever">
                <statement name="DO">
                  <block type="motion_move_steps">
                    <field name="STEPS">6</field>
                    <next>
                      <block type="sensing_bounce_off_edge"></block>
                    </next>
                  </block>
                </statement>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

export const FLAPPY_BIRD_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="game_set_score">
        <field name="SCORE">0</field>
        <next>
          <block type="game_set_gravity">
            <field name="GRAVITY">0.5</field>
            <next>
              <block type="motion_goto_xy">
                <field name="X">-80</field>
                <field name="Y">0</field>
                <next>
                  <block type="control_forever">
                    <statement name="DO">
                      <block type="game_apply_gravity">
                        <next>
                          <block type="control_if">
                            <value name="CONDITION">
                              <block type="sensing_key_pressed">
                                <field name="KEY"> </field>
                              </block>
                            </value>
                            <statement name="DO">
                              <block type="game_jump">
                                <field name="POWER">9</field>
                                <next>
                                  <block type="sound_play">
                                    <field name="SOUND">jump</field>
                                  </block>
                                </next>
                              </block>
                            </statement>
                          </block>
                        </next>
                      </block>
                    </statement>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

export const DANCING_CAT_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="looks_say_for">
        <field name="TEXT">Let's Dance! 🎵</field>
        <field name="SECS">2</field>
        <next>
          <block type="control_forever">
            <statement name="DO">
              <block type="motion_move_steps">
                <field name="STEPS">15</field>
                <next>
                  <block type="sensing_bounce_off_edge">
                    <next>
                      <block type="looks_next_costume">
                        <next>
                          <block type="sound_play_note">
                            <field name="NOTE">60</field>
                            <field name="BEATS">0.3</field>
                            <next>
                              <block type="control_wait">
                                <field name="SECS">0.2</field>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </statement>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

export const MAZE_PLAYER_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="motion_goto_xy">
        <field name="X">-180</field>
        <field name="Y">-120</field>
        <next>
          <block type="looks_say_for">
            <field name="TEXT">Get to the Star!</field>
            <field name="SECS">2</field>
            <next>
              <block type="control_forever">
                <statement name="DO">
                  <block type="control_if">
                    <value name="CONDITION">
                      <block type="sensing_key_pressed">
                        <field name="KEY">ArrowRight</field>
                      </block>
                    </value>
                    <statement name="DO">
                      <block type="motion_change_x">
                        <field name="DX">6</field>
                      </block>
                    </statement>
                    <next>
                      <block type="control_if">
                        <value name="CONDITION">
                          <block type="sensing_key_pressed">
                            <field name="KEY">ArrowLeft</field>
                          </block>
                        </value>
                        <statement name="DO">
                          <block type="motion_change_x">
                            <field name="DX">-6</field>
                          </block>
                        </statement>
                        <next>
                          <block type="control_if">
                            <value name="CONDITION">
                              <block type="sensing_key_pressed">
                                <field name="KEY">ArrowUp</field>
                              </block>
                            </value>
                            <statement name="DO">
                              <block type="motion_change_y">
                                <field name="DY">6</field>
                              </block>
                            </statement>
                            <next>
                              <block type="control_if">
                                <value name="CONDITION">
                                  <block type="sensing_key_pressed">
                                    <field name="KEY">ArrowDown</field>
                                  </block>
                                </value>
                                <statement name="DO">
                                  <block type="motion_change_y">
                                    <field name="DY">-6</field>
                                  </block>
                                </statement>
                                <next>
                                  <block type="control_if">
                                    <value name="CONDITION">
                                      <block type="sensing_touching">
                                        <field name="SPRITE">Goal</field>
                                      </block>
                                    </value>
                                    <statement name="DO">
                                      <block type="sound_play">
                                        <field name="SOUND">win</field>
                                        <next>
                                          <block type="looks_say">
                                            <field name="TEXT">You Win! 🏆</field>
                                            <next>
                                              <block type="game_level_complete">
                                                <next>
                                                  <block type="control_stop">
                                                    <field name="STOP">all</field>
                                                  </block>
                                                </next>
                                              </block>
                                            </next>
                                          </block>
                                        </next>
                                      </block>
                                    </statement>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

export const MAZE_GOAL_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="motion_goto_xy">
        <field name="X">180</field>
        <field name="Y">120</field>
        <next>
          <block type="control_forever">
            <statement name="DO">
              <block type="motion_turn_clockwise">
                <field name="DEGREES">5</field>
              </block>
            </statement>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

export const EXAMPLE_PROJECTS: { name: string; description: string; data: ProjectData }[] = [
  {
    name: "Catch the Apple",
    description: "Move the basket to catch falling apples. Score increases for each apple caught!",
    data: {
      projectName: "Catch the Apple",
      sprites: [
        spriteFromBuiltin("Basket", 0, 0, -140, CATCH_APPLE_BASKET_XML),
        spriteFromBuiltin("Apple", 5, 0, 160, CATCH_APPLE_APPLE_XML),
      ],
      backdrops: getBuiltinBackdrops().map((b) => ({ id: generateId("backdrop"), name: b.name, dataUrl: b.dataUrl })),
      currentBackdrop: 0,
      variables: [
        { id: generateId("var"), name: "score", value: 0, visible: true, spriteScoped: false },
      ],
      scripts: CATCH_APPLE_BASKET_XML,
      sounds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
  {
    name: "Bouncing Ball",
    description: "A ball that bounces around the screen forever with color changes and sound effects!",
    data: {
      projectName: "Bouncing Ball",
      sprites: [
        spriteFromBuiltin("Ball", 3, 0, 0, BOUNCING_BALL_XML),
      ],
      backdrops: getBuiltinBackdrops().map((b) => ({ id: generateId("backdrop"), name: b.name, dataUrl: b.dataUrl })),
      currentBackdrop: 1,
      variables: [],
      scripts: BOUNCING_BALL_XML,
      sounds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
  {
    name: "Dancing Cat",
    description: "The cat dances, animates costumes, and plays musical notes!",
    data: {
      projectName: "Dancing Cat",
      sprites: [
        spriteFromBuiltin("Cat", 1, 0, 0, DANCING_CAT_XML),
      ],
      backdrops: getBuiltinBackdrops().map((b) => ({ id: generateId("backdrop"), name: b.name, dataUrl: b.dataUrl })),
      currentBackdrop: 4,
      variables: [],
      scripts: DANCING_CAT_XML,
      sounds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
  {
    name: "Space Shooter",
    description: "Control your ship in space. Dodge and outmaneuver alien enemies!",
    data: {
      projectName: "Space Shooter",
      sprites: [
        spriteFromBuiltin("Ship", 2, 0, -120, SPACE_SHOOTER_SHIP_XML),
        spriteFromBuiltin("Enemy", 6, 100, 120, SPACE_SHOOTER_ENEMY_XML),
      ],
      backdrops: getBuiltinBackdrops().map((b) => ({ id: generateId("backdrop"), name: b.name, dataUrl: b.dataUrl })),
      currentBackdrop: 1,
      variables: [
        { id: generateId("var"), name: "score", value: 0, visible: true, spriteScoped: false },
      ],
      scripts: SPACE_SHOOTER_SHIP_XML,
      sounds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
  {
    name: "Maze Game",
    description: "Navigate through the screen using arrow keys. Reach the star to win!",
    data: {
      projectName: "Maze Game",
      sprites: [
        spriteFromBuiltin("Player", 2, -180, -120, MAZE_PLAYER_XML),
        spriteFromBuiltin("Goal", 4, 180, 120, MAZE_GOAL_XML),
      ],
      backdrops: getBuiltinBackdrops().map((b) => ({ id: generateId("backdrop"), name: b.name, dataUrl: b.dataUrl })),
      currentBackdrop: 2,
      variables: [],
      scripts: MAZE_PLAYER_XML,
      sounds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
  {
    name: "Flappy Bird",
    description: "Press space to flap. Avoid hitting the ground in this classic game!",
    data: {
      projectName: "Flappy Bird",
      sprites: [
        spriteFromBuiltin("Bird", 7, -80, 0, FLAPPY_BIRD_XML),
      ],
      backdrops: getBuiltinBackdrops().map((b) => ({ id: generateId("backdrop"), name: b.name, dataUrl: b.dataUrl })),
      currentBackdrop: 0,
      variables: [
        { id: generateId("var"), name: "score", value: 0, visible: true, spriteScoped: false },
      ],
      scripts: FLAPPY_BIRD_XML,
      sounds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  },
];

export function createBlankProject(name: string = "New Project"): ProjectData {
  const builtinSprites = getBuiltinSprites();
  const defaultStarterXml = `<xml xmlns="https://developers.google.com/blockly/xml">
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

  return {
    projectName: name,
    sprites: [
      {
        id: generateSpriteId(),
        name: "Sprite1",
        x: 0,
        y: 0,
        direction: 90,
        size: 100,
        visible: true,
        costumes: [{ id: generateId("costume"), name: "kite", dataUrl: builtinSprites[0].dataUrl, width: 80, height: 80 }],
        currentCostume: 0,
        rotationStyle: "all-around",
        layerOrder: 0,
        variables: {},
        blocks: defaultStarterXml,
        volume: 100,
        effects: { color: 0, brightness: 0, ghost: 0 },
      },
    ],
    backdrops: getBuiltinBackdrops().map((b) => ({ id: generateId("backdrop"), name: b.name, dataUrl: b.dataUrl })),
    currentBackdrop: 0,
    variables: [],
    scripts: defaultStarterXml,
    sounds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
