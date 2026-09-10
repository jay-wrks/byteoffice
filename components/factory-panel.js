window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.factoryPanel = String.raw`
<section class="factory-panel">
<div class="room-sign"><span>PROCESSING FLOOR</span><i>BYTE-01</i></div>
<div class="factory-scene" id="scene">
<div aria-hidden="true" class="factory-world-decor">
<div class="factory-back-wall"></div>
<div class="factory-overhead-rail"><i></i><i></i><i></i></div>
<div class="factory-warning-light light-a"></div>
<div class="factory-warning-light light-b"></div>
<div class="factory-cable cable-a"></div>
<div class="factory-cable cable-b"></div>
<div class="factory-floor-mark mark-a">A-01</div>
<div class="factory-floor-mark mark-b">B-07</div>
</div>
<div class="conveyor inbox-zone">
<div class="zone-label"><span>INBOX</span><small>RECEIVE</small></div>
<div aria-hidden="true" class="conveyor-machine"><i></i><i></i><i></i></div>
<div class="boxes" id="inbox"></div>
<div aria-hidden="true" class="conveyor-endcap"></div>
</div>
<div data-component="components/robot.html"></div>
<div class="work-floor">
<div class="byte-station-label"><span>BYTE STATION</span><i></i></div>
<div class="memory-title">FLOOR MEMORY <small>PHYSICAL STORAGE</small></div>
<div class="memory-grid" id="memory"></div>
</div>
<div class="conveyor outbox-zone">
<div class="zone-label"><span>OUTBOX</span><small>DISPATCH</small></div>
<div aria-hidden="true" class="conveyor-machine"><i></i><i></i><i></i></div>
<div class="boxes out" id="outbox"></div>
<div aria-hidden="true" class="conveyor-endcap"></div>
</div>
</div>
<div class="machine-console">
<div class="status-lamp"><span id="lamp"></span><div><small>MACHINE</small><b id="statusText">READY</b></div></div>
<div aria-label="Execution speed" class="speed-control">
<div class="speed-head"><label for="speedRange">SPEED</label><output for="speedRange" id="speedReadout">1× NORMAL</output></div>
<div class="speed-slider-row">
<span aria-hidden="true" class="speed-glyph">◀</span>
<input id="speedRange" max="8" min="1" step="1" type="range" value="3">
<span aria-hidden="true" class="speed-glyph fast">▶▶</span>
</input></div>
<div aria-hidden="true" class="speed-scale"><span>SLOW</span><span>NORMAL</span><span>TURBO</span></div>
</div>
<div class="console-actions">
<button class="machine-btn run" id="runBtn"><span>▶</span><b>RUN</b></button>
<button class="machine-btn" id="stepBtn"><span>›|</span><b>STEP</b></button>
<button class="machine-btn" id="pauseBtn"><span>Ⅱ</span><b>PAUSE</b></button>
<button class="machine-btn" id="resetBtn"><span>↻</span><b>RESET</b></button>
</div>
</div>
</section>
`;
