window.ByteOfficeComponents = window.ByteOfficeComponents || {};
window.ByteOfficeComponents.robot = String.raw`
<div aria-label="Byte, the mini factory robot" class="worker-wrap robot-wrap" id="workerWrap">
<div class="worker-shadow robot-shadow"></div>
<div class="worker robot" id="worker">
<div class="worker-head robot-head">
<span class="robot-antenna"><i></i></span>
<span class="robot-ear ear-left"></span><span class="robot-ear ear-right"></span>
<span class="robot-face-screen">
<span class="eye eye-l"></span><span class="eye eye-r"></span>
<span class="mouth"></span>
<span class="robot-cheek cheek-l"></span><span class="robot-cheek cheek-r"></span>
</span>
</div>
<div class="worker-body robot-body">
<span class="robot-neck"></span>
<span class="robot-chest-screen"><i></i><b></b><em></em></span>
<span class="robot-belly-light"></span>
<span class="robot-side-bolt bolt-l"></span><span class="robot-side-bolt bolt-r"></span>
</div>
<div class="worker-arm left-arm robot-arm"><span class="arm-joint"></span><span class="hand robot-claw"><i></i><b></b></span></div>
<div class="worker-arm right-arm robot-arm"><span class="arm-joint"></span><span class="hand robot-claw"><i></i><b></b></span></div>
<div class="worker-leg left-leg robot-leg"><span class="leg-joint"></span><span class="shoe robot-foot"></span></div>
<div class="worker-leg right-leg robot-leg"><span class="leg-joint"></span><span class="shoe robot-foot"></span></div>
</div>
<div aria-hidden="true" class="carry-rig" id="carryRig">
<div class="held-card" id="heldCard">—</div>
</div>
</div>
`;
