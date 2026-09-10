window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.programPanel = String.raw`
<aside class="program-panel java-program-panel">
<div class="program-header">
<div>
<span class="small-cap">BYTEBOT CONTROL</span>
<h2>Java Program</h2>
</div>
<div class="java-header-actions">
<span class="java-version-badge">Java 8</span>
<button class="clear-btn" id="clearBtn">Reset Code</button>
</div>
</div>
<div class="editor-toolbar java-editor-toolbar">
<button id="undoBtn" title="Undo source edit">↶ Undo</button>
<button id="redoBtn" title="Redo source edit">↷ Redo</button>
<button id="compactBtn" title="Show or hide the ByteBot API reference">API</button>
<button id="testBtn" title="Compile once and run against both examples">Test ×2</button>
<button id="analyzeBtn" title="Compile and inspect the ByteBot contract">Build</button>
<button id="shareBtn" title="Import or export Program.java">Share</button>
<button class="copy-answer-btn" hidden id="copyAnswerBtn">Copy to Draft</button>
<span class="editor-tip">Real Java • ByteOffice calls program(ByteBot bot) • Ctrl+Enter / F9 run • F10 step</span>
</div>
<div aria-label="Java source editor" class="program-list java-program-list" id="programList"></div>
<div class="command-tray java-api-tray" id="commandTray">
<div class="tray-head">
<div>
<div class="tray-title">BYTEBOT API</div>
<div class="tray-subtitle">Methods control only Byte's physical world. Box values are never returned.</div>
</div>
<button aria-expanded="true" aria-label="Minimize ByteBot API" class="command-tray-toggle" id="commandTrayToggle" title="Minimize ByteBot API" type="button"><span aria-hidden="true" class="tray-toggle-icon"></span></button>
</div>
<div class="command-palette java-api-palette" id="commandPalette"></div>
</div>
</aside>
`;
