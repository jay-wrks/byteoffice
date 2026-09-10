(function(){
  'use strict';

  async function loadClassicScript(src){
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;
      script.onload=resolve;
      script.onerror=()=>reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  }

  async function boot(){
    try{
      const response=await fetch('js/java/java-mode.js',{cache:'no-store'});
      if(!response.ok) throw new Error(`Could not load Java mode (${response.status})`);
      let source=await response.text();

      source=source
        .replaceAll('/str/byteoffice/ByteBot.java','/str/ByteBot.java')
        .replaceAll('/str/byteoffice/GameRunner.java','/str/GameRunner.java');

      (0,eval)(source+'\n//# sourceURL=js/java/java-mode.patched.js');

      // Upgrade the raw textarea into a real IDE before the remaining UI and
      // key bindings attach. The hidden textarea remains the persistence/runtime bridge.
      await loadClassicScript('js/java/intellij-editor.js');
      await loadClassicScript('js/java/java-ui.js');
      await loadClassicScript('js/app/bindings.js');
    }catch(err){
      console.error('ByteOffice Java bootstrap failed:',err);
      const footer=document.querySelector('#footerMessage');
      if(footer) footer.textContent='Java runtime failed to initialize: '+(err?.message||String(err));
    }
  }

  boot();
})();
