(function installByteOfficeAssetDecor(){
  const A='assets/ui/props/';
  const mk=(src,cls,alt='')=>{const i=document.createElement('img');i.src=src;i.className=cls;i.alt=alt;i.setAttribute('aria-hidden','true');i.draggable=false;return i;};
  const once=(root,sel,fn)=>{const el=root&&root.querySelector(sel);if(el&&!el.dataset.boAssetReady){el.dataset.boAssetReady='1';fn(el);}};

  function decorateHome(){
    const home=document.getElementById('homeScreen'); if(!home)return;
    once(home,'.home-coffee',el=>{el.textContent='';el.appendChild(mk(A+'coffee-mug.svg','home-prop-img'));});
    once(home,'.home-pencil',el=>{el.textContent='';el.appendChild(mk(A+'pencil.svg','home-prop-img'));});
    home.querySelectorAll('.home-note,.home-mini-note').forEach(el=>{if(!el.querySelector('.note-paper-img'))el.prepend(mk(A+'sticky-note.svg','note-paper-img'));});
    const ws=home.querySelector('.home-workspace');
    if(ws&&!ws.dataset.boProps){ws.dataset.boProps='1';ws.append(
      mk(A+'compass.svg','bo-prop bo-home-compass'),
      mk(A+'map-doodle.svg','bo-prop bo-home-map'),
      mk(A+'loose-paper.svg','bo-prop bo-home-loose-paper'),
      mk(A+'pushpins.svg','bo-prop bo-home-pushpins')
    );}
  }

  function decorateGame(){
    const app=document.getElementById('app'); if(!app)return;
    once(app,'.room-sign',el=>el.prepend(mk(A+'wood-sign.svg','wood-sign-img')));
    if(!app.dataset.boProps){app.dataset.boProps='1';app.append(
      mk('assets/ui/plant.webp','bo-prop bo-game-plant'),
      mk(A+'coffee-mug.svg','bo-prop bo-game-coffee'),
      mk(A+'pencil.svg','bo-prop bo-game-pencil')
    );}
  }

  function decorateRoadmap(){
    const map=document.getElementById('mapScreen'); if(!map)return;
    const head=map.querySelector('.roadmap-head');
    if(head&&!head.dataset.boProps){head.dataset.boProps='1';head.append(mk(A+'compass.svg','bo-prop bo-roadmap-compass'),mk(A+'pushpins.svg','bo-prop bo-roadmap-pin'));}
    map.querySelectorAll('.road-region-tag').forEach(el=>{if(!el.querySelector('.wood-sign-img'))el.prepend(mk(A+'wood-sign.svg','wood-sign-img'));});
  }

  function decorateAll(){decorateHome();decorateGame();decorateRoadmap();}
  decorateAll();
  const target=document.getElementById('byteOfficeRoot')||document.body;
  new MutationObserver(decorateAll).observe(target,{childList:true,subtree:true});
})();
