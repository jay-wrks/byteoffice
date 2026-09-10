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
<div class="java-action-menu-wrap">
<button aria-expanded="false" aria-haspopup="menu" aria-label="Open Program actions" class="java-action-menu-button" id="javaActionMenuButton" title="Program actions" type="button">
<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/></svg><span>Menu</span>
</button>
<div aria-label="Program actions" class="java-action-menu" hidden id="javaActionMenu" role="menu">
<div class="java-action-menu-title">PROGRAM ACTIONS</div>
<div class="java-action-menu-grid">
<button id="undoBtn" role="menuitem" title="Undo source edit" type="button">↶ Undo</button>
<button id="redoBtn" role="menuitem" title="Redo source edit" type="button">↷ Redo</button>
<button id="formatBtn" role="menuitem" title="Format Java indentation" type="button">Format</button>
<button id="testBtn" role="menuitem" title="Compile once and run against both examples" type="button">Test ×2</button>
<button id="shareBtn" role="menuitem" title="Import or export Program.java" type="button">Share</button>
</div>
</div>
</div>
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
