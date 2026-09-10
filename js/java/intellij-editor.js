(function(){
  'use strict';

  // Monaco is vendored into the repository so the IDE does not depend on a CDN.
  const MONACO='libs/monaco/vs';
  let editor=null, model=null, textarea=null, decorations=[], loading=null;

  function loadMonaco(){
    if(window.monaco?.editor) return Promise.resolve(window.monaco);
    if(loading) return loading;
    loading=new Promise((resolve,reject)=>{
      const start=()=>{
        if(typeof window.require!=='function') return reject(new Error('Local Monaco loader unavailable.'));
        window.require.config({paths:{vs:MONACO}});
        window.MonacoEnvironment={getWorkerUrl(){
          const src=`self.MonacoEnvironment={baseUrl:'${MONACO}/'};importScripts('${MONACO}/base/worker/workerMain.js');`;
          return URL.createObjectURL(new Blob([src],{type:'text/javascript'}));
        }};
        window.require(['vs/editor/editor.main'],()=>resolve(window.monaco),reject);
      };
      if(typeof window.require==='function') return start();
      const s=document.createElement('script');
      s.src=MONACO+'/loader.js';
      s.onload=start;
      s.onerror=()=>reject(new Error('Failed to load local Monaco Editor from libs/monaco.'));
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
      <div class="byte-ide-tabbar"><div class="byte-ide-tab active" id="ideFileTab"><span class="java-file-icon">J</span><span>Program.java</span></div></div>
      <div class="byte-ide-breadcrumb"><span>ByteOffice</span><i>›</i><span>src</span><i>›</i><span>Program.java</span><i>›</i><b>program(ByteBot bot)</b></div>
      <div class="byte-monaco-wrap"><div id="byteMonaco" class="byte-monaco"></div><div id="byteIdeLoading" class="byte-ide-loading">Loading Java IDE…</div></div>
      <div class="byte-ide-status"><span>ByteOffice Java IDE</span><span id="ideCursor">Ln 1, Col 1</span><span>Spaces: 4</span><span>UTF-8</span><span>Java 8</span></div>
    </div>`;
  }

  function syncToLegacy(value){
    if(!textarea) return;
    textarea.value=value;
    textarea.dispatchEvent(new Event('input',{bubbles:true}));
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
    textarea=host.querySelector('#javaEditor');
    if(!textarea) return;
    const initial=textarea.value;
    textarea.style.display='none';
    host.insertAdjacentHTML('beforeend',chrome());
    const monaco=await loadMonaco();
    defineTheme(monaco);registerCompletions(monaco);
    model=monaco.editor.createModel(initial,'java',monaco.Uri.parse('inmemory://byteoffice/Program.java'));
    editor=monaco.editor.create(document.querySelector('#byteMonaco'),{
      model,theme:'byteoffice-darcula',automaticLayout:true,fontSize:13,fontFamily:'DM Mono, Menlo, Monaco, Consolas, monospace',fontLigatures:false,
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
        decorations=editor.deltaDecorations(decorations,[{range:new monaco.Range(line,1,line,1),options:{isWholeLine:true,className:'byte-active-exec-line',glyphMarginClassName:'byte-active-exec-glyph'}}]);
        editor.revealLineInCenterIfOutsideViewport(line);
      },
      clearExecution(){decorations=editor.deltaDecorations(decorations,[]);}
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

  if(document.querySelector('#javaEditor')) mountEditor().catch(console.error);
})();
