window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.home = String.raw`
<section aria-label="Byte Office main menu" class="home-screen" id="homeScreen">
  <div aria-hidden="true" class="home-backdrop-grid"></div>
  <div class="home-desk">
    <header class="home-brand-row">
      <div class="home-brand-plaque">
        <div class="home-brand-mark">B</div>
        <div>
          <span class="home-kicker">DEPARTMENT OF TINY PROGRAMS</span>
          <h1>BYTE OFFICE</h1>
          <p>Clock in. Read the instructions. Make the machine work.</p>
        </div>
      </div>
      <nav class="home-top-tabs" aria-label="Primary">
        <button class="active" type="button"><span>⌂</span>Home</button>
        <button id="homeTopLevelsBtn" type="button"><span>▱</span>Levels</button>
        <button id="homeTopDashboardBtn" type="button"><span>▥</span>Dashboard</button>
        <button id="homeTopBadgesBtn" type="button"><span>★</span>Badges</button>
        <button id="homeTopHelpBtn" type="button"><span>▤</span>How to Play</button>
      </nav>
      <div class="home-top-tools"><button id="homeTopSettingsBtn" type="button" aria-label="Settings">⚙</button><button type="button" aria-label="Profile">●</button></div>
    </header>

    <aside class="home-side-nav" aria-label="Byte Office navigation">
      <button class="active" type="button"><span>⌂</span>Home</button>
      <button id="homeLevelsBtn" type="button"><span>▱</span>Levels</button>
      <button id="homeDashboardBtn" type="button"><span>▥</span>Dashboard</button>
      <button id="homeBadgesBtn" type="button"><span>★</span>Badges</button>
      <button id="homeHelpBtn" type="button"><span>▤</span>How to Play</button>
      <div class="home-nav-spacer"></div>
      <button id="homeSideSettingsBtn" type="button"><span>⚙</span>Settings</button>
    </aside>

    <main class="home-workspace">
      <div class="home-doodle home-doodle-left" aria-hidden="true"><span>PLAN</span><span>CODE</span><span>TEST</span><span>IMPROVE</span></div>
      <div class="home-note home-note-top" aria-hidden="true">Think<br>Code<br>Solve<br>Repeat ☺</div>
      <div class="home-note home-note-bottom" aria-hidden="true">Tiny Steps<br>Big Progress ☺</div>
      <div class="home-coffee" aria-hidden="true"><span>☕</span></div>
      <div class="home-pencil" aria-hidden="true"></div>
      <div class="home-paperclip clip-a" aria-hidden="true">⌇</div>
      <div class="home-paperclip clip-b" aria-hidden="true">⌇</div>

      <div class="home-terminal-wrap">
        <div class="home-terminal-heading">
          <span class="home-kicker">DEPARTMENT OF TINY PROGRAMS</span>
          <div class="home-terminal-title-row"><div class="home-title-tile">B</div><div><h2>BYTE OFFICE</h2><p>Check in. Read the instructions. Make the machine work.</p></div></div>
        </div>

        <div class="home-file-card">
          <div class="home-file-tab">EMPLOYEE TERMINAL</div>
          <div class="home-resume-copy">
            <span id="homeProgressLabel">CURRENT ASSIGNMENT</span>
            <h2 id="homeLevelTitle">Level 01 · Mail Room</h2>
            <p id="homeLevelSummary">Your saved worktrees and progress are ready.</p>
            <div class="home-byte-mascot" aria-hidden="true"><div class="mascot-antenna"></div><div class="mascot-head"><i></i><i></i></div><div class="mascot-body">B</div><div class="mascot-board"></div></div>
            <div class="home-mini-note" aria-hidden="true">Good<br>Programs<br>Build<br>Brighter<br>You ☺</div>
          </div>

          <div class="home-actions">
            <button class="home-primary" id="homeResumeBtn"><span>▶</span><b>Resume work</b><small>Continue your saved assignment</small><em>→</em></button>
            <button class="home-action" id="homeMapBtn"><span>▱</span><b>View map</b><small>Browse all levels and track progress</small><em>→</em></button>
            <button class="home-action" id="homeSettingsBtn"><span>⚙</span><b>Settings</b><small>Audio, controls and interface</small><em>→</em></button>
          </div>

          <div class="home-settings" hidden id="homeSettingsPanel">
            <div class="home-settings-head"><div><span>TERMINAL PREFERENCES</span><b>Settings</b></div><button aria-label="Close settings" id="homeSettingsClose">×</button></div>
            <label class="setting-row"><span><b>Music</b><small>Quiet procedural office ambience</small></span><input id="musicToggle" type="checkbox"/><i></i></label>
            <label class="setting-row"><span><b>Sound effects</b><small>Machine clicks, alerts and completion tones</small></span><input id="sfxToggle" type="checkbox"/><i></i></label>
            <label class="setting-row"><span><b>Page transitions</b><small>Animated movement between menu, map and game</small></span><input id="transitionToggle" type="checkbox"/><i></i></label>
            <label class="setting-row"><span><b>Reduced motion</b><small>Limit decorative UI movement</small></span><input id="motionToggle" type="checkbox"/><i></i></label>
            <label class="setting-row"><span><b>Editor tips</b><small>Show shortcut hints above instructions</small></span><input id="tipsToggle" type="checkbox"/><i></i></label>
            <label class="setting-row"><span><b>Unlock all levels</b><small>Open every roadmap assignment without changing completion progress</small></span><input id="unlockLevelsToggle" type="checkbox"/><i></i></label>
            <label class="setting-row"><span><b>Show answers</b><small>Show the exact read-only command solution beside your two drafts</small></span><input id="answersToggle" type="checkbox"/><i></i></label>
          </div>

          <div class="home-meta"><span id="homeCompletion">0 / 50 assignments cleared</span><span>Auto-save enabled <i></i></span></div>
        </div>
      </div>
    </main>
  </div>
</section>
`;
