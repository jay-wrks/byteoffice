window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.missionPanel = String.raw`
<section class="mission-panel paper-panel">
<div class="mission-kicker" id="levelNumber">LEVEL 01</div>
<h1 id="levelTitle">Mail Room</h1>
<p class="mission-story" id="levelStory"></p>
<div class="objective-box">
<span class="objective-label">OBJECTIVE</span>
<p id="levelObjective"></p>
</div>
<div class="examples-box">
<div class="examples-title">INPUT → OUTPUT</div>
<div class="level-examples" id="levelExamples"></div>
</div>
<div class="goal-row">
<div><span>Size goal</span><strong id="sizeGoal">—</strong></div>
<div><span>Step goal</span><strong id="stepGoal">—</strong></div>
</div>
<button class="paper-button" id="hintBtn">Supervisor hint</button>
</section>
`;
