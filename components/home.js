window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.home = String.raw`
<section aria-label="Byte Office main menu" class="home-screen" id="homeScreen">
  <div aria-hidden="true" class="home-backdrop-grid"></div>
  <div class="home-desk">
    <div class="home-brand-row">
      <div class="home-brand-mark">B</div>
      <div>
        <span class="home-kicker">DEPARTMENT OF TINY PROGRAMS</span>
        <h1>BYTE OFFICE</h1>
        <p>Clock in. Read the instructions. Make the machine work.</p>
      </div>
    </div>

    <nav class="home-side-nav" aria-label="Main navigation">
      <button type="button" class="active"><span>⌂</span>Home</button>
      <button type="button" id="homeLevelsNav"><span>▱</span>Levels</button>
      <button type="button" id="homeDashboardNav"><span>▥</span>Dashboard</button>
      <button type="button" id="homeBadgesNav"><span>★</span>Badges</button>
      <button type="button" id="homeHelpNav"><span>?</span>How to Play</button>
      <div class="home-nav-spacer"></div>
      <button type="button" id="homeSettingsNav"><span>⚙</span>Settings</button>
    </nav>

    <div class="home-workspace">
      <div class="home-file-card">
        <div class="home-file-tab">EMPLOYEE TERMINAL</div>
        <div class="home-resume-copy">
          <span id="homeProgressLabel">CURRENT ASSIGNMENT</span>
          <h2 id="homeLevelTitle">Level 01 · Mail Room</h2>
          <p id="homeLevelSummary">Your saved worktrees and progress are ready.</p>
        </div>
        <div class="home-actions">
          <button class="home-primary" id="homeResumeBtn"><span>▶</span><b>Resume work</b><small>Continue your saved assignment</small></button>
          <button class="home-action" id="homeMapBtn"><span>▱</span><b>View map</b><small>Browse all levels and track progress</small></button>
          <button class="home-action" id="homeSettingsBtn"><span>⚙</span><b>Settings</b><small>Audio, controls and interface</small></button>
        </div>
        <div class="home-settings" hidden="" id="homeSettingsPanel">
          <div class="home-settings-head"><div><span>TERMINAL PREFERENCES</span><b>Settings</b></div><button aria-label="Close settings" id="homeSettingsClose">×</button></div>
          <label class="setting-row"><span><b>Music</b><small>Quiet procedural office ambience</small></span><input id="musicToggle" type="checkbox"/><i></i></label>
          <label class="setting-row"><span><b>Sound effects</b><small>Machine clicks, alerts and completion tones</small></span><input id="sfxToggle" type="checkbox"/><i></i></label>
          <label class="setting-row"><span><b>Page transitions</b><small>Animated movement between menu, map and game</small></span><input id="transitionToggle" type="checkbox"/><i></i></label>
          <label class="setting-row"><span><b>Reduced motion</b><small>Limit decorative UI movement</small></span><input id="motionToggle" type="checkbox"/><i></i></label>
          <label class="setting-row"><span><b>Editor tips</b><small>Show shortcut hints above instructions</small></span><input id="tipsToggle" type="checkbox"/><i></i></label>
          <label class="setting-row"><span><b>Unlock all levels</b><small>Open every roadmap assignment without changing completion progress</small></span><input id="unlockLevelsToggle" type="checkbox"/><i></i></label>
          <label class="setting-row"><span><b>Show answers</b><small>Show the exact read-only command solution beside your two drafts</small></span><input id="answersToggle" type="checkbox"/><i></i></label>
        </div>
        <div class="home-meta"><span id="homeCompletion">0 / 50 assignments cleared</span><span>Autosave enabled</span></div>
      </div>
    </div>
  </div>
</section>
`;
