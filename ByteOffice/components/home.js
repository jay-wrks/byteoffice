window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.home = String.raw`
<section aria-label="Byte Office main menu" class="home-screen" id="homeScreen">
<div aria-hidden="true" class="home-backdrop-grid"></div>
<div class="home-desk">
<div class="home-brand-row">
${window.ByteOfficeHeadAvatar.markup('home-brand-mark')}
<div><span class="home-kicker">DEPARTMENT OF TINY PROGRAMS <span class="site-version">· v1.0.0</span></span><h1>BYTE OFFICE</h1></div>
</div>
<div class="home-file-card">
<div class="home-file-tab">EMPLOYEE TERMINAL</div>
<div class="home-resume-copy">
<span id="homeProgressLabel">CURRENT ASSIGNMENT</span>
<h2 id="homeLevelTitle">Level 01 · Mail Room</h2>
<p id="homeLevelSummary">Your saved worktrees and progress are ready.</p>
</div>
<div class="home-actions">
<button class="home-primary" id="homeResumeBtn" disabled><span>▶</span><b>Start assignment</b><small>Restoring your Google session…</small></button>
<button class="home-action" id="homeMapBtn" disabled><span>⌘</span><b>View map</b><small>Sign in to browse the roadmap</small></button>
<button class="home-action" id="homeSettingsBtn"><span>⚙</span><b>Settings</b><small>Audio, motion and interface</small></button>
</div>
<div class="home-cloud-card" aria-live="polite">
<div class="home-account-profile"><span class="home-cloud-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7.4 18.2h9.1a4.1 4.1 0 0 0 .5-8.17A6.1 6.1 0 0 0 5.2 9.2a4.5 4.5 0 0 0 2.2 9Z" stroke="currentColor" stroke-width="1.6"/><path d="M12 11.3v5.1m0 0-2-2m2 2 2-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg></span><span id="homeAuthAvatar" class="home-profile-avatar" aria-hidden="true"><span>?</span></span><span class="home-account-copy"><span id="homeAuthKicker" class="home-account-kicker">CHECKING GOOGLE SESSION</span><b id="homeAuthTitle">Restoring your session…</b><small id="homeAuthStatus">Checking your saved Google login</small></span></div>
<div id="homeAuthStats" class="home-account-stats" hidden><span><b data-stat="completedLevels">0</b><small>levels</small></span><span><b data-stat="totalStars">0</b><small>stars</small></span><span><b data-stat="totalSteps">0</b><small>steps</small></span><span><b data-stat="totalSize">0</b><small>actions</small></span></div>
<div class="home-account-actions"><button id="homeAuthBtn" class="home-cloud-primary" type="button" disabled><svg class="google-mark" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.24-.16-1.82H9v3.44h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.6Z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.91-2.26c-.8.54-1.82.86-3.05.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.95 10.68A5.4 5.4 0 0 1 3.67 9c0-.58.1-1.15.28-1.68V4.99H.94A9 9 0 0 0 0 9c0 1.45.35 2.82.94 4.01l3.01-2.33Z"/><path fill="#EA4335" d="M9 3.6c1.32 0 2.5.45 3.43 1.34l2.57-2.57C13.46.92 11.42 0 9 0A9 9 0 0 0 .94 4.99l3.01 2.33C4.66 5.19 6.65 3.6 9 3.6Z"/></svg><span>Checking session…</span></button></div>
</div>
<section class="home-leaderboard" aria-labelledby="homeLeaderboardTitle"><div class="home-leaderboard-head"><div><span class="home-account-kicker">PUBLIC RECORD</span><h3 id="homeLeaderboardTitle">Leaderboard</h3></div><span class="home-leaderboard-rule">LIVE STANDINGS</span></div><div class="home-top3"><div class="home-top3-head"><div><span class="home-account-kicker">COMBINED PERFORMANCE</span><h4>Top 5 of 45</h4></div><span>15 PTS PER BOARD</span></div><div id="homeLeaderboardTop3" class="home-top3-list"><p class="home-leaderboard-loading">Building the combined ranking…</p></div></div><div class="home-leaderboard-table-heading"><span class="home-account-kicker">FULL BOARDS</span><h4>Top 15 players</h4></div><div class="home-leaderboard-grid"><article class="home-leaderboard-board"><div class="home-leaderboard-board-head"><b>Stars collected</b><span>HIGH → LOW</span></div><div id="homeLeaderboardStars" class="home-leaderboard-list"><p class="home-leaderboard-loading">Loading standings…</p></div></article><article class="home-leaderboard-board"><div class="home-leaderboard-board-head"><b>Best steps</b><span>LOW → HIGH</span></div><div id="homeLeaderboardSteps" class="home-leaderboard-list"><p class="home-leaderboard-loading">Loading standings…</p></div></article><article class="home-leaderboard-board"><div class="home-leaderboard-board-head"><b>Best actions</b><span>LOW → HIGH</span></div><div id="homeLeaderboardActions" class="home-leaderboard-list"><p class="home-leaderboard-loading">Loading standings…</p></div></article></div></section>
<div class="home-settings" hidden="" id="homeSettingsPanel">
<div class="home-settings-head"><div><span>TERMINAL PREFERENCES</span><b>Settings</b></div><button aria-label="Close settings" id="homeSettingsClose">×</button></div>
<label class="setting-row"><span><b>Music</b><small>Quiet procedural office ambience</small></span><input id="musicToggle" type="checkbox"/><i></i></label>
<label class="setting-row"><span><b>Sound effects</b><small>Machine clicks, alerts and completion tones</small></span><input id="sfxToggle" type="checkbox"/><i></i></label>
<label class="setting-row"><span><b>Page transitions</b><small>Animated movement between menu, map and game</small></span><input id="transitionToggle" type="checkbox"/><i></i></label>
<label class="setting-row"><span><b>Reduced motion</b><small>Limit decorative UI movement</small></span><input id="motionToggle" type="checkbox"/><i></i></label>
<label class="setting-row"><span><b>Editor tips</b><small>Show shortcut hints above instructions</small></span><input id="tipsToggle" type="checkbox"/><i></i></label>
<label class="setting-row" data-developer-setting hidden><span><b>Unlock all levels</b><small>Open every roadmap assignment without changing completion progress</small></span><input id="unlockLevelsToggle" type="checkbox"/><i></i></label>
<label class="setting-row" data-developer-setting hidden><span><b>Show answers</b><small>Show the exact read-only command solution beside your two drafts</small></span><input id="answersToggle" type="checkbox"/><i></i></label>
<div class="settings-danger-zone" id="resetProgressZone" hidden><div><b>Reset progress</b><small id="resetProgressStatus" aria-live="polite">Permanently clear cloud progress, completed levels, scores, history and saved drafts.</small></div><button id="resetProgressBtn" type="button">Reset</button></div>
</div>
<div class="home-meta"><span id="homeCompletion">0 / 50 assignments cleared</span><span>Autosave enabled</span></div>
<div class="home-maker-signature" role="note" aria-label="Made by Jay for fun"><span class="home-maker-led" aria-hidden="true"></span><span class="home-maker-copy" aria-hidden="true"><span class="home-maker-char" style="--char-index:0">M</span><span class="home-maker-char" style="--char-index:1">a</span><span class="home-maker-char" style="--char-index:2">d</span><span class="home-maker-char" style="--char-index:3">e</span> <span class="home-maker-char" style="--char-index:4">b</span><span class="home-maker-char" style="--char-index:5">y</span> <strong><span class="home-maker-char" style="--char-index:6">J</span><span class="home-maker-char" style="--char-index:7">a</span><span class="home-maker-char" style="--char-index:8">y</span></strong> <span class="home-maker-char" style="--char-index:9">f</span><span class="home-maker-char" style="--char-index:10">o</span><span class="home-maker-char" style="--char-index:11">r</span> <span class="home-maker-char" style="--char-index:12">f</span><span class="home-maker-char" style="--char-index:13">u</span><span class="home-maker-char" style="--char-index:14">n</span></span><span class="home-maker-code" aria-hidden="true">BOT//LAB.01</span></div>
</div>
</div>
</section>
`;
