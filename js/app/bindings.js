const unlockAudio=()=>{ audioContext(); if(settings.music) startMusic(); };
window.addEventListener('pointerdown',unlockAudio,{once:true,capture:true});
window.addEventListener('keydown',unlockAudio,{once:true,capture:true});
document.addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b || b.disabled) return;
  if(!b.matches('#runBtn,#stepBtn,#pauseBtn,#resetBtn,#clearBtn,.command-btn,.program-row button')) sfx('ui');
},true);

$("#runBtn").addEventListener("click",startRun);
$("#stepBtn").addEventListener("click",async()=>{ stopRun(); await stepOnce(); });
$("#pauseBtn").addEventListener("click",pause); $("#resetBtn").addEventListener("click",()=>{ if(!animating) resetMachine(); });
$("#clearBtn").addEventListener("click",()=>{ if(animating) return; commitEdit(); stopRun(); program=[]; selectedRow=null; renderProgram(); resetMachine(); });
els.undo.addEventListener("click",undoEdit); els.redo.addEventListener("click",redoEdit);
els.compact.addEventListener("click",()=>{compactProgram=!compactProgram;renderProgram();});
$("#homeBtn").addEventListener("click",()=>goHome());
$("#levelBtn").addEventListener("click",()=>openRoadmap('game')); $("#dashboardBtn").addEventListener("click",showDashboard); $("#achievementsBtn").addEventListener("click",showAchievements); $("#helpBtn").addEventListener("click",showHelp); $("#hintBtn").addEventListener("click",showHint);
$("#testBtn").addEventListener("click",()=>{metaStore.usedTestLab=true;saveMeta();showTestLab();}); $("#analyzeBtn").addEventListener("click",analyzeProgram); $("#shareBtn").addEventListener("click",showShare); $("#copyAnswerBtn").addEventListener("click",copyAnswerToDraft);
$("#modalClose").addEventListener("click",()=>closeModal());
els.modal.addEventListener("click",e=>{if(e.target===els.modal){ if(currentPage==='map'&&els.modal.classList.contains('roadmap-modal')) closeRoadmapRoute(); else closeModal(); }});
$("#soundBtn").addEventListener("click",e=>{settings.sfx=!settings.sfx;saveSettings();e.currentTarget.textContent=settings.sfx?'🔊':'🔇';});
$("#homeResumeBtn").addEventListener("click",()=>enterGame(clamp(parseInt(workspaceStore.lastLevel||0,10),0,levels.length-1)));
$("#homeMapBtn").addEventListener("click",()=>openRoadmap('home'));
$("#homeSettingsBtn").addEventListener("click",()=>{const p=$("#homeSettingsPanel"); if(p._hideTimer) clearTimeout(p._hideTimer); p.hidden=false; p.classList.remove('closing'); requestAnimationFrame(()=>requestAnimationFrame(()=>p.classList.add('open'))); syncSettingsUI(); sfx('ui');});
$("#homeSettingsClose").addEventListener("click",()=>{const p=$("#homeSettingsPanel"); p.classList.remove('open'); p.classList.add('closing'); sfx('ui'); p._hideTimer=setTimeout(()=>{p.hidden=true;p.classList.remove('closing');},240);});
[['musicToggle','music'],['sfxToggle','sfx'],['transitionToggle','transitions'],['motionToggle','reducedMotion'],['tipsToggle','editorTips'],['unlockLevelsToggle','unlockAllLevels'],['answersToggle','showAnswers']].forEach(([id,key])=>$("#"+id).addEventListener('change',e=>{settings[key]=e.target.checked;saveSettings(); if(key==='unlockAllLevels'&&currentPage==='map') showRoadmap();}));
els.workspaceTabs.forEach(tab=>tab.addEventListener("click",()=>switchWorkspace(tab.dataset.workspace)));
if(els.commandTrayToggle) els.commandTrayToggle.addEventListener("click",()=>{
  const next=!els.commandTray?.classList.contains("collapsed");
  setCommandTrayCollapsed(next,{remember:!answerMode});
});
setCommandTrayCollapsed(draftCommandTrayCollapsed,{remember:false});
window.addEventListener("keydown",e=>{
  const typing=/INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"&&!typing){e.preventDefault();e.shiftKey?redoEdit():undoEdit();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"&&!typing){e.preventDefault();redoEdit();return;}
  if(e.code==="Space" && !typing){ e.preventDefault(); running?pause():startRun(); }
  if(e.key==="F9" && !typing){e.preventDefault();running?pause():startRun();}
  if(e.key==="F10" && !typing){e.preventDefault();stopRun();stepOnce();}
  if(e.key==="F8" && !typing && selectedRow!==null){e.preventDefault();toggleBreakpoint(selectedRow);}
  if(e.key==="Escape" && !typing && running){e.preventDefault();pause();}
});
window.addEventListener("resize",()=>{ if(!animating) placeWorkerHome(true); drawJumpArrows(); });
els.list.addEventListener("scroll",()=>requestAnimationFrame(drawJumpArrows));

// Do not initialize the processing floor at boot. The game is loaded only
// after Resume or an explicit level selection from the roadmap.
const rememberedLevel=clamp(parseInt(workspaceStore.lastLevel||0,10),0,levels.length-1);
levelIndex=rememberedLevel;
saveSettings(); syncSettingsUI(); refreshHome(); setBasePage('home');
requestAnimationFrame(()=>document.body.classList.add('ui-ready'));
els.speed?.addEventListener("input",refreshSpeedControl);
refreshSpeedControl();
