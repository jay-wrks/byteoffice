async function startRun(){
  if(running || animating) return;
  if(engine.halted) resetMachine(false);
  if(!program.length){ els.footer.textContent="Your program is empty."; return; }
  if(engine.steps===0) recordRunStart();
  running=true; setStatus("WORKING","working");
  while(running && !engine.halted){
    const pc=engine.pc;
    if(!answerMode && breakpoints.has(pc) && breakpointResumePc!==pc){
      running=false; breakpointResumePc=pc; selectedRow=pc; renderProgram(); highlightLine(pc); setStatus("BREAKPOINT","paused");
      els.footer.textContent=`Breakpoint at line ${pc+1}. Press STEP to execute it or RUN to continue.`; sfx('breakpoint'); break;
    }
    if(breakpointResumePc===pc) breakpointResumePc=null;
    const ok=await stepOnce(); if(!ok || !running) break;
    await wait(dur(90));
  }
}

function stopRun(){ running=false; }
function pause(){ running=false; if(!engine.halted){ setStatus("PAUSED","paused"); els.footer.textContent="Paused. The worker will finish the current physical action, then stop."; } }

function evaluate(){
  const expected=level().output, got=engine.output;
  const good=got.length===expected.length && got.every((v,i)=>v===expected[i]);
  if(good){
    els.footer.textContent="Assignment complete — every OUTBOX box is correct!";
    beepWin();
    if(!completed.includes(level().id)){ completed.push(level().id); localStorage.setItem("byteOfficeCompletedV17",JSON.stringify(completed)); }
    recordClear();
    successFeedback().then(()=>setTimeout(showWin,dur(120)));
  } else {
    setStatus("STOPPED","error"); setPose('error-pose'); sfx('error');
    els.footer.textContent=`Program stopped too early. Expected [${expected.join(", ")}], got [${got.join(", ")}].`;
    spawnFeedbackBurst('error',els.outbox,'!');
  }
}

function showWin(){
  setPose(""); const sizeStar=program.length<=level().sizeGoal, stepStar=engine.steps<=level().stepGoal, next=levelIndex<levels.length-1, m=levelMeta();
  const stars=1+(sizeStar?1:0)+(stepStar?1:0);
  const starMarkup=Array.from({length:3},(_,i)=>`<span class="${i<stars?'earned-star':'empty-star'}" style="--star-delay:${i*180}ms">${i<stars?'★':'☆'}</span>`).join('');
  showModal(`<div class="win-sheet"><div class="win-stamp">APPROVED</div><h2>Level Complete!</h2><div class="big-stars">${starMarkup}</div><p>You produced exactly the requested OUTBOX.</p><div class="score-cards"><div><span>Program</span><b>${program.length} lines</b><em>${sizeStar?'★ Efficiency goal met':'☆ Goal: '+level().sizeGoal}</em><small>Best: ${m.bestSize??program.length}</small></div><div><span>Runtime</span><b>${engine.steps} steps</b><em>${stepStar?'★ Speed goal met':'☆ Goal: '+level().stepGoal}</em><small>Best: ${m.bestSteps??engine.steps}</small></div></div><div class="win-actions"><button id="replayLevelBtn" class="paper-button">Optimize Again</button>${next?'<button id="nextLevelBtn" class="modal-primary">Next Assignment →</button>':'<button id="nextLevelBtn" class="modal-primary">View Levels</button>'}</div></div>`);
  $("#replayLevelBtn").addEventListener("click",()=>{closeModal();resetMachine();});
  $("#nextLevelBtn").addEventListener("click",()=>{ if(next) startNextAssignmentFlow(levelIndex+1); else openRoadmap('game'); });
}

function startNextAssignmentFlow(nextIndex){
  if(transitionBusy) return;
  document.body.classList.add('roadmap-flow-locked');
  roadmapOrigin='game';
  closeModal();
  pageTransition('Updating assignment map…',()=>{
    showRoadmap({autoEnterIndex:nextIndex});
    setBasePage('map');
  });
}

function showRoadmap({autoEnterIndex=null}={}){
  const firstTodoIndex=levels.findIndex(l=>!completed.includes(l.id));
  const nextIndex=firstTodoIndex<0?levels.length-1:firstTodoIndex;
  const fav=favoriteSet();
  const tileCount=Math.ceil(levels.length/8);
  const hadMapSnapshot=Array.isArray(metaStore.roadmapSeenCompleted);
  const previousCompleted=new Set(hadMapSnapshot?metaStore.roadmapSeenCompleted:[]);
  const roadPoints=[
    [7.5,48.8],[18.5,46.4],[31.0,48.6],[43.5,52.0],
    [55.5,54.3],[67.5,50.9],[80.5,51.8],[93.0,54.5]
  ];
  const roadRegions=[
    'Pine Intake','Wreckage Pass','Stoneworks Trail','Crater District',
    'Old Machine Range','Algorithm Avenue','Search Valley','Sorting Station',
    'Optimization Frontier'
  ];
  let revealedTile=0;
  if(settings.unlockAllLevels){
    revealedTile=tileCount-1;
  }else{
    // Region 1 is the starting map. Every later region is revealed only after
    // 75% of the immediately previous region is cleared.
    // With eight assignments per tile, this means six completed levels.
    for(let tile=1;tile<tileCount;tile++){
      const previousRegion=levels.filter((_,index)=>Math.floor(index/8)===tile-1);
      const previousIds=new Set(previousRegion.map(level=>level.id));
      const cleared=completed.filter(id=>previousIds.has(id)).length;
      if(cleared<Math.ceil(previousRegion.length*.75)) break;
      revealedTile=tile;
    }
  }
  const nextRegionTile=revealedTile<tileCount-1?revealedTile+1:-1;
  const nextRegionLevels=nextRegionTile>=1
    ? levels.filter((_,index)=>Math.floor(index/8)===nextRegionTile-1)
    : [];
  const nextRegionIds=new Set(nextRegionLevels.map(level=>level.id));
  const nextRegionCleared=completed.filter(id=>nextRegionIds.has(id)).length;
  const nextRegionRequired=Math.ceil(nextRegionLevels.length*.75);
  const nextRegionPct=nextRegionRequired?Math.min(100,Math.round(nextRegionCleared/nextRegionRequired*100)):100;
  const revealFor=(doneSet)=>{
    let tile=1;
    for(let n=1;n<tileCount;n++){
      const previous=levels.filter((_,index)=>Math.floor(index/8)===n-1);
      const cleared=previous.filter(level=>doneSet.has(level.id)).length;
      if(cleared<Math.ceil(previous.length*.75)) break;
      tile=n;
    }
    return tile;
  };
  const previousRevealedTile=hadMapSnapshot
    ? Number.isInteger(metaStore.roadmapSeenRegion)?metaStore.roadmapSeenRegion:revealFor(previousCompleted)
    : revealFor(previousCompleted);
  const regionRevealTiles=[];
  if(hadMapSnapshot&&!settings.unlockAllLevels){
    for(let tile=previousRevealedTile+1;tile<=revealedTile;tile++) regionRevealTiles.push(tile);
  }
  const previousNextIndex=levels.findIndex(l=>!previousCompleted.has(l.id));
  const animateNextLevel=hadMapSnapshot&&previousNextIndex!==nextIndex&&nextIndex>=0;
  const newCompletionCount=hadMapSnapshot?completed.filter(id=>!previousCompleted.has(id)).length:0;
  const completionAnimationWait=Math.max(1500,1500+Math.max(0,newCompletionCount-1)*190);
  const nodes=levels.map((l,i)=>{
    const tile=Math.floor(i/8), point=roadPoints[i%8], regionVisible=tile<=revealedTile, done=completed.includes(l.id), unlocked=regionVisible&&(settings.unlockAllLevels||done||i<=nextIndex);
    const m=levelMeta(l.id), starCount=(m.sizeStar?1:0)+(m.stepStar?1:0), favorite=fav.has(l.id), current=i===nextIndex&&!done;
    const regionArrival=regionRevealTiles.includes(tile);
    const levelArrival=animateNextLevel&&i===nextIndex;
    const completedArrival=hadMapSnapshot&&done&&!previousCompleted.has(l.id)&&!regionArrival;
    const state=regionVisible?(done?'done':current?'current':unlocked?'open':'locked'):'hidden-region';
    const medal=done?Array.from({length:3},(_,starIndex)=>`<span class="${starIndex<1+starCount?'map-earned-star':'map-empty-star'}" style="--map-star-delay:${starIndex*120}ms">${starIndex<1+starCount?'★':'☆'}</span>`).join(''):(current?'GO':'');
    const roadLeft=tile*1075+(point[0]/100)*1075;
    const completionDelay=completedArrival?Math.max(0,i-previousNextIndex)*190:0;
    return `<button class="road-level ${state} ${favorite?'favorite':''} ${regionArrival?'region-arrival':''} ${levelArrival?'newly-unlocked':''} ${completedArrival?'completed-arrival':''}" data-level="${i}" data-tile="${tile}" style="--road-left:${roadLeft}px;--ry:${point[1]}%;--completion-delay:${completionDelay}ms" ${unlocked?'':'disabled'} aria-label="Level ${l.id}: ${l.title}${unlocked?'':' locked'}"><span class="road-level-pin"><i>${String(l.id).padStart(2,'0')}</i><em>${medal}</em></span><span class="road-level-label"><b>${l.title}</b><small>${done?'Completed':current?'Next assignment':(settings.unlockAllLevels?'Unlocked in Settings':'Locked — finish the previous assignment')}</small></span></button>`;
  }).join('');
  const cloudMarkup=(i)=>{
    if(regionRevealTiles.includes(i)) return `<div class="road-cloud-cover region-reveal-cover region-reveal-queued" data-reveal-tile="${i}" aria-label="Region revealed"><span>REGION REVEALED</span></div>`;
    if(i<=revealedTile) return '';
    if(i===nextRegionTile) return `<div class="road-cloud-cover" aria-label="Undiscovered region"><span>UNDISCOVERED</span><div class="region-unlock-progress"><i style="width:${nextRegionPct}%"></i></div><small>${Math.max(0,nextRegionRequired-nextRegionCleared)} more to reveal ${roadRegions[i]||`Sector ${i+1}`}</small></div>`;
    return '<div class="road-cloud-cover" aria-label="Undiscovered region"><span>UNDISCOVERED</span><b>Advance through the previous regions</b></div>';
  };
  const tiles=Array.from({length:tileCount},(_,i)=>`<div class="road-tile road-tile-${i%2?'b':'a'}" data-road-tile="${i}"><div class="road-region-tag">${roadRegions[i]||`Sector ${i+1}`}</div>${cloudMarkup(i)}</div>`).join('');
  metaStore.roadmapSeenCompleted=[...completed];
  metaStore.roadmapSeenRegion=revealedTile;
  saveMeta();
  const pct=Math.round(completed.length/levels.length*100);
  els.mapContent.innerHTML=`<div class="roadmap-shell">
    <div class="roadmap-head">
      <div><span class="roadmap-kicker">BYTE OFFICE EXPEDITION MAP</span><h2>Assignment Roadmap</h2><p>Follow the road from left to right. Complete assignments in order to unlock the next checkpoint.</p></div><button id="roadExitBtn" class="road-exit-btn" aria-label="Close map">×</button>
      <div class="roadmap-progress"><div><b>${completed.length}</b><span>of ${levels.length} cleared</span></div><div class="roadmap-progress-track"><i style="width:${pct}%"></i></div><small>${pct}% campaign progress</small></div>
    </div>
    <div class="roadmap-toolbar"><button id="roadBackBtn" title="Scroll left">←</button><button id="roadCurrentBtn">◎ Current checkpoint</button><button id="roadForwardBtn" title="Scroll right">→</button><span>Drag / wheel / Shift+wheel to travel • ★ optimized • 🔒 locked</span><button id="roadListBtn" class="road-list-btn">List view</button></div>
    <div id="roadViewport" class="road-viewport"><div id="roadCanvas" class="road-canvas">${tiles}<div class="road-node-layer">${nodes}</div></div></div>
    <div class="roadmap-foot"><div><b>Route rule</b><span>${settings.unlockAllLevels?'All assignments are temporarily unlocked in Settings. Completion progress is unchanged.':'Clear 75% of a region to reveal the next one. Only the next unfinished assignment unlocks. Finished checkpoints stay replayable.'}</span></div><button id="roadContinueBtn" class="modal-primary">Continue to Level ${levels[nextIndex].id} →</button></div>
  </div>`;
  closeMapOverlay(true);
  const viewport=$('#roadViewport'), canvas=$('#roadCanvas');
  const tileWidth=1075;
  const scrollToLevel=(idx,behavior='smooth')=>{
    const tile=Math.floor(idx/8), point=roadPoints[idx%8][0]/100;
    const target=tile*tileWidth+point*tileWidth-viewport.clientWidth*.46;
    viewport.scrollTo({left:Math.max(0,target),behavior});
  };
  const finishAutoEnter=()=>{
    if(autoEnterIndex===null) return;
    const focusPoint=roadPoints[autoEnterIndex%8];
    const focusTile=Math.floor(autoEnterIndex/8);
    canvas.style.setProperty('--focus-x',`${focusTile*tileWidth+(focusPoint[0]/100)*tileWidth}px`);
    canvas.style.setProperty('--focus-y',`${focusPoint[1]}%`);
    scrollToLevel(autoEnterIndex,'smooth');
    setTimeout(()=>canvas.classList.add('next-level-zoom'),280);
    setTimeout(()=>{
      document.body.classList.remove('roadmap-flow-locked');
      enterGame(autoEnterIndex);
    },Math.max(1800,completionAnimationWait+300));
  };
  document.querySelectorAll('.road-level:not(:disabled)').forEach(b=>b.addEventListener('click',()=>enterGame(+b.dataset.level)));
  $('#roadContinueBtn').addEventListener('click',()=>enterGame(nextIndex));
  $('#roadCurrentBtn').addEventListener('click',()=>scrollToLevel(nextIndex));
  $('#roadBackBtn').addEventListener('click',()=>viewport.scrollBy({left:-viewport.clientWidth*.72,behavior:'smooth'}));
  $('#roadForwardBtn').addEventListener('click',()=>viewport.scrollBy({left:viewport.clientWidth*.72,behavior:'smooth'}));
  $('#roadListBtn').addEventListener('click',showLevelDirectory);
  $('#roadExitBtn').addEventListener('click',closeRoadmapRoute);
  viewport.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();viewport.scrollLeft+=e.deltaY;}},{passive:false});
  let down=false,startX=0,startScroll=0;
  viewport.addEventListener('pointerdown',e=>{if(e.target.closest('.road-level'))return;down=true;startX=e.clientX;startScroll=viewport.scrollLeft;viewport.classList.add('dragging');viewport.setPointerCapture(e.pointerId);});
  viewport.addEventListener('pointermove',e=>{if(down)viewport.scrollLeft=startScroll-(e.clientX-startX);});
  viewport.addEventListener('pointerup',()=>{down=false;viewport.classList.remove('dragging');});
  viewport.addEventListener('pointercancel',()=>{down=false;viewport.classList.remove('dragging');});
  const playRegionReveal=(sequenceIndex=0)=>{
    if(sequenceIndex>=regionRevealTiles.length){finishAutoEnter();return;}
    const tile=regionRevealTiles[sequenceIndex];
    const cloud=document.querySelector(`.region-reveal-cover[data-reveal-tile="${tile}"]`);
    if(!cloud){playRegionReveal(sequenceIndex+1);return;}
    scrollToLevel(Math.min(levels.length-1,tile*8),'smooth');
    setTimeout(()=>{
      cloud.classList.remove('region-reveal-queued');
      cloud.classList.add('region-reveal-active');
      cloud.addEventListener('animationend',()=>{
        const arrivals=[...document.querySelectorAll(`.road-level.region-arrival[data-tile="${tile}"]`)];
        cloud.remove();
        arrivals.forEach((node,index)=>setTimeout(()=>node.classList.add('region-levels-visible'),index*180));
        const finalPinDelay=arrivals.length?((arrivals.length-1)*180+720):0;
        setTimeout(()=>playRegionReveal(sequenceIndex+1),Math.max(260,finalPinDelay));
      },{once:true});
    },420);
  };
  requestAnimationFrame(()=>{
    if(regionRevealTiles.length){
      scrollToLevel(Math.min(levels.length-1,regionRevealTiles[0]*8),'auto');
      setTimeout(()=>playRegionReveal(),280);
    }else{
      scrollToLevel(nextIndex,'auto');
      finishAutoEnter();
    }
  });
}

function closeMapOverlay(immediate=false){
  const overlay=els.mapOverlay; if(!overlay) return;
  if(immediate){ overlay.className='map-overlay'; overlay.innerHTML=''; overlay.setAttribute('aria-hidden','true'); return; }
  if(!overlay.classList.contains('open')) return;
  overlay.classList.add('closing'); sfx('page');
  setTimeout(()=>{ overlay.className='map-overlay'; overlay.innerHTML=''; overlay.setAttribute('aria-hidden','true'); },220);
}

function showLevelDirectory(){
  const fav=favoriteSet();
  const cardHtml=(filter='all',query='')=>levels.map((l,i)=>{
    const done=completed.includes(l.id), m=levelMeta(l.id), favorite=fav.has(l.id);
    const firstTodo=levels.findIndex(x=>!completed.includes(x.id));
    const unlocked=settings.unlockAllLevels || done || firstTodo<0 || i<=firstTodo;
    const starCount=(m.sizeStar?1:0)+(m.stepStar?1:0), q=(l.title+' '+l.objective+' '+l.id).toLowerCase();
    if(query && !q.includes(query.toLowerCase())) return '';
    if(filter==='done'&&!done) return ''; if(filter==='todo'&&done) return ''; if(filter==='fav'&&!favorite)return '';
    return `<div class="level-card-wrap ${unlocked?'':'locked'}"><button class="favorite-btn ${favorite?'active':''}" data-fav="${l.id}" title="Favorite">${favorite?'★':'☆'}</button><button class="level-card ${done?'done':''} ${unlocked?'':'locked'}" data-level="${i}" ${unlocked?'':'disabled'}><span>${String(l.id).padStart(2,'0')}</span><div><b>${l.title}</b><small>${done?`Completed ${'★'.repeat(1+starCount)}${starCount<2?'☆'.repeat(2-starCount):''}${m.bestSize!=null?` · best ${m.bestSize}/${m.bestSteps}`:''}`:(unlocked?(settings.unlockAllLevels&&!done&&i>firstTodo?'Unlocked in Settings':'Assignment available'):'Locked — clear the previous assignment')}</small></div></button></div>`;
  }).join('');
  const overlay=els.mapOverlay;
  overlay.innerHTML=`<div class="map-directory-sheet">
    <div class="map-directory-header">
      <div class="map-directory-title"><span>ROADMAP DIRECTORY</span><h2>Assignment List</h2><p>${completed.length}/${levels.length} completed · choose an unlocked assignment or return to the map.</p></div>
      <button id="mapDirectoryBack" class="map-directory-back" type="button"><span>←</span> Map view</button>
    </div>
    <div class="map-directory-controls">
      <label class="map-search"><span>⌕</span><input id="levelSearch" placeholder="Find an assignment…" autocomplete="off"/></label>
      <div class="level-filters" role="group" aria-label="Filter assignments"><button data-filter="all" class="active">All</button><button data-filter="todo">Available</button><button data-filter="done">Completed</button><button data-filter="fav">★ Saved</button></div>
    </div>
    <div class="map-directory-rule"><span>STATUS</span><b>Green = completed</b><b>Cream = available</b><b>Grey = locked</b></div>
    <div class="level-list-scroll"><div id="levelGrid" class="level-grid map-level-grid">${cardHtml()}</div></div>
  </div>`;
  overlay.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>overlay.classList.add('open')); sfx('page');
  let filter='all'; const grid=$('#levelGrid'), search=$('#levelSearch');
  const wire=()=>{
    document.querySelectorAll('#mapOverlay .level-card:not(:disabled)').forEach(b=>b.addEventListener('click',()=>enterGame(+b.dataset.level)));
    document.querySelectorAll('#mapOverlay .favorite-btn').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const id=+b.dataset.fav;const f=favoriteSet();f.has(id)?f.delete(id):f.add(id);metaStore.favorites=[...f];saveMeta();showLevelDirectory();}));
  };
  const refresh=()=>{grid.innerHTML=cardHtml(filter,search.value.trim());wire();}; wire();
  $('#mapDirectoryBack').addEventListener('click',()=>closeMapOverlay());
  search.addEventListener('input',refresh);
  document.querySelectorAll('#mapOverlay .level-filters button').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('#mapOverlay .level-filters button').forEach(x=>x.classList.toggle('active',x===b));refresh();}));
}

function showHelp(){ showModal(`<div class="modal-heading"><span>EMPLOYEE HANDBOOK</span><h2>How to Play</h2></div><div class="help-copy"><p>Build a program on the right. Press <b>RUN</b> to watch the employee physically execute it, or <b>STEP</b> to perform one instruction at a time.</p><p>The employee now walks to the actual source or destination, turns toward it, reaches down, picks up or places number tiles, carries a visible value, and performs arithmetic at floor memory.</p><p><b>INBOX</b> takes a number. <b>OUTBOX</b> sends the held number out. Floor memory stores physical value boxes. <b>PLACE</b> moves the held box to a floor slot and empties your hands; <b>TAKE</b> is its opposite and removes a box from a floor slot into your hands. <b>COPYTO</b> and <b>COPYFROM</b> copy without removing the source.</p><p><b>No raw indexes:</b> memory instructions show named floor slots such as A/B/C. Click the target chip and then click the real floor slot, or drag the chip onto it. Jump instructions work the same way: click or drag the jump target onto the destination row. A curved arrow remains visible so you can see the control flow.</p><p><b>Debugging:</b> click a line number to toggle a breakpoint. <b>F9</b> runs/continues, <b>F10</b> single-steps, and <b>Esc</b> pauses. The QA Lab instantly tests both examples without animation. Analyze checks control flow and unreachable lines.</p><p><b>Progress:</b> Dashboard stores attempts and best scores. Each level has two saved solution drafts. Settings can optionally unlock the full roadmap and expose a read-only Answer tab. Badges track campaign milestones. The level directory supports search, filters, favorites, and three-star completion records.</p></div>`); }
function showHint(){ showModal(`<div class="modal-heading"><span>SUPERVISOR NOTE</span><h2>A small hint</h2></div><div class="hint-note">${level().hint}</div>`); }
function showModal(html){
  els.modal.classList.remove('closing');
  els.modalContent.innerHTML=html;
  els.modal.classList.toggle('star-reveal-modal',!!els.modalContent.querySelector('.win-sheet'));
  els.modal.classList.remove("hidden");
  requestAnimationFrame(()=>els.modal.classList.add('opened'));
  sfx('ui');
}
function closeModal(immediate=false){
  if(els.modal.classList.contains('hidden')) return;
  els.modal.classList.remove('java-compile-error-modal','star-reveal-modal');
  if(immediate){ els.modal.classList.add('hidden'); els.modal.classList.remove('opened','closing','roadmap-modal'); return; }
  els.modal.classList.remove('opened'); els.modal.classList.add('closing'); sfx('ui');
  setTimeout(()=>{ els.modal.classList.add('hidden'); els.modal.classList.remove('closing','roadmap-modal'); },210);
}
function setStatus(text,type){ els.status.textContent=text; els.lamp.className=type; }
function clearActive(){ els.list.querySelectorAll(".active").forEach(x=>x.classList.remove("active")); }

function beep(freq=300,dur=.03){
  if(!soundOn || !window.AudioContext) return;
  const ctx=beep.ctx||(beep.ctx=new AudioContext()), o=ctx.createOscillator(), g=ctx.createGain();
  o.frequency.value=freq; g.gain.value=.035; o.connect(g); g.connect(ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur); o.stop(ctx.currentTime+dur);
}
function beepWin(){ sfx('win'); }
