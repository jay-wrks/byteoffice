function resetMachine(message=true){
  stopRun(); animating=false; clearTransientBoxes(); engine.resetState(level().input, level().memory, program); visualState=engine.snapshot();
  resetPhysicalScene(visualState); setStatus("READY","ready"); clearActive(); placeWorkerHome(true); setPose("");
  if(message) els.footer.textContent="Machine reset. Your program is ready.";
}

function makeValueBox(value, output=false){
  const d=document.createElement("div");
  d.className=`value-box${output ? " output-box" : ""}`;
  d.textContent=value;
  return d;
}

function setEmptyState(container, text){
  const boxes=container.querySelectorAll(".value-box");
  let empty=container.querySelector(".empty-zone");
  if(boxes.length){ if(empty) empty.remove(); return; }
  if(!empty){ empty=document.createElement("div"); empty.className="empty-zone"; container.appendChild(empty); }
  empty.textContent=text;
}

function resetPhysicalScene(s){
  visualState={...s,input:[...s.input],output:[...s.output],memory:[...s.memory]};
  els.outbox.classList.remove('output-error-flash','output-success-flash');
  els.workerWrap.classList.remove('wrong-output-recoil','level-success-celebration');
  els.inbox.innerHTML="";
  s.input.forEach(v=>els.inbox.appendChild(makeValueBox(v,false)));
  setEmptyState(els.inbox,"EMPTY");
  els.outbox.innerHTML="";
  s.output.forEach(v=>els.outbox.appendChild(makeValueBox(v,true)));
  setEmptyState(els.outbox,"WAITING");
  setHeldVisual(s.held);
  s.memory.forEach((v,i)=>setMemoryVisual(i,v));
  els.steps.textContent=s.steps;
  highlightLine(s.pc);
}

function setHeldVisual(value){
  const next=value===null ? "" : String(value);
  const has=value!==null;
  if(els.held.dataset.value!==next){ els.held.textContent=next; els.held.dataset.value=next; }
  if(els.held.classList.contains("has-value")!==has) els.held.classList.toggle("has-value",has);
  const label=has ? `Holding ${value}` : "Hands empty";
  if(els.held.getAttribute("aria-label")!==label) els.held.setAttribute("aria-label",label);
  if(els.workerWrap) els.workerWrap.classList.toggle("has-held",has);

  // Holding is a persistent physical state.  Once a tile belongs to Byte,
  // the claws remain locked to it even while he is standing still.  Action
  // code may temporarily replace this with memory/side/copy/throw grips.
  const activeGrip=els.workerWrap?.dataset.grip || "";
  const actionGrip=activeGrip && activeGrip!=="held";
  if(has && !actionGrip) setRobotGrip("held");
  else if(!has && activeGrip==="held") setRobotGrip("");
}

function setMemoryVisual(i,value){
  const tile=els.memory.querySelector(`[data-i="${i}"]`);
  if(!tile) return;
  const box=tile.querySelector(".memory-box");
  const next=value===null ? "" : String(value), has=value!==null;
  if(box.dataset.value!==next){ box.textContent=next; box.dataset.value=next; }
  if(box.classList.contains("has-value")!==has) box.classList.toggle("has-value",has);
}

function highlightLine(line){
  clearActive();
  if(line>=0){
    const row=els.list.querySelector(`[data-index="${line}"]`);
    if(row){ row.classList.add("active"); row.scrollIntoView({block:"nearest",behavior:"auto"}); }
  }
}

function renderVisual(s, executedPc=null){
  visualState={...s,input:[...s.input],output:[...s.output],memory:[...s.memory]};
  setHeldVisual(s.held);
  s.memory.forEach((v,i)=>setMemoryVisual(i,v));
  els.steps.textContent=s.steps;
  highlightLine(executedPc!==null ? executedPc : s.pc);
}

function centerOf(el){
  const r=el.getBoundingClientRect();
  return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};
}

function nextPaint(){ return new Promise(resolve => requestAnimationFrame(()=>requestAnimationFrame(resolve))); }

function cancelAnimations(el){
  if(!el || !el.getAnimations) return;
  for(const a of el.getAnimations()){
    try{ a.cancel(); }catch(_){ }
  }
}

async function animateCommit(el,keyframes,options={}){
  if(!el) return;
  cancelAnimations(el);
  const last=keyframes[keyframes.length-1] || {};
  const animation=el.animate(keyframes,{...options,fill:"none"});
  try{ await animation.finished; }catch(_){ if(options.duration) await wait(options.duration); }
  if(last.transform!==undefined) el.style.transform=last.transform;
  if(last.left!==undefined) el.style.left=last.left;
  if(last.top!==undefined) el.style.top=last.top;
  cancelAnimations(el);
}

function park(el){
  if(!el) return;
  cancelAnimations(el);
  el.classList.add("physical-parked");
  // Ownership handoff must win over .has-value visibility rules.
  // This is an instantaneous hide under the transfer tile, not a fade.
  el.style.setProperty("visibility","hidden","important");
}

function unpark(el){
  if(!el) return;
  el.classList.remove("physical-parked");
  el.style.removeProperty("visibility");
}

function clearTransientBoxes(){
  document.querySelectorAll(".transfer-box,.discard-box,.math-stage,.result-burst").forEach(el=>{
    cancelAnimations(el); el.remove();
  });
  document.querySelectorAll(".box-in-transit,.physical-hidden,.copy-source-active,.physical-parked").forEach(el=>{
    el.classList.remove("box-in-transit","physical-hidden","copy-source-active","physical-parked");
    el.style.removeProperty("visibility");
  });
}

function makeTransferAt(sourceEl,value,output=false,extraClass=""){
  const a=centerOf(sourceEl);
  const ghost=makeValueBox(value,output);
  ghost.classList.add("transfer-box");
  if(extraClass) ghost.classList.add(extraClass);
  ghost.style.left=`${a.x}px`;
  ghost.style.top=`${a.y}px`;
  ghost.style.width=`${a.w}px`;
  ghost.style.height=`${a.h}px`;
  ghost.style.transform="translate3d(-50%,-50%,0)";
  document.body.appendChild(ghost);
  return {ghost,a};
}

function beginCoupledManipulation(boxEl){
  if(!boxEl || !els.workerWrap || !els.worker) return {stop(){}};

  // v2.2: Byte has ONE permanent pair of hands.  The same DOM arms/claws
  // used for normal INBOX/OUTBOX actions are physically aimed at the live
  // transfer box every frame.  No temporary/telescopic/alternate hands are
  // created, so there is nothing that can visually become a third hand.
  const leftArm=els.worker.querySelector(".left-arm");
  const rightArm=els.worker.querySelector(".right-arm");
  if(!leftArm || !rightArm) return {stop(){}};

  els.workerWrap.classList.add("single-hand-coupled");
  let alive=true, raf=0;

  const position=()=>{
    if(!alive || !boxEl.isConnected) return;
    const robot=els.worker.getBoundingClientRect();
    const box=boxEl.getBoundingClientRect();
    const facingLeft=els.workerWrap.dataset.facing==="left";

    // Real screen-space shoulder pivots. The DOM arm names swap visually
    // when the robot is mirrored, so assign the physically-left/right arm
    // based on facing rather than assuming class name == screen side.
    const screenLeftArm=facingLeft ? rightArm : leftArm;
    const screenRightArm=facingLeft ? leftArm : rightArm;
    const shoulderY=robot.top+66;
    const leftShoulder={x:robot.left+7,y:shoulderY};
    const rightShoulder={x:robot.right-7,y:shoulderY};
    // Normal pickup/carry transfer grips opposite side walls. OUTBOX is a
    // presentation/push action: both permanent hands contact the robot-facing
    // (near) wall at two different heights, avoiding crossed/broken-looking arms.
    let leftTarget={x:box.left+1,y:box.top+box.height*.52};
    let rightTarget={x:box.right-1,y:box.top+box.height*.52};
    let outboxPresent=els.workerWrap.classList.contains("outbox-live-place");
    if(outboxPresent){
      const nearX=facingLeft ? box.right-2 : box.left+2;
      leftTarget={x:nearX,y:box.top+box.height*.34};
      rightTarget={x:nearX,y:box.top+box.height*.70};
    }

    const aim=(arm,a,b,screenSide)=>{
      const dx=b.x-a.x, dy=b.y-a.y;
      const len=Math.max(24,Math.hypot(dx,dy));
      // Robot arms are drawn vertically downward at rotate(0). Convert the
      // screen vector to rotation-from-down. Mirroring reverses rotation.
      let angle=Math.atan2(-dx,dy)*180/Math.PI;
      if(facingLeft) angle=-angle;
      const scale=Math.max(.52,Math.min(2.95,len/50));

      // v2.3: write the live geometry directly onto the ONE permanent arm.
      // This intentionally uses inline !important so the old centered-carry
      // pose can never win while a pickup/place transfer is in progress.
      // The arm and box therefore cannot run on two different tracks.
      arm.style.setProperty("transform",`rotate(${angle}deg) scaleY(${scale})`,"important");
      arm.style.setProperty("transform-origin","50% 4px","important");
      arm.style.setProperty("visibility","visible","important");
      arm.style.setProperty("animation","none","important");

      const claw=arm.querySelector('.robot-claw');
      if(claw){
        // Clamp lies against the corresponding vertical side wall of box.
        let clawAngle=screenSide==='left' ? -90 : 90;
        if(screenSide==='near-top' || screenSide==='near-bottom') clawAngle=facingLeft ? -90 : 90;
        claw.style.setProperty("transform",`rotate(${clawAngle}deg)`,"important");
        claw.style.setProperty("transform-origin","50% 50%","important");
      }
    };
    aim(screenLeftArm,leftShoulder,leftTarget,outboxPresent ? "near-top" : "left");
    aim(screenRightArm,rightShoulder,rightTarget,outboxPresent ? "near-bottom" : "right");
    raf=requestAnimationFrame(position);
  };
  position();

  return {stop(){
    alive=false;
    cancelAnimationFrame(raf);
    for(const arm of [leftArm,rightArm]){
      arm.style.removeProperty("--live-arm-angle");
      arm.style.removeProperty("--live-arm-scale");
      arm.style.removeProperty("transform");
      arm.style.removeProperty("transform-origin");
      arm.style.removeProperty("visibility");
      arm.style.removeProperty("animation");
      const claw=arm.querySelector('.robot-claw');
      if(claw){
        claw.style.removeProperty("transform");
        claw.style.removeProperty("transform-origin");
      }
    }
    els.workerWrap.classList.remove("single-hand-coupled");
  }};
}

async function flyBox(fromEl,toEl,value,{moveSource=false,output=false,onArrive=null,gripStart="",gripEnd="",reversePickup=false}={}){
  if(!fromEl || !toEl) return;
  const {ghost,a}=makeTransferAt(fromEl,value,output);

  // Contact is established while the transfer tile still perfectly covers
  // the source. From this point until handoff, hands are derived from the
  // moving box rectangle every animation frame — never from another timer.
  await nextPaint();
  if(gripStart==="side") faceTowardElement(fromEl);
  setRobotGrip(gripStart || "side");
  const coupled=beginCoupledManipulation(ghost);
  await wait(dur(95));
  if(moveSource) park(fromEl);

  const b=centerOf(toEl);
  const dx=b.x-a.x, dy=b.y-a.y;
  const lift=Math.min(20,Math.max(7,Math.abs(dx)*.025+Math.abs(dy)*.015));

  // OUTBOX can use the exact INBOX pickup trajectory in reverse. Build the
  // pickup path as if the destination were travelling toward the held tile,
  // then reverse those samples back into held -> destination coordinates.
  // Hands remain coupled to the physical tile for every frame, so there is
  // no second arm animation/recovery track to create a swing or flicker.
  let transferFrames;
  let transferEase="cubic-bezier(.2,.72,.2,1)";
  if(reversePickup){
    const rdx=-dx, rdy=-dy;
    const rlift=Math.min(20,Math.max(7,Math.abs(rdx)*.025+Math.abs(rdy)*.015));
    const pickupSamples=[
      {x:0,y:0,rot:0,offset:0},
      {x:rdx*.22,y:rdy*.22-rlift*.65,rot:rdx>=0?.4:-.4,offset:.22},
      {x:rdx*.58,y:rdy*.58-rlift,rot:rdx>=0?.3:-.3,offset:.58},
      {x:rdx*.84,y:rdy*.84-rlift*.30,rot:0,offset:.84},
      {x:rdx,y:rdy,rot:0,offset:1}
    ];
    transferFrames=pickupSamples.slice().reverse().map((k,index,arr)=>({
      transform:`translate3d(-50%,-50%,0) translate3d(${k.x-rdx}px,${k.y-rdy}px,0) rotate(${k.rot}deg)`,
      offset:index===0?0:index===arr.length-1?1:1-k.offset
    })).sort((a,b)=>(a.offset??0)-(b.offset??0));
    // Reversing the motion also reverses the timing curve.
    transferEase="cubic-bezier(.8,.28,.8,1)";
  }else{
    transferFrames=[
      {transform:"translate3d(-50%,-50%,0) translate3d(0,0,0) rotate(0deg)"},
      {transform:`translate3d(-50%,-50%,0) translate3d(${dx*.22}px,${dy*.22-lift*.65}px,0) rotate(${dx>=0?.4:-.4}deg)`,offset:.22},
      {transform:`translate3d(-50%,-50%,0) translate3d(${dx*.58}px,${dy*.58-lift}px,0) rotate(${dx>=0?.3:-.3}deg)`,offset:.58},
      {transform:`translate3d(-50%,-50%,0) translate3d(${dx*.84}px,${dy*.84-lift*.30}px,0) rotate(0deg)`,offset:.84},
      {transform:`translate3d(-50%,-50%,0) translate3d(${dx}px,${dy}px,0) rotate(0deg)`}
    ];
  }
  await animateCommit(ghost,transferFrames,{duration:dur(610),easing:transferEase});

  // Commit while the moving tile and attached clamps still cover the final
  // state. This makes pickup -> centered carry a literal physical handoff.
  if(onArrive) await onArrive();
  await nextPaint();
  if(gripEnd==="side") faceTowardElement(toEl);
  // For OUTBOX, live-coupled inline geometry still owns the arms at this point.
  // Do NOT install the static `side` grip underneath it: when inline geometry
  // is later removed that hidden side pose would flash for one frame.
  if(!output) setRobotGrip(gripEnd || (els.held.classList.contains("has-value") ? "held" : ""));

  if(output){
    // Reverse-INBOX OUTBOX handoff: while the live coupled geometry is still
    // holding the tile at the destination, clear ownership and release from
    // that exact contact pose. No static side grip and no extra arm recovery
    // animation are installed underneath it.
    setRobotGrip("");
    coupled.stop();
  }else{
    coupled.stop();
  }
  ghost.remove();
  if(moveSource && fromEl.isConnected) unpark(fromEl);
}

async function copyToMemoryEffect(fromEl,toEl,value,onArrive=null){
  if(!fromEl || !toEl) return;
  const {ghost:copy,a}=makeTransferAt(fromEl,value,false,"copy-transfer-box");
  fromEl.classList.add("copy-source-active");
  setRobotGrip("held");
  await nextPaint();

  // The duplicate peels away from the original before travelling.
  await animateCommit(copy,[
    {transform:"translate3d(-50%,-50%,0) translate3d(0,0,0) rotate(0deg)"},
    {transform:"translate3d(-50%,-50%,0) translate3d(10px,-4px,0) rotate(1deg)",offset:.45},
    {transform:"translate3d(-50%,-50%,0) translate3d(34px,-10px,0) rotate(2deg)"}
  ],{duration:dur(420),easing:"cubic-bezier(.2,.72,.2,1)"});
  sfx('copy');
  setRobotGrip("copy-guide");
  await wait(dur(110));

  const b=centerOf(toEl);
  const dx=b.x-a.x-34, dy=b.y-a.y+10;
  const lift=Math.min(28,Math.max(12,Math.abs(dx)*.04+Math.abs(dy)*.025));
  await animateCommit(copy,[
    {transform:"translate3d(-50%,-50%,0) translate3d(34px,-10px,0) rotate(2deg)"},
    {transform:`translate3d(-50%,-50%,0) translate3d(${34+dx*.3}px,${-10+dy*.3-lift}px,0) rotate(1deg)`,offset:.3},
    {transform:`translate3d(-50%,-50%,0) translate3d(${34+dx*.8}px,${-10+dy*.8-lift*.25}px,0) rotate(-.5deg)`,offset:.8},
    {transform:`translate3d(-50%,-50%,0) translate3d(${34+dx}px,${-10+dy}px,0) rotate(0deg)`}
  ],{duration:dur(650),easing:"cubic-bezier(.22,.61,.25,1)"});

  if(onArrive) await onArrive();
  await nextPaint();
  copy.remove();
  fromEl.classList.remove("copy-source-active");
  setRobotGrip("held");
}

async function copyFromMemoryEffect(fromEl,toEl,value,onArrive=null){
  if(!fromEl || !toEl) return;
  const {ghost:copy,a}=makeTransferAt(fromEl,value,false,"copy-transfer-box");
  fromEl.classList.add("copy-source-active");
  setRobotGrip("memory");
  await nextPaint();

  // Mirror COPYTO's visual language: first visibly separate a duplicate from
  // the original floor card, then guide that duplicate into Byte's hands.
  await animateCommit(copy,[
    {transform:"translate3d(-50%,-50%,0) translate3d(0,0,0) rotate(0deg)"},
    {transform:"translate3d(-50%,-50%,0) translate3d(-7px,-7px,0) rotate(-1deg)",offset:.45},
    {transform:"translate3d(-50%,-50%,0) translate3d(-24px,-13px,0) rotate(-2deg)"}
  ],{duration:dur(380),easing:"cubic-bezier(.2,.72,.2,1)"});
  sfx('copy');
  setRobotGrip("copy-guide");
  await wait(dur(90));

  const b=centerOf(toEl);
  const dx=b.x-a.x+24, dy=b.y-a.y+13;
  const lift=Math.min(30,Math.max(14,Math.abs(dx)*.04+Math.abs(dy)*.025));
  await animateCommit(copy,[
    {transform:"translate3d(-50%,-50%,0) translate3d(-24px,-13px,0) rotate(-2deg)"},
    {transform:`translate3d(-50%,-50%,0) translate3d(${-24+dx*.30}px,${-13+dy*.30-lift}px,0) rotate(-1deg)`,offset:.30},
    {transform:`translate3d(-50%,-50%,0) translate3d(${-24+dx*.80}px,${-13+dy*.80-lift*.25}px,0) rotate(.5deg)`,offset:.80},
    {transform:`translate3d(-50%,-50%,0) translate3d(${-24+dx}px,${-13+dy}px,0) rotate(0deg)`}
  ],{duration:dur(620),easing:"cubic-bezier(.22,.61,.25,1)"});

  if(onArrive) await onArrive();
  await nextPaint();
  copy.remove();
  fromEl.classList.remove("copy-source-active");
  setRobotGrip("held");
}

async function throwDestroyBox(sourceEl,value,{memory=false,onDestroyed=null}={}){
  if(!sourceEl || value===null || value===undefined) return;
  const a=centerOf(sourceEl);
  const ghost=makeValueBox(value,false);
  ghost.classList.add("clean-discard-box");
  ghost.style.left=`${a.x}px`; ghost.style.top=`${a.y}px`;
  ghost.style.width=`${Math.max(44,Math.min(62,a.w||52))}px`;
  ghost.style.height=`${Math.max(34,Math.min(48,a.h||40))}px`;

  // One-box ownership for BOTH held and memory discards: the real source is
  // parked before the animated copy can paint. There is no legacy contact
  // ghost, throw grip, or second destruction box underneath this animation.
  park(sourceEl);
  document.body.appendChild(ghost);
  await nextPaint();

  els.footer.textContent=memory ? `Clearing floor slot — discarding ${value}…` : `Hands are full — discarding ${value}…`;
  sfx('throw');
  const worker=centerOf(els.workerWrap);
  const dir=a.x < worker.x ? -1 : 1;
  const dx=dir*(memory?96:118);
  const rise=memory?58:70;
  const drop=memory?34:48;

  const toss=ghost.animate([
    {transform:"translate(-50%,-50%) translate3d(0,0,0) rotate(0deg) scale(1)",opacity:1},
    {transform:`translate(-50%,-50%) translate3d(${dx*.45}px,${-rise}px,0) rotate(${dir*22}deg) scale(.98)`,opacity:1,offset:.50},
    {transform:`translate(-50%,-50%) translate3d(${dx}px,${-rise+drop}px,0) rotate(${dir*48}deg) scale(.86)`,opacity:.96,offset:.82},
    {transform:`translate(-50%,-50%) translate3d(${dx*1.08}px,${-rise+drop+18}px,0) rotate(${dir*58}deg) scale(.62)`,opacity:0}
  ],{duration:dur(500),easing:"cubic-bezier(.2,.72,.26,1)",fill:"forwards"});
  try{ await toss.finished; }catch(_){ await wait(dur(500)); }

  // A restrained paper-puff replaces the old explosive/flickering destroy
  // effect. It is decorative only; the thrown box remains the sole box node.
  const g=centerOf(ghost);
  const puff=document.createElement("div");
  puff.className="discard-paper-puff";
  puff.style.left=`${g.x}px`; puff.style.top=`${g.y}px`;
  puff.innerHTML='<i></i><i></i><i></i><i></i>';
  document.body.appendChild(puff);
  sfx('destroy');
  if(onDestroyed) await onDestroyed();
  ghost.remove();
  await wait(dur(170));
  puff.remove();
  if(sourceEl.isConnected) unpark(sourceEl);
  setRobotGrip(els.held?.classList.contains('has-value') ? "held" : "");
}

async function removeInboxBoxSmooth(source){
  if(!source || !source.isConnected) return;
  const remaining=[...els.inbox.querySelectorAll(".value-box")].filter(box=>box!==source);
  const before=new Map(remaining.map(box=>[box,box.getBoundingClientRect()]));
  source.remove();
  setEmptyState(els.inbox,"EMPTY");
  await nextPaint();
  const moves=remaining.map(box=>{
    if(!box.isConnected) return Promise.resolve();
    const old=before.get(box), now=box.getBoundingClientRect();
    const dx=old.left-now.left, dy=old.top-now.top;
    if(Math.abs(dx)<.5 && Math.abs(dy)<.5) return Promise.resolve();
    const anim=box.animate([
      {transform:`translate3d(${dx}px,${dy}px,0)`},
      {transform:"translate3d(0,0,0)"}
    ],{duration:dur(330),easing:"cubic-bezier(.22,.61,.25,1)"});
    return anim.finished.catch(()=>{});
  });
  await Promise.all(moves);
}

function createOutboxAnchor(){
  const anchor=document.createElement("div");
  anchor.className="outbox-drop-anchor";
  anchor.setAttribute("aria-hidden","true");
  const empty=els.outbox.querySelector(".empty-zone");
  if(empty) empty.replaceWith(anchor);
  else els.outbox.appendChild(anchor);
  return anchor;
}

function commitOutboxAtAnchor(anchor,value){
  const box=makeValueBox(value,true);
  box.classList.add("settle-box");
  if(anchor?.isConnected) anchor.replaceWith(box);
  else els.outbox.appendChild(box);
  setEmptyState(els.outbox,"WAITING");
  return box;
}

