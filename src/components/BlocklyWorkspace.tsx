import { memo,  useEffect, useRef, forwardRef, useImperativeHandle  } from "react";
import * as Blockly from "blockly";
import { defineAllBlocks } from "../blocks/blockDefinitions";
import { buildToolboxJson, buildBeginnerToolboxJson, buildSearchToolbox } from "../blocks/toolbox";
import { ContinuousToolbox, ContinuousFlyout, ContinuousMetrics } from "@blockly/continuous-toolbox";
import { useEditorStore } from "../store/editorStore";

let blocksDefined = false;

class FixedScaleContinuousFlyout extends ContinuousFlyout {
  getFlyoutScale() {
    return 0.78;
  }

  protected reflowInternal_() {
    super.reflowInternal_();
    (this as any).width_ = 220;
    (this as any).position();
    (this as any).targetWorkspace?.resizeContents();
  }

  getWidth() {
    return 220;
  }
}

export interface BlocklyWorkspaceHandle {
  getWorkspace: () => Blockly.Workspace | null;
  getXml: () => string;
  setXml: (xml: string) => void;
  loadXml: (xml: string) => void;
  clear: () => void;
  addBlockByType: (type: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  center: () => void;
  selectCategory: (name: string) => void;
  undo: () => void;
  redo: () => void;
  deleteSelected: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// Default starter program loaded into workspace on first open
const DEFAULT_WORKSPACE_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
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

interface Props {
  beginnerMode: boolean;
  searchQuery: string;
  activeCategory: string;
  onWorkspaceChange?: () => void;
  onCategoryChange?: (name: string) => void;
}

const BlocklyWorkspace = forwardRef<BlocklyWorkspaceHandle, Props>(({ beginnerMode, searchQuery, activeCategory, onWorkspaceChange, onCategoryChange }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const onWorkspaceChangeRef = useRef(onWorkspaceChange);
  const activeCategoryRef = useRef(activeCategory);
  onWorkspaceChangeRef.current = onWorkspaceChange;
  activeCategoryRef.current = activeCategory;

  useEffect(() => {
    if (!blocksDefined) {
      defineAllBlocks();
      blocksDefined = true;
    }

    if (!containerRef.current) return;

    const toolbox = beginnerMode ? buildBeginnerToolboxJson() : buildToolboxJson();

    workspaceRef.current = Blockly.inject(containerRef.current, {
      plugins: {
        toolbox: ContinuousToolbox,
        flyoutsVerticalToolbox: FixedScaleContinuousFlyout,
        metricsManager: ContinuousMetrics,
      },
      toolbox,
      grid: {
        spacing: 28,
        length: 1,
        colour: "#e2e8f0",
        snap: true,
      },
      zoom: {
        controls: false,
        wheel: false,
        startScale: 1.0,
        maxScale: 2.5,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      trashcan: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
      renderer: "zelos",
      sounds: false,
    } as any);

    // Flyout scroll wheel event listener

    // Load default starter code if workspace is empty
    const timer3 = setTimeout(() => {
      try {
        if (workspaceRef.current && workspaceRef.current.getAllBlocks(false).length === 0) {
          const dom = Blockly.utils.xml.textToDom(DEFAULT_WORKSPACE_XML);
          Blockly.Xml.domToWorkspace(dom, workspaceRef.current);
          workspaceRef.current.scrollCenter();
        }
      } catch (_) {}
    }, 300);

    // Enable mouse-wheel scroll on the Blockly flyout
    const enableFlyoutScroll = () => {
      try {
        const toolbox = (workspaceRef.current as any)?.getToolbox?.();
        const flyout = toolbox?.getFlyout?.() ?? (workspaceRef.current as any)?.getFlyout?.();
        if (!flyout) return;
        const flyoutSvg: SVGElement | null = flyout.svgGroup_ ?? flyout.getSvgRoot?.() ?? null;
        if (!flyoutSvg) return;
        flyoutSvg.addEventListener("wheel", (e: WheelEvent) => {
          e.stopPropagation();
          try {
            const scrollbar = flyout.scrollbar_ ?? flyout.scrollbar;
            if (scrollbar) {
              const pos = (scrollbar.get?.() ?? 0) + e.deltaY;
              scrollbar.set?.(Math.max(0, pos));
            } else {
              flyout.scrollTarget_ = (flyout.scrollTarget_ ?? 0) + e.deltaY;
              flyout.startFlyoutScroll?.();
            }
          } catch (_) {}
        }, { passive: false });
      } catch (_) {}
    };
    const timer4 = setTimeout(enableFlyoutScroll, 400);

    const onChange = (e: Blockly.Events.Abstract) => {
      if (e.type === Blockly.Events.BLOCK_CREATE || e.type === Blockly.Events.BLOCK_MOVE || e.type === Blockly.Events.BLOCK_DELETE || e.type === Blockly.Events.BLOCK_CHANGE) {
        onWorkspaceChangeRef.current?.();
      }
      if (e.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
        const catName = (e as any).newItem;
        if (catName && typeof catName === "string") {
          onCategoryChange?.(catName);
        }
      }
    };
    workspaceRef.current.addChangeListener(onChange);

    const resizeObserver = new ResizeObserver(() => {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current);
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timer3);
      clearTimeout(timer4);
      resizeObserver.disconnect();
      if (workspaceRef.current) {
        workspaceRef.current.removeChangeListener(onChange);
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [beginnerMode]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const timer = window.setTimeout(() => {
      if (workspaceRef.current !== workspace) return;

      const toolbox = workspace.getToolbox() as any;
      if (!toolbox) return;

      toolbox.clearSelection();
      if (searchQuery.trim()) {
        const { toolbox: searchToolbox } = buildSearchToolbox(searchQuery, beginnerMode);
        workspace.updateToolbox(searchToolbox);
      } else {
        workspace.updateToolbox(beginnerMode ? buildBeginnerToolboxJson() : buildToolboxJson());
      }

      toolbox.refreshSelection();
      toolbox.getFlyout().recordScrollPositions();
      if (!searchQuery.trim()) {
        const items = toolbox.getToolboxItems();
        const selectedCategory = items.find((item: any) =>
          item.getName().toLowerCase() === activeCategoryRef.current.toLowerCase()
        );
        if (selectedCategory) toolbox.setSelectedItem(selectedCategory);
      }
    }, searchQuery.trim() ? 120 : 0);

    return () => window.clearTimeout(timer);
  }, [searchQuery, beginnerMode]);

  useImperativeHandle(ref, () => ({
    getWorkspace: () => workspaceRef.current,
    getXml: () => {
      if (!workspaceRef.current) return "";
      const dom = Blockly.Xml.workspaceToDom(workspaceRef.current);
      return Blockly.Xml.domToText(dom);
    },
    setXml: (xml: string) => {
      if (!workspaceRef.current || !xml) return;
      const dom = Blockly.utils.xml.textToDom(xml);
      Blockly.Xml.clearWorkspaceAndLoadFromXml(dom, workspaceRef.current);
    },
    loadXml: (xml: string) => {
      if (!workspaceRef.current || !xml) return;
      const dom = Blockly.utils.xml.textToDom(xml);
      Blockly.Xml.domToWorkspace(dom, workspaceRef.current);
    },
    clear: () => {
      if (!workspaceRef.current) return;
      workspaceRef.current.clear();
    },
    addBlockByType: (type: string) => {
      if (!workspaceRef.current) return;
      const block = workspaceRef.current.newBlock(type);
      block.initSvg();
      const allBlocks = workspaceRef.current.getAllBlocks(false);
      block.moveTo(new Blockly.utils.Coordinate(50 + (allBlocks.length % 5) * 40, 50 + Math.floor(allBlocks.length / 5) * 60));
      block.render();
    },
    zoomIn: () => {
      if (!workspaceRef.current) return;
      workspaceRef.current.zoomCenter(1);
    },
    zoomOut: () => {
      if (!workspaceRef.current) return;
      workspaceRef.current.zoomCenter(-1);
    },
    center: () => {
      if (!workspaceRef.current) return;
      workspaceRef.current.scrollCenter();
    },
    undo: () => {
      if (!workspaceRef.current) return;
      workspaceRef.current.undo(false);
    },
    redo: () => {
      if (!workspaceRef.current) return;
      workspaceRef.current.undo(true);
    },
    deleteSelected: () => {
      const workspace = workspaceRef.current;
      const selection = Blockly.getSelected();
      if (!workspace || !selection || selection.workspace !== workspace) return;
      const selectedBlock = workspace.getBlockById(selection.id);
      selectedBlock?.dispose(true);
    },
    canUndo: () => {
      if (!workspaceRef.current) return false;
      return ((workspaceRef.current as any).undoStack_?.length ?? 0) > 0;
    },
    canRedo: () => {
      if (!workspaceRef.current) return false;
      return ((workspaceRef.current as any).redoStack_?.length ?? 0) > 0;
    },
    selectCategory: (name: string) => {
      if (!workspaceRef.current) return;
      try {
        const tb = (workspaceRef.current as any).getToolbox?.();
        if (!tb) return;
        const items: any[] = tb.getToolboxItems?.() ?? [];
        for (const item of items) {
          const n = item.getName?.() ?? item.name_ ?? item.toolboxItemDef_?.name ?? "";
          if (n === name || n.toLowerCase() === name.toLowerCase()) {
            tb.setSelectedItem?.(item);
            return;
          }
        }
      } catch (_) {}
    },
  }));

  return <div ref={containerRef} className="w-full h-full" />;
});

BlocklyWorkspace.displayName = "BlocklyWorkspace";
export default memo(BlocklyWorkspace);
