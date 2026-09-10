function favoriteSet(){ return new Set(metaStore.favorites||[]); }
function toggleFavorite(id){ const f=favoriteSet(); f.has(id)?f.delete(id):f.add(id); metaStore.favorites=[...f]; saveMeta(); showRoadmap(); }


function saveSettings(){
  try{ localStorage.setItem(SETTINGS_STORAGE_KEY,JSON.stringify(settings)); }catch(_){}
  soundOn=!!settings.sfx;
  document.body.classList.toggle('reduced-motion',!!settings.reducedMotion);
  document.body.classList.toggle('hide-editor-tips',!settings.editorTips);
  const soundBtn=$("#soundBtn"); if(soundBtn) soundBtn.textContent=soundOn?'🔊':'🔇';
  if(settings.music) startMusic(); else stopMusic();
  if(!settings.showAnswers && answerMode){ answerMode=false; setAnswerModeControls(false); renderProgram(); resetMachine(false); refreshWorkspaceTabs(); }
  else if(hasLoadedLevel) refreshWorkspaceTabs();
}
function syncSettingsUI(){
  const pairs=[['musicToggle','music'],['sfxToggle','sfx'],['transitionToggle','transitions'],['motionToggle','reducedMotion'],['tipsToggle','editorTips'],['unlockLevelsToggle','unlockAllLevels'],['answersToggle','showAnswers']];
  pairs.forEach(([id,key])=>{ const el=$("#"+id); if(el) el.checked=!!settings[key]; });
}
function audioContext(){
  if(!window.AudioContext) return null;
  const ctx=audioContext.ctx||(audioContext.ctx=new AudioContext());
  if(ctx.state==='suspended') ctx.resume().catch(()=>{});
  return ctx;
}
function tone(ctx,out,freq,start,duration,{type='sine',gain=.035,slide=0}={}){
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type; o.frequency.setValueAtTime(Math.max(25,freq),start);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(25,freq+slide),start+duration);
  g.gain.setValueAtTime(.0001,start); g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),start+.008);
  g.gain.exponentialRampToValueAtTime(.0001,start+duration);
  o.connect(g); g.connect(out); o.start(start); o.stop(start+duration+.02);
}
function noise(ctx,out,start,duration,gain=.018,highpass=500){
  const len=Math.max(1,Math.floor(ctx.sampleRate*duration)),buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain(); src.buffer=buf; filter.type='highpass'; filter.frequency.value=highpass;
  g.gain.setValueAtTime(gain,start); g.gain.exponentialRampToValueAtTime(.0001,start+duration);
  src.connect(filter); filter.connect(g); g.connect(out); src.start(start); src.stop(start+duration);
}
function sfx(name){
  if(!settings.sfx) return;
  const ctx=audioContext(); if(!ctx) return;
  const out=ctx.createGain(); out.gain.value=.72; out.connect(ctx.destination); const t=ctx.currentTime+.005;
  switch(name){
    case 'ui': tone(ctx,out,520,t,.035,{type:'triangle',gain:.018,slide:45}); break;
    case 'page': noise(ctx,out,t,.10,.010,900); tone(ctx,out,180,t,.12,{type:'triangle',gain:.018,slide:70}); break;
    case 'add': tone(ctx,out,330,t,.05,{type:'square',gain:.018,slide:80}); tone(ctx,out,495,t+.035,.06,{type:'triangle',gain:.015}); break;
    case 'reorder': noise(ctx,out,t,.045,.014,1200); tone(ctx,out,240,t,.055,{type:'triangle',gain:.016,slide:-45}); break;
    case 'target': tone(ctx,out,620,t,.05,{type:'sine',gain:.025}); tone(ctx,out,820,t+.045,.07,{type:'triangle',gain:.018}); break;
    case 'invalid': tone(ctx,out,155,t,.12,{type:'sawtooth',gain:.022,slide:-35}); break;
    case 'pickup': noise(ctx,out,t,.055,.020,700); tone(ctx,out,245,t,.09,{type:'triangle',gain:.028,slide:80}); break;
    case 'place': tone(ctx,out,270,t,.06,{type:'triangle',gain:.028,slide:-55}); noise(ctx,out,t+.035,.075,.022,420); break;
    case 'copy': tone(ctx,out,510,t,.055,{type:'sine',gain:.022}); tone(ctx,out,690,t+.045,.08,{type:'triangle',gain:.020,slide:80}); break;
    case 'throw': noise(ctx,out,t,.10,.025,500); tone(ctx,out,230,t,.14,{type:'sawtooth',gain:.018,slide:-120}); break;
    case 'destroy': noise(ctx,out,t,.16,.050,250); tone(ctx,out,105,t,.15,{type:'square',gain:.025,slide:-50}); break;
    case 'math': tone(ctx,out,620,t,.04,{type:'square',gain:.014}); tone(ctx,out,780,t+.055,.04,{type:'square',gain:.012}); tone(ctx,out,930,t+.11,.07,{type:'triangle',gain:.018}); break;
    case 'step': tone(ctx,out,390,t,.025,{type:'triangle',gain:.012,slide:25}); break;
    case 'breakpoint': tone(ctx,out,210,t,.07,{type:'square',gain:.015}); tone(ctx,out,210,t+.10,.07,{type:'square',gain:.015}); break;
    case 'error': tone(ctx,out,145,t,.18,{type:'sawtooth',gain:.025,slide:-55}); noise(ctx,out,t,.13,.015,350); break;
    case 'wrong-output': tone(ctx,out,196,t,.10,{type:'square',gain:.038,slide:-55}); tone(ctx,out,142,t+.095,.15,{type:'sawtooth',gain:.032,slide:-45}); noise(ctx,out,t+.03,.20,.030,260); break;
    case 'success-hit': tone(ctx,out,523.25,t,.08,{type:'triangle',gain:.030,slide:80}); tone(ctx,out,659.25,t+.07,.10,{type:'triangle',gain:.030,slide:90}); tone(ctx,out,783.99,t+.15,.18,{type:'sine',gain:.034,slide:120}); noise(ctx,out,t+.16,.10,.012,1100); break;
    case 'foot': noise(ctx,out,t,.045,.010,180); tone(ctx,out,90,t,.045,{type:'sine',gain:.012,slide:-20}); break;
    case 'win': [392,494,587,784].forEach((f,i)=>tone(ctx,out,f,t+i*.095,.16,{type:'triangle',gain:.025})); break;
    default: tone(ctx,out,320,t,.04,{type:'triangle',gain:.018});
  }
  setTimeout(()=>{try{out.disconnect()}catch(_){}},650);
}
function startMusic(){
  if(musicRig || !settings.music) return;
  const ctx=audioContext(); if(!ctx) return;
  try{
    const master=ctx.createGain(),filter=ctx.createBiquadFilter(); master.gain.value=.0001; filter.type='lowpass'; filter.frequency.value=1450;
    master.connect(filter); filter.connect(ctx.destination); master.gain.setTargetAtTime(.055,ctx.currentTime,.8);
    const rig={ctx,master,filter,timer:null,beat:0}; musicRig=rig;
    const chords={home:[[110,164.81,220],[98,146.83,196],[130.81,196,261.63],[87.31,130.81,174.61]],map:[[130.81,196,261.63],[146.83,220,293.66],[110,164.81,220],[98,146.83,196]],game:[[110,164.81,220],[110,146.83,220],[98,146.83,196],[130.81,164.81,261.63]]};
    const tick=()=>{
      if(!musicRig||musicRig!==rig||!settings.music) return;
      const page=currentPage==='map'?'map':currentPage==='game'?'game':'home', progression=chords[page], chord=progression[Math.floor(rig.beat/4)%progression.length], now=ctx.currentTime+.02;
      if(rig.beat%4===0) chord.forEach((f,i)=>tone(ctx,master,f,now,1.65,{type:i?'triangle':'sine',gain:i?.055:.085}));
      if(page==='game' && rig.beat%2===0) tone(ctx,master,55,now,.16,{type:'sine',gain:.05,slide:-8});
      if(page==='map' && rig.beat%4===2) tone(ctx,master,chord[2]*2,now,.28,{type:'sine',gain:.025});
      rig.beat++; rig.timer=setTimeout(tick,430);
    }; tick();
  }catch(_){musicRig=null;}
}
function stopMusic(){
  if(!musicRig) return; const rig=musicRig; musicRig=null;
  if(rig.timer) clearTimeout(rig.timer);
  try{ rig.master.gain.setTargetAtTime(.0001,rig.ctx.currentTime,.15); setTimeout(()=>{try{rig.master.disconnect()}catch(_){}},500); }catch(_){}
}
function refreshHome(){
  const remembered=clamp(parseInt(workspaceStore.lastLevel||0,10),0,levels.length-1), l=levels[remembered];
  if(els.homeLevelTitle) els.homeLevelTitle.textContent=`Level ${String(l.id).padStart(2,'0')} · ${l.title}`;
  if(els.homeLevelSummary){ const bucket=workspaceBucket(l.id), count=(bucket.slots||[]).reduce((n,x)=>n+(x&&x.length?1:0),0); els.homeLevelSummary.textContent=count?`${count} saved worktree${count===1?'':'s'} ready. Continue exactly where you stopped.`:'No instructions saved yet. Start this assignment when you are ready.'; }
  if(els.homeCompletion) els.homeCompletion.textContent=`${completed.length} / ${levels.length} assignments cleared`;
  if(els.homeProgressLabel) els.homeProgressLabel.textContent=completed.includes(l.id)?'LAST OPENED ASSIGNMENT':'CURRENT ASSIGNMENT';
}
function setBasePage(page){
  currentPage=page;
  const home=page==='home', map=page==='map', game=page==='game';
  els.home.classList.toggle('is-hidden',!home);
  els.map.classList.toggle('is-hidden',!map);
  els.app.classList.toggle('is-hidden',!game);
  els.home.setAttribute('aria-hidden',home?'false':'true');
  els.map.setAttribute('aria-hidden',map?'false':'true');
  els.app.setAttribute('aria-hidden',game?'false':'true');
  if(home) refreshHome();
}
function pageTransition(label,action){
  if(transitionBusy) return;
  sfx('page');
  const skip=!settings.transitions || settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(skip){ action(); return; }
  transitionBusy=true;
  els.curtainLabel.textContent=label||'Moving to the next desk…';
  els.curtain.classList.add('active','entering');
  setTimeout(()=>{
    action();
    els.curtain.classList.remove('entering'); els.curtain.classList.add('leaving');
    setTimeout(()=>{els.curtain.classList.remove('active','leaving');transitionBusy=false;},300);
  },260);
}
function goHome(withTransition=true){
  const act=()=>{ stopRun(); closeModal(); setBasePage('home'); currentPage='home'; };
  withTransition?pageTransition('Returning to employee terminal…',act):act();
}
function enterGame(index=levelIndex){
  pageTransition('Opening assignment file…',()=>{
    // The roadmap directory is a real interactive overlay. Remove it before
    // exposing the processing floor or its pointer-capturing layer can remain
    // above the game after a level is chosen from List View.
    closeMapOverlay(true);
    setBasePage('game');
    loadLevel(index);
    currentPage='game';
  });
}
function openRoadmap(origin=currentPage){
  roadmapOrigin=origin==='map'?'home':origin;
  pageTransition('Unfolding assignment map…',()=>{ showRoadmap(); setBasePage('map'); });
}
function closeRoadmapRoute(){
  const dest=roadmapOrigin==='game'?'game':'home';
  pageTransition(dest==='game'?'Returning to processing floor…':'Returning to employee terminal…',()=>{ closeMapOverlay(true); setBasePage(dest); });
}

function showDashboard(){
  const cleared=completed.length, pct=Math.round(cleared/levels.length*100);
  const metas=Object.values(metaStore.levels||{}), attempts=metas.reduce((a,m)=>a+(m.attempts||0),0), dual=metas.filter(m=>m.dualStars).length;
  const bestSizes=metas.filter(m=>Number.isFinite(m.bestSize)).length;
  const rank=cleared>=levels.length?'Chief Automation Officer':cleared>=Math.ceil(levels.length*.72)?'Principal Byte Wrangler':cleared>=Math.ceil(levels.length*.42)?'Senior Process Engineer':cleared>=8?'Automation Specialist':cleared>=1?'Junior Operator':'New Hire';
  showModal(`<div class="modal-heading"><span>PERSONNEL FILE</span><h2>Progress Dashboard</h2></div><div class="rank-card"><span>CURRENT RANK</span><b>${rank}</b><div class="progress-track"><i style="width:${pct}%"></i></div><small>${cleared}/${levels.length} assignments · ${pct}% campaign complete</small></div><div class="dashboard-grid"><div><span>Runs</span><b>${attempts}</b></div><div><span>Clears</span><b>${metaStore.totalClears||cleared}</b></div><div><span>Dual-goal clears</span><b>${dual}</b></div><div><span>Recorded bests</span><b>${bestSizes}</b></div><div><span>Favorites</span><b>${favoriteSet().size}</b></div><div><span>Worktrees</span><b>${Object.values(workspaceStore).filter(x=>x&&x.slots).reduce((n,b)=>n+b.slots.filter(s=>s.length).length,0)}</b></div></div>`);
}

function achievementData(){
  const metas=Object.values(metaStore.levels||{}), dual=metas.filter(m=>m.dualStars).length, fav=favoriteSet().size;
  return [
    ['First Stamp','Complete your first assignment.',completed.length>=1],['Getting Dangerous','Complete 5 assignments.',completed.length>=5],['Middle Management','Complete 15 assignments.',completed.length>=15],['Machine Whisperer','Complete 30 assignments.',completed.length>=30],['Office Legend',`Complete all ${levels.length} assignments.`,completed.length>=levels.length],
    ['Two-Star Employee','Meet both goals on one assignment.',dual>=1],['Optimization Dept.','Meet both goals on 10 assignments.',dual>=10],['Debugger','Set a breakpoint at least once.',!!metaStore.usedBreakpoint],['QA Engineer','Open the multi-example test lab.',!!metaStore.usedTestLab],['Collector','Favorite 5 assignments.',fav>=5],['Two Branches','Use both saved solutions on any level.',Object.values(workspaceStore).some(b=>b&&b.slots&&b.slots.length>=2&&b.slots.slice(0,2).every(s=>s.length))]
  ];
}
function showAchievements(){
  const a=achievementData(), unlocked=a.filter(x=>x[2]).length;
  showModal(`<div class="modal-heading"><span>COMPANY BADGES</span><h2>Achievements ${unlocked}/${a.length}</h2></div><div class="achievement-grid">${a.map(([n,d,u])=>`<div class="achievement ${u?'unlocked':''}"><span>${u?'★':'☆'}</span><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`);
}

