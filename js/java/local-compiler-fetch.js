(function(){
  'use strict';

  const REMOTE_ECJ = 'https://repo.maven.apache.org/maven2/org/eclipse/jdt/ecj/3.46.0/ecj-3.46.0.jar';
  const LOCAL_COMPILER = 'java/ecj.jar';
  const nativeFetch = window.fetch.bind(window);

  // Keep the compiler JAR same-origin so browsers do not block it with CORS.
  window.fetch = function(resource, init){
    const requested = typeof resource === 'string' ? resource : resource && resource.url;
    if(requested === REMOTE_ECJ){
      const localUrl = new URL(LOCAL_COMPILER, document.baseURI).href;
      return nativeFetch(localUrl, init).then(response => {
        if(!response.ok){
          throw new Error(`Local Java compiler could not be loaded (${response.status}) from ${localUrl}`);
        }
        return response;
      }).catch(error => {
        if(location.protocol === 'file:'){
          throw new Error('ByteOffice Java mode cannot fetch java/ecj.jar from file://. Open the game from static HTTP/HTTPS hosting so the bundled compiler can be loaded same-origin.');
        }
        throw error;
      });
    }
    return nativeFetch(resource, init);
  };

  // CheerpOS /str is a flat in-memory string-file namespace. It rejects
  // cheerpOSAddStringFile('/str/byteoffice/Foo.java', ...). ByteBot and
  // GameRunner still declare package byteoffice; javac will generate the
  // package directory under /files when compiling them.
  const SOURCE_PATHS = new Map([
    ['/str/byteoffice/ByteBot.java', '/str/ByteBot.java'],
    ['/str/byteoffice/GameRunner.java', '/str/GameRunner.java']
  ]);

  function installCheerpJPathShim(){
    if(window.__byteOfficeCheerpJPathShimInstalled) return true;
    if(typeof window.cheerpOSAddStringFile !== 'function' || typeof window.cheerpjRunMain !== 'function') return false;

    const nativeAddStringFile = window.cheerpOSAddStringFile.bind(window);
    const nativeRunMain = window.cheerpjRunMain.bind(window);

    window.cheerpOSAddStringFile = function(path, data){
      return nativeAddStringFile(SOURCE_PATHS.get(path) || path, data);
    };

    window.cheerpjRunMain = function(mainClass, classPath, ...args){
      const rewrittenArgs = args.map(arg => SOURCE_PATHS.get(arg) || arg);
      return nativeRunMain(mainClass, classPath, ...rewrittenArgs);
    };

    window.__byteOfficeCheerpJPathShimInstalled = true;
    return true;
  }

  // loader.js is loaded before this file, but the actual APIs may become
  // available slightly later. Install immediately when possible and retry
  // briefly until CheerpJ exposes them.
  if(!installCheerpJPathShim()){
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if(installCheerpJPathShim() || attempts >= 200) clearInterval(timer);
    }, 25);
  }
})();
