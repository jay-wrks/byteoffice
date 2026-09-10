window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.gameShell = String.raw`
<div aria-hidden="true" class="app-shell is-hidden" id="app">
<header class="topbar">
<div class="brand">
<div class="brand-mark">B</div>
<div>
<div class="brand-name">BYTE OFFICE</div>
<div class="brand-sub">Tiny Programs. Real Machines.</div>
</div>
</div>
<div class="top-actions">
<button class="top-btn" id="homeBtn">Home</button>
<button class="top-btn" id="levelBtn">Map</button>
<button class="top-btn secondary-hidden" id="dashboardBtn">Dashboard</button>
<button class="top-btn secondary-hidden" id="achievementsBtn">Badges</button>
<button class="top-btn" id="helpBtn">Help</button>
<button aria-label="Toggle sound" class="top-btn icon-btn" id="soundBtn">🔊</button>
</div>
</header>
<main class="game-layout">
<div data-component="components/mission-panel.html"></div>
<div data-component="components/factory-panel.html"></div>
<div data-component="components/program-panel.html"></div>
</main>
<footer class="footerbar">
<div>Size <b id="programSize">0</b></div>
<div>Steps <b id="stepCount">0</b></div>
<div class="footer-message" id="footerMessage">Build a program, then press Run.</div>
</footer>
</div>
`;
