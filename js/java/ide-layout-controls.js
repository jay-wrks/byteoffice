(function(){
  'use strict';

  const STORAGE_KEY='byteOfficeIdeMaximized';
  const ANIMATION_MS=280;
  let observer=null;
  let activeAnimation=null;

  function isMaximized(){
    try{return localStorage.getItem(STORAGE_KEY)==='1';}catch(_){return false;}
  }

  function reducedMotion(){
    return document.body.classList.contains('reduced-motion') ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  function layoutEditor(){
    requestAnimationFrame(()=>{
      try{window.ByteOfficeIDE?.editor?.layout();}catch(_){}
      setTimeout(()=>{try{window.ByteOfficeIDE?.editor?.layout();}catch(_){}},ANIMATION_MS+30);
    });
  }

  function updateButton(maximized){
    const btn=document.querySelector('#ideLayoutToggle');
    if(!btn) return;
    btn.setAttribute('aria-pressed',maximized?'true':'false');
    btn.title=maximized?'Restore game layout':'Maximize code IDE';
    btn.setAttribute('aria-label',btn.title);
    btn.innerHTML=maximized?'↙':'⛶';
  }

  function persist(maximized){
    try{localStorage.setItem(STORAGE_KEY,maximized?'1':'0');}catch(_){}
  }

  function setState(maximized){
    const layout=document.querySelector('.game-layout');
    if(!layout) return;
    layout.classList.toggle('ide-maximized',maximized);
    document.body.classList.toggle('byte-ide-maximized',maximized);
    updateButton(maximized);
    persist(maximized);
  }

  async function apply(maximized,{animate=true}={}){
    const layout=document.querySelector('.game-layout');
    const panel=layout?.querySelector(':scope > .java-program-panel');
    if(!layout||!panel) return;

    const current=layout.classList.contains('ide-maximized');
    if(current===maximized){
      updateButton(maximized);
      layoutEditor();
      return;
    }

    if(activeAnimation){
      try{activeAnimation.cancel();}catch(_){}
      activeAnimation=null;
    }

    const first=panel.getBoundingClientRect();
    setState(maximized);

    // Force the browser to resolve the destination overlay/grid geometry.
    const last=panel.getBoundingClientRect();

    if(!animate || reducedMotion() || !panel.animate || !first.width || !last.width){
      layoutEditor();
      return;
    }

    const dx=first.left-last.left;
    const dy=first.top-last.top;
    const sx=first.width/last.width;
    const sy=first.height/last.height;

    panel.classList.add('ide-layout-animating');
    activeAnimation=panel.animate([
      {
        transformOrigin:'top left',
        transform:`translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
        opacity:.96,
        boxShadow:'0 0 0 rgba(29,25,19,0)'
      },
      {
        transformOrigin:'top left',
        transform:'translate(0, 0) scale(1, 1)',
        opacity:1,
        boxShadow:maximized?'-12px 0 24px rgba(29,25,19,.26)':'0 0 0 rgba(29,25,19,0)'
      }
    ],{
      duration:ANIMATION_MS,
      easing:'cubic-bezier(.2,.78,.2,1)',
      fill:'both'
    });

    // Keep Monaco fitting the moving panel instead of snapping only at the end.
    const started=performance.now();
    const tick=()=>{
      try{window.ByteOfficeIDE?.editor?.layout();}catch(_){}
      if(performance.now()-started<ANIMATION_MS) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    try{await activeAnimation.finished;}catch(_){}
    panel.classList.remove('ide-layout-animating');
    if(activeAnimation){
      try{activeAnimation.cancel();}catch(_){}
      activeAnimation=null;
    }
    layoutEditor();
  }

  function ensureButton(){
    const actions=document.querySelector('.byte-ide-title-actions');
    if(!actions||document.querySelector('#ideLayoutToggle')) return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.id='ideLayoutToggle';
    btn.className='byte-ide-iconbtn ide-layout-toggle';
    btn.addEventListener('click',()=>{
      const layout=document.querySelector('.game-layout');
      apply(!layout?.classList.contains('ide-maximized'));
    });
    actions.prepend(btn);
    apply(isMaximized(),{animate:false});
  }

  function boot(){
    ensureButton();
    observer=new MutationObserver(()=>ensureButton());
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('resize',layoutEditor,{passive:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  window.ByteOfficeIDELayout={
    maximize(){return apply(true);},
    restore(){return apply(false);},
    toggle(){const l=document.querySelector('.game-layout');return apply(!l?.classList.contains('ide-maximized'));}
  };
})();
