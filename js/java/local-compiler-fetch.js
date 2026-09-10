(function(){
  'use strict';

  const REMOTE_ECJ = 'https://repo.maven.apache.org/maven2/org/eclipse/jdt/ecj/3.46.0/ecj-3.46.0.jar';
  const LOCAL_COMPILER = 'java/tools.jar';
  const nativeFetch = window.fetch.bind(window);

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
          throw new Error('ByteOffice Java mode cannot fetch java/tools.jar from file://. Open the game from static HTTP/HTTPS hosting so the bundled compiler can be loaded same-origin.');
        }
        throw error;
      });
    }
    return nativeFetch(resource, init);
  };
})();
