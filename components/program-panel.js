window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.programPanel = String.raw`
<aside class="program-panel">
<div class="program-header">
<div>
<span class="small-cap">PROGRAM WORKBENCH</span>
<h2>Instructions</h2>
</div>
<div class="program-header-actions">
<span class="program-run-hint">F9 RUN · F10 STEP</span>
<button class="clear-btn" id="clearBtn">Clear</button>
</div>
</div>
<div aria-label="Programs for this level" class="workspace-switcher">
<div class="workspace-tabs" role="tablist">
<button aria-selected="true" class="workspace-tab active" data-workspace="0" role="tab"><b>A</b><span>Solution 1</span></button>
<button aria-selected="false" class="workspace-tab" data-workspace="1" role="tab"><b>B</b><span>Solution 2</span></button>
<button aria-selected="false" class="workspace-tab answer-tab" data-workspace="answer" hidden="" role="tab"><b>✓</b><span>Answer</span></button>
</div>
</div>
<div class="editor-toolbar">
<div class="editor-primary-tools">
<button id="undoBtn" title="Undo edit">↶ Undo</button>
<button id="redoBtn" title="Redo edit">↷ Redo</button>
<button id="compactBtn" title="Compact long programs">Compact</button>
</div>
<details class="editor-tools-menu">
<summary title="Testing, analysis and sharing">Tools <span>⌄</span></summary>
<div class="editor-tools-popover">
<button id="testBtn" title="Run current program against all examples"><b>QA</b><span>Test both examples</span></button>
<button id="analyzeBtn" title="Inspect control flow and common issues"><b>⌁</b><span>Analyze program</span></button>
<button id="shareBtn" title="Import or export this program"><b>↗</b><span>Share / import</span></button>
</div>
</details>
<button class="copy-answer-btn" hidden="" id="copyAnswerBtn" title="Copy this answer into one of your drafts">Copy to Draft</button>
<span class="editor-tip">Drag target chips to rows/slots • F9 run • F10 step</span>
</div>
<div aria-label="Program instructions" class="program-list" id="programList"></div>
<div class="command-tray" id="commandTray">
<div class="tray-head">
<div><div class="tray-title">COMMAND MODULES</div><small class="tray-subtitle">Click a module to install it</small></div>
<button aria-expanded="true" aria-label="Minimize commands" class="command-tray-toggle" id="commandTrayToggle" title="Minimize commands" type="button">
<span aria-hidden="true" class="tray-toggle-icon"></span>
</button>
</div>
<div class="command-palette" id="commandPalette"></div>
</div>
</aside>
`;
