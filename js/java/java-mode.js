(function(){
  'use strict';

  const JAVA_MODE_VERSION='1.0.0';

  const BYTEBOT_SOURCE=String.raw`package byteoffice;

public final class ByteBot {
    private int currentSourceLine = -1;

    public ByteBot __byteOfficeSourceLine(int line) { currentSourceLine = line; return this; }

    private static native int nTake(int line);
    private static native int nSend(int line);
    private static native int nCopyTo(int slot, int line);
    private static native int nCopyFrom(int slot, int line);
    private static native int nPlace(int slot, int line);
    private static native int nPick(int slot, int line);
    private static native int nAdd(int slot, int line);
    private static native int nSubtract(int slot, int line);
    private static native boolean nHasNext(int line);
    private static native boolean nIsZero(int line);
    private static native boolean nIsNegative(int line);
    private static native boolean nIsHolding(int line);
    private static native int nMemorySize(int line);
    private static native boolean nIsEmpty(int slot, int line);

    private static void check(int code) {
        switch (code) {
            case 0: return;
            case 1: throw new IllegalStateException("INPUT is empty.");
            case 2: throw new IllegalStateException("Byte is not holding a box.");
            case 3: throw new IndexOutOfBoundsException("That floor-memory slot does not exist on this level.");
            case 4: throw new IllegalStateException("That floor-memory slot is empty.");
            case 5: throw new IllegalStateException("Safety stop: too many ByteBot actions. Possible infinite loop.");
            case 6: throw new IllegalStateException("The last OUTBOX value does not match the assignment.");
            case 7: throw new IllegalStateException("Execution was stopped by the player.");
            default: throw new IllegalStateException("ByteBot runtime error " + code + ".");
        }
    }

    public void take() { check(nTake(currentSourceLine)); }
    public void send() { check(nSend(currentSourceLine)); }
    public void copyTo(int slot) { check(nCopyTo(slot, currentSourceLine)); }
    public void copyFrom(int slot) { check(nCopyFrom(slot, currentSourceLine)); }
    public void place(int slot) { check(nPlace(slot, currentSourceLine)); }
    public void pick(int slot) { check(nPick(slot, currentSourceLine)); }
    public void add(int slot) { check(nAdd(slot, currentSourceLine)); }
    public void subtract(int slot) { check(nSubtract(slot, currentSourceLine)); }

    public boolean hasNext() { return nHasNext(currentSourceLine); }
    public boolean isZero() { return nIsZero(currentSourceLine); }
    public boolean isNegative() { return nIsNegative(currentSourceLine); }
    public boolean isHolding() { return nIsHolding(currentSourceLine); }
    public int memorySize() { return nMemorySize(currentSourceLine); }
    public boolean isEmpty(int slot) { return nIsEmpty(slot, currentSourceLine); }
}
`;

  const RUNNER_SOURCE=String.raw`package byteoffice;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public final class GameRunner {
    public static void main(String[] args) throws Exception {
        Class<?> programClass = Class.forName("Program");
        Object instance = programClass.getDeclaredConstructor().newInstance();
        Method program = programClass.getMethod("program", ByteBot.class);
        try {
            program.invoke(instance, new ByteBot());
        } catch (InvocationTargetException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof Exception) throw (Exception) cause;
            if (cause instanceof Error) throw (Error) cause;
            throw ex;
        }
    }
}
`;

  function starterSource(){
    return `import byteoffice.ByteBot;\n\npublic class Program {\n    public void program(ByteBot bot) {\n        // Write your Java here. ByteOffice calls this method for you.\n        \n    }\n}\n`;
  }

  let javaMachine=null;
  let expectedOutput=[];
  let javaRuntimePromise=null;
  let compiledSource=null;
  let execution=null;
  let headless=false;
  let activeJavaLine=-1;
  let runtimeMessage='Java JVM not loaded';
  let lastCompileMs=null;
  let lastRunMs=null;
  let runStartedAt=null;
  let editTimer=null;
  let compileTimer=null;
  let compileJob=null;
  let lastCompileDiagnostics='';
  const javaUndo=[];
  const javaRedo=[];

  function sourceFromProgram(){
    const entry=Array.isArray(program) ? program.find(x=>x&&x.op==='JAVA'&&typeof x.source==='string') : null;
    return entry ? entry.source : starterSource();
  }
  function assignSource(source){ program=[{op:'JAVA',source:String(source)}]; }
  function sourceLines(){ return sourceFromProgram().split(/\r?\n/); }
  function instrumentJavaSource(source){
    const methods='take|send|copyTo|copyFrom|place|pick|add|subtract|hasNext|isZero|isNegative|isHolding|memorySize|isEmpty';
    // Discover every ByteBot variable, not just the required program
    // parameter named `bot`. This also covers local ByteBot objects and
    // helper-method parameters.
    const names=new Set(['bot']);
    const declaration=/\b(?:byteoffice\s*\.\s*)?ByteBot\s+([A-Za-z_$][\w$]*)/g;
    let declarationMatch;
    while((declarationMatch=declaration.exec(source))) names.add(declarationMatch[1]);
    const receiver=Array.from(names).sort((a,b)=>b.length-a.length).map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    const call=new RegExp('((?:this\\.)?(?:'+receiver+'))\\s*\\.\\s*(?:'+methods+')\\s*\\(','y');
    let blockComment=false;
    return source.split(/(\r?\n)/).map((part,index,parts)=>{
      if(/^\r?\n$/.test(part)) return part;
      const lineNumber=parts.slice(0,index).filter(x=>/^\r?\n$/.test(x)).length+1;
      let out='',i=0,stringQuote='';
      while(i<part.length){
        if(blockComment){
          const end=part.indexOf('*/',i);
          if(end<0){out+=part.slice(i);return out;}
          out+=part.slice(i,end+2);i=end+2;blockComment=false;continue;
        }
        const ch=part[i];
        if(stringQuote){
          out+=ch;i++;
          if(ch==='\\'&&i<part.length){out+=part[i++];continue;}
          if(ch===stringQuote) stringQuote='';
          continue;
        }
        if(ch==='"'||ch==="'"){stringQuote=ch;out+=ch;i++;continue;}
        if(ch==='/'&&part[i+1]==='/'){out+=part.slice(i);break;}
        if(ch==='/'&&part[i+1]==='*'){out+='/*';i+=2;blockComment=true;continue;}
        call.lastIndex=i;
        const match=call.exec(part);
        if(match){
          const receiverText=match[1];
          const methodStart=match[0].indexOf('.',receiverText.length)+1;
          out+=receiverText+'.__byteOfficeSourceLine('+lineNumber+').'+match[0].slice(methodStart);
          i=call.lastIndex;
          continue;
        }
        out+=ch;i++;
      }
      return out;
    }).join('');
  }
  function botCallCount(){
    const m=sourceFromProgram().match(/\bbot\s*\.\s*(?:take|send|copyTo|copyFrom|place|pick|add|subtract)\s*\(/g);
    return m ? m.length : 0;
  }

  window.cloneProgram=function(){ return [{op:'JAVA',source:sourceFromProgram()}]; };

  window.commitEdit=function(){
    const src=sourceFromProgram();
    if(javaUndo[javaUndo.length-1]!==src) javaUndo.push(src);
    if(javaUndo.length>80) javaUndo.shift();
    javaRedo.length=0;
    updateEditorButtons();
  };
  window.restoreProgram=function(next){
    stopRun();
    const src=Array.isArray(next)&&next[0]?.source ? next[0].source : starterSource();
    assignSource(src); renderProgram(); resetMachine(false);
  };
  window.undoEdit=function(){
    if(animating||!javaUndo.length) return;
    const current=sourceFromProgram();
    const prev=javaUndo.pop();
    javaRedo.push(current);
    assignSource(prev); renderProgram(); resetMachine(false); updateEditorButtons();
  };
  window.redoEdit=function(){
    if(animating||!javaRedo.length) return;
    const current=sourceFromProgram();
    const next=javaRedo.pop();
    javaUndo.push(current);
    assignSource(next); renderProgram(); resetMachine(false); updateEditorButtons();
  };
  window.updateEditorButtons=function(){
    if(els.undo) els.undo.disabled=!javaUndo.length;
    if(els.redo) els.redo.disabled=!javaRedo.length;
    if(els.compact){ els.compact.disabled=false; els.compact.textContent='Format'; }
  };

  function updateLineNumbers(){
    const ta=document.querySelector('#javaEditor');
    const gutter=document.querySelector('#javaLineNumbers');
    if(!ta||!gutter) return;
    const n=Math.max(1,ta.value.split(/\r?\n/).length);
    gutter.innerHTML=Array.from({length:n},(_,i)=>`<span data-java-line="${i+1}">${i+1}</span>`).join('');
    gutter.scrollTop=ta.scrollTop;
    highlightJavaLine(activeJavaLine);
  }

  function updateJavaStatus(text,kind='idle'){
    runtimeMessage=text;
    const el=document.querySelector('#javaRuntimeStatus');
    if(el){ el.textContent=text; el.dataset.kind=kind; }
  }

  function formatDuration(ms){
    if(!Number.isFinite(ms)) return '—';
    return ms<1000 ? `${Math.round(ms)} ms` : `${(ms/1000).toFixed(2)} s`;
  }

  function updateTimingStatus(phase=''){
    const el=document.querySelector('#ideTiming');
    if(!el) return;
    const compile=phase==='compile'?'Compile …':`Compile ${formatDuration(lastCompileMs)}`;
    const run=phase==='run'?'Run …':`Run ${formatDuration(lastRunMs)}`;
    el.textContent=`${compile} · ${run}`;
    el.title=`Last compile: ${formatDuration(lastCompileMs)} · Last run: ${formatDuration(lastRunMs)}`;
  }

  function highlightJavaLine(line){
    activeJavaLine=Number.isFinite(+line)?+line:-1;
    const gutter=document.querySelector('#javaLineNumbers');
    const ta=document.querySelector('#javaEditor');
    if(!gutter) return;
    gutter.querySelectorAll('.active-java-line').forEach(x=>x.classList.remove('active-java-line'));
    const marker=gutter.querySelector(`[data-java-line="${activeJavaLine}"]`);
    if(marker){
      marker.classList.add('active-java-line');
      marker.scrollIntoView({block:'nearest'});
      if(ta){
        const lineHeight=parseFloat(getComputedStyle(ta).lineHeight)||20;
        const target=Math.max(0,(activeJavaLine-3)*lineHeight);
        if(target<ta.scrollTop || target>ta.scrollTop+ta.clientHeight-lineHeight*4) ta.scrollTop=target;
        gutter.scrollTop=ta.scrollTop;
      }
    }
  }
  window.highlightLine=highlightJavaLine;

  window.renderProgram=function(){
    clearOperandTargeting?.();
    if(!Array.isArray(program)||!program.length||program[0]?.op!=='JAVA') assignSource(starterSource());
    if(!els.list) return;
    const source=sourceFromProgram();
    els.list.classList.add('java-program-list');
    els.list.innerHTML=`<div class="java-editor-shell">
      <div class="java-editor-topline"><span>Program.java</span><span class="java-runtime-pill" id="javaRuntimeStatus" data-kind="idle">${escapeHtml(runtimeMessage)}</span></div>
      <div class="java-editor-body"><pre class="java-line-numbers" id="javaLineNumbers" aria-hidden="true"></pre><textarea id="javaEditor" class="java-editor" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Java source code"></textarea></div>
    </div>`;
    const ta=document.querySelector('#javaEditor');
    ta.value=source;
    updateTimingStatus();
    updateLineNumbers();
    ta.addEventListener('scroll',()=>{ const g=document.querySelector('#javaLineNumbers'); if(g)g.scrollTop=ta.scrollTop; });
    ta.addEventListener('keydown',e=>{
      if(e.key==='Tab'){
        e.preventDefault();
        const start=ta.selectionStart,end=ta.selectionEnd;
        ta.setRangeText('    ',start,end,'end');
        ta.dispatchEvent(new Event('input',{bubbles:true}));
      }
    });
    ta.addEventListener('input',()=>{
      const old=sourceFromProgram();
      assignSource(ta.value);
      compiledSource=null;
      updateLineNumbers();
      if(els.size) els.size.textContent=botCallCount();
      if(editTimer) clearTimeout(editTimer);
      editTimer=setTimeout(()=>{
        if(javaUndo[javaUndo.length-1]!==old) javaUndo.push(old);
        if(javaUndo.length>80) javaUndo.shift();
        javaRedo.length=0;
        saveWorkspace(); updateEditorButtons();
      },300);
      scheduleCompile();
    });
    if(els.size) els.size.textContent=botCallCount();
    updateEditorButtons();
    setAnswerModeControls?.(false);
    const answerTab=document.querySelector('.answer-tab'); if(answerTab) answerTab.hidden=true;
  };

  window.renderPalette=function(){
    if(!els.palette) return;
    const methods=[
      ['bot.take()','Take the next INPUT box into Byte\'s hands. Returns void.'],
      ['bot.send()','Move the held box to OUTPUT. Returns void.'],
      ['bot.copyTo(slot)','Copy the held box to a floor slot; Byte keeps holding it.'],
      ['bot.copyFrom(slot)','Copy a floor box into Byte\'s hands.'],
      ['bot.place(slot)','Move the held box onto a floor slot; hands become empty.'],
      ['bot.pick(slot)','Move a floor box into Byte\'s hands; that slot becomes empty.'],
      ['bot.add(slot)','Add a floor value to the held value without exposing either value.'],
      ['bot.subtract(slot)','Subtract a floor value from the held value.'],
      ['bot.hasNext()','Safe boolean: whether INPUT still has a box.'],
      ['bot.isZero()','Safe boolean test for the currently held value.'],
      ['bot.isNegative()','Safe boolean test for the currently held value.'],
      ['bot.isHolding()','Whether Byte currently holds a box.'],
      ['bot.memorySize()','Number of physical floor slots in this level.'],
      ['bot.isEmpty(slot)','Whether a physical floor slot is empty.']
    ];
    els.palette.innerHTML=methods.map(([sig,desc])=>`<button type="button" class="command-card java-api-card" data-java-snippet="${escapeHtml(sig)}"><strong>${escapeHtml(sig)}</strong><span>${escapeHtml(desc)}</span></button>`).join('');
    els.palette.querySelectorAll('[data-java-snippet]').forEach(btn=>btn.addEventListener('click',()=>{
      const ta=document.querySelector('#javaEditor'); if(!ta) return;
      const snippet=btn.dataset.javaSnippet+';';
      const start=ta.selectionStart,end=ta.selectionEnd;
      ta.setRangeText(snippet,start,end,'end'); ta.focus(); ta.dispatchEvent(new Event('input',{bubbles:true}));
    }));
  };

  window.refreshWorkspaceTabs=function(){
    const bucket=workspaceBucket(level().id);
    els.workspaceTabs.forEach(tab=>{
      if(tab.dataset.workspace==='answer'){ tab.hidden=true; return; }
      const slot=parseInt(tab.dataset.workspace,10);
      const active=slot===workspaceIndex;
      tab.classList.toggle('active',active); tab.setAttribute('aria-selected',active?'true':'false');
      const entry=bucket.slots[slot]?.find?.(x=>x?.op==='JAVA');
      const has=!!entry?.source?.trim();
      tab.classList.toggle('has-code',has);
      const span=tab.querySelector('span'); if(span) span.textContent=`Solution ${slot+1}`;
    });
  };

  window.switchWorkspace=function(next){
    if(animating||next==='answer') return;
    next=clamp(parseInt(next,10),0,WORKSPACE_COUNT-1);
    if(next===workspaceIndex) return;
    saveWorkspace(false); stopRun(); workspaceIndex=next;
    const bucket=workspaceBucket(level().id); bucket.active=workspaceIndex;
    program=(bucket.slots[workspaceIndex]||[]).map(x=>({...x}));
    if(!program.some(x=>x?.op==='JAVA' && typeof x.source==='string' && x.source.trim())) assignSource(starterSource());
    javaUndo.length=0; javaRedo.length=0; compiledSource=null; activeJavaLine=-1;
    renderProgram(); resetMachine(false); refreshWorkspaceTabs(); saveWorkspace();
    els.footer.textContent=`Java worktree ${String.fromCharCode(65+workspaceIndex)} loaded. Changes save automatically.`;
  };

  function machineSnapshot(extra={}){
    const m=javaMachine||{input:[],output:[],memory:[],held:null,steps:0};
    return {input:[...m.input],output:[...m.output],memory:[...m.memory],held:m.held,steps:m.steps,pc:m.lastLine||-1,halted:!!m.halted,error:m.error||null,...extra};
  }

  function resetJavaState(input=level().input){
    javaMachine={input:[...input],output:[],memory:Array.from({length:level().memory},()=>null),held:null,steps:0,lastLine:-1,halted:false,error:null,cancelled:false};
    expectedOutput=[...(level().output||[])];
    return machineSnapshot();
  }

  function validSlot(slot){ return Number.isInteger(slot)&&slot>=0&&slot<javaMachine.memory.length; }
  function actionError(code,message,line){
    javaMachine.halted=true; javaMachine.error=message; javaMachine.lastLine=line;
    if(!headless){ setStatus('ERROR','error'); els.footer.textContent=message; updateJavaStatus('Runtime error','error'); }
    return code;
  }

  async function waitForExecutionPermit(){
    if(!execution) return;
    if(execution.cancelled) return;
    if(execution.mode==='run') return;
    if(execution.permits>0){ execution.permits--; return; }
    await new Promise(resolve=>execution.waiters.push(resolve));
  }

  function releaseExecution(count=1){
    if(!execution) return;
    execution.permits+=count;
    while(execution.waiters.length && (execution.mode==='run'||execution.permits>0)){
      if(execution.mode!=='run') execution.permits--;
      const resolve=execution.waiters.shift(); resolve();
    }
  }

  async function performAction(op,arg,line){
    const actionExecution=execution;
    await waitForExecutionPermit();
    if(!javaMachine||javaMachine.cancelled||!actionExecution||actionExecution.cancelled||execution!==actionExecution) return 7;
    if(javaMachine.halted) return 7;
    line=Number.isFinite(+line)?+line:-1;
    javaMachine.lastLine=line;
    if(!headless) highlightJavaLine(line);
    if(javaMachine.steps>=1500) return actionError(5,'Safety stop: your Java program performed more than 1500 ByteBot actions.',line);

    const before=machineSnapshot();
    let event='execute', code=0, message='';
    const slot=Number(arg);
    javaMachine.steps++;

    if(op==='READ'){
      if(!javaMachine.input.length){ javaMachine.steps--; return actionError(1,'INPUT is empty.',line); }
      javaMachine.held=javaMachine.input.shift(); event='read';
    }else if(op==='WRITE'){
      if(javaMachine.held===null) return actionError(2,'Byte cannot send: his hands are empty.',line);
      javaMachine.output.push(javaMachine.held); javaMachine.held=null; event='write';
    }else if(['STORE','LOAD','PLACE','TAKE','ADD','SUB'].includes(op)){
      if(!validSlot(slot)) return actionError(3,`Floor slot ${slot} does not exist. This level has ${javaMachine.memory.length} slot${javaMachine.memory.length===1?'':'s'}.`,line);
      if(['STORE','PLACE','ADD','SUB'].includes(op)&&javaMachine.held===null) return actionError(2,`${op} needs a box in Byte's hands.`,line);
      if(['LOAD','TAKE','ADD','SUB'].includes(op)&&javaMachine.memory[slot]===null) return actionError(4,`Floor slot ${slot} is empty.`,line);
      if(op==='STORE'){ javaMachine.memory[slot]=javaMachine.held; event='store'; }
      if(op==='LOAD'){ javaMachine.held=javaMachine.memory[slot]; event='load'; }
      if(op==='PLACE'){ javaMachine.memory[slot]=javaMachine.held; javaMachine.held=null; event='place'; }
      if(op==='TAKE'){ javaMachine.held=javaMachine.memory[slot]; javaMachine.memory[slot]=null; event='take'; }
      if(op==='ADD'){ javaMachine.held+=javaMachine.memory[slot]; event='math'; }
      if(op==='SUB'){ javaMachine.held-=javaMachine.memory[slot]; event='math'; }
    }

    const after=machineSnapshot();
    if(!headless){
      const transition={status:'ok',event,before,after,executedPc:line,instruction:{op,arg:slot}};
      animating=true;
      try{ await animateTransition(transition); } finally { animating=false; }
    }

    // A tab change/reset may have cancelled this Java session while the
    // physical animation was still finishing. Never continue the old action
    // against the newly reset machine.
    if(!javaMachine||javaMachine.cancelled||actionExecution.cancelled||execution!==actionExecution) return 7;

    if(event==='write'){
      const i=javaMachine.output.length-1;
      if(i>=expectedOutput.length || javaMachine.output[i]!==expectedOutput[i]){
        const got=javaMachine.output[i], exp=i<expectedOutput.length?expectedOutput[i]:null;
        javaMachine.halted=true;
        javaMachine.error=exp===null?`Unexpected extra OUTPUT value ${got}.`:`Wrong OUTPUT value ${got}; expected ${exp}.`;
        if(!headless){
          await wrongOutputFeedback({index:i,got,expected:exp,extra:exp===null});
          updateJavaStatus('Wrong output','error');
        }
        code=6;
      }
    }
    return code;
  }

  function safeBoolLine(line){
    if(!javaMachine||javaMachine.cancelled||execution?.cancelled) return false;
    javaMachine.lastLine=Number(line)||-1;
    if(!headless) highlightJavaLine(javaMachine.lastLine);
    return true;
  }

  const natives={
    async Java_byteoffice_ByteBot_nTake(lib,line){ return performAction('READ',null,line); },
    async Java_byteoffice_ByteBot_nSend(lib,line){ return performAction('WRITE',null,line); },
    async Java_byteoffice_ByteBot_nCopyTo(lib,slot,line){ return performAction('STORE',Number(slot),line); },
    async Java_byteoffice_ByteBot_nCopyFrom(lib,slot,line){ return performAction('LOAD',Number(slot),line); },
    async Java_byteoffice_ByteBot_nPlace(lib,slot,line){ return performAction('PLACE',Number(slot),line); },
    async Java_byteoffice_ByteBot_nPick(lib,slot,line){ return performAction('TAKE',Number(slot),line); },
    async Java_byteoffice_ByteBot_nAdd(lib,slot,line){ return performAction('ADD',Number(slot),line); },
    async Java_byteoffice_ByteBot_nSubtract(lib,slot,line){ return performAction('SUB',Number(slot),line); },
    Java_byteoffice_ByteBot_nHasNext(lib,line){ safeBoolLine(line); return !!javaMachine&&!javaMachine.halted&&javaMachine.input.length>0; },
    Java_byteoffice_ByteBot_nIsZero(lib,line){ safeBoolLine(line); return !!javaMachine&&javaMachine.held===0; },
    Java_byteoffice_ByteBot_nIsNegative(lib,line){ safeBoolLine(line); return !!javaMachine&&javaMachine.held!==null&&javaMachine.held<0; },
    Java_byteoffice_ByteBot_nIsHolding(lib,line){ safeBoolLine(line); return !!javaMachine&&javaMachine.held!==null; },
    Java_byteoffice_ByteBot_nMemorySize(lib,line){ safeBoolLine(line); return javaMachine?javaMachine.memory.length:0; },
    Java_byteoffice_ByteBot_nIsEmpty(lib,slot,line){ safeBoolLine(line); slot=Number(slot); return !javaMachine||!validSlot(slot)||javaMachine.memory[slot]===null; }
  };

  async function ensureJavaRuntime(){
    if(javaRuntimePromise) return javaRuntimePromise;
    javaRuntimePromise=(async()=>{
      updateJavaStatus('Loading Java 8 JVM…','loading');
      if(typeof cheerpjInit!=='function') throw new Error('CheerpJ loader is unavailable. Serve ByteOffice over HTTP/HTTPS and check your connection.');
      await cheerpjInit({version:8,status:'none',natives});
      updateJavaStatus('Java compiler ready','ready');
      return true;
    })().catch(err=>{
      javaRuntimePromise=null;
      updateJavaStatus('JVM failed','error');
      throw err;
    });
    return javaRuntimePromise;
  }

  function mountSources(source){
    cheerpOSAddStringFile('/str/Program.java',source);
    cheerpOSAddStringFile('/str/byteoffice/ByteBot.java',BYTEBOT_SOURCE);
    cheerpOSAddStringFile('/str/byteoffice/GameRunner.java',RUNNER_SOURCE);
  }

  function compilerMessage(args){
    return args.map(value=>{
      if(typeof value==='string') return value;
      if(value&&typeof value.message==='string') return value.message;
      try{return JSON.stringify(value);}catch(_){return String(value);}
    }).join(' ');
  }

  function looksLikeCompilerDiagnostic(text){
    return /(?:Program\.java|error:|warning:|expected|found|illegal|cannot find symbol|\^\s*$)/im.test(text);
  }

  async function runJavaCompiler(){
    const original={log:console.log,warn:console.warn,error:console.error};
    const diagnostics=[];
    const capture=(method)=>(...args)=>{
      const text=compilerMessage(args);
      if(text&&looksLikeCompilerDiagnostic(text)) diagnostics.push(text);
      else original[method].apply(console,args);
    };
    console.log=capture('log');
    console.warn=capture('warn');
    console.error=capture('error');
    try{
      const exit=await cheerpjRunMain(
        'com.sun.tools.javac.Main',
        '/app/java/tools.jar:/files/',
        '-g:lines,source','-d','/files',
        '/str/byteoffice/ByteBot.java','/str/byteoffice/GameRunner.java','/str/Program.java'
      );
      return {exit,diagnostics:[...new Set(diagnostics)].join('\n')};
    }finally{
      console.log=original.log;
      console.warn=original.warn;
      console.error=original.error;
    }
  }

  function finishCompileFailure(startedAt,diagnostics,quiet=false){
    lastCompileMs=performance.now()-startedAt;
    lastCompileDiagnostics=String(diagnostics||'').trim()||'The Java compiler rejected Program.java. Check the source and try again.';
    updateTimingStatus();
    compiledSource=null;
    if(quiet){
      setStatus('READY','ready');
      updateJavaStatus('Editing · compile on Run','idle');
      els.footer.textContent='Java source changed. Click RUN to check compilation.';
      return false;
    }
    updateJavaStatus('Compile error','error');
    setStatus('COMPILE ERROR','error');
    els.footer.textContent='Java compilation failed. Fix the compiler errors, then run again.';
    return false;
  }

  async function compileSource(source,{quiet=false}={}){
    const startedAt=performance.now();
    updateTimingStatus('compile');
    try{
      await ensureJavaRuntime();
      updateJavaStatus('Compiling Program.java…','loading');
      els.footer.textContent='Compiling your Java source inside the browser…';
      mountSources(instrumentJavaSource(source));
      const result=await runJavaCompiler();
      if(result.exit!==0) return finishCompileFailure(startedAt,result.diagnostics,quiet);
      lastCompileMs=performance.now()-startedAt;
      lastCompileDiagnostics='';
      updateTimingStatus();
      if(sourceFromProgram()===source) compiledSource=source;
      setStatus('READY','ready');
      updateJavaStatus('Compiled · Java 8','ready');
      els.footer.textContent='Java compiled successfully. Ready to run ByteBot.';
      return true;
    }catch(err){
      return finishCompileFailure(startedAt,err?.message||String(err),quiet);
    }
  }

  function showCompileErrorPopup(diagnostics){
    const detail=String(diagnostics||lastCompileDiagnostics||'Compilation failed.').trim();
    showModal(`<div class="java-compile-error-sheet">
      <div class="java-compile-error-kicker">JAVA COMPILER</div>
      <h2>Program cannot run</h2>
      <p>Fix the compilation errors below, then click RUN again.</p>
      <div class="java-compile-error-status">COMPILATION FAILED</div>
      <pre>${escapeHtml(detail)}</pre>
      <button type="button" class="modal-primary java-compile-error-close" id="javaCompileErrorClose">Back to Program.java</button>
    </div>`);
    const modal=document.querySelector('#modal');
    modal?.classList.add('java-compile-error-modal');
    document.querySelector('#javaCompileErrorClose')?.addEventListener('click',()=>{
      closeModal();
      window.ByteOfficeIDE?.focus?.();
    },{once:true});
  }

  async function compileCurrentSource(force=false,{showError=false}={}){
    const source=sourceFromProgram();
    if(!force && compiledSource===source){ updateTimingStatus(); return true; }
    if(compileJob){
      const result=await compileJob;
      if(sourceFromProgram()!==source) return compileCurrentSource(false,{showError});
      if(!result&&showError) showCompileErrorPopup(lastCompileDiagnostics);
      return result;
    }
    const job=compileSource(source,{quiet});
    compileJob=job;
    let result=false;
    try{ result=await job; }
    finally{ if(compileJob===job) compileJob=null; }
    if(sourceFromProgram()!==source) return compileCurrentSource(false,{showError});
    if(!result&&showError) showCompileErrorPopup(lastCompileDiagnostics);
    return result;
  }

  function scheduleCompile(delay=650){
    if(compileTimer) clearTimeout(compileTimer);
    compileTimer=setTimeout(async()=>{
      compileTimer=null;
      try{
        const pending=window.stopRun?.();
        if(pending&&typeof pending.then==='function') await pending;
        await compileCurrentSource(false,{quiet:true});
      }catch(err){
        setStatus('READY','ready');
        updateJavaStatus('Editing · compile on Run','idle');
        els.footer.textContent='Java source changed. Click RUN to check compilation.';
      }
    },Math.max(0,Number(delay)||0));
  }

  async function finishExecution(exitCode){
    if(!execution) return;
    if(runStartedAt!==null){ lastRunMs=performance.now()-runStartedAt; runStartedAt=null; updateTimingStatus(); }
    const wasCancelled=execution.cancelled;
    execution.task=null;
    running=false;
    if(wasCancelled) return;
    if(exitCode!==0 || javaMachine?.error){
      setStatus('JAVA ERROR','error');
      if(!javaMachine?.error) els.footer.textContent='Your Java program stopped with an exception. Check the browser Java console for the stack trace.';
      updateJavaStatus('Program stopped','error');
      return;
    }
    if(!javaMachine) return;
    if(sameArray(javaMachine.output,expectedOutput)){
      await successFeedback();
      if(!completed.includes(level().id)) completed.push(level().id);
      localStorage.setItem('byteOfficeCompletedV17',JSON.stringify(completed));
      const m=levelMeta();
      m.clears=(m.clears||0)+1;
      const calls=botCallCount();
      m.bestSize=m.bestSize===null?calls:Math.min(m.bestSize,calls);
      m.bestSteps=m.bestSteps===null?javaMachine.steps:Math.min(m.bestSteps,javaMachine.steps);
      metaStore.totalClears=(metaStore.totalClears||0)+1; saveMeta();
      refreshHome?.();
      els.footer.textContent=`Passed with real Java · ${javaMachine.steps} ByteBot actions.`;
      updateJavaStatus('Level passed','success');
    }else{
      setStatus('INCOMPLETE','error');
      els.footer.textContent=`Program finished, but OUTPUT is [${javaMachine.output.join(', ')}]. Expected [${expectedOutput.join(', ')}].`;
      updateJavaStatus('Output incomplete','error');
    }
  }

  async function launchJava(mode='run'){
    if(execution?.task){
      execution.mode=mode;
      running=mode==='run';
      if(mode==='run') releaseExecution(1000000); else releaseExecution(1);
      setStatus(mode==='run'?'WORKING':'STEP','working');
      return execution.task;
    }
    if(!(await compileCurrentSource(false,{showError:true}))) return null;
    resetJavaState(level().input);
    resetPhysicalScene(machineSnapshot());
    recordRunStart?.();
    execution={mode,permits:mode==='step'?1:0,waiters:[],cancelled:false,task:null};
    running=mode==='run';
    setStatus(mode==='run'?'WORKING':'STEP','working');
    updateJavaStatus('Program running','working');
    runStartedAt=performance.now();
    updateTimingStatus('run');
    const task=cheerpjRunMain('byteoffice.GameRunner','/files');
    execution.task=task;
    task.then(finishExecution).catch(err=>{
      if(execution?.cancelled) return;
      if(runStartedAt!==null){ lastRunMs=performance.now()-runStartedAt; runStartedAt=null; updateTimingStatus(); }
      running=false; setStatus('JAVA ERROR','error'); updateJavaStatus('Java exception','error');
      els.footer.textContent='Java execution failed: '+(err?.message||String(err));
    });
    return task;
  }

  window.startRun=function(){
    if(animating) return;
    launchJava('run').catch(err=>{ setStatus('JAVA ERROR','error'); updateJavaStatus('Runtime failed','error'); els.footer.textContent=err.message; });
  };
  window.stepOnce=async function(){
    if(animating) return false;
    try{ await launchJava('step'); return true; }
    catch(err){ setStatus('JAVA ERROR','error'); updateJavaStatus('Runtime failed','error'); els.footer.textContent=err.message; return false; }
  };
  window.pause=function(){
    if(!execution?.task) return;
    execution.mode='pause'; running=false; setStatus('PAUSED','paused'); updateJavaStatus('Paused at next ByteBot call','paused');
    els.footer.textContent='Java execution paused. STEP executes one ByteBot action; RUN continues.';
  };
  window.stopRun=function(){
    const pending=execution?.task;
    running=false;
    if(execution){
      execution.cancelled=true; execution.mode='run';
      javaMachine && (javaMachine.cancelled=true);
      while(execution.waiters.length) execution.waiters.shift()();
    }
    execution=null;
    return pending&&typeof pending.then==='function' ? Promise.resolve(pending).catch(()=>{}) : Promise.resolve();
  };

  window.resetMachine=function(message=true){
    stopRun(); animating=false; activeJavaLine=-1; clearTransientBoxes?.();
    const snap=resetJavaState(level().input);
    resetPhysicalScene(snap); setStatus('READY','ready'); clearActive?.(); placeWorkerHome(true); setPose('');
    updateJavaStatus(javaRuntimePromise?'Java ready':'Java JVM not loaded',javaRuntimePromise?'ready':'idle');
    if(message) els.footer.textContent='Machine reset. Your Java program is ready.';
  };

  async function runHeadlessJava(input,output){
    resetJavaState(input); expectedOutput=[...output]; headless=true;
    execution={mode:'run',permits:0,waiters:[],cancelled:false,task:null};
    try{
      const exit=await cheerpjRunMain('byteoffice.GameRunner','/files');
      return {output:[...javaMachine.output],steps:javaMachine.steps,error:javaMachine.error,exit};
    }finally{ headless=false; execution=null; }
  }

  window.showTestLab=async function(){
    try{
      if(!(await compileCurrentSource())) return;
      const examples=level().examples||[{input:level().input,output:level().output}];
      const results=[];
      for(const ex of examples.slice(0,2)) results.push(await runHeadlessJava(ex.input,ex.output));
      const rows=results.map((r,i)=>{
        const ex=examples[i], ok=r.exit===0&&!r.error&&sameArray(r.output,ex.output);
        return `<div class="test-case ${ok?'pass':'fail'}"><div class="test-case-head"><b>${ok?'✓ PASS':'✕ FAIL'} · Example ${i+1}</b><span>${r.steps} bot actions</span></div><small>IN</small><code>[${ex.input.join(', ')}]</code><small>EXPECTED</small><code>[${ex.output.join(', ')}]</code><small>GOT</small><code>[${r.output.join(', ')}]</code>${r.error?`<p>${escapeHtml(r.error)}</p>`:''}</div>`;
      }).join('');
      showModal(`<div class="modal-heading"><span>JAVA QA LAB</span><h2>Compiled Test Suite</h2><p>Your Program.java was compiled once and executed by the browser JVM against the level examples.</p></div><div class="test-grid">${rows}</div>`);
      resetMachine(false);
    }catch(err){ setStatus('JAVA ERROR','error'); els.footer.textContent=err.message; }
  };

  window.analyzeProgram=async function(){
    try{
      const ok=await compileCurrentSource(true);
      if(!ok) return;
      showModal(`<div class="modal-heading"><span>JAVA COMPILER</span><h2>Program.java builds successfully</h2><p>Full Java 8 source is accepted. The puzzle restriction is enforced only by the ByteBot boundary: box values are never returned to Java.</p></div><div class="analysis-block"><h3>Physical ByteBot memory</h3><ul><li>This level exposes ${level().memory} floor slot${level().memory===1?'':'s'}.</li><li>Byte can hold one box at a time.</li><li><code>take()</code>, <code>send()</code>, <code>copyTo()</code>, <code>copyFrom()</code>, <code>place()</code>, <code>pick()</code>, <code>add()</code>, and <code>subtract()</code> never return box values.</li><li>Your own Java variables, methods, classes, arrays, collections, recursion, and standard Java syntax remain available.</li></ul></div>`);
    }catch(err){ els.footer.textContent=err.message; }
  };

  window.showShare=function(){
    const payload=JSON.stringify({game:'Byte Office Java',version:1,level:level().id,source:sourceFromProgram()},null,2);
    showModal(`<div class="modal-heading"><span>PROGRAM PORT</span><h2>Share Java Solution</h2><p>Copy the full Program.java source package, or paste another exported source package below.</p></div><textarea id="shareData" class="share-data" spellcheck="false">${escapeHtml(payload)}</textarea><div class="share-actions"><button id="copyProgramBtn" class="modal-primary">Copy JSON</button><button id="importProgramBtn" class="paper-button">Import JSON</button></div><div id="shareStatus" class="share-status"></div>`);
    const ta=document.querySelector('#shareData'),status=document.querySelector('#shareStatus');
    document.querySelector('#copyProgramBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(ta.value);status.textContent='Copied ✓';}catch(_){ta.select();status.textContent='Selected. Press Ctrl/Cmd+C.';}});
    document.querySelector('#importProgramBtn').addEventListener('click',()=>{try{const raw=JSON.parse(ta.value); if(typeof raw.source!=='string')throw new Error('Missing Java source.'); commitEdit();assignSource(raw.source);compiledSource=null;renderProgram();saveWorkspace();closeModal();}catch(err){status.textContent='Import failed: '+err.message;}});
  };

  window.showHint=function(){
    showModal(`<div class="modal-heading"><span>JAVA HINT</span><h2>${escapeHtml(level().title)}</h2><p>${escapeHtml(level().objective)}</p></div><div class="analysis-block"><p>Control Byte directly from Java. The usual loop is <code>while (bot.hasNext())</code>. Use floor slots only when the puzzle requires remembering box data; your Java variables are still available for your own counters, flags, objects and algorithm state.</p><p><strong>Important:</strong> ByteBot never exposes the numeric value inside a box. Use <code>bot.isZero()</code> and <code>bot.isNegative()</code> for the same physical tests Byte can perform.</p></div>`);
  };

  const oldLoadLevel=window.loadLevel;
  if(typeof oldLoadLevel==='function'){
    window.loadLevel=function(index){
      oldLoadLevel(index);
      const bucket=workspaceBucket(level().id);
      const slot=bucket.slots[workspaceIndex]||[];
      if(!slot.some(x=>x?.op==='JAVA' && typeof x.source==='string' && x.source.trim())){
        assignSource(starterSource()); bucket.slots[workspaceIndex]=cloneProgram(); saveWorkspace(false); renderProgram(); resetMachine(false);
      }
      renderPalette(); refreshWorkspaceTabs();
      const title=document.querySelector('.program-header h2'); if(title) title.textContent='Java Program';
      const cap=document.querySelector('.program-header .small-cap'); if(cap) cap.textContent='BYTEBOT CONTROL';
      if(els.footer) els.footer.textContent='Write real Java in Program.java. ByteOffice owns main() and calls program(ByteBot bot).';
    };
  }

  const oldSaveWorkspace=window.saveWorkspace;
  if(typeof oldSaveWorkspace==='function'){
    window.saveWorkspace=function(showState=true){
      if(!Array.isArray(program)||!program.some(x=>x?.op==='JAVA')) assignSource(starterSource());
      return oldSaveWorkspace(showState);
    };
  }

  const originalSetAnswerModeControls=window.setAnswerModeControls;
  window.setAnswerModeControls=function(){
    if(typeof originalSetAnswerModeControls==='function') originalSetAnswerModeControls(false);
    const answerTab=document.querySelector('.answer-tab'); if(answerTab) answerTab.hidden=true;
  };

  window.ByteOfficeJava={
    version:JAVA_MODE_VERSION,
    starterSource,
    compile:compileCurrentSource,
    scheduleCompile,
    ensureRuntime:ensureJavaRuntime,
    apiSource:BYTEBOT_SOURCE
  };
})();
