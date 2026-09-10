function renderExamples(examples){
  if(!els.levelExamples) return;
  const makeBoxes = (values) => {
    if(!values || !values.length) return '<div class="example-empty">(empty)</div>';
    return values.map(v=>`<div class="example-value-box">${v}</div>`).join("");
  };
  els.levelExamples.innerHTML = examples.slice(0,2).map((ex,i)=>`
    <div class="example-card">
      <div class="example-card-head">EXAMPLE ${i+1}</div>
      <div class="example-flow">
        <div class="example-lane">
          <div class="example-lane-title">INBOX</div>
          <div class="example-box-track">${makeBoxes(ex.input)}</div>
        </div>
        <div class="example-arrow" aria-hidden="true">→</div>
        <div class="example-lane">
          <div class="example-lane-title">OUTBOX</div>
          <div class="example-box-track output">${makeBoxes(ex.output)}</div>
        </div>
      </div>
    </div>`).join("");
}

function cloneProgram(){ return program.map(x=>({op:x.op,arg:x.arg})); }
function commitEdit(){
  undoStack.push(cloneProgram());
  if(undoStack.length>80) undoStack.shift();
  redoStack=[];
  updateEditorButtons();
}
function restoreProgram(next){
  stopRun(); program=next.map(x=>({op:x.op,arg:x.arg})); selectedRow=null; renderProgram(); resetMachine(false);
}
function undoEdit(){ if(animating||!undoStack.length)return; const prev=undoStack.pop(); redoStack.push(cloneProgram()); restoreProgram(prev); updateEditorButtons(); }
function redoEdit(){ if(animating||!redoStack.length)return; const next=redoStack.pop(); undoStack.push(cloneProgram()); restoreProgram(next); updateEditorButtons(); }
function updateEditorButtons(){
  if(els.undo) els.undo.disabled=!undoStack.length;
  if(els.redo) els.redo.disabled=!redoStack.length;
  if(els.compact){ els.compact.classList.toggle("active",compactProgram); els.compact.textContent=compactProgram?"Comfort":"Compact"; }
}
function hasLineTarget(ins, length=program.length){
  return Number.isInteger(ins?.arg) && ins.arg>=0 && ins.arg<length;
}
function mapJumpTargets(mapper){
  program.forEach(ins=>{ if(defs[ins.op] && defs[ins.op].arg==="line" && hasLineTarget(ins)) ins.arg=mapper(ins.arg); });
}
function adjustTargetsForInsert(index, oldLength){
  program.forEach(ins=>{ if(defs[ins.op] && defs[ins.op].arg==="line" && hasLineTarget(ins,oldLength)){ const t=ins.arg; ins.arg=t>=index?t+1:t; } });
}
function adjustTargetsForDelete(index, oldLength){
  program.forEach(ins=>{ if(defs[ins.op] && defs[ins.op].arg==="line" && hasLineTarget(ins,oldLength)){ let t=ins.arg; if(t>index)t--; else if(t===index) ins.arg=null; if(ins.arg!==null) ins.arg=t; } });
}
function moveInstruction(from,to){
  if(from===to||from<0||to<0||from>=program.length||to>=program.length)return;
  commitEdit(); stopRun(); breakpoints.clear(); saveBreakpoints();
  const oldTargets=program.map(ins=>defs[ins.op]&&defs[ins.op].arg==="line"&&hasLineTarget(ins)?ins.arg:null);
  const [item]=program.splice(from,1); program.splice(to,0,item);
  const indexMap=(old)=>{
    if(old===from)return to;
    if(from<to && old>from && old<=to)return old-1;
    if(from>to && old>=to && old<from)return old+1;
    return old;
  };
  const oldOrder=[]; for(let i=0;i<program.length;i++) oldOrder.push(i);
  // Map each instruction's old target after its own instruction has moved.
  program.forEach((ins,newIdx)=>{
    if(!(defs[ins.op]&&defs[ins.op].arg==="line"))return;
    let oldIdx;
    if(newIdx===to) oldIdx=from;
    else if(from<to && newIdx>=from && newIdx<to) oldIdx=newIdx+1;
    else if(from>to && newIdx>to && newIdx<=from) oldIdx=newIdx-1;
    else oldIdx=newIdx;
    ins.arg=oldTargets[oldIdx]===null ? null : indexMap(oldTargets[oldIdx]);
  });
  selectedRow=to; renderProgram(); resetMachine(false);
}

function memoryName(i){ return String(i); }
function lineName(i){
  const ins=program[i];
  return ins ? `${String(i+1).padStart(2,"0")} ${defs[ins.op]?.label||ins.op}` : `Line ${i+1}`;
}
function clearOperandTargeting(){
  operandTargeting=null;
  document.body.classList.remove('target-select-mode','target-select-memory','target-select-line');
  document.querySelectorAll('.target-candidate,.target-disabled,.targeting-memory,.targeting-line').forEach(x=>x.classList.remove('target-candidate','target-disabled','targeting-memory','targeting-line'));
}
function beginOperandTargeting(rowIndex,type){
  if(animating) return;
  operandTargeting={rowIndex,type};
  document.body.classList.remove('target-select-memory','target-select-line');
  document.body.classList.add('target-select-mode',type==='memory'?'target-select-memory':'target-select-line');
  document.querySelectorAll('.target-candidate,.target-disabled,.targeting-memory,.targeting-line').forEach(x=>x.classList.remove('target-candidate','target-disabled','targeting-memory','targeting-line'));
  if(type==='memory'){
    els.memory.classList.add('targeting-memory');
    els.memory.querySelectorAll('.memory-tile').forEach(x=>x.classList.add('target-candidate'));
    els.footer.textContent=`Choose a floor slot for ${defs[program[rowIndex].op].label}. Click a highlighted slot, or drag the target chip onto it.`;
  }else{
    els.list.classList.add('targeting-line');
    els.list.querySelectorAll('.program-row').forEach(x=>{
      const candidate=Number(x.dataset.index);
      x.classList.toggle('target-candidate',candidate!==rowIndex);
      x.classList.toggle('target-disabled',candidate===rowIndex);
    });
    els.footer.textContent=`Choose a different instruction for ${defs[program[rowIndex].op].label}. The jump cannot target itself.`;
  }
}
function setOperandTarget(rowIndex,type,target){
  if(animating || !program[rowIndex] || defs[program[rowIndex].op]?.arg!==type) return;
  if(type==='line' && target===rowIndex){
    els.footer.textContent=`${defs[program[rowIndex].op].label} cannot target its own instruction. Choose another row.`;
    sfx('invalid');
    return;
  }
  commitEdit(); stopRun();
  program[rowIndex].arg=target;
  selectedRow=rowIndex;
  clearOperandTargeting();
  renderProgram(); resetMachine(false); sfx('reorder');
  els.footer.textContent=type==='memory'
    ? `${defs[program[rowIndex].op].label} now uses floor slot ${memoryName(target)}.`
    : `${defs[program[rowIndex].op].label} now points to ${lineName(target)}.`;
}
function drawJumpArrows(){
  const old=els.list.querySelector('.jump-arrow-layer'); if(old) old.remove();
  const arrowProgram=answerMode?(level().answer||[]):program;
  const jumps=arrowProgram.map((ins,i)=>({ins,i})).filter(x=>defs[x.ins.op]?.arg==='line' && Number.isInteger(x.ins.arg) && x.ins.arg>=0 && x.ins.arg<arrowProgram.length);
  els.list.style.setProperty('--jump-lanes',Math.max(1,jumps.length));
  if(!jumps.length) return;

  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('jump-arrow-layer');
  svg.setAttribute('aria-hidden','true');
  const w=Math.max(els.list.clientWidth,els.list.scrollWidth), h=Math.max(els.list.clientHeight,els.list.scrollHeight);
  svg.setAttribute('width',w); svg.setAttribute('height',h); svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  svg.innerHTML='<defs><marker id="jumpArrowHead" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z"/></marker></defs>';
  const base=els.list.getBoundingClientRect();
  const listRight=els.list.scrollLeft+els.list.clientWidth;
  const laneGap=jumps.length>1?Math.max(3,Math.min(9,76/(jumps.length-1))):8;

  jumps.forEach(({ins,i},jumpIndex)=>{
    const fromRow=els.list.querySelector(`[data-index="${i}"]`), toRow=els.list.querySelector(`[data-index="${ins.arg}"]`);
    const fromPort=fromRow?.querySelector('.jump-port'), toPort=toRow?.querySelector('.jump-port');
    if(!fromPort||!toPort) return;
    const a=fromPort.getBoundingClientRect(), b=toPort.getBoundingClientRect();
    const portInset=Math.min(7,Math.max(4,a.width*.08));
    const targetInset=Math.min(7,Math.max(4,b.width*.08));
    const xStart=a.left-base.left+els.list.scrollLeft+portInset;
    const xEnd=b.left-base.left+els.list.scrollLeft+targetInset;
    const y1=a.top-base.top+els.list.scrollTop+a.height/2;
    const y2=b.top-base.top+els.list.scrollTop+b.height/2;
    const laneX=listRight-9-(jumpIndex*laneGap);
    const shoulder=Math.min(laneX-3,Math.max(xStart+4,laneX-12));
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',`M ${xStart} ${y1} H ${shoulder} Q ${laneX} ${y1} ${laneX} ${y1+(y2>y1?8:-8)} V ${y2-(y2>y1?8:-8)} Q ${laneX} ${y2} ${laneX-8} ${y2} H ${xEnd}`);
    path.setAttribute('marker-end','url(#jumpArrowHead)');
    path.classList.add('jump-link',`jump-${ins.op.toLowerCase()}`);
    path.style.setProperty('--jump-index',jumpIndex);
    svg.appendChild(path);

    const startDot=document.createElementNS('http://www.w3.org/2000/svg','circle');
    startDot.setAttribute('cx',xStart); startDot.setAttribute('cy',y1); startDot.setAttribute('r','2.6'); startDot.classList.add('jump-dot'); svg.appendChild(startDot);
  });
  els.list.prepend(svg);
}

function renderMemory(n){
  els.memory.innerHTML = "";
  if (!n) { els.memory.innerHTML = '<div class="no-memory">No floor slots on this level.</div>'; return; }
  for(let i=0;i<n;i++){
    const d=document.createElement("div"); d.className="memory-tile"; d.dataset.i=i;
    d.innerHTML=`<span class="memory-slot-label">${memoryName(i)}</span><div class="memory-box" aria-label="Floor slot ${memoryName(i)}"></div>`;
    d.addEventListener('click',()=>{ if(operandTargeting?.type==='memory') setOperandTarget(operandTargeting.rowIndex,'memory',i); });
    d.addEventListener('dragover',e=>{ if(operandDrag?.type==='memory'){e.preventDefault();d.classList.add('operand-drag-over');} });
    d.addEventListener('dragleave',()=>d.classList.remove('operand-drag-over'));
    d.addEventListener('drop',e=>{ if(operandDrag?.type==='memory'){e.preventDefault();d.classList.remove('operand-drag-over');const src=operandDrag;operandDrag=null;setOperandTarget(src.rowIndex,'memory',i);} });
    els.memory.appendChild(d);
  }
}

function renderPalette(){
  els.palette.innerHTML="";
  const fresh=new Set(level().newCommands||[]);
  level().commands.forEach(op=>{
    const b=document.createElement("button"); b.className="command-card"+(fresh.has(op)?" newly-unlocked":""); b.type="button";
    b.innerHTML=`<strong>${defs[op].label}${fresh.has(op)?'<i class="new-command-badge">NEW</i>':''}</strong><span>${defs[op].desc}</span>`;
    b.addEventListener("click",()=>addCommand(op)); els.palette.appendChild(b);
  });
}

function addCommand(op){
  if(animating || answerMode) return;
  commitEdit(); stopRun(); breakpoints.clear(); saveBreakpoints(); const def=defs[op]; let arg=null;
  if(def.arg === "memory") arg=0;
  if(def.arg === "line") arg=null;
  program.push({op,arg}); selectedRow=program.length-1; renderProgram(); resetMachine(false); sfx('add');
  if(def.arg) beginOperandTargeting(selectedRow,def.arg);
}

function renderProgram(){
  if(answerMode){ renderAnswerProgram(); return; }
  clearOperandTargeting();
  els.list.innerHTML="";
  els.list.classList.toggle("compact",compactProgram);
  if(!program.length) els.list.innerHTML='<div class="empty-program"><b>DROP INSTRUCTIONS HERE</b><span>Click a command below to add it.</span></div>';
  program.forEach((ins,i)=>{
    const row=document.createElement("div"); row.className="program-row"+(selectedRow===i?" selected":"")+(breakpoints.has(i)?" breakpoint":""); row.dataset.index=i; row.draggable=true;
    const argType = defs[ins.op].arg; let argHtml="";
    if(argType==='memory'){
      const target=clamp(parseInt(ins.arg??0,10),0,Math.max(0,level().memory-1)); ins.arg=target;
      argHtml=`<button class="operand-chip memory-target" type="button" draggable="true" title="Click, then choose a floor slot. You can also drag this chip onto a floor slot."><span class="operand-icon">▦</span><span>Slot ${memoryName(target)}</span></button>`;
    }else if(argType==='line'){
      const resolved=hasLineTarget(ins) && ins.arg!==i;
      if(!resolved) ins.arg=null;
      argHtml=resolved
        ? `<button class="operand-chip jump-target" type="button" draggable="true" title="Click or drag to choose a different destination instruction."><span class="operand-icon">↪</span><span>${lineName(ins.arg)}</span></button>`
        : `<button class="operand-chip jump-target unresolved-target" type="button" draggable="true" title="Target required. Click or drag this marker onto another instruction."><span class="operand-icon target-required-icon">◎</span><span>Choose target</span><span class="target-cursor-icon">↗</span></button>`;
    }
    row.innerHTML=`<div class="drag-grip" title="Drag row to reorder">⋮⋮</div><div class="line-num" title="Click for breakpoint">${String(i+1).padStart(2,"0")}</div><div class="instruction"><b>${defs[ins.op].label}</b>${argHtml}</div><div class="row-tools"><button data-act="up" title="Move up">↑</button><button data-act="down" title="Move down">↓</button><button data-act="dup" title="Duplicate line">⧉</button><button data-act="del" title="Delete">×</button></div><div class="jump-port" aria-hidden="true">${argType==='line'?'↪':''}</div>`;
    row.querySelector(".line-num").addEventListener("click",e=>{e.stopPropagation(); if(operandTargeting?.type==='line') setOperandTarget(operandTargeting.rowIndex,'line',i); else toggleBreakpoint(i);});
    row.addEventListener("click",e=>{
      if(operandTargeting?.type==='line' && !e.target.closest('.operand-chip,.row-tools')){e.preventDefault();setOperandTarget(operandTargeting.rowIndex,'line',i);return;}
      if(e.target.closest("button"))return; selectedRow=i; renderProgram();
    });
    row.addEventListener("dragstart",e=>{ if(e.target.closest('.operand-chip')) return; dragFrom=i; row.classList.add("dragging"); e.dataTransfer.effectAllowed="move"; });
    row.addEventListener("dragend",()=>{dragFrom=null;row.classList.remove("dragging")});
    row.addEventListener("dragover",e=>{e.preventDefault(); if(operandDrag?.type==='line'){row.classList.add('operand-drag-over');return;} e.dataTransfer.dropEffect="move";row.classList.add("drag-over")});
    row.addEventListener("dragleave",()=>row.classList.remove("drag-over","operand-drag-over"));
    row.addEventListener("drop",e=>{e.preventDefault();row.classList.remove("drag-over","operand-drag-over");if(operandDrag?.type==='line'){const src=operandDrag;operandDrag=null;setOperandTarget(src.rowIndex,'line',i);return;}if(dragFrom!==null)moveInstruction(dragFrom,i)});
    const chip=row.querySelector('.operand-chip');
    if(chip){
      chip.addEventListener('click',e=>{e.stopPropagation();beginOperandTargeting(i,argType);});
      chip.addEventListener('dragstart',e=>{e.stopPropagation();operandDrag={rowIndex:i,type:argType};e.dataTransfer.effectAllowed='link';e.dataTransfer.setData('text/plain',`${argType}:${i}`);beginOperandTargeting(i,argType);});
      chip.addEventListener('dragend',e=>{e.stopPropagation();operandDrag=null;clearOperandTargeting();renderProgram();});
    }
    row.querySelectorAll(".row-tools button").forEach(b=>b.addEventListener("click",()=>editRow(i,b.dataset.act)));
    els.list.appendChild(row);
  });
  els.size.textContent=program.length;
  updateEditorButtons();
  saveWorkspace();
  refreshWorkspaceTabs();
  requestAnimationFrame(drawJumpArrows);
}

function editRow(i,act){
  if(animating) return;
  if(act==="up" && i>0){ moveInstruction(i,i-1); return; }
  if(act==="down" && i<program.length-1){ moveInstruction(i,i+1); return; }
  commitEdit(); stopRun(); breakpoints.clear(); saveBreakpoints();
  if(act==="del"){ const oldLength=program.length; program.splice(i,1); adjustTargetsForDelete(i,oldLength); selectedRow=program.length?Math.min(i,program.length-1):null; }
  if(act==="dup"){ const oldLength=program.length; adjustTargetsForInsert(i+1,oldLength); program.splice(i+1,0,{op:program[i].op,arg:program[i].arg}); selectedRow=i+1; }
  renderProgram(); resetMachine(false);
}
