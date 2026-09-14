(function(){
  'use strict';

  const guides={
    1:[
      {target:'#scene',kicker:'WELCOME TO BYTE OFFICE',title:'Meet Byte.',body:'You are Byte’s new systems engineer. Your job is to write tiny Java instructions that make this physical worker complete each assignment.',button:'Start the tour →'},
      {target:'.objective-box',kicker:'YOUR FIRST ASSIGNMENT',title:'One box. One trip.',body:'The question is simple: take the first box from <b>INBOX</b> and deliver that same box to <b>OUTBOX</b>. Read the example values here; the machine will check your result exactly.',button:'Show me the workspace →'},
      {target:'#programList',kicker:'YOUR JAVA IDE',title:'This is Program.java',body:'This editor is your control room. ByteOffice supplies <code>main()</code> and calls your <code>program(ByteBot bot)</code> method. You write normal Java, then control Byte through physical commands such as <code>bot.take()</code> and <code>bot.send()</code>.',button:'Show me the first instruction →',advanceOnIdeClick:true},
      {target:'#byteMonaco',kicker:'STEP 1 · WRITE',title:'Pick up the box',body:'Click inside the highlighted <b>Program.java</b> editor and add this line inside <code>program(ByteBot bot)</code>. It tells Byte to walk to INBOX and take the next box into his hands.',code:'bot.take();',required:'bot.take();',condition:source=>/\bbot\s*\.\s*take\s*\(\s*\)\s*;/.test(source),waiting:'Add bot.take(); in Program.java, then I’ll point to the delivery move.'},
      {target:'#byteMonaco',kicker:'STEP 2 · WRITE',title:'Send it out',body:'Add the second instruction. It tells Byte to carry the box to OUTBOX and release it there.',code:'bot.send();',required:'bot.send();',condition:source=>/\bbot\s*\.\s*send\s*\(\s*\)\s*;/.test(source),waiting:'Add bot.send(); so Byte has somewhere to deliver the box.'},
      {target:'#runBtn',phase:'compile',mode:'compile',kicker:'JAVA COMPILER',title:'Compiling your program…',body:'The browser is compiling Program.java now. The RUN control is showing its live loading state. This can take a moment the first time while the Java tools are prepared. Please wait here and do not click RUN again.',button:'Waiting for compiler…',locked:true},
      {target:'#runBtn',kicker:'STEP 3 · START',title:'Run the machine',body:'Compilation is ready. Now press the highlighted <b>RUN</b> control to start Byte and watch your two instructions become physical movement.',on:'run',externalAction:true},
      {target:'#workerWrap',runtime:true,follow:true,kicker:'BYTE IS READY',title:'Watch the code become motion',body:'The glowing execution marker in Program.java will stay synchronized with Byte. Each physical movement starts from the Java line highlighted in the IDE.',button:'Watching Byte…',locked:true}
    ],
    2:[
      {target:'.objective-box',kicker:'BYTE BRIEFING',title:'This time, repeat.',body:'There are several boxes on the belt. Instead of writing the same commands again and again, make Java repeat them until INBOX is empty.',button:'Show me how →'},
      {target:'#byteMonaco',kicker:'STEP 1 · LOOP',title:'Keep working while boxes remain',body:'Wrap the work in a loop. <code>bot.hasNext()</code> is true while INBOX still has another box. Use this exact program shape in Program.java:',code:'while (bot.hasNext()) {\n  bot.take();\n  bot.send();\n}',required:'while (bot.hasNext()) {',condition:source=>/\bwhile\s*\(\s*bot\s*\.\s*hasNext\s*\(\s*\)\s*\)\s*\{/.test(source),waiting:'Create a while (bot.hasNext()) loop in Program.java.'},
      {target:'#byteMonaco',kicker:'STEP 2 · LOOP BODY',title:'Take one box each round',body:'Inside the loop, tell Byte to take the next INBOX box.',code:'bot.take();',required:'bot.take();',condition:source=>/\bbot\s*\.\s*take\s*\(\s*\)\s*;/.test(source),waiting:'Put bot.take(); inside the loop body.'},
      {target:'#byteMonaco',kicker:'STEP 3 · LOOP BODY',title:'Send one box each round',body:'Complete the loop body with the delivery instruction. The loop will return to the top for the next box.',code:'bot.send();',required:'bot.send();',condition:source=>/\bbot\s*\.\s*send\s*\(\s*\)\s*;/.test(source),waiting:'Put bot.send(); inside the loop body.'},
      {target:'#runBtn',phase:'compile',mode:'compile',kicker:'JAVA COMPILER',title:'Compiling your program…',body:'Your code changed, so the browser is compiling Program.java first. Please wait for this loading state to finish.',externalAction:true},
      {target:'#runBtn',kicker:'STEP 4 · START',title:'Run the conveyor',body:'Compilation is ready. Now use the highlighted <b>RUN</b> control to start Byte. Byte should repeat the same two physical actions until every inbox box is delivered.',on:'run',externalAction:true},
      {target:'#scene',kicker:'WATCH BYTE',title:'Loops make small ideas scale',body:'One pair of instructions handled the whole conveyor. You’ve just used a Java loop to control a physical machine.',button:'Show me the speed control →'},
      {target:'#workerWrap',extraTarget:'.speed-control',extraTargetInteractive:true,follow:true,kicker:'WATCH BYTE · MACHINE CONTROL',title:'Control the pace',body:'Use the <b>SPEED</b> slider while Byte works to slow the animation down for a closer look or speed it up when you already understand the motion. It changes only the playback pace—not your Java program or the assignment result.',button:'Finish guide'}
    ],
    3:[
      {target:'.objective-box',kicker:'BYTE BRIEFING',title:'Reverse each pair.',body:'Two forms arrive together. Save the first box, send the second box, then bring the saved first box back and send it.',button:'Show me how →'},
      {target:'#byteMonaco',kicker:'STEP 1 · COMPLETE PROGRAM',title:'Keep handling pairs',body:'Use this complete program to reverse every pair. Byte stores the first box, sends the second box, then sends the stored first box.',code:'while (bot.hasNext()) {\n  bot.take();\n  bot.place(0);\n\n  bot.take();\n  bot.send();\n\n  bot.pick(0);\n  bot.send();\n}',required:'while (bot.hasNext()) {',condition:source=>/\bwhile\s*\(\s*bot\s*\.\s*hasNext\s*\(\s*\)\s*\)\s*\{/.test(source),waiting:'Start the complete pair-swap program with while (bot.hasNext()) {.'},
      {target:'#byteMonaco',kicker:'STEP 2 · TAKE THE FIRST BOX',title:'Take the first box',body:'Inside the loop, take the first box from INBOX. Byte will hold it until you move it into floor memory.',code:'bot.take();',required:'bot.take();',condition:source=>/\bbot\s*\.\s*take\s*\(\s*\)\s*;/.test(source),waiting:'Add bot.take(); inside the pair loop.'},
      {target:'#byteMonaco',kicker:'STEP 3 · SAVE THE FIRST BOX',title:'Place it in Slot A',body:'After the first <code>bot.take()</code>, place the box in floor memory. <code>place(0)</code> moves it from Byte’s hands into Slot A.',code:'bot.place(0);',required:'bot.place(0);',condition:source=>/\bbot\s*\.\s*place\s*\(\s*0\s*\)\s*;/.test(source),waiting:'Add bot.place(0); after Byte takes the first box.'},
      {target:'#byteMonaco',kicker:'STEP 4 · OUTPUT THE SECOND',title:'Send the newer box first',body:'Take the second inbox box and send it immediately. That reverses the pair’s order.',code:'bot.take();\nbot.send();',codeOccurrence:{'bot.take();':2},required:'bot.send();',condition:source=>(source.match(/\bbot\s*\.\s*take\s*\(\s*\)\s*;/g)||[]).length>=2&&/\bbot\s*\.\s*send\s*\(\s*\)\s*;/.test(source),waiting:'Add the second bot.take(); and bot.send(); inside the loop.'},
      {target:'#byteMonaco',kicker:'STEP 5 · RESTORE THE FIRST',title:'Pick back Slot A',body:'After sending the second box, pick the saved first box back into Byte’s hands, then send it.',code:'bot.pick(0);\nbot.send();',codeOccurrence:{'bot.send();':2},required:'bot.pick(0);',condition:source=>/\bbot\s*\.\s*pick\s*\(\s*0\s*\)\s*;/.test(source)&&(source.match(/\bbot\s*\.\s*send\s*\(\s*\)\s*;/g)||[]).length>=2,waiting:'Add bot.pick(0); and the final bot.send(); after the second box is sent.'},
      {target:'#runBtn',phase:'compile',mode:'compile',kicker:'JAVA COMPILER',title:'Compiling your program…',body:'The browser is compiling Program.java now. The RUN control is showing its live loading state. Please wait until compilation finishes before running the pair swap.',button:'Waiting for compiler…',locked:true},
      {target:'#runBtn',kicker:'STEP 6 · START',title:'Run the pair swap',body:'Compilation is ready. Press <b>RUN</b>. Each pair should leave the OUTBOX in reverse order: second box first, saved first box second.',on:'run',externalAction:true},
      {target:'#scene',kicker:'WATCH BYTE',title:'Floor memory changes the route',body:'Byte used Slot A as a temporary shelf, so he could reverse every pair without losing the first box.',button:'Finish guide'}
    ],
    4:[
      {target:'.objective-box',kicker:'BYTE BRIEFING',title:'Add the pair values.',body:'Level 4 introduces physical addition. For every pair of boxes, Byte must combine the two values and send their sum to OUTBOX.',button:'Show me the ByteBot API →'},
      {target:'#commandTray',kicker:'BYTEBOT API',title:'ByteBot’s command panel',body:'This panel is Byte’s command shelf. Each tile represents one physical action you can call from Java, such as taking, sending, storing, or adding boxes.',button:'Open sum API →',openApiPanel:true},
      {target:'[data-java-api-name="bot.add(slot)"]',kicker:'BYTEBOT API · ADDITION',title:'Open bot.add(slot)',body:'This is the command Level 4 introduces. Open the highlighted <b>bot.add(slot)</b> tile to watch Byte physically combine the held box with a floor-memory value.',externalAction:true,openApi:true}
    ]
  };

  const guidePrograms={
    2:'while (bot.hasNext()) {\n  bot.take();\n  bot.send();\n}',
    3:'while (bot.hasNext()) {\n  bot.take();\n  bot.place(0);\n\n  bot.take();\n  bot.send();\n\n  bot.pick(0);\n  bot.send();\n}'
  };

  const levelOneRuntime={
    read:{
      kicker:'BYTE · STEP 1 / 2',
      title:'Take the box',
      body:'<code>bot.take()</code> tells Byte to walk to INBOX, lift the next box, and carry it in his hands. The highlighted Java line and his movement are synchronized.',
      code:'bot.take();',
      mode:'live'
    },
    write:{
      kicker:'BYTE · STEP 2 / 2',
      title:'Send the box',
      body:'<code>bot.send()</code> tells Byte to walk to OUTBOX and release the box there. The assignment checks that delivered value against the question.',
      code:'bot.send();',
      mode:'live'
    }
  };

  let session=null;
  let activeTarget=null;
  let positionFrame=0;
  let followFrame=0;
  let runReadyFrame=0;
  let targetRetryTimer=0;
  let targetResizeObserver=null;
  let typingAdvanceTimer=0;

  function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function source(){return window.ByteOfficeIDE?.getValue?.()||document.querySelector('#javaEditor')?.value||'';}
  function currentStep(){return session?guides[session.levelId]?.[session.stepIndex]:null;}
  function renderGuideBot(){
    return window.ByteOfficeHeadAvatar.markup('byte-guide-bot');
  }
  function setEditorGuideLock(locked){
    const readOnly=!!locked||!!window.answerMode;
    try{window.ByteOfficeIDE?.editor?.updateOptions({readOnly,domReadOnly:readOnly});}catch(_){ }
    const textarea=document.querySelector('#javaEditor');
    if(textarea) textarea.readOnly=readOnly;
  }
  function guideCodeState(code,value=source(),step=currentStep()){
    const entered=String(value).split(/\r?\n/).map(line=>line.trim());
    const lines=String(code).split(/\r?\n/);
    const compact=value=>String(value).replace(/\s+/g,'');
    const displayedCounts={};
    return lines.map(line=>{
      const expected=line.trim();
      const compactExpected=compact(expected);
      displayedCounts[expected]=(displayedCounts[expected]||0)+1;
      const requiredOccurrence=step?.codeOccurrence?.[expected]||displayedCounts[expected];
      const exactCount=entered.filter(value=>compact(value)===compactExpected).length;
      const candidate=exactCount>=requiredOccurrence
        ? expected
        : entered.find(value=>value&&compact(value)!==compactExpected&&compactExpected.startsWith(compact(value)))||'';
      const compactCandidate=compact(candidate);
      const matched=compactExpected&&compactCandidate?compactCandidate.length:0;
      let compactIndex=0;
      return Array.from(line).map((char,index)=>{
        const done=/\s/.test(char)||(compactIndex++<matched);
        return {char,done};
      });
    });
  }
  function renderGuideCode(code,value=source(),step=currentStep()){
    return guideCodeState(code,value,step).map(line=>{
      const chars=line.map(({char,done})=>`<span class="guide-code-char ${done?'is-entered':'is-needed'}">${escapeHtml(char)||' '}</span>`).join('');
      return `<span class="guide-code-line">${chars||' '}</span>`;
    }).join('');
  }
  function updateGuideCodeProgress(code,value=source(),step=currentStep()){
    let enteredCount=0;
    document.querySelectorAll('#byteGuideLayer .guide-code').forEach(guideCode=>{
      const isFullProgram=guideCode.dataset.guideCode==='full';
      const shownCode=isFullProgram?guidePrograms[session?.levelId]:code;
      if(!shownCode) return;
      const next=guideCodeState(shownCode,value,isFullProgram?{}:step).flat();
      const chars=Array.from(guideCode.querySelectorAll('.guide-code-char'));
      if(chars.length!==next.length) return;
      let blockEntered=0;
      chars.forEach((span,index)=>{
        const done=next[index].done;
        const newlyEntered=done&&span.classList.contains('is-needed');
        span.classList.toggle('is-entered',done);
        span.classList.toggle('is-needed',!done);
        if(!newlyEntered) return;
        span.style.setProperty('--guide-char-delay',`${blockEntered*28}ms`);
        span.classList.remove('just-entered');
        void span.offsetWidth;
        span.classList.add('just-entered');
        span.addEventListener('animationend',()=>span.classList.remove('just-entered'),{once:true});
        blockEntered++;
      });
      if(blockEntered){
        guideCode.classList.remove('is-correct-input');
        void guideCode.offsetWidth;
        guideCode.classList.add('is-correct-input');
        guideCode.addEventListener('animationend',()=>guideCode.classList.remove('is-correct-input'),{once:true});
      }
      enteredCount=Math.max(enteredCount,blockEntered);
    });
    return enteredCount;
  }
  function stepSatisfied(step,value=source()){
    if(step?.required){
      // Java permits formatting differences around punctuation. Compare the
      // required instruction by tokens across the whole source. Newlines are
      // formatting in Java, so `bot.take(); bot.send();` is just as valid as
      // putting those statements on separate lines.
      const wanted=step.required.replace(/\s+/g,'');
      const hasRequired=String(value).replace(/\s+/g,'').includes(wanted);
      if(!hasRequired) return false;
    }
    return !step?.condition||step.condition(value);
  }
  function ensureLayer(){
    let layer=document.querySelector('#byteGuideLayer');
    if(layer) return layer;
    layer=document.createElement('div');
    layer.id='byteGuideLayer';
    layer.setAttribute('aria-hidden','false');
    layer.innerHTML='<div id="byteGuideShield" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div id="byteGuideFocus" aria-hidden="true"></div><div id="byteGuideFocusSecondary" aria-hidden="true"></div><aside id="byteGuideProgramReference" class="byte-guide-card byte-guide-program-reference" aria-label="Complete program reference" hidden></aside><section id="byteGuideCard" class="byte-guide-card" role="dialog" aria-live="polite" aria-labelledby="byteGuideTitle" aria-describedby="byteGuideBody"></section>';
    document.body.appendChild(layer);
    layer.addEventListener('click',event=>{
      const button=event.target.closest('button');
      if(!button||!session) return;
      if(button.id==='byteGuideNext'){
        if(currentStep()?.onError||(currentStep()?.phase==='compile'&&session.compileError)){window.ByteOfficeIDE?.focus?.();return;}
        advance();
      }
    });
    return layer;
  }
  function stopFollow(){
    if(followFrame){cancelAnimationFrame(followFrame);followFrame=0;}
  }
  function stopWaitingForRun(){
    if(runReadyFrame){cancelAnimationFrame(runReadyFrame);runReadyFrame=0;}
  }
  function waitForRunButton(){
    stopWaitingForRun();
    const check=()=>{
      runReadyFrame=0;
      if(!session||currentStep()?.phase!=='compile') return;
      const run=document.querySelector('#runBtn');
      const label=run?.textContent?.replace(/\s+/g,' ').trim()||'';
      if(run&&!run.disabled&&!run.matches('[aria-busy="true"]')&&/^(?:▶\s*)?RUN$/.test(label)){
        session.stepIndex++;
        session.runtimeCopy=null;
        render();
        return;
      }
      runReadyFrame=requestAnimationFrame(check);
    };
    runReadyFrame=requestAnimationFrame(check);
  }
  function followTarget(){
    if(!session||!currentStep()?.follow){followFrame=0;return;}
    // Keep the explanation card readable while only the spotlight follows Byte.
    position(false,false);
    followFrame=requestAnimationFrame(followTarget);
  }
  function syncFollow(){
    if(session&&currentStep()?.follow){
      if(!followFrame) followFrame=requestAnimationFrame(followTarget);
    }else stopFollow();
  }
  function removeLayer(){
    stopFollow();
    stopWaitingForRun();
    if(typingAdvanceTimer){clearTimeout(typingAdvanceTimer);typingAdvanceTimer=0;}
    if(targetRetryTimer){clearTimeout(targetRetryTimer);targetRetryTimer=0;}
    setEditorGuideLock(false);
    targetResizeObserver?.disconnect();
    targetResizeObserver=null;
    if(activeTarget) activeTarget.classList.remove('byte-guide-focus-target');
    activeTarget=null;
    document.querySelector('#byteGuideLayer')?.remove();
  }
  function targetFor(step){
    let target=document.querySelector(step.target);
    const targetReady=target&&target.getBoundingClientRect().width>=8&&target.getBoundingClientRect().height>=8;
    if(!targetReady){
      if(session&&!targetRetryTimer){
        targetRetryTimer=setTimeout(()=>{
          targetRetryTimer=0;
          if(session) position(true);
        },120);
      }
      target=document.querySelector('#programList')||document.querySelector('#app');
    }
    return target;
  }
  function revealInScrollContainers(target){
    if(!target) return;
    let parent=target.parentElement;
    while(parent&&parent!==document.body){
      const style=getComputedStyle(parent);
      if((style.overflowY==='auto'||style.overflowY==='scroll')&&parent.scrollHeight>parent.clientHeight){
        const targetRect=target.getBoundingClientRect(), parentRect=parent.getBoundingClientRect();
        if(targetRect.top<parentRect.top||targetRect.bottom>parentRect.bottom){
          parent.scrollTop+=(targetRect.top+targetRect.height/2)-(parentRect.top+parentRect.height/2);
        }
      }
      parent=parent.parentElement;
    }
  }
  function positionShield(rect,pad,secondaryRect=null){
    const shield=document.querySelector('#byteGuideShield');
    if(!shield) return;
    const width=window.innerWidth, height=window.innerHeight;
    const holes=[rect,secondaryRect].filter(Boolean).map(box=>({
      left:Math.max(0,box.left-pad),top:Math.max(0,box.top-pad),
      right:Math.min(width,box.right+pad),bottom:Math.min(height,box.bottom+pad)
    }));
    const xs=[0,width],ys=[0,height];
    holes.forEach(box=>{xs.push(box.left,box.right);ys.push(box.top,box.bottom);});
    xs.sort((a,b)=>a-b);ys.sort((a,b)=>a-b);
    const unique=(values)=>values.filter((value,index)=>index===0||value!==values[index-1]);
    const xStops=unique(xs),yStops=unique(ys);
    shield.innerHTML='';
    for(let y=0;y<yStops.length-1;y++) for(let x=0;x<xStops.length-1;x++){
      const cell={left:xStops[x],top:yStops[y],right:xStops[x+1],bottom:yStops[y+1]};
      const centerX=(cell.left+cell.right)/2,centerY=(cell.top+cell.bottom)/2;
      if(holes.some(h=>centerX>=h.left&&centerX<=h.right&&centerY>=h.top&&centerY<=h.bottom)) continue;
      const pane=document.createElement('i');
      pane.style.left=`${cell.left}px`;pane.style.top=`${cell.top}px`;
      pane.style.width=`${Math.max(0,cell.right-cell.left)}px`;
      pane.style.height=`${Math.max(0,cell.bottom-cell.top)}px`;
      shield.appendChild(pane);
    }
  }
  function position(forceVisibility=false,moveCard=true){
    if(!session||!currentStep()) return;
    const layer=ensureLayer(), focus=layer.querySelector('#byteGuideFocus'), secondaryFocus=layer.querySelector('#byteGuideFocusSecondary'), card=layer.querySelector('#byteGuideCard'), step=currentStep(), target=targetFor(step);
    if(!target||!focus||!card) return;
    const targetChanged=activeTarget!==target;
    if(activeTarget&&targetChanged) activeTarget.classList.remove('byte-guide-focus-target');
    activeTarget=target; activeTarget.classList.add('byte-guide-focus-target');
    if(targetChanged){
      targetResizeObserver?.disconnect();
      targetResizeObserver=null;
      if(window.ResizeObserver){
        targetResizeObserver=new ResizeObserver(()=>{
          if(!session) return;
          cancelAnimationFrame(positionFrame);
          positionFrame=requestAnimationFrame(()=>position());
        });
        targetResizeObserver.observe(target);
      }
    }
    let rect=target.getBoundingClientRect();
    const visibleHeight=Math.max(0,Math.min(rect.bottom,window.innerHeight)-Math.max(rect.top,0));
    const requiredHeight=Math.min(rect.height,window.innerHeight)*.6;
    if((targetChanged||forceVisibility)&&visibleHeight<requiredHeight){
      target.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});
      rect=target.getBoundingClientRect();
    }
    const pad=6;
    // A new guide step must highlight its own target immediately. In
    // particular, do not animate the focus rectangle from a previously
    // followed Byte target to RUN while the RUN instructions are visible.
    // The shield already switches holes synchronously, so animating only the
    // outline also leaves a misleading stale highlight behind.
    focus.style.transition=(step.follow||targetChanged)?'none':'';
    focus.style.left=`${Math.max(4,rect.left-pad)}px`;focus.style.top=`${Math.max(4,rect.top-pad)}px`;
    focus.style.width=`${Math.min(window.innerWidth-8,rect.width+pad*2)}px`;focus.style.height=`${Math.min(window.innerHeight-8,rect.height+pad*2)}px`;
    if(targetChanged&&!step.follow){
      requestAnimationFrame(()=>{
        if(session&&activeTarget===target&&!currentStep()?.follow) focus.style.transition='';
      });
    }
    const secondaryTarget=step.extraTarget?document.querySelector(step.extraTarget):null;
    const secondaryRect=secondaryTarget?.getBoundingClientRect()||null;
    positionShield(rect,pad,secondaryRect);
    if(secondaryFocus){
      secondaryFocus.classList.toggle('is-interactive',!!step.extraTargetInteractive);
      if(secondaryRect){
        secondaryFocus.hidden=false;
        secondaryFocus.style.left=`${Math.max(4,secondaryRect.left-pad)}px`;
        secondaryFocus.style.top=`${Math.max(4,secondaryRect.top-pad)}px`;
        secondaryFocus.style.width=`${Math.min(window.innerWidth-8,secondaryRect.width+pad*2)}px`;
        secondaryFocus.style.height=`${Math.min(window.innerHeight-8,secondaryRect.height+pad*2)}px`;
      }else secondaryFocus.hidden=true;
    }
    const margin=16, gap=18, cardRect=card.getBoundingClientRect(), cardWidth=cardRect.width, cardHeight=cardRect.height;
    let left=rect.left, top=rect.bottom+gap, placement='below';
    const preferLeft=['#byteMonaco','#programList'].includes(currentStep()?.target);
    if(preferLeft&&rect.left-cardWidth-gap>=margin){left=rect.left-cardWidth-gap;top=rect.top;placement='left';}
    else if(rect.width>cardWidth*1.35&&rect.right+gap+cardWidth<=window.innerWidth-margin){left=rect.right+gap;top=rect.top;placement='right';}
    else if(top+cardHeight>window.innerHeight-margin&&rect.top-cardHeight-gap>=margin){top=rect.top-cardHeight-gap;placement='above';}
    else if(top+cardHeight>window.innerHeight-margin){top=window.innerHeight-cardHeight-margin;}
    left=Math.max(margin,Math.min(window.innerWidth-cardWidth-margin,left));
    top=Math.max(margin,Math.min(window.innerHeight-cardHeight-margin,top));
    if(moveCard){
      card.style.left=`${left}px`;card.style.top=`${top}px`;card.dataset.placement=placement;
      const overview=layer.querySelector('#byteGuideProgramReference:not([hidden])');
      if(overview){
        const overviewRect=overview.getBoundingClientRect();
        const gapBetweenCards=12;
        let overviewLeft=left-overviewRect.width-gapBetweenCards;
        let overviewTop=top;
        if(overviewLeft<margin){
          // Narrow layouts keep both cards beside the IDE as a compact stack
          // instead of sending the complete program to the viewport edge.
          overviewLeft=left;
          overviewTop=Math.max(margin,top-overviewRect.height-gapBetweenCards);
          if(overviewTop===margin) overviewTop=Math.min(window.innerHeight-overviewRect.height-margin,top+cardHeight+gapBetweenCards);
        }
        if(!overview.dataset.positioned){
          // Begin exactly where the original full-program card was. On the
          // next paint, slide that card aside and reveal the line explanation
          // in the space it vacated.
          overview.style.transition='none';
          overview.style.left=`${left}px`;
          overview.style.top=`${top}px`;
          overview.dataset.positioned='moving';
          requestAnimationFrame(()=>requestAnimationFrame(()=>{
            if(!session||overview.hidden) return;
            overview.style.transition='';
            overview.style.left=`${overviewLeft}px`;
            overview.style.top=`${overviewTop}px`;
            overview.dataset.positioned='true';
            card.classList.add('dual-instruction-visible');
          }));
        }else if(overview.dataset.positioned==='true'){
          overview.style.left=`${overviewLeft}px`;
          overview.style.top=`${overviewTop}px`;
          card.classList.add('dual-instruction-visible');
        }
      }
    }
  }
  function render(){
    if(!session){removeLayer();return;}
    const steps=guides[session.levelId]||[], step=currentStep();
    if(!step){finish();return;}
    // Drop callbacks belonging to the prior step before resolving this
    // step's target. A queued follow/resize frame must never repaint Byte
    // after the guide has moved on to RUN.
    stopFollow();
    cancelAnimationFrame(positionFrame);
    positionFrame=0;
    // The program may start before the guide gets its next paint. Do not
    // leave the user on a stale RUN instruction once execution is underway.
    if(step.on==='run'&&window.byteOfficeJavaPhase==='run-start'){
      session.stepIndex++;
      render();
      return;
    }
    if((step.openApiPanel||step.openApi) && typeof setCommandTrayCollapsed==='function') setCommandTrayCollapsed(false,{remember:false});
    setEditorGuideLock(step.lockEditor);
    const layer=ensureLayer(), card=layer.querySelector('#byteGuideCard');
    const programReference=layer.querySelector('#byteGuideProgramReference');
    card.classList.remove('typing-success');
    const progress=Math.round((session.stepIndex/Math.max(1,steps.length))*100);
    const copy=step.runtime&&session.runtimeCopy?session.runtimeCopy:step;
    const compileError=step.phase==='compile'&&session.compileError;
    const display=compileError
      ? {...step,kicker:'JAVA COMPILER · NEEDS ATTENTION',title:'The compiler stopped',body:'The source needs a small fix before Byte can run. Review the compiler message in Program.java, correct the code, and press RUN again.'}
      : copy;
    const fullProgram=guidePrograms[session.levelId];
    const showProgramReference=!!(fullProgram&&step.code&&step.code!==fullProgram);
    if(programReference){
      const wasHidden=programReference.hidden;
      programReference.hidden=!showProgramReference;
      if(showProgramReference){
        if(wasHidden){
          delete programReference.dataset.positioned;
          card.classList.add('dual-instruction-pending');
          card.classList.remove('dual-instruction-visible');
        }
        programReference.innerHTML=`<div class="byte-guide-head">${renderGuideBot()}<div><span class="byte-guide-kicker">PROGRAM REFERENCE</span><h2>Complete program</h2></div></div><div class="byte-guide-copy"><p>Keep the whole solution visible while you enter the current instruction.<br><code class="guide-code" data-guide-code="full">${renderGuideCode(fullProgram,source(),{})}</code></p></div>`;
      }else{
        programReference.innerHTML='';
        delete programReference.dataset.positioned;
        card.classList.remove('dual-instruction-pending','dual-instruction-visible');
      }
    }
    const body=display.body+(display.code?`<br><code class="guide-code" data-guide-code="step">${renderGuideCode(display.code)}</code>`:'');
    const locked=display.locked&&!compileError;
    const button=compileError?'Back to Program.java':(display.button||'I’ve done that →');
    const nextButton=display.externalAction||step.runtime?'':`<button type="button" class="byte-guide-next" id="byteGuideNext"${locked?' disabled':''}>${escapeHtml(button)}</button>`;
    const actions=nextButton?`<div class="byte-guide-actions">${nextButton}</div>`:'';
    card.dataset.mode=display.mode||step.mode||'';
    const feedback=compileError?'Compilation failed. Review the highlighted error in Program.java, correct the code, then press RUN again.':(!stepSatisfied(step)?step.waiting||'Complete the highlighted step to continue.':'');
    card.innerHTML=`<div class="byte-guide-head">${renderGuideBot()}<div><span class="byte-guide-kicker">${escapeHtml(display.kicker)}</span><h2 id="byteGuideTitle">${escapeHtml(display.title)}</h2></div></div><div class="byte-guide-copy" id="byteGuideBody"><p>${body}</p></div><div class="byte-guide-progress"><span>GUIDE ${session.stepIndex+1} / ${steps.length}</span><i style="--guide-progress:${progress}%"></i></div><div class="byte-guide-feedback" aria-live="polite">${feedback}</div>${actions}`;
    window.ByteOfficeHeadAvatar.refresh();
    position();
    // Recalculate after the current guide card and any button state changes
    // have painted; this prevents a previous follow target from leaving the
    // spotlight on Byte when the current step targets RUN.
    requestAnimationFrame(()=>{if(session) position(true);});
    if(step.openApi) requestAnimationFrame(()=>{revealInScrollContainers(targetFor(step));position(true);});
    syncFollow();
  }
  function finish(){
    session=null;removeLayer();
  }
  function moveToCompile(){
    if(!session) return;
    if(currentStep()?.on==='run') session.stepIndex++;
    if(currentStep()?.phase==='compile'){
      session.compileError=false;
      render();
    }
  }
  function javaPhaseChanged(detail={}){
    if(!session) return;
    const phase=detail.phase;
    if(phase==='run-requested'||phase==='compile-start'){
      moveToCompile();
      return;
    }
    if(phase==='compile-complete'){
      if(currentStep()?.phase==='compile'){
        waitForRunButton();
      }
      return;
    }
    if(phase==='compile-error'){
      stopWaitingForRun();
      if(currentStep()?.phase==='compile'){
        session.compileError=true;
        render();
      }
      return;
    }
    if(phase==='run-start'){
      // A run can begin from the compile step after the same click has
      // finished compiling. In that case the click handler already missed
      // one or more guide transitions. Consume every pending compile/RUN
      // step when execution really starts, so the guide cannot remain on
      // "Run the machine" while Byte is already moving.
      while(currentStep()?.phase==='compile'||currentStep()?.on==='run') session.stepIndex++;
      if(currentStep()?.runtime){
        session.runtimeCopy={
          kicker:'BYTE IS READY',
          title:'Watch the code become motion',
          body:'The glowing execution marker in Program.java will stay synchronized with Byte. Each physical movement starts from the Java line highlighted in the IDE.',
          button:'Watching Byte…',
          mode:'live',
          locked:true
        };
        render();
      }
      return;
    }
    if(phase==='run-complete'&&!detail.success&&currentStep()?.runtime){
      session.runtimeCopy={
        kicker:'BYTE · RUN STOPPED',
        title:'Let’s try that again',
        body:'Byte could not finish this run. Review the highlighted Java line and the machine message, correct the code, then press RUN again.',
        button:'Back to Program.java',
        mode:'error',
        locked:false,
        onError:true
      };
      render();
    }
  }
  function javaActionStarted(detail={}){
    if(session?.levelId!==1||!currentStep()?.runtime) return;
    const copy=levelOneRuntime[detail.event];
    if(!copy) return;
    session.actionCount=(session.actionCount||0)+1;
    session.runtimeCopy={...copy,kicker:`BYTE · MOVE ${session.actionCount}`,mode:'live',locked:true};
    if(Number.isFinite(+detail.executedPc)) window.ByteOfficeIDE?.highlightLine?.(+detail.executedPc);
    render();
  }
  function deferAutoCompile(){
    return false;
  }
  function advance(){
    if(!session) return;
    const step=currentStep();
    if(!step) return finish();
    if(step.phase==='compile'||step.runtime) return;
    if(!stepSatisfied(step)){
      const card=document.querySelector('#byteGuideCard'), feedback=card?.querySelector('.byte-guide-feedback');
      if(feedback) feedback.textContent=step.waiting||'Complete the highlighted step to continue.';
      card?.classList.remove('shake');void card?.offsetWidth;card?.classList.add('shake');
      return;
    }
    session.stepIndex++;
    if(session.stepIndex>=(guides[session.levelId]||[]).length) return finish();
    render();
  }
  function sourceChanged(){
    if(!session) return;
    const value=source(), step=currentStep();
    const enteredCount=step?.code?updateGuideCodeProgress(step.code,value):0;
    if(typingAdvanceTimer){
      if(stepSatisfied(step,value)) return;
      clearTimeout(typingAdvanceTimer);typingAdvanceTimer=0;
      document.querySelector('#byteGuideCard')?.classList.remove('typing-success');
    }
    if(step?.condition&&stepSatisfied(step,value)&&enteredCount){
      const sessionAtInput=session, stepIndexAtInput=session.stepIndex;
      const card=document.querySelector('#byteGuideCard');
      card?.classList.add('typing-success');
      const feedback=card?.querySelector('.byte-guide-feedback');
      if(feedback) feedback.textContent='Correct — nice work.';
      const successDelay=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:360;
      typingAdvanceTimer=setTimeout(()=>{
        typingAdvanceTimer=0;
        if(session!==sessionAtInput||session.stepIndex!==stepIndexAtInput||!stepSatisfied(currentStep())) return;
        let changed=false;
        while(currentStep()?.condition&&stepSatisfied(currentStep())){session.stepIndex++;changed=true;}
        if(changed) session.stepIndex>=(guides[session.levelId]||[]).length?finish():render();
      },successDelay);
      return;
    }
    let changed=false;
    while(currentStep()?.condition&&stepSatisfied(currentStep(),value)){session.stepIndex++;changed=true;}
    if(changed) session.stepIndex>=(guides[session.levelId]||[]).length?finish():render();
    else if(currentStep()?.condition){
      const feedback=document.querySelector('#byteGuideCard .byte-guide-feedback');
      if(feedback) feedback.textContent=currentStep().waiting||'Complete the highlighted step to continue.';
    }
  }
  function start(index){
    if(typingAdvanceTimer){clearTimeout(typingAdvanceTimer);typingAdvanceTimer=0;}
    const id=levels?.[index]?.id;
    if(!guides[id]){
      finish();
      return;
    }
    session={levelId:id,stepIndex:0};render();
    if(id===1){
      // Compile the untouched starter after the workspace and first guide
      // have painted. Background mode reports downloads in RUN and avoids
      // the full-page Java loading curtain used by later levels.
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(session?.levelId===1) window.ByteOfficeJava?.compile?.(false,{quiet:true,background:true}).catch?.(()=>{});
      }));
    }
  }
  function levelPassed(id){if(session?.levelId===id) finish();}

  document.addEventListener('input',event=>{if(event.target?.id==='javaEditor')sourceChanged();});
  document.addEventListener('pointerdown',event=>{
    if(!session||!currentStep()?.advanceOnIdeClick) return;
    if(!event.target?.closest?.('#byteMonaco,#javaEditor,.monaco-editor')) return;
    session.stepIndex++;
    session.stepIndex>=(guides[session.levelId]||[]).length?finish():render();
  },true);
  function handleRunGuideClick(event){
    if(session?.levelId===4&&currentStep()?.openApiPanel){
      const apiTile=event.target?.closest?.('.java-api-card');
      if(apiTile){
        // Guide every tile click toward the newly introduced addition API.
        event.preventDefault();
        event.stopImmediatePropagation();
        setTimeout(()=>{if(session?.levelId===4&&currentStep()?.openApiPanel) advance();},0);
        return;
      }
    }
    if(session?.levelId===4&&currentStep()?.openApiPanel&&event.target.closest('#commandTrayToggle')){
      setTimeout(()=>{if(session?.levelId===4&&currentStep()?.openApiPanel) advance();},0);
      return;
    }
    if(session?.levelId===4&&currentStep()?.openApi&&event.target.closest('.java-api-card')){
      finish();
      return;
    }
    if(!session?.levelId||!event.target.closest('#runBtn')) return;
    // Compilation can finish between the compiler event and the next paint.
    // If the user clicks RUN in that small window, recover the guide state
    // before the runner's click handler starts the program.
    if(currentStep()?.phase==='compile' && !window.byteOfficeCompiling && window.byteOfficeJavaPhase==='compile-complete'){
      session.stepIndex++;
      render();
    }
    if(currentStep()?.on==='run') advance();
  }
  // Run's own handler is async and can begin compiling before a bubbling
  // listener gets control. Capture the click first so a ready-to-run guide
  // step always leaves the card as soon as the user presses RUN.
  document.addEventListener('click',handleRunGuideClick,true);
  window.addEventListener('byteoffice-java-phase',event=>javaPhaseChanged(event.detail||{}));
  window.addEventListener('byteoffice-java-action',event=>javaActionStarted(event.detail||{}));
  window.addEventListener('byteoffice-ide-ready',()=>{
    if(!session) return;
    render();
    requestAnimationFrame(()=>position(true));
  });
  window.addEventListener('resize',()=>{if(session){cancelAnimationFrame(positionFrame);positionFrame=requestAnimationFrame(position);}});
  window.addEventListener('scroll',()=>{if(session){cancelAnimationFrame(positionFrame);positionFrame=requestAnimationFrame(position);}},true);

  const originalLoadLevel=window.loadLevel;
  if(typeof originalLoadLevel==='function'){
    window.loadLevel=function(index){
      originalLoadLevel.apply(this,arguments);
      start(index);
    };
  }
  window.ByteOfficeTutorial={start,levelPassed,deferAutoCompile};
})();
