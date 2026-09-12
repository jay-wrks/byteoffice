window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.missionPanel = String.raw`
<section class="mission-panel paper-panel">
<div class="paper-pin pin-left"></div>
<div class="paper-pin pin-right"></div>
<div class="mission-kicker" id="levelNumber">LEVEL 01</div>
<h1 id="levelTitle">Mail Room</h1>
<p class="mission-story" id="levelStory"></p>
<div class="objective-box">
<span class="objective-label">YOUR ASSIGNMENT</span>
<p id="levelObjective"></p>
</div>
<div class="examples-box">
<div class="examples-title">EXAMPLES</div>
<div class="level-examples" id="levelExamples"></div>
</div>
<div class="goal-row">
<div><span>Best size</span><strong id="sizeGoal">—</strong></div>
<div><span>Best steps</span><strong id="stepGoal">—</strong></div>
</div>
<button class="paper-button" id="hintBtn">Need a hint?</button>
</section>
`;
