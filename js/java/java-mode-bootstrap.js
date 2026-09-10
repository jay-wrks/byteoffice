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
      // Load the Java runtime source same-origin and adapt it to CheerpJ's
      // browser filesystem/compiler layout before evaluating it.
      const response=await fetch('js/java/java-mode.js',{cache:'no-store'});
      if(!response.ok) throw new Error(`Could not load Java mode (${response.status})`);
      let source=await response.text();

      // /str is a flat string-file namespace. The package declarations remain
      // in the Java source; javac creates /files/byteoffice/*.class for us.
      source=source
        .replaceAll('/str/byteoffice/ByteBot.java','/str/ByteBot.java')
        .replaceAll('/str/byteoffice/GameRunner.java','/str/GameRunner.java');

      // java/tools.jar is the same javac tools.jar used by LeaningTech's
      // JavaFiddle. Do not fetch/mount ECJ: this JAR contains javac, not the
      // Eclipse compiler.
      source=source.replace(
        "const compilerFetch=fetch(ECJ_URL).then(r=>{ if(!r.ok) throw new Error(`ECJ download failed (${r.status})`); return r.arrayBuffer(); });",
        "const compilerFetch=Promise.resolve(null);"
      );
      source=source.replace(
        "if(!compilerMounted){\n        const bytes=new Uint8Array(await compilerFetch);\n        cheerpOSAddStringFile('/str/ecj.jar',bytes);\n        compilerMounted=true;\n      }",
        "compilerMounted=true;"
      );

      // Use javac from the bundled application JAR exactly as CheerpJ's
      // JavaFiddle does. tools.jar is visible to CheerpJ under /app/.
      source=source
        .replaceAll('org.eclipse.jdt.internal.compiler.batch.Main','com.sun.tools.javac.Main')
        .replaceAll("'/str/ecj.jar'","'/app/java/tools.jar:/files/'")
        .replace("'-17','-proc:none','-g','-d','/files',", "'-g','-d','/files',");

      // Execute as a classic script so it shares ByteOffice's existing global
      // environment just like a normal script tag.
      (0,eval)(source+'\n//# sourceURL=js/java/java-mode.patched.js');

      // These depend on the functions installed by java-mode.js.
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
