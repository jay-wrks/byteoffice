(function(){
  'use strict';

  const MONACO='https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs';
  let editor=null, model=null, textarea=null, decorations=[], loading=null;

  function loadMonaco(){
    if(window.monaco?.editor) return Promise.resolve(window.monaco);
    if(loading) return loading;
    loading=new Promise((resolve,reject)=>{
      const start=()=>{
        if(typeof window.require!=='function') return reject(new Error('Monaco loader unavailable.'));
        window.require.config({paths:{vs:MONACO}});
        window.MonacoEnvironment={getWorkerUrl(){
          const src=`self.MonacoEnvironment={baseUrl:'${MONACO}/'};importScripts('${MONACO}/base/worker/workerMain.js');`;
          return URL.createObjectURL(new Blob([src],{type:'text/javascript'}));
        }};
        window.require(['vs/editor/editor.main'],()=>resolve(window.monaco),reject);
      };
      if(typeof window.require==='function') return start();
      const s=document.createElement('script');
      s.src=MONACO+'/loader.js'; s.onload=start; s.onerror=()=>reject(new Error('Failed to load Monaco Editor.'));
      document.head.appendChild(s);
    });
    return loading;
  }

  function defineTheme(m){
    m.editor.defineTheme('byteoffice-darcula',{
      base:'vs-dark',inherit:true,
      rules:[
        {token:'keyword.java',foreground:'CF8E6D'},
        {token:'string.java',foreground:'6AAB73'},
        {token:'number.java',foreground:'2AACB8'},
        {token:'comment.java',foreground:'7A7E85',fontStyle:'italic'}
      ],
      colors:{
        'editor.background':'#1E1F22','editor.foreground':'#BCBEC4','editorLineNumber.foreground':'#5A5D63','editorLineNumber.activeForeground':'#A4A7AD',
        'editor.lineHighlightBackground':'#25272B','editorCursor.foreground':'#A9B7C6','editor.selectionBackground':'#214283','editor.inactiveSelectionBackground':'#243A5E',
        'editorIndentGuide.background1':'#2F3136','editorIndentGuide.activeBackground1':'#4B4D52','editorBracketMatch.background':'#314A3A','editorBracketMatch.border':'#5F8268',
        'editorGutter.background':'#1E1F22','editorWidget.background':'#2B2D30','editorWidget.border':'#45484E','input.background':'#1F2024','input.border':'#4A4D53',
        'list.hoverBackground':'#383A3F','list.activeSelectionBackground':'#2F65CA','scrollbarSlider.background':'#5B5D6255','scrollbarSlider.hoverBackground':'#6E707688'
      }
    });
  }

  function registerCompletions(m){
    if(window.__byteOfficeMonacoCompletions) return;
    window.__byteOfficeMonacoCompletions=true;
    const items=[
      ['take','take()','Take the next INPUT box into Byte’s hands. Returns void.'],
      ['send','send()','Move Byte’s held box to OUTPUT. Returns void.'],
      ['copyTo','copyTo(${1:slot})','Copy the held box to a physical floor-memory slot.'],
      ['copyFrom','copyFrom(${1:slot})','Copy a floor-memory box into Byte’s hands.'],
      ['place','place(${1:slot})','Move the held box to floor memory and empty Byte’s hands.'],
      ['pick','pick(${1:slot})','Move a floor-memory box into Byte’s hands and clear the slot.'],
      ['add','add(${1:slot})','Add a floor-memory value to Byte’s held value.'],
      ['subtract','subtract(${1:slot})','Subtract a floor-memory value from Byte’s held value.'],
      ['hasNext','hasNext()','Whether INPUT still contains another box.'],
      ['isZero','isZero()','Whether the held box is zero.'],
      ['isNegative','isNegative()','Whether the held box is negative.'],
      ['isHolding','isHolding()','Whether Byte currently holds a box.'],
      ['memorySize','memorySize()','Number of physical floor-memory slots in this level.'],
      ['isEmpty','isEmpty(${1:slot})','Whether a floor-memory slot is empty.']
    ];
    m.languages.registerCompletionItemProvider('java',{
      triggerCharacters:['.'],
      provideCompletionItems(mod,pos){
        const before=mod.getLineContent(pos.lineNumber).slice(0,pos.column-1);
        if(!/\bbot\s*\.\s*[\w]*$/.test(before)) return {suggestions:[]};
        const word=mod.getWordUntilPosition(pos);
        const range=new m.Range(pos.lineNumber,word.startColumn,pos.lineNumber,pos.column);
        return {suggestions:items.map(([label,insert,doc])=>({label,kind:m.languages.CompletionItemKind.Method,insertText:insert,insertTextRules:m.languages.CompletionItemInsertTextRule.InsertAsSnippet,detail:'ByteBot · '+insert.replace(/\$\{1:slot\}/g,'slot'),documentation:{value:doc},range,sortText:'0'+label}))};
      }
    });
  }

  function chrome(){
    return `<div class="byte-ide">
      <div class="byte-ide-titlebar"><div class="byte-ide-project"><span class="java-dot">J</span><b>ByteOffice</b><small>›</small><span>src</span><small>›</small><span>Program.java</span></div><div class="byte-ide-title-actions"><button class="byte-ide-iconbtn" id="ideFind" title="Find">⌕</button><button class="byte-ide-iconbtn" id="ideCommand" title="Command Palette">⌘</button></div></div>
      <div class="byte-ide-tabbar"><div class="byte-ide-tab active" id="ideFileTab">Program.java<span class="dirty"></span></div></div>
      <div class="byte-ide-main"><div class="byte-ide-stripe"><button class="active">Project</button><button>Problems</button></div><div class="byte-ide-editorwrap"><div id="byteMonaco" class="byte-monaco"></div><div id="byteIdeLoading" class="byte-ide-loading">Loading Java IDE…</div></div></div>
      <div class="byte-ide-status"><span id="ideRuntimeState" class="ready">Java</span><div class="byte-ide-breadcrumb"><span>Program</span><i>›</i><span>program(ByteBot bot)</span></div><span class="spacer"></span><span id="ideCursor">Ln 1, Col 1</span><span>Spaces: 4</span><span>UTF-8</span><kbd>Java 8</kbd></div>
    </div>`;
  }

  function validate(m){
    if(!model) return;
    const src=model.getValue(), lines=src.split(/\r?\n/), markers=[];
    if(!/\bclass\s+Program\b/.test(src)) markers.push({severity:m.MarkerSeverity.Error,message:'Required class Program is missing.',startLineNumber:1,startColumn:1,endLineNumber:1,endColumn:2});
    if(!/\bvoid\s+program\s*\(\s*ByteBot\s+bot\s*\)/.test(src)) markers.push({severity:m.MarkerSeverity.Error,message:'ByteOffice requires: public void program(ByteBot bot)',startLineNumber:1,startColumn:1,endLineNumber:1,endColumn:Math.max(2,(lines[0]||'').length+1)});
    let depth=0;
    lines.forEach((line,i)=>{for(let j=0;j<line.length;j++){if(line[j]==='{')depth++;else if(line[j]==='}')depth--;if(depth<0){markers.push({severity:m.MarkerSeverity.Error,message:'Unexpected closing brace.',startLineNumber:i+1,startColumn:j+1,endLineNumber:i+1,endColumn:j+2});depth=0;}}});
    if(depth>0){const i=lines.length;markers.push({severity:m.MarkerSeverity.Error,message:'Missing closing brace.',startLineNumber:i,startColumn:Math.max(1,(lines[i-1]||'').length),endLineNumber:i,endColumn:(lines[i-1]||'').length+1});}
    m.editor.setModelMarkers(model,'byteoffice-live',markers);
  }

  async function mount(){
    const host=document.querySelector('#programList');
    if(!host) return;
    textarea=host.querySelector('#javaEditor');
    if(!textarea) return;
    const initial=textarea.value;
    textarea.style.display='none';
    host.insertAdjacentHTML('beforeend',chrome());

    const m=await loadMonaco();
    defineTheme(m); registerCompletions(m);
    model=m.editor.createModel(initial,'java',m.Uri.parse('inmemory://byteoffice/Program.java'));
    editor=m.editor.create(document.querySelector('#byteMonaco'),{
      model,theme:'byteoffice-darcula',automaticLayout:true,fontSize:13,lineHeight:21,fontFamily:'JetBrains Mono, Menlo, Monaco, Consolas, monospace',fontLigatures:true,
      tabSize:4,insertSpaces:true,detectIndentation:false,wordWrap:'off',smoothScrolling:true,minimap:{enabled:true,showSlider:'mouseover'},scrollBeyondLastLine:false,
      folding:true,foldingHighlight:true,showFoldingControls:'mouseover',bracketPairColorization:{enabled:true},guides:{bracketPairs:true,indentation:true,highlightActiveIndentation:true},
      renderLineHighlight:'all',renderWhitespace:'selection',cursorBlinking:'smooth',cursorSmoothCaretAnimation:'on',stickyScroll:{enabled:true,maxLineCount:3},
      quickSuggestions:{other:true,comments:false,strings:false},suggestOnTriggerCharacters:true,parameterHints:{enabled:true},formatOnPaste:true,overviewRulerLanes:2,
      glyphMargin:true,lineNumbersMinChars:3,contextmenu:true,find:{addExtraSpaceOnTop:false},padding:{top:10,bottom:18}
    });
    document.querySelector('#byteIdeLoading')?.classList.add('hidden');
    validate(m);

    model.onDidChangeContent(()=>{
      textarea.value=model.getValue();
      textarea.dispatchEvent(new Event('input',{bubbles:true}));
      document.querySelector('#ideFileTab')?.classList.add('modified');
      validate(m);
    });
    editor.onDidChangeCursorPosition(e=>{const el=document.querySelector('#ideCursor');if(el)el.textContent=`Ln ${e.position.lineNumber}, Col ${e.position.column}`;});
    document.querySelector('#ideFind')?.addEventListener('click',()=>editor.getAction('actions.find')?.run());
    document.querySelector('#ideCommand')?.addEventListener('click',()=>editor.getAction('editor.action.quickCommand')?.run());

    window.ByteOfficeIDE={
      editor,model,
      focus(){editor.focus();},getValue(){return model.getValue();},
      setValue(v){if(model.getValue()!==v)model.setValue(v);},
      highlightLine(line){if(!Number.isFinite(+line)||+line<1)return;decorations=editor.deltaDecorations(decorations,[{range:new m.Range(+line,1,+line,1),options:{isWholeLine:true,className:'byte-active-exec-line',glyphMarginClassName:'byte-active-exec-glyph'}}]);editor.revealLineInCenterIfOutsideViewport(+line);},
      clearExecution(){decorations=editor.deltaDecorations(decorations,[]);}
    };
  }

  function dispose(){if(editor)editor.dispose();if(model)model.dispose();editor=null;model=null;textarea=null;window.ByteOfficeIDE=null;}

  const oldRender=window.renderProgram;
  if(typeof oldRender==='function') window.renderProgram=function(){dispose();oldRender.apply(this,arguments);queueMicrotask(()=>mount().catch(err=>{console.error('ByteOffice IDE failed:',err);const ta=document.querySelector('#javaEditor');if(ta)ta.style.display='block';}));};

  const oldHighlight=window.highlightLine;
  window.highlightLine=function(line){if(typeof oldHighlight==='function')oldHighlight(line);window.ByteOfficeIDE?.highlightLine(Number(line));};

  if(document.querySelector('#javaEditor')) mount().catch(console.error);
})();
