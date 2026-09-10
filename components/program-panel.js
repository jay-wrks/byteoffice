window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.programPanel = String.raw`
<aside class="program-panel">
<div class="program-header">
<div>
<span class="small-cap">EMPLOYEE PROGRAM</span>
<h2>Instructions</h2>
</div>
<button class="clear-btn" id="clearBtn">Clear</button>
</div>
<div aria-label="Programs for this level" class="workspace-switcher">
<div class="workspace-tabs" role="tablist">
<button aria-selected="true" class="workspace-tab active" data-workspace="0" role="tab"><b>A</b><span>Solution 1</span></button>
<button aria-selected="false" class="workspace-tab" data-workspace="1" role="tab"><b>B</b><span>Solution 2</span></button>
<button aria-selected="false" class="workspace-tab answer-tab" data-workspace="answer" hidden="" role="tab"><b>✓</b><span>Answer</span></button>
</div>
</div>
<div class="editor-toolbar">
<button id="undoBtn" title="Undo edit">↶ Undo</button>
<button id="redoBtn" title="Redo edit">↷ Redo</button>
<button id="compactBtn" title="Compact long programs">Compact</button>
<button id="testBtn" title="Run current program against all examples">Test ×2</button>
<button id="analyzeBtn" title="Inspect control flow and common issues">Analyze</button>
<button id="shareBtn" title="Import or export this program">Share</button>
<button class="copy-answer-btn" hidden="" id="copyAnswerBtn" title="Copy this answer into one of your drafts">Copy to Draft</button>
<span class="editor-tip">Drag target chips to rows/slots • F9 run • F10 step</span>
</div>
<div aria-label="Program instructions" class="program-list" id="programList"></div>
<div class="command-tray" id="commandTray">
<div class="tray-head">
<div class="tray-title">AVAILABLE COMMANDS</div>
<button aria-expanded="true" aria-label="Minimize commands" class="command-tray-toggle" id="commandTrayToggle" title="Minimize commands" type="button">
<span aria-hidden="true" class="tray-toggle-icon"></span>
</button>
</div>
<div class="command-palette" id="commandPalette"></div>
</div>
</aside>
`;
