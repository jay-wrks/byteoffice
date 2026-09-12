(function(){
  'use strict';

  const ASSET_VERSION='20260911-0110';

  function versioned(src){
    const base=window.__BYTE_OFFICE_ASSET_BASE__||document.baseURI||window.location.href;
    const url=new URL(src,base);
    url.searchParams.set('v',ASSET_VERSION);
    return url.href;
  }

  async function loadClassicScript(src){
    const url=versioned(src);
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=url;
      script.onload=resolve;
      script.onerror=()=>reject(new Error(`Failed to load ${url}`));
      document.body.appendChild(script);
    });
  }

  async function boot(){
    try{
      // Keep CheerpJ's /app/ filesystem anchored to this deployed app
      // directory, rather than trusting the page's <base> element. This is
      // important when the entry page is hosted one directory above it.
      window.__BYTE_OFFICE_ASSET_BASE__=new URL('../..',document.currentScript?.src||window.location.href).href;
      const response=await fetch(versioned('js/java/java-mode.js'),{cache:'no-store'});
      if(!response.ok) throw new Error(`Could not load Java mode (${response.status})`);
      let source=await response.text();

      source=source
        .replaceAll('/str/byteoffice/ByteBot.java','/str/ByteBot.java')
        .replaceAll('/str/byteoffice/GameRunner.java','/str/GameRunner.java')
        // The Java runtime keeps its source-line highlighter private inside
        // java-mode.js. Mirror those exact runtime lines into Monaco directly
        // so every physical ByteBot action highlights Program.java before the
        // corresponding bot animation starts.
        .replace(
          'if(!headless) highlightJavaLine(line);',
          'if(!headless){ highlightJavaLine(line); window.ByteOfficeIDE?.highlightLine?.(line); }'
        )
        .replace(
          'if(!headless) highlightJavaLine(javaMachine.lastLine);',
          'if(!headless){ highlightJavaLine(javaMachine.lastLine); window.ByteOfficeIDE?.highlightLine?.(javaMachine.lastLine); }'
        )
        // Reset must also clear the Monaco execution marker, otherwise a
        // completed/aborted run can leave the previous statement highlighted.
        .replace(
          "stopRun(); animating=false; activeJavaLine=-1; clearTransientBoxes?.();",
          "stopRun(); animating=false; activeJavaLine=-1; window.ByteOfficeIDE?.clearExecution?.(); clearTransientBoxes?.();"
        );

      (0,eval)(source+'\n//# sourceURL=js/java/java-mode.patched.js?v='+ASSET_VERSION);

      await loadClassicScript('js/java/intellij-editor.js');
      await loadClassicScript('js/java/byteoffice-monaco-theme.js');
      await loadClassicScript('js/java/java-ui.js');
      await loadClassicScript('js/java/java-solutions.js');
      await loadClassicScript('js/java/java-workspace-tabs.js');
      await loadClassicScript('js/java/ide-layout-controls.js');
      await loadClassicScript('js/app/bindings.js');
      await loadClassicScript('js/java/execution-highlighter.js');
    }catch(err){
      console.error('ByteOffice Java bootstrap failed:',err);
      const footer=document.querySelector('#footerMessage');
      if(footer) footer.textContent='Java runtime failed to initialize: '+(err?.message||String(err));
    }
  }

  boot();
})();
