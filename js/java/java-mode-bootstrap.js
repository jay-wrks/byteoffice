(function(){
  'use strict';

  const ASSET_VERSION='20260911-0057';

  function versioned(src){
    return src + (src.includes('?')?'&':'?') + 'v=' + encodeURIComponent(ASSET_VERSION);
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
      const response=await fetch(versioned('js/java/java-mode.js'),{cache:'no-store'});
      if(!response.ok) throw new Error(`Could not load Java mode (${response.status})`);
      let source=await response.text();

      source=source
        .replaceAll('/str/byteoffice/ByteBot.java','/str/ByteBot.java')
        .replaceAll('/str/byteoffice/GameRunner.java','/str/GameRunner.java');

      (0,eval)(source+'\n//# sourceURL=js/java/java-mode.patched.js?v='+ASSET_VERSION);

      await loadClassicScript('js/java/intellij-editor.js');
      await loadClassicScript('js/java/byteoffice-monaco-theme.js');
      await loadClassicScript('js/java/java-ui.js');
      await loadClassicScript('js/java/java-workspace-tabs.js');
      await loadClassicScript('js/java/ide-layout-controls.js');
      await loadClassicScript('js/app/bindings.js');
    }catch(err){
      console.error('ByteOffice Java bootstrap failed:',err);
      const footer=document.querySelector('#footerMessage');
      if(footer) footer.textContent='Java runtime failed to initialize: '+(err?.message||String(err));
    }
  }

  boot();
})();
