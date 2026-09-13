(function(){
  'use strict';

  const poses=[
    {name:'idle',classes:[],duration:1800},
    {name:'walking',classes:['walking'],duration:1300},
    {name:'carrying',classes:['walking','carrying'],duration:1300},
    {name:'pickup',classes:['reaching'],duration:1100},
    {name:'placement',classes:['placing'],duration:1100},
    {name:'copying',classes:['copying'],duration:1100},
    {name:'calculating',classes:['calculating'],duration:1500},
    {name:'thinking',classes:['thinking'],duration:1400},
    {name:'discarding',classes:['throwing'],duration:1100},
    {name:'error',classes:['error-pose'],duration:1300},
    {name:'celebrating',classes:['celebrate'],duration:1500}
  ];
  const poseClasses=[...new Set(poses.flatMap(pose=>pose.classes))];
  let poseIndex=0;
  let poseTimer=0;

  function markup(className=''){
    return `<div class="${className} worker-wrap robot-wrap" data-byte-head-cycle aria-hidden="true"><div class="byte-head-avatar-robot worker robot"><div class="worker-head robot-head"><span class="robot-antenna"><i></i></span><span class="robot-ear ear-left"></span><span class="robot-ear ear-right"></span><span class="robot-face-screen"><span class="eye eye-l"></span><span class="eye eye-r"></span><span class="mouth"></span><span class="robot-cheek cheek-l"></span><span class="robot-cheek cheek-r"></span></span></div></div></div>`;
  }
  function reducedMotion(){
    return document.body?.classList.contains('reduced-motion')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }
  function refresh(){
    const pose=reducedMotion()?poses[0]:(poses[poseIndex]||poses[0]);
    document.querySelectorAll('[data-byte-head-cycle]').forEach(avatar=>{
      avatar.classList.remove(...poseClasses);
      if(pose.classes.length) avatar.classList.add(...pose.classes);
      avatar.dataset.pose=pose.name;
    });
  }
  function schedule(){
    if(poseTimer){clearTimeout(poseTimer);poseTimer=0;}
    if(reducedMotion()){
      poseIndex=0;
      refresh();
      return;
    }
    refresh();
    const pose=poses[poseIndex]||poses[0];
    poseTimer=setTimeout(()=>{
      poseTimer=0;
      poseIndex=(poseIndex+1)%poses.length;
      schedule();
    },pose.duration);
  }
  function observe(){
    const root=document.documentElement;
    if(!root) return;
    new MutationObserver(refresh).observe(root,{childList:true,subtree:true});
    if(document.body) new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
    const motionQuery=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    motionQuery?.addEventListener?.('change',schedule);
    schedule();
  }

  window.ByteOfficeHeadAvatar={markup,refresh};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',observe,{once:true});
  else observe();
})();
