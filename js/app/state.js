const $ = (s) => document.querySelector(s);
function clamp(v,a,b){ return Math.max(a,Math.min(b,Number.isFinite(v)?v:a)); }
const levels = window.BYTE_LEVELS;
const defs = window.BYTE_COMMANDS;
let levelIndex = 0;
let program = [];
let running = false;
let animating = false;
const SETTINGS_STORAGE_KEY = "byteOfficeSettingsV20";
const defaultSettings = { music:true, sfx:true, transitions:true, reducedMotion:false, editorTips:true, unlockAllLevels:false, showAnswers:false, commandTrayCollapsed:false };
let settings = (()=>{ try { return {...defaultSettings,...JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)||"{}")} } catch(_){ return {...defaultSettings}; } })();
let soundOn = settings.sfx;
let currentPage = "home";
let roadmapOrigin = "home";
let transitionBusy = false;
let musicRig = null;
let completed = JSON.parse(localStorage.getItem("byteOfficeCompletedV17") || "[]");
let visualState = null;
let selectedRow = null;
let compactProgram = false;
let undoStack = [];
let redoStack = [];
let dragFrom = null;
let operandTargeting = null;
let operandDrag = null;
let workspaceIndex = 0;
let answerMode = false;
let draftCommandTrayCollapsed = !!settings.commandTrayCollapsed;
let hasLoadedLevel = false;
const WORKSPACE_COUNT = 2;
const WORKSPACE_STORAGE_KEY = "byteOfficeWorktreesV17";
let workspaceStore = loadWorkspaceStore();
const META_STORAGE_KEY = "byteOfficeMetaV17";
let metaStore = loadMetaStore();
let breakpoints = new Set();
let breakpointResumePc = null;

const els = {
  levelNumber: $("#levelNumber"), levelTitle: $("#levelTitle"), levelStory: $("#levelStory"), levelObjective: $("#levelObjective"), levelExamples: $("#levelExamples"),
  sizeGoal: $("#sizeGoal"), stepGoal: $("#stepGoal"), inbox: $("#inbox"), outbox: $("#outbox"), memory: $("#memory"),
  held: $("#heldCard"), workerWrap: $("#workerWrap"), worker: $("#worker"), scene: $("#scene"), list: $("#programList"),
  palette: $("#commandPalette"), commandTray: $("#commandTray"), commandTrayToggle: $("#commandTrayToggle"), size: $("#programSize"), steps: $("#stepCount"), status: $("#statusText"), lamp: $("#lamp"),
  footer: $("#footerMessage"), speed: $("#speedRange"), speedReadout: $("#speedReadout"), modal: $("#modal"), modalContent: $("#modalContent"),
  undo: $("#undoBtn"), redo: $("#redoBtn"), compact: $("#formatBtn"),
  workspaceTabs: Array.from(document.querySelectorAll(".workspace-tab")), workspaceSaveState: $("#workspaceSaveState"),
  app: $("#app"), home: $("#homeScreen"), map: $("#mapScreen"), mapContent: $("#mapContent"), mapOverlay: $("#mapOverlay"), curtain: $("#pageCurtain"), curtainLabel: $("#curtainLabel"),
  homeLevelTitle: $("#homeLevelTitle"), homeLevelSummary: $("#homeLevelSummary"), homeProgressLabel: $("#homeProgressLabel"), homeCompletion: $("#homeCompletion")
};

const engine = new ByteEngine();
function loadWorkspaceStore(){
  try {
    const parsed = JSON.parse(localStorage.getItem(WORKSPACE_STORAGE_KEY) || "{}");
    if(!parsed || typeof parsed !== "object") return {};
    // v2.4 migration: Draft 3 no longer exists. Keep only the two real player drafts.
    Object.values(parsed).forEach(bucket=>{
      if(!bucket || !Array.isArray(bucket.slots)) return;
      bucket.slots=bucket.slots.slice(0,2);
      while(bucket.slots.length<2) bucket.slots.push([]);
      bucket.active=clamp(parseInt(bucket.active||0,10),0,1);
    });
    try{ localStorage.setItem(WORKSPACE_STORAGE_KEY,JSON.stringify(parsed)); }catch(_){}
    return parsed;
  } catch (_) { return {}; }
}
function loadMetaStore(){
  try {
    const parsed=JSON.parse(localStorage.getItem(META_STORAGE_KEY)||"{}");
    return parsed && typeof parsed==="object" ? parsed : {};
  } catch(_){ return {}; }
}
function saveMeta(){ try{ localStorage.setItem(META_STORAGE_KEY,JSON.stringify(metaStore)); }catch(_){} }
function levelMeta(id=level().id){
  const key=String(id);
  if(!metaStore.levels) metaStore.levels={};
  if(!metaStore.levels[key]) metaStore.levels[key]={attempts:0,clears:0,bestSize:null,bestSteps:null,dualStars:false};
  return metaStore.levels[key];
}
function breakpointKey(){ return `${level().id}:${workspaceIndex}`; }
function loadBreakpoints(){
  const raw=(metaStore.breakpoints&&metaStore.breakpoints[breakpointKey()])||[];
  breakpoints=new Set(raw.filter(Number.isInteger).filter(i=>i>=0&&i<program.length)); breakpointResumePc=null;
}
function saveBreakpoints(){
  if(!metaStore.breakpoints) metaStore.breakpoints={};
  metaStore.breakpoints[breakpointKey()]=[...breakpoints].sort((a,b)=>a-b); saveMeta();
}
function toggleBreakpoint(i){
  if(animating||i<0||i>=program.length)return;
  breakpoints.has(i)?breakpoints.delete(i):breakpoints.add(i); metaStore.usedBreakpoint=true; saveBreakpoints(); renderProgram();
  els.footer.textContent=breakpoints.has(i)?`Breakpoint set on line ${i+1}. RUN will pause before it executes.`:`Breakpoint removed from line ${i+1}.`;
}
function workspaceBucket(levelId){
  const key=String(levelId);
  if(!workspaceStore[key]) workspaceStore[key]={active:0,slots:[[],[]]};
  if(!Array.isArray(workspaceStore[key].slots)) workspaceStore[key].slots=[[],[]];
  while(workspaceStore[key].slots.length<WORKSPACE_COUNT) workspaceStore[key].slots.push([]);
  workspaceStore[key].active=clamp(parseInt(workspaceStore[key].active||0,10),0,WORKSPACE_COUNT-1);
  return workspaceStore[key];
}
function saveWorkspace(showState=true){
  // The official Answer is a temporary read-only program, never a saved draft.
  if(answerMode) return;
  const l=levels[levelIndex]; if(!l) return;
  const bucket=workspaceBucket(l.id);
  bucket.active=workspaceIndex;
  bucket.slots[workspaceIndex]=cloneProgram();
  workspaceStore.lastLevel=levelIndex;
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY,JSON.stringify(workspaceStore));
    if(showState && els.workspaceSaveState){
      els.workspaceSaveState.textContent="Saved locally ✓";
      els.workspaceSaveState.classList.add("saved-pulse");
      clearTimeout(saveWorkspace.timer);
      saveWorkspace.timer=setTimeout(()=>els.workspaceSaveState&&els.workspaceSaveState.classList.remove("saved-pulse"),550);
    }
  } catch (_) { if(els.workspaceSaveState) els.workspaceSaveState.textContent="Local save unavailable"; }
}
function setCommandTrayCollapsed(collapsed,{remember=true}={}){
  collapsed=!!collapsed;
  if(els.commandTray) els.commandTray.classList.toggle("collapsed",collapsed);
  if(els.commandTrayToggle){
    els.commandTrayToggle.setAttribute("aria-expanded",collapsed?"false":"true");
    const actionLabel=collapsed?"Show commands":"Minimize commands";
    els.commandTrayToggle.title=actionLabel;
    els.commandTrayToggle.setAttribute("aria-label",actionLabel);
  }
  if(remember && !answerMode){
    draftCommandTrayCollapsed=collapsed;
    settings.commandTrayCollapsed=collapsed;
    saveSettings();
  }
}

function refreshWorkspaceTabs(){
  const bucket=workspaceBucket(level().id);
  els.workspaceTabs.forEach((tab,i)=>{
    const isAnswer=tab.dataset.workspace==='answer';
    if(isAnswer){
      tab.hidden=!settings.showAnswers;
      const active=answerMode && settings.showAnswers;
      tab.classList.toggle("active",active); tab.setAttribute("aria-selected",active?"true":"false");
      tab.classList.remove("has-code");
      return;
    }
    const slot=parseInt(tab.dataset.workspace,10);
    const active=!answerMode && slot===workspaceIndex;
    tab.classList.toggle("active",active); tab.setAttribute("aria-selected",active?"true":"false");
    const count=(bucket.slots[slot]||[]).length;
    tab.classList.toggle("has-code",count>0);
    const span=tab.querySelector("span"); if(span) span.textContent=count?`Solution ${slot+1} · ${count}`:`Solution ${slot+1}`;
  });
  const tabsWrap=document.querySelector('.workspace-tabs');
  if(tabsWrap) tabsWrap.classList.toggle('has-answer',!!settings.showAnswers);
}
function setAnswerModeControls(on){
  document.querySelector('.program-panel')?.classList.toggle('answer-mode',on);
  // Answer is read-only for editing, but it runs through the exact same machine pipeline.
  ['clearBtn','undoBtn','redoBtn'].forEach(id=>{const el=$("#"+id); if(el) el.disabled=on;});
  ['formatBtn','shareBtn','testBtn','runBtn','stepBtn','pauseBtn','resetBtn'].forEach(id=>{const el=$("#"+id); if(el) el.disabled=false;});
  document.querySelectorAll('.command-card').forEach(b=>b.disabled=on);
}
function renderAnswerProgram(){
  clearOperandTargeting();
  const answer=program.map(x=>({...x}));
  els.list.innerHTML="";
  els.list.classList.toggle("compact",compactProgram);
  answer.forEach((ins,i)=>{
    const row=document.createElement("div");
    row.className="program-row answer-program-row";
    row.dataset.index=i;
    const argType=defs[ins.op]?.arg; let argHtml="";
    if(argType==='memory'){
      argHtml=`<span class="operand-chip memory-target answer-chip"><span class="operand-icon">▦</span><span>Slot ${memoryName(ins.arg)}</span></span>`;
    }else if(argType==='line'){
      argHtml=`<span class="operand-chip jump-target answer-chip"><span class="operand-icon">↪</span><span>${lineName(ins.arg)}</span></span>`;
    }
    row.innerHTML=`<div class="drag-grip answer-lock" aria-hidden="true">•</div><div class="line-num">${String(i+1).padStart(2,"0")}</div><div class="instruction"><b>${defs[ins.op]?.label||ins.op}</b>${argHtml}</div><div class="row-tools answer-row-tools"><span title="Answer lines are read-only">🔒</span></div><div class="jump-port" aria-hidden="true">${argType==='line'?'↪':''}</div>`;
    els.list.appendChild(row);
  });
  if(!answer.length) els.list.innerHTML='<div class="empty-program"><b>NO ANSWER AVAILABLE</b></div>';
  els.size.textContent=answer.length;
  setAnswerModeControls(true);
  refreshWorkspaceTabs();
  updateEditorButtons();
  requestAnimationFrame(drawJumpArrows);
}
function switchWorkspace(next){
  if(animating) return;
  if(next==='answer'){
    if(!settings.showAnswers || answerMode) return;
    saveWorkspace(false); stopRun(); answerMode=true; selectedRow=null; undoStack=[]; redoStack=[];
    setCommandTrayCollapsed(true,{remember:false});
    program=(level().answer||[]).map(x=>({op:x.op,arg:x.arg}));
    resetMachine(false); renderAnswerProgram();
    els.footer.textContent='Official answer loaded. Press RUN or STEP to watch Byte execute it.';
    return;
  }
  next=clamp(parseInt(next,10),0,WORKSPACE_COUNT-1);
  if(!answerMode && next===workspaceIndex) return;
  if(!answerMode) saveWorkspace(false);
  stopRun(); answerMode=false; setAnswerModeControls(false); setCommandTrayCollapsed(draftCommandTrayCollapsed,{remember:false}); workspaceIndex=next;
  const bucket=workspaceBucket(level().id); bucket.active=workspaceIndex;
  program=(bucket.slots[workspaceIndex]||[]).map(x=>({op:x.op,arg:x.arg}));
  loadBreakpoints();
  selectedRow=null; undoStack=[]; redoStack=[]; renderProgram(); resetMachine(false); refreshWorkspaceTabs(); saveWorkspace();
  els.footer.textContent=`Worktree ${String.fromCharCode(65+workspaceIndex)} loaded. Changes save automatically.`;
}
function level(){ return levels[levelIndex]; }
function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
function motionScale(){ return [1.55,1.25,1,.72,.46,.32,.23,.16][+els.speed.value-1] || 1; }
function dur(ms){ return Math.max(24, Math.round(ms * motionScale())); }
function refreshSpeedControl(){
  if(!els.speed) return;
  const i=clamp(+els.speed.value||3,1,8);
  const labels=["0.65× SLOW","0.8×","1× NORMAL","1.4×","2.2× FAST","3×","4.3× TURBO","6× MAX"];
  if(els.speedReadout) els.speedReadout.textContent=labels[i-1];
  els.speed.style.setProperty("--speed-pos",`${((i-1)/7)*100}%`);
}

function loadLevel(index){
  if(hasLoadedLevel && levels[levelIndex]) saveWorkspace(false);
  stopRun(); levelIndex = index; selectedRow = null; undoStack = []; redoStack = [];
  const l = level();
  const bucket=workspaceBucket(l.id); workspaceIndex=bucket.active; answerMode=false; setAnswerModeControls(false); setCommandTrayCollapsed(draftCommandTrayCollapsed,{remember:false});
  program=(bucket.slots[workspaceIndex]||[]).map(x=>({op:x.op,arg:x.arg}));
  loadBreakpoints();
  els.levelNumber.textContent = `LEVEL ${String(l.id).padStart(2,"0")}`;
  els.levelTitle.textContent = l.title; els.levelStory.textContent = l.story; els.levelObjective.textContent = l.objective;
  renderExamples(l.examples || [{input:l.input,output:l.output}]);
  els.sizeGoal.textContent = l.sizeGoal; els.stepGoal.textContent = l.stepGoal;
  renderMemory(l.memory); renderPalette(); renderProgram(); resetMachine(); refreshWorkspaceTabs(); saveWorkspace(false); hasLoadedLevel=true; closeModal();
  const introduced=(l.newCommands||[]).map(op=>defs[op].label);
  els.footer.textContent = introduced.length
    ? `New instruction${introduced.length>1?'s':''}: ${introduced.join(', ')}. Previously learned instructions remain available from now on.`
    : (program.length ? `Worktree ${String.fromCharCode(65+workspaceIndex)} restored. Continue where you left off.` : "Build a program, then press Run.");
}
