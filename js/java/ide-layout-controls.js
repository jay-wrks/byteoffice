(function(){
  'use strict';

  const STORAGE_KEY='byteOfficeIdeMaximized';
  let observer=null;

  function isMaximized(){
    try{return localStorage.getItem(STORAGE_KEY)==='1';}catch(_){return false;}
  }

  function layoutEditor(){
    requestAnimationFrame(()=>{
      try{window.ByteOfficeIDE?.editor?.layout();}catch(_){}
      setTimeout(()=>{try{window.ByteOfficeIDE?.editor?.layout();}catch(_){}},180);
    });
  }

  function apply(maximized){
    const layout=document.querySelector('.game-layout');
    if(!layout) return;
    layout.classList.toggle('ide-maximized',maximized);
    document.body.classList.toggle('byte-ide-maximized',maximized);
    try{localStorage.setItem(STORAGE_KEY,maximized?'1':'0');}catch(_){}

    const btn=document.querySelector('#ideLayoutToggle');
    if(btn){
      btn.setAttribute('aria-pressed',maximized?'true':'false');
      btn.title=maximized?'Restore game layout':'Maximize code IDE';
      btn.setAttribute('aria-label',btn.title);
      btn.innerHTML=maximized?'↙':'⛶';
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
    apply(isMaximized());
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
    maximize(){apply(true);},
    restore(){apply(false);},
    toggle(){const l=document.querySelector('.game-layout');apply(!l?.classList.contains('ide-maximized'));}
  };
})();
