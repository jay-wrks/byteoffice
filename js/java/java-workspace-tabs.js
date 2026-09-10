(function(){
  'use strict';

  const originalSwitchWorkspace=window.switchWorkspace;
  const originalSaveSettings=window.saveSettings;
  let savedTransitionSpeed=null;

  function showWorkspaceLoading(){
    const curtain=document.querySelector('#pageCurtain');
    const label=document.querySelector('#curtainLabel');
    if(curtain){
      curtain.classList.remove('entering','leaving');
      curtain.classList.add('active','workspace-loading');
      curtain.setAttribute('aria-hidden','false');
    }
    if(label) label.textContent='Loading program…';
    const speed=document.querySelector('#speedRange');
    if(speed && savedTransitionSpeed===null){
      savedTransitionSpeed=speed.value;
      speed.value=speed.max||'8';
      window.refreshSpeedControl?.();
    }
  }

  function hideWorkspaceLoading(){
    const curtain=document.querySelector('#pageCurtain');
    if(curtain){
      curtain.classList.remove('active','workspace-loading','entering','leaving');
      curtain.setAttribute('aria-hidden','true');
    }
    const speed=document.querySelector('#speedRange');
    if(speed && savedTransitionSpeed!==null){
      speed.value=savedTransitionSpeed;
      savedTransitionSpeed=null;
      window.refreshSpeedControl?.();
    }
  }

  function javaAnswerSource(){
    const id=typeof level==='function' ? Number(level()?.id) : -1;
    const source=window.BYTE_JAVA_SOLUTIONS?.[id];
    if(typeof source==='string' && source.trim()) return source;

    return `import byteoffice.ByteBot;\n\npublic class Program {\n    public void program(ByteBot bot) {\n        // No authored Java answer is available for this level.\n    }\n}\n`;
  }

  function setJavaAnswerControls(on){
    document.querySelector('.program-panel')?.classList.toggle('answer-mode',!!on);
    ['clearBtn','undoBtn','redoBtn'].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=!!on;});
    ['compactBtn','shareBtn','testBtn','analyzeBtn','runBtn','stepBtn','pauseBtn','resetBtn'].forEach(id=>{const el=document.getElementById(id);if(el)el.disabled=false;});
    const copy=document.getElementById('copyAnswerBtn');
    if(copy){
      const label=`Copy to Program ${String.fromCharCode(65+(typeof workspaceIndex==='number'?workspaceIndex:0))}`;
      copy.hidden=!on;
      copy.disabled=!on;
      if(copy.textContent!==label) copy.textContent=label;
    }
    try{window.ByteOfficeIDE?.editor?.updateOptions({readOnly:!!on,domReadOnly:!!on});}catch(_){}
  }

  function tabMarkup(slot,label,active,extra=''){
    return `<button type="button" class="byte-ide-tab ${active?'active':''} ${extra}" data-ide-workspace="${slot}" role="tab" aria-selected="${active?'true':'false'}"><span>${label}</span><i class="dirty" aria-hidden="true"></i></button>`;
  }

  async function resetBeforeWorkspaceChange(){
    showWorkspaceLoading();
    const pending=window.stopRun?.();
    window.ByteOfficeExecutionHighlight?.clear?.();
    if(pending&&typeof pending.then==='function') await pending;
    window.resetMachine?.(false);
  }

  function renderIdeTabs(){
    const bar=document.querySelector('.byte-ide-tabbar');
    if(!bar) return;
    const currentAnswer=typeof answerMode!=='undefined' && answerMode;
    const current=typeof workspaceIndex==='number'?workspaceIndex:0;
    const showAnswer=typeof settings!=='undefined' && !!settings.showAnswers;
    const signature=`${currentAnswer?'answer':current}|${showAnswer?'answers-on':'answers-off'}`;

    if(bar.dataset.workspaceSignature===signature){
      setJavaAnswerControls(currentAnswer);
      return;
    }

    const html=[
      tabMarkup('0','Program A.java',!currentAnswer&&current===0),
      tabMarkup('1','Program B.java',!currentAnswer&&current===1)
    ];
    if(showAnswer) html.push(tabMarkup('answer','Answer.java',currentAnswer,'answer-ide-tab'));
    bar.innerHTML=html.join('');
    bar.dataset.workspaceSignature=signature;
    bar.querySelectorAll('[data-ide-workspace]').forEach(tab=>{
      tab.addEventListener('click',()=>window.switchWorkspace(tab.dataset.ideWorkspace));
    });
    setJavaAnswerControls(currentAnswer);
  }

  function enterAnswer(){
    if(typeof settings==='undefined' || !settings.showAnswers || (typeof answerMode!=='undefined'&&answerMode)) return;
    if(typeof saveWorkspace==='function') saveWorkspace(false);
    if(typeof stopRun==='function') stopRun();
    answerMode=true;
    program=[{op:'JAVA',source:javaAnswerSource()}];
    if(typeof renderProgram==='function') renderProgram();
    if(typeof resetMachine==='function') resetMachine(false);
    setJavaAnswerControls(true);
    renderIdeTabs();
    if(typeof els!=='undefined'&&els.footer) els.footer.textContent='Official Java answer loaded read-only. RUN or STEP executes it on the same Byte machine.';
  }

  function returnToDraft(target){
    target=Math.max(0,Math.min(1,parseInt(target,10)||0));
    if(typeof answerMode!=='undefined' && answerMode){
      if(typeof loadLevel==='function') loadLevel(levelIndex);
      if(target!==workspaceIndex && typeof originalSwitchWorkspace==='function') originalSwitchWorkspace(target);
      setJavaAnswerControls(false);
      renderIdeTabs();
      return;
    }
    if(typeof originalSwitchWorkspace==='function') originalSwitchWorkspace(target);
    renderIdeTabs();
  }

  window.switchWorkspace=async function(next){
    if((next==='answer' && typeof answerMode!=='undefined' && answerMode) ||
       (next!=='answer' && (typeof answerMode==='undefined'||!answerMode) && parseInt(next,10)===workspaceIndex)) return;
    await resetBeforeWorkspaceChange();
    if(next==='answer') return enterAnswer();
    return returnToDraft(next);
  };

  window.refreshWorkspaceTabs=function(){
    renderIdeTabs();
  };

  window.setAnswerModeControls=function(on){
    setJavaAnswerControls(!!on);
    renderIdeTabs();
  };

  window.saveSettings=function(){
    if(typeof answerMode!=='undefined' && answerMode && typeof settings!=='undefined' && !settings.showAnswers){
      if(typeof loadLevel==='function') loadLevel(levelIndex);
    }
    const result=typeof originalSaveSettings==='function' ? originalSaveSettings.apply(this,arguments) : undefined;
    renderIdeTabs();
    return result;
  };

  function copyAnswerToDraft(){
    if(typeof answerMode==='undefined' || !answerMode) return;
    const source=program?.find?.(x=>x?.op==='JAVA')?.source || javaAnswerSource();
    answerMode=false;
    program=[{op:'JAVA',source}];
    const bucket=workspaceBucket(level().id);
    bucket.active=workspaceIndex;
    bucket.slots[workspaceIndex]=[{op:'JAVA',source}];
    if(typeof saveWorkspace==='function') saveWorkspace(false);
    if(typeof renderProgram==='function') renderProgram();
    if(typeof resetMachine==='function') resetMachine(false);
    setJavaAnswerControls(false);
    renderIdeTabs();
    if(typeof els!=='undefined'&&els.footer) els.footer.textContent=`Answer copied to Program ${String.fromCharCode(65+workspaceIndex)}. It is now editable.`;
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#copyAnswerBtn')) copyAnswerToDraft();
  });

  window.addEventListener('byteoffice-ide-ready',hideWorkspaceLoading);

  const host=document.querySelector('#programList');
  if(host){
    const observer=new MutationObserver(()=>renderIdeTabs());
    observer.observe(host,{childList:true});
  }
  renderIdeTabs();

  window.ByteOfficeJavaWorkspaceTabs={refresh:renderIdeTabs,answerSource:javaAnswerSource};
})();
