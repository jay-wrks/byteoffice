window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.factoryPanel = String.raw`
<section class="factory-panel">
<div class="room-sign"><span>PROCESSING FLOOR</span></div>
<div class="factory-scene" id="scene">
<div aria-hidden="true" class="factory-props">
  <img class="factory-prop prop-wrench" src="assets/pack2/open-ended-wrench.png" alt="" />
  <img class="factory-prop prop-screwdriver" src="assets/pack2/screwdriver.png" alt="" />
  <img class="factory-prop prop-chip" src="assets/pack2/microchip.png" alt="" />
  <img class="factory-prop prop-gear-small" src="assets/pack2/small-gear.png" alt="" />
</div>
<div class="conveyor inbox-zone">
<div class="zone-label">INBOX</div>
<div class="boxes" id="inbox"></div>
</div>
<div data-component="components/robot.html"></div>
<div class="work-floor">
<div class="memory-title">FLOOR MEMORY</div>
<div class="memory-grid" id="memory"></div>
</div>
<div class="conveyor outbox-zone">
<div class="zone-label">OUTBOX</div>
<div class="boxes out" id="outbox"></div>
</div>
</div>
<div class="machine-console">
<div class="status-lamp"><span id="lamp"></span><b id="statusText">READY</b></div>
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
<button class="machine-btn run" id="runBtn">▶ RUN</button>
<button class="machine-btn" id="stepBtn">⏭ STEP</button>
<button class="machine-btn" id="pauseBtn">⏸ PAUSE</button>
<button class="machine-btn" id="resetBtn">↻ RESET</button>
</div>
</div>
</section>
`;
