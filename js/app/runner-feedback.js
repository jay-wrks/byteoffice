function unresolvedJumpRows(){
  return program.map((ins,i)=>({ins,i})).filter(({ins,i})=>defs[ins.op]?.arg==='line' && (!hasLineTarget(ins) || ins.arg===i));
}
function requireResolvedJumps(){
  const bad=unresolvedJumpRows();
  if(!bad.length) return true;
  const first=bad[0].i; selectedRow=first; renderProgram(); beginOperandTargeting(first,'line');
  els.footer.textContent=`Target required on line ${first+1}. Choose another instruction before running.`;
  setStatus("TARGET NEEDED","paused"); sfx('invalid'); return false;
}

async function stepOnce(){
  if(animating) return false;
  if(!program.length){ els.footer.textContent="Your program is empty."; sfx('invalid'); return false; }
  if(!requireResolvedJumps()) return false;
  engine.setProgram(program); animating=true;
  const r=engine.step(); await animateTransition(r); animating=false;
  if(r.status==="ok") sfx('step');
  if(r.status==="ok" && r.event==="write") {
    const mismatch=outputMismatch();
    if(mismatch){ await wrongOutputFeedback(mismatch); animating=false; return false; }
  }
  if(engine.halted){ running=false; if(engine.error) return false; evaluate(); return false; }
  const snap=engine.snapshot();
  visualState={...snap,input:[...snap.input],output:[...snap.output],memory:[...snap.memory]};
  els.steps.textContent=snap.steps;
  highlightLine(snap.pc);
  return true;
}

function runHeadless(input){
  const e=new ByteEngine(); e.maxSteps=1500; e.resetState(input,level().memory,program);
  while(!e.halted) e.step();
  return {output:[...e.output],steps:e.steps,error:e.error,halted:e.halted};
}

function sameArray(a,b){ return a.length===b.length && a.every((v,i)=>v===b[i]); }

function outputMismatch(){
  const expected=level().output, got=engine.output;
  if(!got.length) return null;
  const i=got.length-1;
  if(i>=expected.length) return {index:i,got:got[i],expected:null,extra:true};
  if(got[i]!==expected[i]) return {index:i,got:got[i],expected:expected[i],extra:false};
  return null;
}

function spawnFeedbackBurst(kind, anchorEl, label){
  const host=els.scene; if(!host) return null;
  const hostRect=host.getBoundingClientRect();
  const r=(anchorEl||els.workerWrap).getBoundingClientRect();
  const burst=document.createElement('div');
  burst.className=`result-burst ${kind}`;
  burst.style.left=`${r.left-hostRect.left+r.width/2}px`;
  burst.style.top=`${r.top-hostRect.top+r.height/2}px`;
  burst.innerHTML=`<div class="result-ring"></div><div class="result-badge">${label}</div>${Array.from({length:10},(_,i)=>`<i style="--i:${i}"></i>`).join('')}`;
  host.appendChild(burst);
  requestAnimationFrame(()=>burst.classList.add('show'));
  setTimeout(()=>{burst.classList.add('leave');setTimeout(()=>burst.remove(),320)},dur(kind==='success'?1050:900));
  return burst;
}

async function wrongOutputFeedback(mismatch){
  running=false;
  engine.halted=true;
  engine.error=mismatch.extra
    ? `OUTBOX has an extra box: ${mismatch.got}. No more output was expected.`
    : `Wrong OUTBOX box ${mismatch.index+1}: expected ${mismatch.expected}, got ${mismatch.got}.`;
  setStatus('WRONG OUTPUT','error');
  const boxes=[...els.outbox.querySelectorAll('.value-box')];
  const bad=boxes[boxes.length-1];
  if(bad){ bad.classList.add('wrong-output-box'); faceTowardElement(bad); }
  els.outbox.classList.remove('output-success-flash');
  void els.outbox.offsetWidth;
  els.outbox.classList.add('output-error-flash');
  setPose('error-pose');
  els.workerWrap.classList.add('wrong-output-recoil');
  spawnFeedbackBurst('error',bad||els.outbox,'✕');
  els.footer.textContent=mismatch.extra
    ? `Wrong output — ${mismatch.got} is an extra OUTBOX box. Execution stopped.`
    : `Wrong output — box ${mismatch.index+1} should be ${mismatch.expected}, not ${mismatch.got}. Execution stopped.`;
  sfx('wrong-output');
  await wait(dur(720));
  els.workerWrap.classList.remove('wrong-output-recoil');
}

async function successFeedback(){
  setStatus('COMPLETE','success');
  setPose('celebrate');
  els.workerWrap.classList.add('level-success-celebration');
  els.outbox.classList.remove('output-error-flash');
  void els.outbox.offsetWidth;
  els.outbox.classList.add('output-success-flash');
  const last=[...els.outbox.querySelectorAll('.value-box')].at(-1);
  spawnFeedbackBurst('success',last||els.workerWrap,'✓');
  sfx('success-hit');
  await wait(dur(980));
  els.workerWrap.classList.remove('level-success-celebration');
}

function showTestLab(){
  if(!program.length){ els.footer.textContent="Add some instructions before testing."; return; }
  if(!requireResolvedJumps()) return;
  const examples=level().examples||[{input:level().input,output:level().output}];
  const rows=examples.map((ex,i)=>{
    const r=runHeadless(ex.input), ok=!r.error&&sameArray(r.output,ex.output);
    return `<div class="test-case ${ok?'pass':'fail'}"><div class="test-case-head"><b>${ok?'✓ PASS':'✕ FAIL'} · Example ${i+1}</b><span>${r.steps} steps</span></div><small>IN</small><code>[${ex.input.join(', ')}]</code><small>EXPECTED</small><code>[${ex.output.join(', ')}]</code><small>GOT</small><code>[${r.output.join(', ')}]</code>${r.error?`<p>${escapeHtml(r.error)}</p>`:''}</div>`;
  }).join('');
  const pass=examples.filter(ex=>{const r=runHeadless(ex.input);return !r.error&&sameArray(r.output,ex.output)}).length;
  showModal(`<div class="modal-heading"><span>QA LAB</span><h2>Program Test Suite</h2><p>${pass}/${examples.length} examples passing without animation.</p></div><div class="test-grid">${rows}</div>`);
}

function analyzeProgram(){
  const issues=[], notes=[];
  if(!program.length) issues.push('Program is empty.');
  if(program.length && !program.some(x=>x.op==='READ')) issues.push('No INBOX instruction: the program never consumes input.');
  if(program.length && !program.some(x=>x.op==='WRITE')) issues.push('No OUTBOX instruction: the program can never produce output.');
  program.forEach((ins,i)=>{
    const d=defs[ins.op];
    if(!d) issues.push(`Line ${i+1}: unknown instruction ${ins.op}.`);
    if(d?.arg==='memory' && (!Number.isInteger(ins.arg)||ins.arg<0||ins.arg>=level().memory)) issues.push(`Line ${i+1}: memory target ${ins.arg} is outside this level.`);
    if(d?.arg==='line' && (!hasLineTarget(ins)||ins.arg===i)) issues.push(`Line ${i+1}: jump needs a target on a different instruction.`);
  });
  const reachable=new Set(), stack=program.length?[0]:[];
  while(stack.length){
    const i=stack.pop(); if(reachable.has(i)||i<0||i>=program.length)continue; reachable.add(i);
    const ins=program[i]; if(!ins)continue;
    if(ins.op==='JUMP') stack.push(ins.arg);
    else if(ins.op==='JNEG'||ins.op==='JZERO'){ stack.push(ins.arg); stack.push(i+1); }
    else stack.push(i+1);
  }
  const dead=program.map((_,i)=>i).filter(i=>!reachable.has(i));
  if(dead.length) issues.push(`Unreachable lines: ${dead.map(i=>i+1).join(', ')}.`);
  const backward=program.filter((x,i)=>(x.op==='JUMP'||x.op==='JNEG'||x.op==='JZERO')&&hasLineTarget(x)&&x.arg<i).length;
  if(backward) notes.push(`${backward} backward jump${backward===1?'':'s'} found; loops are intentional only if INBOX exhaustion or branching can terminate them.`);
  notes.push(`${reachable.size}/${program.length||0} lines are reachable from line 1.`);
  notes.push(`${breakpoints.size} debugger breakpoint${breakpoints.size===1?'':'s'} active.`);
  const issueHtml=issues.length?issues.map(x=>`<li>${escapeHtml(x)}</li>`).join(''):'<li class="good">No obvious structural problems found.</li>';
  showModal(`<div class="modal-heading"><span>PROGRAM INSPECTOR</span><h2>Static Analysis</h2></div><div class="analysis-block"><h3>Checks</h3><ul>${issueHtml}</ul><h3>Notes</h3><ul>${notes.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`);
}

function escapeHtml(v){ return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function showShare(){
  const sharedProgram=answerMode?(level().answer||[]).map(x=>({...x})):cloneProgram();
  const payload=JSON.stringify({game:'Byte Office',version:2,level:level().id,program:sharedProgram},null,2);
  const importAction=answerMode?'':`<button id="importProgramBtn" class="paper-button">Import JSON</button>`;
  const copyLabel=answerMode?'Copy Answer JSON':'Copy JSON';
  showModal(`<div class="modal-heading"><span>PROGRAM PORT</span><h2>${answerMode?'Share Answer':'Import / Export'}</h2><p>${answerMode?'Export this exact answer program as JSON. The Answer tab itself stays read-only.':'Copy a solution as JSON, or paste one below. Imports are validated against this assignment.'}</p></div><textarea id="shareData" class="share-data" spellcheck="false" ${answerMode?'readonly':''}>${escapeHtml(payload)}</textarea><div class="share-actions"><button id="copyProgramBtn" class="modal-primary">${copyLabel}</button>${importAction}</div><div id="shareStatus" class="share-status"></div>`);
  const ta=$('#shareData'), status=$('#shareStatus');
  $('#copyProgramBtn').addEventListener('click',async()=>{ try{await navigator.clipboard.writeText(ta.value);status.textContent='Copied to clipboard ✓';}catch(_){ta.focus();ta.select();status.textContent='Selected. Press Ctrl/Cmd+C to copy.';} });
  const importBtn=$('#importProgramBtn');
  if(importBtn) importBtn.addEventListener('click',()=>{
    try{
      const raw=JSON.parse(ta.value), arr=Array.isArray(raw)?raw:raw.program;
      if(!Array.isArray(arr)) throw new Error('JSON must contain a program array.');
      const allowed=new Set(level().commands);
      const next=arr.map((x,i)=>{
        if(!x||!allowed.has(x.op)||!defs[x.op]) throw new Error(`Line ${i+1}: ${x?.op||'unknown'} is not available on this level.`);
        const d=defs[x.op]; let arg=null;
        if(d.arg==='memory') arg=clamp(parseInt(x.arg??0,10),0,Math.max(0,level().memory-1));
        if(d.arg==='line') arg=clamp(parseInt(x.arg??0,10),0,Math.max(0,arr.length-1));
        return {op:x.op,arg};
      });
      commitEdit(); stopRun(); program=next; breakpoints.clear(); saveBreakpoints(); selectedRow=null; renderProgram(); resetMachine(false); status.textContent=`Imported ${next.length} lines ✓`; sfx('target');
    }catch(err){ status.textContent='Import failed: '+err.message; }
  });
}

function copyAnswerToDraft(){
  if(!answerMode) return;
  const answer=program.map(x=>({...x}));
  const bucket=workspaceBucket(level().id);
  showModal(`<div class="modal-heading"><span>ANSWER</span><h2>Copy to Draft</h2><p>Choose which editable solution should receive this answer. Existing commands in that draft will be replaced.</p></div><div class="answer-copy-choices"><button class="modal-primary" data-copy-draft="0">Solution 1${bucket.slots[0]?.length?' · replace existing':''}</button><button class="paper-button" data-copy-draft="1">Solution 2${bucket.slots[1]?.length?' · replace existing':''}</button></div>`);
  document.querySelectorAll('[data-copy-draft]').forEach(btn=>btn.addEventListener('click',()=>{
    const target=clamp(parseInt(btn.dataset.copyDraft,10),0,WORKSPACE_COUNT-1);
    bucket.slots[target]=answer.map(x=>({...x})); bucket.active=target; workspaceIndex=target;
    try{localStorage.setItem(WORKSPACE_STORAGE_KEY,JSON.stringify(workspaceStore));}catch(_){}
    closeModal(); stopRun(); answerMode=false; setAnswerModeControls(false);
    program=answer.map(x=>({...x})); selectedRow=null; undoStack=[]; redoStack=[]; breakpoints.clear(); saveBreakpoints();
    renderProgram(); resetMachine(false); refreshWorkspaceTabs();
    els.footer.textContent=`Answer copied to Solution ${target+1}. You can edit it now.`; sfx('target');
  }));
}

function recordRunStart(){
  const m=levelMeta(); m.attempts=(m.attempts||0)+1; metaStore.totalRuns=(metaStore.totalRuns||0)+1; saveMeta();
}

function recordClear(){
  const m=levelMeta(); m.clears=(m.clears||0)+1;
  m.bestSize=m.bestSize===null?program.length:Math.min(m.bestSize,program.length);
  m.bestSteps=m.bestSteps===null?engine.steps:Math.min(m.bestSteps,engine.steps);
  if(program.length<=level().sizeGoal) m.sizeStar=true;
  if(engine.steps<=level().stepGoal) m.stepStar=true;
  if(m.sizeStar && m.stepStar) m.dualStars=true;
  metaStore.totalClears=(metaStore.totalClears||0)+1; saveMeta();
}

