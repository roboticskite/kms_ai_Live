import { X, Sparkles, Send, AlertTriangle, HelpCircle, Code2, Key, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import * as Blockly from "blockly";

interface Props {
  blocklyRef: React.MutableRefObject<any>;
  onClose: () => void;
}

const SUGGESTIONS = [
  "Explain this code",
  "Find errors in my code",
  "Make a game where a character catches apples",
  "Make the character jump with space key",
  "Add a bouncing animation with sound",
  "Create an arrow keys movement controller",
];

export default function AIPanel({ blocklyRef, onClose }: Props) {
  const { promptHistory, addPromptMessage, geminiApiKey, setGeminiApiKey, project } = useEditorStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || "");
  const [keySaved, setKeySaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [promptHistory, loading]);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(apiKeyInput.trim());
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowKeyInput(false);
    }, 1000);
  };

  // Inspect the current Blockly workspace to explain code
  const explainCurrentWorkspace = (ws: Blockly.Workspace): string => {
    const topBlocks = ws.getTopBlocks(true);
    if (topBlocks.length === 0) {
      return "Your workspace is currently empty. Drag some blocks from the categories on the left or click one of the suggestions below to get started!";
    }

    const descriptions: string[] = [];
    topBlocks.forEach((block, index) => {
      let desc = `**Script ${index + 1}**: `;
      if (block.type === "event_when_flag") {
        desc += "Starts when the **Green Flag** is clicked.\n";
      } else if (block.type === "event_when_key") {
        const key = block.getFieldValue("KEY");
        desc += `Starts when the **${key === " " ? "Space" : key}** key is pressed.\n`;
      } else if (block.type === "event_when_clicked") {
        desc += "Starts when this sprite is **clicked**.\n";
      } else if (block.type === "event_when_receive") {
        const msg = block.getFieldValue("MESSAGE");
        desc += `Starts when message **"${msg}"** is received.\n`;
      } else {
        desc += `Starts with block \`${block.type.replace(/_/g, " ")}\`.\n`;
      }

      // Traverse children
      const actions: string[] = [];
      let current: Blockly.Block | null = block.getNextBlock();
      let depth = 0;
      while (current && depth < 8) {
        if (current.type === "control_forever") {
          actions.push("• Loops forever repeating the inner action blocks.");
        } else if (current.type === "motion_move_steps") {
          actions.push(`• Moves forward by ${current.getFieldValue("STEPS") || 10} steps.`);
        } else if (current.type === "motion_turn_clockwise") {
          actions.push(`• Turns clockwise by ${current.getFieldValue("DEGREES") || 15} degrees.`);
        } else if (current.type === "looks_say") {
          actions.push(`• Displays a speech bubble: "${current.getFieldValue("TEXT") || "Hello"}".`);
        } else if (current.type === "looks_say_for") {
          actions.push(`• Says "${current.getFieldValue("TEXT")}" for ${current.getFieldValue("SECS") || 2} seconds.`);
        } else if (current.type === "control_wait") {
          actions.push(`• Pauses execution for ${current.getFieldValue("SECS") || 1} seconds.`);
        } else if (current.type.startsWith("game_")) {
          actions.push(`• Game action: ${current.type.replace("game_", "").replace(/_/g, " ")}.`);
        } else {
          actions.push(`• Executes \`${current.type.replace(/_/g, " ")}\`.`);
        }
        current = current.getNextBlock();
        depth++;
      }

      if (actions.length > 0) {
        desc += actions.join("\n");
      } else {
        desc += "• (No further connected action blocks)";
      }
      descriptions.push(desc);
    });

    return `Here is what your program does:\n\n${descriptions.join("\n\n")}\n\n*Click the green Run button to watch your code execute live on the stage!*`;
  };

  // Inspect the workspace for real errors or missing connections
  const findWorkspaceErrors = (ws: Blockly.Workspace): string => {
    const allBlocks = ws.getAllBlocks(false);
    if (allBlocks.length === 0) {
      return "There are no blocks in the workspace to inspect. Add some blocks first!";
    }

    const warnings: string[] = [];
    const topBlocks = ws.getTopBlocks(false);

    topBlocks.forEach((block) => {
      const isHat = [
        "event_when_flag",
        "event_when_key",
        "event_when_clicked",
        "event_when_start",
        "event_when_receive",
        "control_when_start_as_clone",
        "procedures_def",
      ].includes(block.type);

      if (!isHat) {
        warnings.push(`⚠️ An unattached action block \`${block.type.replace(/_/g, " ")}\` is floating without an Event trigger (like 'when flag clicked'). It will never run.`);
      }
    });

    // Check for loops without yields
    allBlocks.forEach((block) => {
      if (block.type === "control_forever" || block.type === "control_repeat_until") {
        const doBlock = block.getInput("DO")?.connection?.targetBlock();
        if (!doBlock) {
          warnings.push(`⚠️ An empty loop \`${block.type.replace(/_/g, " ")}\` has no blocks inside. It won't do anything.`);
        }
      }
      if (block.type === "control_if") {
        const cond = block.getInput("CONDITION")?.connection?.targetBlock();
        if (!cond) {
          warnings.push(`⚠️ An \`if\` condition block has an empty condition slot. Attach a Sensing or Operator block.`);
        }
      }
    });

    if (warnings.length === 0) {
      return "🎉 **Great job!** No obvious syntax errors or orphaned blocks detected. Your scripts are properly connected to event blocks and ready to run.";
    }

    return `### Code Inspector Feedback:\n\n${warnings.join("\n\n")}\n\n*Fix these blocks in the workspace so your game runs smoothly!*`;
  };

  // Generate properly connected XML block scripts
  const generateCleanBlocks = (ws: Blockly.Workspace, prompt: string): string => {
    const lower = prompt.toLowerCase();

    if (lower.includes("catch") || lower.includes("apple") || lower.includes("fall")) {
      const xml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="game_set_score">
        <field name="SCORE">0</field>
        <next>
          <block type="motion_goto_xy">
            <field name="X">0</field>
            <field name="Y">150</field>
            <next>
              <block type="control_forever">
                <statement name="DO">
                  <block type="motion_change_y">
                    <field name="DY">-5</field>
                    <next>
                      <block type="control_if">
                        <value name="CONDITION">
                          <block type="sensing_touching_edge"></block>
                        </value>
                        <statement name="DO">
                          <block type="motion_goto_xy">
                            <field name="X">0</field>
                            <field name="Y">150</field>
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
      try {
        const dom = Blockly.utils.xml.textToDom(xml);
        Blockly.Xml.domToWorkspace(dom, ws);
        return "I've generated a Catch Game script! The sprite starts at the top, falls down continuously, and resets when touching the edge. Press **Run** to test it!";
      } catch {
        return "Generated catch script, but could not inject into workspace.";
      }
    }

    if (lower.includes("jump")) {
      const xml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_key" x="30" y="30">
    <field name="KEY"> </field>
    <next>
      <block type="game_jump">
        <field name="POWER">9</field>
        <next>
          <block type="sound_play">
            <field name="SOUND">jump</field>
          </block>
        </next>
      </block>
    </next>
  </block>
  <block type="event_when_flag" x="250" y="30">
    <next>
      <block type="game_set_gravity">
        <field name="GRAVITY">0.5</field>
        <next>
          <block type="control_forever">
            <statement name="DO">
              <block type="game_apply_gravity"></block>
            </statement>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;
      try {
        const dom = Blockly.utils.xml.textToDom(xml);
        Blockly.Xml.domToWorkspace(dom, ws);
        return "I've added jumping with gravity physics! When you press the **Space bar**, the sprite jumps up, and gravity pulls it back down to the floor.";
      } catch {
        return "Generated jump blocks.";
      }
    }

    if (lower.includes("bounce")) {
      const xml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="motion_point_direction">
        <field name="DIR">45</field>
        <next>
          <block type="control_forever">
            <statement name="DO">
              <block type="motion_move_steps">
                <field name="STEPS">10</field>
                <next>
                  <block type="sensing_bounce_off_edge">
                    <next>
                      <block type="sound_play">
                        <field name="SOUND">boing</field>
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
      try {
        const dom = Blockly.utils.xml.textToDom(xml);
        Blockly.Xml.domToWorkspace(dom, ws);
        return "I've created a Bouncing Ball script! The sprite moves diagonally and bounces off edges with a fun boing sound effect.";
      } catch {
        return "Generated bounce blocks.";
      }
    }

    if (lower.includes("arrow") || lower.includes("control") || lower.includes("move")) {
      const xml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
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
                <field name="DX">8</field>
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
                    <field name="DX">-8</field>
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
                        <field name="DY">8</field>
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
                            <field name="DY">-8</field>
                          </block>
                        </statement>
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
</xml>`;
      try {
        const dom = Blockly.utils.xml.textToDom(xml);
        Blockly.Xml.domToWorkspace(dom, ws);
        return "I've added smooth 4-direction arrow key controls! Press Run and use the Arrow Keys on your keyboard to navigate.";
      } catch {
        return "Generated arrow movement blocks.";
      }
    }

    // Default: Starter program
    const defaultXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="event_when_flag" x="30" y="30">
    <next>
      <block type="looks_say_for">
        <field name="TEXT">Ready to code!</field>
        <field name="SECS">2</field>
        <next>
          <block type="control_forever">
            <statement name="DO">
              <block type="motion_move_steps">
                <field name="STEPS">8</field>
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
</xml>`;
    try {
      const dom = Blockly.utils.xml.textToDom(defaultXml);
      Blockly.Xml.domToWorkspace(dom, ws);
      return `I've added connected starter blocks to help you build "${prompt}". Click **Run** to test, or ask me to add jumping, arrows, scoring, or sound effects!`;
    } catch {
      return "I've processed your request!";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    addPromptMessage({ role: "user", content: userMsg });
    setInput("");
    setLoading(true);

    const ws = blocklyRef.current?.getWorkspace();

    // If Gemini API Key is provided, call Gemini API
    if (geminiApiKey) {
      try {
        const currentXml = blocklyRef.current?.getXml() || "";
        const systemPrompt = `You are an expert coding assistant for Kite Robotics (a Scratch/Blockly platform for kids).
The user is working on project "${project.projectName}".
Current Blockly XML code:
${currentXml}

Answer clearly, encouragingly, and succinctly. If the user asks for code or an explanation, provide clear advice.`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMsg}` }] },
              ],
            }),
          }
        );
        const data = await res.json();
        const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiResponse) {
          addPromptMessage({ role: "assistant", content: aiResponse });
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Gemini API error, falling back to local assistant:", e);
      }
    }

    // Local Intelligent Assistant
    await new Promise((r) => setTimeout(r, 400));
    const lower = userMsg.toLowerCase();
    let response = "";

    if (lower.includes("explain") || lower.includes("what does this do")) {
      response = ws ? explainCurrentWorkspace(ws) : "Workspace not ready.";
    } else if (lower.includes("error") || lower.includes("bug") || lower.includes("fix") || lower.includes("check")) {
      response = ws ? findWorkspaceErrors(ws) : "Workspace not ready.";
    } else {
      response = ws ? generateCleanBlocks(ws, userMsg) : "Workspace not ready.";
    }

    addPromptMessage({ role: "assistant", content: response });
    setLoading(false);
  };

  return (
    <div className="w-88 bg-white border-l border-gray-200 flex flex-col h-full shrink-0 animate-slide-up z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-kite-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-kite-600" />
          <span className="font-bold text-gray-800 text-sm">AI Assistant</span>
          {geminiApiKey && (
            <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">
              Gemini Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`btn-ghost p-1 text-xs ${showKeyInput ? "bg-kite-100 text-kite-700" : "text-gray-500"}`}
            onClick={() => setShowKeyInput(!showKeyInput)}
            title="Configure Gemini API Key"
          >
            <Key size={16} />
          </button>
          <button className="btn-ghost p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* API Key Dropdown Banner */}
      {showKeyInput && (
        <form onSubmit={handleSaveApiKey} className="p-3 bg-kite-50 border-b border-kite-100 text-xs flex flex-col gap-2 animate-slide-up">
          <div className="font-semibold text-gray-700 flex items-center justify-between">
            <span>Gemini API Key (Optional)</span>
            <span className="text-[10px] text-gray-400">BYOK</span>
          </div>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white outline-none focus:border-kite-500 text-xs"
          />
          <div className="flex justify-end gap-2">
            <button type="submit" className="btn-primary text-xs py-1 px-3">
              {keySaved ? <Check size={12} /> : null}
              {keySaved ? "Saved!" : "Save Key"}
            </button>
          </div>
        </form>
      )}

      {/* Message Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {promptHistory.length === 0 && (
          <div className="text-center text-gray-400 mt-6">
            <div className="w-12 h-12 rounded-2xl bg-kite-100 text-kite-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Sparkles size={24} />
            </div>
            <h4 className="font-bold text-gray-700 text-sm mb-1">How can I help you code?</h4>
            <p className="text-xs text-gray-500 max-w-[240px] mx-auto">
              I can explain your current blocks, find bugs, or generate full games!
            </p>
          </div>
        )}

        {promptHistory.map((msg, i) => (
          <div
            key={i}
            className={`rounded-2xl p-3 text-xs leading-relaxed ${
              msg.role === "user"
                ? "bg-kite-500 text-white ml-6 shadow-sm"
                : "bg-gray-100 text-gray-800 mr-4 border border-gray-200"
            }`}
          >
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="bg-gray-100 rounded-2xl p-3 mr-6 w-20 border border-gray-200">
            <div className="flex gap-1.5 justify-center">
              <div className="w-2 h-2 bg-kite-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-kite-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-kite-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {promptHistory.length === 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-kite-100 hover:text-kite-700 rounded-full transition-colors text-gray-600 font-medium border border-gray-200 text-left"
              onClick={() => setInput(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200 flex gap-2 bg-gray-50">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me to explain, debug, or build..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-kite-400 bg-white"
        />
        <button className="btn-primary p-2 rounded-xl" onClick={handleSend} disabled={!input.trim()}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
