function setRobotGrip(mode="") {
  if(!els.workerWrap) return;
  // `held` means a centered two-hand carry cradle. Facing only determines
  // approach/reach direction; it must never move an owned payload sideways.
  if(mode) els.workerWrap.dataset.grip=mode;
  else delete els.workerWrap.dataset.grip;
}

function setRobotFacing(left){
  els.worker.classList.toggle("face-left",!!left);
  els.workerWrap.dataset.facing=left ? "left" : "right";
}

function faceTowardElement(el){
  // Manipulation direction must come from the real object position, never
  // from a remembered/default side. This prevents a stale facing state from
  // making Byte reach right while the physical box is on the left.
  if(!el || !el.getBoundingClientRect) return;
  const target=el.getBoundingClientRect();
  const robot=els.worker.getBoundingClientRect();
  const targetX=target.left+target.width/2;
  const robotX=robot.left+robot.width/2;
  if(Math.abs(targetX-robotX) > 3) setRobotFacing(targetX < robotX);
}

function faceInteraction(side){
  // The held tile is a sibling of the mirrored robot, so keep an explicit
  // facing state on the wrapper. This places the payload in front of Byte
  // rather than inside the torso. Memory interactions use a stable right
  // facing stance while the arms reach down to the floor tile.
  if(side==="inbox") setRobotFacing(true);
  else if(side==="outbox" || side==="memory") setRobotFacing(false);
}

function setPose(pose){
  els.workerWrap.classList.remove("walking","reaching","placing","copying","thinking","celebrate","error-pose","calculating","throwing","action-anticipate","action-contact","action-recover");
  if(pose) els.workerWrap.classList.add(pose);
}

function placeWorkerHome(immediate=false){
  const scene=els.scene.getBoundingClientRect();
  setRobotFacing(false);
  const x=scene.width*0.5-60, y=Math.max(80, scene.height*0.28-90);
  if(immediate){ els.workerWrap.style.transition="none"; setWorkerPosition(x,y); void els.workerWrap.offsetWidth; els.workerWrap.style.transition=""; }
  else setWorkerPosition(x,y);
}

function setWorkerPosition(x,y){ els.workerWrap.style.left=`${x}px`; els.workerWrap.style.top=`${y}px`; }
function currentWorkerX(){ return parseFloat(els.workerWrap.style.left)||0; }

function targetPosition(el, side="center"){
  const scene=els.scene.getBoundingClientRect(), r=el.getBoundingClientRect();
  let tx=r.left-scene.left+r.width/2-60;
  let ty=r.top-scene.top+r.height/2-132;
  if(side==="inbox") {
    tx=r.right-scene.left+9;
    ty=r.top-scene.top+r.height/2-106;
  }
  if(side==="outbox") {
    tx=r.left-scene.left-129;
    ty=r.top-scene.top+r.height/2-106;
  }
  if(side==="memory") {
    // Feet stop *above* the floor tile instead of on it.  The box transfer
    // still targets the tile itself, so character positioning and ownership
    // positioning are independent.
    const tileCenter=r.left-scene.left+r.width/2;
    tx=tileCenter-60;
    ty=r.top-scene.top-148;
    // Near the side walls, stand slightly inward so arms reach the tile
    // without the body covering it.
    if(tileCenter < scene.width*.34) tx += 16;
    else if(tileCenter > scene.width*.66) tx -= 16;
  }
  tx=clamp(tx,4,scene.width-124); ty=clamp(ty,32,scene.height-184);
  return {x:tx,y:ty};
}

async function walkTo(el, side="center"){
  if(!el) return;
  const carrying=els.held.classList.contains("has-value");
  setRobotGrip(carrying ? "held" : "");
  const p=targetPosition(el,side), fromX=currentWorkerX();
  const fromY=parseFloat(els.workerWrap.style.top)||0;
  const distance=Math.hypot(p.x-fromX,p.y-fromY);

  // v1.8 ground-coupled locomotion. Translation is the source of truth.
  // Think of the legs like a tyre on a road: when the chassis speed changes,
  // foot cadence changes by the same ratio. A fixed virtual stride makes
  // footfalls spatially meaningful instead of being a decorative loop.
  const scale=motionScale();
  const worldSpeed=(carrying ? 0.285 : 0.315)/scale; // floor pixels / ms
  const stridePx=carrying ? 78 : 84;                 // distance per full L/R gait cycle
  const travel=Math.max(dur(155),Math.round(distance/worldSpeed));
  const stepMs=Math.round(clamp(stridePx/worldSpeed,190,620));
  const halfStepMs=Math.round(stepMs/2);
  const plantPx=Math.round(stridePx*.24);

  setRobotFacing(p.x < fromX-2);
  els.workerWrap.classList.toggle("carrying",carrying);
  setPose("walking");
  els.workerWrap.style.setProperty("--walk-ms",`${stepMs}ms`);
  els.workerWrap.style.setProperty("--half-walk-ms",`${halfStepMs}ms`);
  els.workerWrap.style.setProperty("--plant-px",`${plantPx}px`);
  els.workerWrap.style.setProperty("--bob-ms",`${halfStepMs}ms`);
  els.workerWrap.style.setProperty("--carry-ms",`${stepMs}ms`);
  els.workerWrap.style.setProperty("--travel-ms",`${travel}ms`);

  // Linear chassis motion is deliberate: a planted foot counter-translates
  // at the same constant floor speed, eliminating visible foot skating.
  els.workerWrap.style.transition=`left ${travel}ms linear, top ${travel}ms linear`;
  setWorkerPosition(p.x,p.y);
  let footTimer=null;
  if(settings.sfx && distance>24){ sfx('foot'); footTimer=setInterval(()=>sfx('foot'),Math.max(150,halfStepMs)); }
  await wait(travel+dur(26));
  if(footTimer) clearInterval(footTimer);
  setPose("");
  els.workerWrap.classList.remove("carrying");

  // Stopping kills locomotion/inertia only.  A carried box stays physically
  // clamped in both hands with zero idle shake.
  if(carrying) setRobotGrip("held");
  else setRobotGrip("");

  // Conveyor interactions naturally face the belt.  For floor memory we do
  // not force a turn after stopping; that used to sweep a held tile through
  // Byte's torso.  The dedicated downward memory grip handles that action.
  if(side!=="memory") faceInteraction(side);
  await wait(dur(45));
}

async function physicalPose(type,note,beforeAction,afterAction,{grip="",target=null,quietRelease=false}={}){
  if(note) els.footer.textContent=note;
  // Lock orientation from the object immediately before the action starts.
  // walkTo() decides locomotion facing; this decides manipulation facing.
  if(target) faceTowardElement(target);
  setPose(type);
  setRobotGrip("");
  els.workerWrap.classList.add("action-anticipate");
  await wait(dur(type==="copying" ? 190 : 155));
  els.workerWrap.classList.remove("action-anticipate");
  if(target) faceTowardElement(target);
  if(grip) setRobotGrip(grip);
  els.workerWrap.classList.add("action-contact");
  await wait(dur(85)); // visible hand-to-box contact before ownership moves
  if(beforeAction) await beforeAction();
  if(afterAction) await afterAction();
  sfx(type==='placing'?'place':type==='copying'?'copy':'pickup');
  els.workerWrap.classList.remove("action-contact");
  // OUTBOX completes its release to the true idle arm geometry inside flyBox.
  // Do not play another arm recovery after that exact handoff.
  if(!quietRelease) els.workerWrap.classList.add("action-recover");
  await wait(dur(105));
  // Recovery may open a transient action grip, but if Byte still owns a box
  // the carry clamps immediately become the authoritative hands. Never leave
  // a centered payload visually floating after an action finishes.
  const stillHolding=els.held.classList.contains("has-value");
  setRobotGrip(stillHolding ? "held" : "");
  await wait(dur(type==="copying" ? 150 : 110));
  if(!quietRelease) els.workerWrap.classList.remove("action-recover");
  setPose("");
  if(els.held.classList.contains("has-value")) setRobotGrip("held");
}

async function showThoughtBubble(text,{kind="think",duration=620}={}){
  const bubble=document.createElement("div");
  bubble.className=`robot-thought robot-thought-${kind}`;
  bubble.innerHTML=`<span class="thought-dot d1"></span><span class="thought-dot d2"></span><div class="thought-card"><b>${kind==="calc"?"BEEP BOOP":"THINK"}</b><span>${text}</span></div>`;
  const r=els.workerWrap.getBoundingClientRect();
  bubble.style.left=`${r.left+r.width*.72}px`;
  bubble.style.top=`${r.top+10}px`;
  document.body.appendChild(bubble);
  await nextPaint();
  bubble.classList.add("show");
  await wait(dur(duration));
  bubble.classList.add("hide");
  await wait(dur(220));
  bubble.remove();
}

async function animateMathOperation(op, tile, source, beforeValue, memoryValue, resultValue){
  if(!tile || !source) return;
  const symbol=op==="SUB" ? "−" : "+";
  const h=centerOf(els.held), m=centerOf(source);
  const cx=(h.x+m.x)/2, cy=Math.min(h.y,m.y)-54;

  const stage=document.createElement("div");
  stage.className=`math-stage math-stage-v8 math-${op.toLowerCase()}`;
  stage.style.left=`${cx}px`; stage.style.top=`${cy}px`;
  stage.setAttribute("aria-hidden","true");

  const heldGhost=makeValueBox(beforeValue,false);
  const memoryGhost=makeValueBox(memoryValue,false);
  heldGhost.classList.add("math-operand","math-held-operand");
  memoryGhost.classList.add("math-operand","math-memory-operand");
  const operator=document.createElement("div"); operator.className="math-operator math-symbol-v8"; operator.textContent=symbol;
  const equation=document.createElement("div"); equation.className="math-equation-v8"; equation.textContent=`${beforeValue} ${symbol} ${memoryValue}`;
  const caption=document.createElement("div"); caption.className="math-caption-v8"; caption.textContent=op==="ADD"?"ADD VALUES":"SUBTRACT VALUES";
  stage.append(heldGhost,operator,memoryGhost,equation,caption);
  document.body.appendChild(stage);
  await nextPaint();
  stage.classList.add("math-enter");
  sfx('math');

  const hp={x:h.x-cx,y:h.y-cy}, mp={x:m.x-cx,y:m.y-cy};
  heldGhost.style.transform=`translate3d(${hp.x}px,${hp.y}px,0)`;
  memoryGhost.style.transform=`translate3d(${mp.x}px,${mp.y}px,0)`;

  // Both moving operands are painted directly over the originals first.
  await nextPaint();
  park(els.held);
  park(source);
  setPose("calculating");
  const calcThought=showThoughtBubble(`${beforeValue} ${symbol} ${memoryValue} = ?`,{kind:"calc",duration:520});

  // Bring both physical boxes into a clear calculation position.
  await Promise.all([
    animateCommit(heldGhost,[
      {transform:`translate3d(${hp.x}px,${hp.y}px,0) rotate(0deg)`},
      {transform:"translate3d(-72px,0,0) rotate(-1deg)"}
    ],{duration:dur(620),easing:"cubic-bezier(.22,.61,.25,1)"}),
    animateCommit(memoryGhost,[
      {transform:`translate3d(${mp.x}px,${mp.y}px,0) rotate(0deg)`},
      {transform:"translate3d(72px,0,0) rotate(1deg)"}
    ],{duration:dur(620),easing:"cubic-bezier(.22,.61,.25,1)"})
  ]);
  await wait(dur(160));

  // Move toward the operator; no scaling/fading and no duplicate floor/hand boxes.
  const leftEnd=op==="ADD"?-35:-42, rightEnd=op==="ADD"?35:24;
  await Promise.all([
    animateCommit(heldGhost,[
      {transform:"translate3d(-72px,0,0) rotate(-1deg)"},
      {transform:`translate3d(${leftEnd}px,0,0) rotate(0deg)`}
    ],{duration:dur(430),easing:"cubic-bezier(.3,0,.2,1)"}),
    animateCommit(memoryGhost,[
      {transform:"translate3d(72px,0,0) rotate(1deg)"},
      {transform:`translate3d(${rightEnd}px,0,0) rotate(${op==="SUB"?-4:0}deg)`}
    ],{duration:dur(430),easing:"cubic-bezier(.3,0,.2,1)"})
  ]);
  sfx('math');
  await wait(dur(180));

  // Result belongs to the held physical box; memory remains unchanged.
  heldGhost.textContent=String(resultValue);
  equation.textContent=`${beforeValue} ${symbol} ${memoryValue} = ${resultValue}`;
  caption.textContent="RESULT";
  await wait(dur(300));

  // Memory operand physically returns to the same floor slot.
  await animateCommit(memoryGhost,[
    {transform:`translate3d(${rightEnd}px,0,0) rotate(${op==="SUB"?-4:0}deg)`},
    {transform:`translate3d(${mp.x}px,${mp.y}px,0) rotate(0deg)`}
  ],{duration:dur(560),easing:"cubic-bezier(.22,.61,.25,1)"});
  unpark(source);
  await nextPaint();
  memoryGhost.remove();

  // Result box returns to the worker's hands and hands take ownership underneath it.
  await animateCommit(heldGhost,[
    {transform:`translate3d(${leftEnd}px,0,0) rotate(0deg)`},
    {transform:`translate3d(${hp.x}px,${hp.y}px,0) rotate(0deg)`}
  ],{duration:dur(560),easing:"cubic-bezier(.22,.61,.25,1)"});
  setHeldVisual(resultValue);
  unpark(els.held);
  await nextPaint();
  heldGhost.remove();
  await calcThought;
  stage.classList.remove("math-enter");
  stage.classList.add("math-exit");
  await wait(dur(260));
  stage.remove();
  setPose("");
}

async function animateTransition(r){
  // Any transient from a cancelled/failed prior action must never leak into the next one.
  clearTransientBoxes();
  const ins=r.instruction || {};
  highlightLine(r.executedPc ?? r.before.pc);
  els.steps.textContent=r.after.steps;
  setStatus("WORKING","working");
  if(r.status==="error"){
    setPose("error-pose"); renderVisual(r.before,r.executedPc ?? r.before.pc); setStatus("ERROR","error"); els.footer.textContent=r.message; sfx('error'); await wait(dur(350)); return;
  }
  if(r.event==="halt" || r.event==="inbox-empty") { renderVisual(r.after); return; }

  if(r.event==="read"){
    const source=els.inbox.querySelector(".value-box");
    await walkTo(source || els.inbox,"inbox");
    if(r.before.held!==null){
      await throwDestroyBox(els.held,r.before.held,{onDestroyed:async()=>setHeldVisual(null)});
    }
    await physicalPose("reaching","Picking the next box from INBOX…",async()=>{
      await flyBox(source,els.held,r.after.held,{moveSource:true,gripStart:"side",gripEnd:"held",onArrive:async()=>{
        setHeldVisual(r.after.held);
        if(source) await removeInboxBoxSmooth(source);
      }});
    },null,{grip:"side",target:source});
  } else if(r.event==="write"){
    // OUTBOX is a true ownership transfer. Do NOT create the destination box
    // before the held box has physically arrived, otherwise the same value is
    // visible in the worker's hands and in OUTBOX at the same time.
    const destination=createOutboxAnchor();
    await walkTo(destination,"outbox");
    await physicalPose("placing","Placing the held box into OUTBOX…",async()=>{
      await flyBox(els.held,destination,r.before.held,{moveSource:true,output:true,reversePickup:true,gripStart:"held",gripEnd:"",onArrive:async()=>{
        // Commit underneath the still-visible transfer tile, exactly like the
        // INBOX ownership handoff but reversed: hands -> conveyor.
        commitOutboxAtAnchor(destination,r.before.held);
        setHeldVisual(null);
      }});
    },null,{grip:"held",target:destination});
    if(destination.isConnected) destination.remove();
  } else if(r.event==="place"){
    const tile=els.memory.querySelector(`[data-i="${ins.arg}"]`), target=tile?.querySelector(".memory-box")||tile;
    await walkTo(tile || els.memory,"memory");
    if(r.before.memory[ins.arg]!==null){
      await throwDestroyBox(target,r.before.memory[ins.arg],{memory:true,onDestroyed:async()=>setMemoryVisual(ins.arg,null)});
    }
    await physicalPose("placing",`Placing the held box onto floor slot ${memoryName(ins.arg)}; hands become empty…`,async()=>{
      await flyBox(els.held,target,r.before.held,{moveSource:true,gripStart:"held",gripEnd:"memory",onArrive:async()=>{
        setMemoryVisual(ins.arg,r.after.memory[ins.arg]);
        setHeldVisual(null);
      }});
    },null,{grip:"held",target:target});
  } else if(r.event==="take"){
    const tile=els.memory.querySelector(`[data-i="${ins.arg}"]`), source=tile?.querySelector(".memory-box")||tile;
    await walkTo(tile || els.memory,"memory");
    if(r.before.held!==null){
      await throwDestroyBox(els.held,r.before.held,{onDestroyed:async()=>setHeldVisual(null)});
    }
    await physicalPose("reaching",`TAKE: lifting the box from floor slot ${memoryName(ins.arg)} into the worker's hands…`,async()=>{
      await flyBox(source,els.held,r.after.held,{moveSource:true,gripStart:"memory",gripEnd:"held",onArrive:async()=>{
        setMemoryVisual(ins.arg,null);
        setHeldVisual(r.after.held);
      }});
    },null,{grip:"memory",target:source});
  } else if(r.event==="store"){
    const tile=els.memory.querySelector(`[data-i="${ins.arg}"]`), target=tile?.querySelector(".memory-box")||tile;
    await walkTo(tile || els.memory,"memory");
    if(r.before.memory[ins.arg]!==null){
      await throwDestroyBox(target,r.before.memory[ins.arg],{memory:true,onDestroyed:async()=>setMemoryVisual(ins.arg,null)});
    }
    await physicalPose("copying",`COPYTO: creating a duplicate, separating it, then placing only the copy on floor slot ${memoryName(ins.arg)}…`,async()=>{
      await copyToMemoryEffect(els.held,target,r.before.held,async()=>{
        setMemoryVisual(ins.arg,r.after.memory[ins.arg]);
        setHeldVisual(r.after.held);
      });
    },null,{grip:"held",target:target});
  } else if(r.event==="load"){
    const tile=els.memory.querySelector(`[data-i="${ins.arg}"]`), source=tile?.querySelector(".memory-box")||tile;
    await walkTo(tile || els.memory,"memory");
    if(r.before.held!==null){
      await throwDestroyBox(els.held,r.before.held,{onDestroyed:async()=>setHeldVisual(null)});
    }
    await physicalPose("copying",`COPYFROM: duplicating floor slot ${memoryName(ins.arg)}, then bringing the copy into the worker's hands…`,async()=>{
      await copyFromMemoryEffect(source,els.held,r.after.held,async()=>setHeldVisual(r.after.held));
    },null,{grip:"memory",target:source});
  } else if(r.event==="math"){
    const tile=els.memory.querySelector(`[data-i="${ins.arg}"]`), source=tile?.querySelector(".memory-box")||tile;
    await walkTo(tile || els.memory,"memory");
    els.footer.textContent=`${ins.op}: ${r.before.held} ${ins.op==="SUB"?"−":"+"} ${r.before.memory[ins.arg]}…`;
    await animateMathOperation(ins.op,tile,source,r.before.held,r.before.memory[ins.arg],r.after.held);
    els.footer.textContent=`${r.before.held} ${ins.op==="SUB"?"−":"+"} ${r.before.memory[ins.arg]} = ${r.after.held}`;
  } else if(r.event==="jump"){
    setPose("thinking"); els.footer.textContent=`Following the branch arrow to ${lineName(r.after.pc)}…`;
    const thought=showThoughtBubble(`↪ ${lineName(r.after.pc)}?`,{kind:"think",duration:390});
    await wait(dur(220)); highlightLine(r.after.pc); await thought; setPose("");
  }
  visualState={...r.after,input:[...r.after.input],output:[...r.after.output],memory:[...r.after.memory]};
}

