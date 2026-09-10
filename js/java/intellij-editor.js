(function(){
  'use strict';

  const MONACO_BASE='https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs';
  let monacoReady=null;
  let editor=null;
  let model=null;
  let hiddenTextarea=null;
  let suppressSync=false;
  let executionDecoration=[];

  function loadMonaco(){
    if(window.monaco?.editor) return Promise.resolve(window.monaco);
    if(monacoReady) return monacoReady;
    monacoReady=new Promise((resolve,reject)=>{
      const boot=()=>{
        if(typeof window.require!=='function') return reject(new Error('Monaco AMD loader failed to initialize.'));
        window.require.config({paths:{vs:MONACO_BASE}});
        window.MonacoEnvironment={getWorkerUrl:function(){
          const code=`self.MonacoEnvironment={baseUrl:'${MONACO_BASE}/'};importScripts('${MONACO_BASE}/base/worker/workerMain.js');`;
          return URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
        }};
        window.require(['vs/editor/editor.main'],()=>resolve(window.monaco),reject);
      };
      if(typeof window.require==='function') return boot();
      const s=document.createElement('script');
      s.src=MONACO_BASE+'/loader.js';
      s.onload=boot;
      s.onerror=()=>reject(new Error('Could not load Monaco Editor. Check your internet connection.'));
      document.head.appendChild(s);
    });
    return monacoReady;
  }

  function defineTheme(monaco){
    monaco.editor.defineTheme('byteoffice-darcula',{
      base:'vs-dark',inherit:true,
      rules:[
        {token:'keyword.java',foreground:'CF8E6D'},
        {token:'type.identifier.java',foreground:'56A8F5'},
        {token:'identifier.java',foreground:'BCBEC4'},
        {token:'string.java',foreground:'6AAB73'},
        {token:'number.java',foreground:'2AACB8'},
        {token:'comment.java',foreground:'7A7E85',fontStyle:'italic'},
        {token:'delimiter.java',foreground:'BCBEC4'}
      ],
      colors:{
        'editor.background':'#1E1F22','editor.foreground':'#BCBEC4','editorLineNumber.foreground':'#5A5D63','editorLineNumber.activeForeground':'#A4A7AD',
        'editorCursor.foreground':'#A9B7C6','editor.selectionBackground':'#214283','editor.inactiveSelectionBackground':'#243A5E',
        'editor.lineHighlightBackground':'#25272B','editorIndentGuide.background1':'#2F3136','editorIndentGuide.activeBackground1':'#4B4D52',
        'editorBracketMatch.background':'#314A3A','editorBracketMatch.border':'#5F8268','editorGutter.background':'#1E1F22',
        'editorWidget.background':'#2B2D30','editorWidget.border':'#45484E','input.background':'#1F2024','input.border':'#4A4D53',
        'list.hoverBackground':'#383A3F','list.activeSelectionBackground':'#2F65CA','scrollbarSlider.background':'#5B5D6255','scrollbarSlider.hoverBackground':'#6E707688'
      }
    });
  }

  function registerByteBotCompletion(monaco){
    if(window.__byteOfficeJavaCompletionInstalled) return;
    window.__byteOfficeJavaCompletionInstalled=true;
    const docs={
      take:['take()','Takes the next INPUT box into Byte’s hands. The box value is never returned to Java.'],
      send:['send()','Moves the currently held box to OUTPUT.'],
      copyTo:['copyTo(${1:slot})','Copies the held box to a physical floor-memory slot while Byte keeps holding it.'],
      copyFrom:['copyFrom(${1:slot})','Copies a floor-memory box into Byte’s hands.'],
      place:['place(${1:slot})','Moves the held box onto a floor-memory slot and empties Byte’s hands.'],
      pick:['pick(${1:slot})','Moves a floor-memory box into Byte’s hands and clears that slot.'],
      add:['add(${1:slot})','Adds a floor-memory value to Byte’s held value.'],
      subtract:['subtract(${1:slot})','Subtracts a floor-memory value from Byte’s held value.'],
      hasNext:['hasNext()','Returns whether INPUT still has another box.'],
      isZero:['isZero()','Returns whether Byte’s held box is zero without exposing its value.'],
      isNegative:['isNegative()','Returns whether Byte’s held box is negative without exposing its value.'],
      isHolding:['isHolding()','Returns whether Byte currently holds a box.'],
      memorySize:['memorySize()','Returns the number of physical floor-memory slots available in this level.'],
      isEmpty:['isEmpty(${1:slot})','Returns whether the selected floor-memory slot is empty.']
    };
    monaco.languages.registerCompletionItemProvider('java',{
      triggerCharacters:['.'],
      provideCompletionItems:function(model,position){
        const line=model.getLineContent(position.lineNumber).slice(0,position.column-1);
        if(!/\bbot\s*\.\s*[A-Za-z0-9_]*$/.test(line)) return {suggestions:[]};
        const range=new monaco.Range(position.lineNumber,model.getWordUntilPosition(position).startColumn,position.lineNumber,position.column);
        return {suggestions:Object.entries(docs).map(([name,[insert,doc]])=>({
          label:name,kind:monaco.languages.CompletionItemKind.Method,insertText:insert,insertTextRules:monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail:'ByteBot · '+insert.replace(/\$\{[^}]+\}/g,'slot'),documentation:{value:doc},range,sortText:'0'+name
        }))};
      }
    });
  }

  function shellHtml(){
    return `<div class="byte-ide">
      <div class="byte-ide-titlebar">
        <div class="byte-ide-project"><span class="java-dot">J</span><b>ByteOffice</b><small>›</small><span>src</span><small>›</small><span>Program.java</span></div>
        <div class="byte-ide-title-actions"><button class="byte-ide-iconbtn" id="ideFind" title="Find (Ctrl+F)">⌕</button><button class="byte-ide-iconbtn" id="ideCommand" title="Command Palette (F1)">⌘</button></div>
      </div>
      <div class="byte-ide-tabbar"><div class="byte-ide-tab active" id="ideFileTab">Program.java<span class="dirty"></span></div></div>
      <div class="byte-ide-main">
        <div class="byte-ide-stripe"><button class="active" title="Project">Project</button><button title="Problems">Problems</button></div>
        <div class="byte-ide-editorwrap"><div id="byteMonaco" class="byte-monaco"></div><div id="byteIdeLoading" class="byte-ide-loading">Loading Java IDE…</div></div>
      </div>
      <div class="byte-ide-status"><span id="ideRuntimeState" class="ready">Java</span><div class="byte-ide-breadcrumb"><span>Program</span><i>›</i><span>program(ByteBot bot)</span></div><span class="spacer"></span><span id="ideCursor">Ln 1, Col 1</span><span>Spaces: 4</span><span>UTF-8</span><kbd>Java 8</kbd></div>
    </div>`;
  }

  function sourceFromHidden(){ return hiddenTextarea?.value || ''; }

  function syncToLegacy(value){
    if(!hiddenTextarea) return;
    suppressSync=true;
    hiddenTextarea.value=value;
    hiddenTextarea.dispatchEvent(new Event('input',{bubbles:true}));
    suppressSync=false;
    document.querySelector('#ideFileTab')?.classList.add('modified');
  }

  function structuralMarkers(monaco,source){
    const markers=[];
    const lines=source.split(/\r?\n/);
    if(!/\bclass\s+Program\b/.test(source)) markers.push({severity:monaco.MarkerSeverity.Error,message:'Required class Program is missing.',startLineNumber:1,startColumn:1,endLineNumber:1,endColumn:2});
    if(!/\bvoid\s+program\s*\(\s*ByteBot\s+bot\s*\)/.test(source)){
      const ln=Math.max(1,lines.findIndex(x=>/class\s+Program/.test(x))+1);
      markers.push({severity:monaco.MarkerSeverity.Error,message:'ByteOffice requires: public void program(ByteBot bot)',startLineNumber:ln,startColumn:1,endLineNumber:ln,endColumn:Math.max(2,(lines[ln-1]||'').length+1)});
    }
    let depth=0;
    for(let i=0;i<lines.length;i++){
      for(let j=0;j<lines[i].length;j++){
        if(lines[i][j]==='{') depth++;
        else if(lines[i][j]==='}') depth--;
        if(depth<0){markers.push({severity:monaco.MarkerSeverity.Error,message:'Unexpected closing brace.',startLineNumber:i+1,startColumn:j+1,endLineNumber:i+1,endColumn:j+2});depth=0;}
      }
    }
    if(depth>0){const i=lines.length;markers.push({severity:monaco.MarkerSeverity.Error,message:`${depth} closing brace${depth===1?' is':'s are'} missing.`,startLineNumber:i,startColumn:Math.max(1,lines[i-1].length),endLineNumber:i,endColumn:lines[i-1].length+1});}
    monaco.editor.setModelMarkers(model,'byteoffice-live',markers);
  }

  async function mountEditor(){
    const host=document.querySelector('#programList');
    if(!host) return;
    hiddenTextarea=host.querySelector('#javaEditor');
    if(!hiddenTextarea) return;
    const initial=hiddenTextarea.value;
    hiddenTextarea.style.display='none';
    host.innerHTML+=shellHtml();
    const monaco=await loadMonaco();
    defineTheme(monaco);registerByteBotCompletion(monaco);
    model=monaco.editor.createModel(initial,'java',monaco.Uri.parse('inmemory://byteoffice/Program.java'));
    editor=monaco.editor.create(document.querySelector('#byteMonaco'),{
      model,theme:'byteoffice-darcula',automaticLayout:true,fontSize:13,fontFamily:'JetBrains Mono, Menlo, Monaco, Consolas, monospace',fontLigatures:true,
      lineHeight:21,letterSpacing:.1,tabSize:4,insertSpaces:true,detectIndentation:false,wordWrap:'off',smoothScrolling:true,
      minimap:{enabled:true,side:'right',showSlider:'mouseover',scale:1},scrollBeyondLastLine:false,padding:{top:10,bottom:18},
      folding:true,foldingHighlight:true,showFoldingControls:'mouseover',bracketPairColorization:{enabled:true},guides:{bracketPairs:true,indentation:true,highlightActiveIndentation:true},
      renderLineHighlight:'all',renderWhitespace:'selection',cursorBlinking:'smooth',cursorSmoothCaretAnimation:'on',stickyScroll:{enabled:true,maxLineCount:3},
      quickSuggestions:{other:true,comments:false,strings:false},suggestOnTriggerCharacters:true,parameterHints:{enabled:true},formatOnPaste:true,
      overviewRulerLanes:2,overviewRulerBorder:false,glyphMargin:true,lineNumbersMinChars:3,contextmenu:true,links:false,
      find:{addExtraSpaceOnTop:false,autoFindInSelection:'never'},lightbulb:{enabled:'on'},occurrencesHighlight:'singleFile',selectionHighlight:true
    });
    document.querySelector('#byteIdeLoading')?.classList.add('hidden');
    structuralMarkers(monaco,initial);

    editor.onDidChangeModelContent(()=>{
      if(suppressSync) return;
      const value=model.getValue();syncToLegacy(value);structuralMarkers(monaco,value);
    });
    editor.onDidChangeCursorPosition(e=>{const el=document.querySelector('#ideCursor');if(el)el.textContent=`Ln ${e.position.lineNumber}, Col ${e.position.column}`;});
    editor.onDidFocusEditorText(()=>document.querySelector('#ideFileTab')?.classList.remove('modified'));
    document.querySelector('#ideFind')?.addEventListener('click',()=>editor.getAction('actions.find')?.run());
    document.querySelector('#ideCommand')?.addEventListener('click',()=>editor.getAction('editor.action.quickCommand')?.run());

    window.ByteOfficeIDE={
      editor,model,
      focus(){editor.focus();},
      getValue(){return model.getValue();},
      setValue(v){if(model.getValue()!==v)model.setValue(v);},
      revealLine(line){editor.revealLineInCenterIfOutsideViewport(line);},
      highlightLine(line){
        executionDecoration=editor.deltaDecorations(executionDecoration,[{range:new monaco.Range(line,1,line,1),options:{isWholeLine:true,className:'byte-active-exec-line',glyphMarginClassName:'byte-active-exec-glyph'}}]);
        editor.revealLineInCenterIfOutsideViewport(line);
      },
      clearExecution(){executionDecoration=editor.deltaDecorations(executionDecoration,[]);}
    };
  }

  const oldRender=window.renderProgram;
  if(typeof oldRender==='function'){
    window.renderProgram=function(){
      if(editor){editor.dispose();model?.dispose();editor=null;model=null;window.ByteOfficeIDE=null;}
      oldRender.apply(this,arguments);
      queueMicrotask(()=>mountEditor().catch(err=>{console.error('ByteOffice IDE failed:',err);const host=document.querySelector('#programList');if(host){const ta=host.querySelector('#javaEditor');if(ta)ta.style.display='block';}}));
    };
  }

  const oldHighlight=window.highlightLine;
  window.highlightLine=function(line){
    if(typeof oldHighlight==='function') oldHighlight(line);
    const n=Number(line);
    if(window.ByteOfficeIDE&&Number.isFinite(n)&&n>0) window.ByteOfficeIDE.highlightLine(n);
  };

  // Upgrade the editor already rendered during initial game boot.
  if(document.querySelector('#javaEditor')) mountEditor().catch(console.error);
})();
