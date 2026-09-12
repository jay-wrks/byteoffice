(function(){
  'use strict';

  let lastLine=-1;

  function highlight(line){
    line=Number(line);
    if(!Number.isFinite(line)||line<1) return;
    lastLine=line;
    try{ window.ByteOfficeIDE?.highlightLine(line); }catch(_){}
  }

  function clear(){
    lastLine=-1;
    try{ window.ByteOfficeIDE?.clearExecution(); }catch(_){}
  }

  function wrapTransition(){
    const original=window.animateTransition;
    if(typeof original!=='function' || original.__byteOfficeExecutionHighlightWrapped) return;

    async function wrapped(transition){
      const line=Number(transition?.executedPc);
      if(Number.isFinite(line)&&line>0) highlight(line);
      return original.apply(this,arguments);
    }
    wrapped.__byteOfficeExecutionHighlightWrapped=true;
    wrapped.__byteOfficeOriginal=original;
    window.animateTransition=wrapped;
  }

  function wrapReset(){
    const original=window.resetMachine;
    if(typeof original!=='function' || original.__byteOfficeExecutionHighlightWrapped) return;

    function wrapped(){
      const result=original.apply(this,arguments);
      requestAnimationFrame(clear);
      return result;
    }
    wrapped.__byteOfficeExecutionHighlightWrapped=true;
    wrapped.__byteOfficeOriginal=original;
    window.resetMachine=wrapped;
  }

  function restoreAfterEditorMount(){
    if(lastLine>0) requestAnimationFrame(()=>highlight(lastLine));
  }

  wrapTransition();
  wrapReset();

  // Monaco is rebuilt when switching workspaces/Answer. If a render occurs
  // while Java is paused on a line, restore the execution marker afterwards.
  const observer=new MutationObserver(()=>restoreAfterEditorMount());
  const host=document.querySelector('#programList');
  if(host) observer.observe(host,{childList:true,subtree:true});

  window.ByteOfficeExecutionHighlight={highlight,clear,get line(){return lastLine;}};
})();
