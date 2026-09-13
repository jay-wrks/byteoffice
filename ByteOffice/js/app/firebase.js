(function(){
  'use strict';

  const firebaseConfig={
    apiKey:'AIzaSyARebn_UXZjQLH2sg1WsQLpMNmnqUo2eXo',
    authDomain:'jay-dsa-games.firebaseapp.com',
    projectId:'jay-dsa-games',
    storageBucket:'jay-dsa-games.firebasestorage.app',
    messagingSenderId:'444843895218',
    appId:'1:444843895218:web:9cac8134442e1172e3dcab'
  };

  const status=$('#homeAuthStatus'), authTitle=$('#homeAuthTitle'), authKicker=$('#homeAuthKicker'), authButton=$('#homeAuthBtn'), resumeButton=$('#homeResumeBtn'), consolidatedList=$('#homeLeaderboardTop3'), leaderboardLists={stars:$('#homeLeaderboardStars'),steps:$('#homeLeaderboardSteps'),actions:$('#homeLeaderboardActions')};
  if(!status||!authButton||!consolidatedList||!leaderboardLists.stars||!leaderboardLists.steps||!leaderboardLists.actions) return;

  function startFirebase(){
    // Firebase scripts are deferred so they do not block the game shell. Keep
    // initialization alive until the SDK arrives instead of silently leaving
    // the account and leaderboard buttons without handlers.
    if(!window.firebase){ setTimeout(startFirebase,80); return; }

  const app=firebase.initializeApp(firebaseConfig);
  const auth=firebase.auth(app), db=firebase.firestore(app);
  const provider=new firebase.auth.GoogleAuthProvider();
  const LEADERBOARD_CACHE_KEY='byteOfficeLeaderboardCacheV2';
  const LEADERBOARD_CACHE_TTL=5*60*1000;
  const leaderboardRequests={};
  const leaderboardRowsByFilter={stars:null,steps:null,actions:null};
  let currentUser=null;

  function cloudStats(){
    const levelMetaValues=Object.values(metaStore.levels||{});
    return {
      completedLevels:completed.length,
      totalStars:levelMetaValues.reduce((n,m)=>n+(m.sizeStar?1:0)+(m.stepStar?1:0),0),
      totalSteps:levelMetaValues.reduce((n,m)=>n+(Number.isFinite(m.bestSteps)?m.bestSteps:0),0),
      totalSize:levelMetaValues.reduce((n,m)=>n+(Number.isFinite(m.bestSize)?m.bestSize:0),0),
      hasScore:completed.length>0,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    };
  }

  function safePhotoUrl(value){
    try{
      const url=new URL(value||'');
      return /^https?:$/.test(url.protocol)?url.href:'';
    }catch(_){ return ''; }
  }

  function initials(name){
    return String(name||'Google operator').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'?';
  }

  function avatarMarkup(name,photo,extraClass='',id=''){
    const safePhoto=safePhotoUrl(photo);
    return `<span${id?` id="${id}"`:''} class="profile-avatar ${extraClass}" aria-hidden="true">${safePhoto?`<img src="${escapeHtml(safePhoto)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:''}<span>${escapeHtml(initials(name))}</span></span>`;
  }

  function mergeCloudProgress(data){
    if(!data||typeof data!=='object') return;
    if(Array.isArray(data.completed)){
      completed=[...new Set([...completed,...data.completed.filter(Number.isInteger)])].sort((a,b)=>a-b);
      localStorage.setItem('byteOfficeCompletedV17',JSON.stringify(completed));
    }
    const remoteLevels=data.meta?.levels||{};
    if(!metaStore.levels) metaStore.levels={};
    Object.entries(remoteLevels).forEach(([id,remote])=>{
      const local=metaStore.levels[id]||{}, merged={...local,...remote};
      if(Number.isFinite(local.bestSize)&&Number.isFinite(remote.bestSize)) merged.bestSize=Math.min(local.bestSize,remote.bestSize);
      if(Number.isFinite(local.bestSteps)&&Number.isFinite(remote.bestSteps)) merged.bestSteps=Math.min(local.bestSteps,remote.bestSteps);
      merged.sizeStar=!!(local.sizeStar||remote.sizeStar);
      merged.stepStar=!!(local.stepStar||remote.stepStar);
      merged.dualStars=!!(local.dualStars||remote.dualStars);
      metaStore.levels[id]=merged;
    });
    saveMeta();
    refreshHome?.();
  }

  async function syncCloudProgress(){
    if(!currentUser) return;
    const stats=cloudStats();
    await Promise.all([
      db.collection('userInfo').doc(currentUser.uid).set({
        uid:currentUser.uid,
        displayName:currentUser.displayName||'Anonymous operator',
        photoURL:currentUser.photoURL||'',
        completed,
        meta:{levels:metaStore.levels||{}},
        ...stats
      },{merge:true})
    ]);
  }

  function setAuthUi(user){
    currentUser=user||null;
    const hasStarted=Object.prototype.hasOwnProperty.call(workspaceStore,'lastLevel')||completed.length>0;
    const resumeHint=resumeButton?.querySelector('small');
    if(user){
      authKicker.textContent='SIGNED IN AS';
      authTitle.textContent=user.displayName||'Google operator';
      status.textContent='Ready for your next assignment';
      const authAvatar=$('#homeAuthAvatar');
      if(authAvatar) authAvatar.outerHTML=avatarMarkup(user.displayName,user.photoURL,'home-profile-avatar is-visible','homeAuthAvatar');
      authButton.textContent='Sign out';
      authButton.classList.add('is-signed-in');
      if(resumeHint) resumeHint.textContent=hasStarted?'Continue your saved assignment':'Start your first assignment';
      if(resumeButton) resumeButton.disabled=false;
    }else{
      authKicker.textContent='GOOGLE ACCOUNT REQUIRED';
      authTitle.textContent='Sign in to unlock the game';
      status.textContent='Google sign-in required · no guest mode';
      const authAvatar=$('#homeAuthAvatar');
      if(authAvatar) authAvatar.outerHTML=avatarMarkup('', '', 'home-profile-avatar is-visible','homeAuthAvatar');
      authButton.textContent='Sign in with Google';
      authButton.classList.remove('is-signed-in');
      if(resumeHint) resumeHint.textContent=hasStarted?'Sign in with Google to continue':'Sign in with Google to begin';
      if(resumeButton) resumeButton.disabled=true;
    }
    authButton.disabled=false;
    authButton.classList.remove('is-loading');
  }

  function setAuthChecking(){
    authKicker.textContent='CHECKING GOOGLE SESSION';
    authTitle.textContent='Restoring your session…';
    status.textContent='Checking your saved Google login';
    authButton.disabled=true;
    authButton.classList.add('is-loading');
    const label=authButton.querySelector('span:last-child');
    if(label) label.textContent='Checking session…';
    if(resumeButton) resumeButton.disabled=true;
  }

  function showAuthGate(){
    showModal('<div class="modal-heading"><span>ACCESS REQUIRED</span><h2>Sign in to play</h2><p>Byte Office uses your Google account to save progress and place your results on the leaderboard. Guest play is not available.</p></div><div class="auth-gate-actions"><button id="authGateBtn" class="modal-primary">Continue with Google</button></div>');
    $('#authGateBtn')?.addEventListener('click',()=>{ closeModal(); signIn(); });
  }

  async function signIn(){
    authButton.disabled=true;
    try{ await auth.signInWithPopup(provider); }
    catch(err){
      if(err.code!=='auth/popup-closed-by-user') status.textContent='Google sign-in failed · try again';
    }finally{ authButton.disabled=false; }
  }

  const leaderboardModes={
    stars:{rule:'STARS · CLEARS',where:true,primary:['totalStars','desc'],secondary:['completedLevels','desc'],metric:row=>[row.totalStars||0,'stars']},
    steps:{rule:'STEPS · CLEARS',where:true,primary:['totalSteps','asc'],secondary:['completedLevels','desc'],metric:row=>[row.totalSteps||0,'steps']},
    actions:{rule:'ACTIONS · CLEARS',where:true,primary:['totalSize','asc'],secondary:['completedLevels','desc'],metric:row=>[row.totalSize||0,'actions']}
  };

  function readLeaderboardCache(filter){
    try{
      const cache=JSON.parse(localStorage.getItem(LEADERBOARD_CACHE_KEY)||'{}');
      const entry=cache?.[filter];
      if(!entry||!Array.isArray(entry.rows)) return null;
      return {rows:entry.rows,fresh:Date.now()-Number(entry.savedAt||0)<LEADERBOARD_CACHE_TTL};
    }catch(_){ return null; }
  }

  function writeLeaderboardCache(filter,rows){
    try{
      const cache=JSON.parse(localStorage.getItem(LEADERBOARD_CACHE_KEY)||'{}');
      cache[filter]={savedAt:Date.now(),rows};
      localStorage.setItem(LEADERBOARD_CACHE_KEY,JSON.stringify(cache));
    }catch(_){ /* Caching is optional and must never block the leaderboard. */ }
  }

  function renderLeaderboardRows(rows,mode,list){
    if(!rows.length){ list.innerHTML='<p class="home-leaderboard-loading">No operators have posted a score yet.</p>'; return; }
    list.innerHTML=rows.map((row,i)=>{const [value,label]=mode.metric(row);return `<div class="home-leaderboard-row"><b>${String(i+1).padStart(2,'0')}</b>${avatarMarkup(row.displayName,row.photoURL,'leaderboard-avatar')}<span title="${escapeHtml(row.displayName||'Anonymous operator')}">${escapeHtml(row.displayName||'Anonymous operator')}</span><strong>${value}</strong><small>${label}</small></div>`;}).join('');
  }

  function renderConsolidatedLeaderboard(){
    if(Object.values(leaderboardRowsByFilter).some(rows=>rows===null)){
      consolidatedList.innerHTML='<p class="home-leaderboard-loading">Building the combined ranking…</p>';
      return;
    }
    const labels={stars:'Stars',steps:'Steps',actions:'Actions'};
    const totals=new Map();
    Object.entries(leaderboardRowsByFilter).forEach(([filter,rows])=>rows.forEach((row,index)=>{
      if(!row.uid) return;
      const entry=totals.get(row.uid)||{...row,points:0,boards:0,ranks:{}};
      entry.points+=15-index;
      entry.boards++;
      entry.ranks[filter]=index+1;
      totals.set(row.uid,entry);
    }));
    const top=[...totals.values()].sort((a,b)=>b.points-a.points||b.boards-a.boards||b.totalStars-a.totalStars||b.completedLevels-a.completedLevels||a.totalSteps-b.totalSteps||a.totalSize-b.totalSize).slice(0,3);
    if(!top.length){ consolidatedList.innerHTML='<p class="home-leaderboard-loading">No operators have posted enough scores yet.</p>'; return; }
    consolidatedList.innerHTML=top.map((row,index)=>{
      const boardRanks=Object.entries(labels).filter(([filter])=>row.ranks[filter]).map(([filter,label])=>`${label} #${row.ranks[filter]}`).join(' · ');
      return `<div class="home-top3-row"><b class="home-top3-place">${String(index+1).padStart(2,'0')}</b>${avatarMarkup(row.displayName,row.photoURL,'home-top3-avatar')}<span class="home-top3-identity"><strong>${escapeHtml(row.displayName||'Anonymous operator')}</strong><small>${row.points} ranking points · ${boardRanks}</small></span><em>${row.points}<small>PTS</small></em></div>`;
    }).join('');
  }

  async function renderLeaderboardPreview(filter='stars'){
    const mode=leaderboardModes[filter]||leaderboardModes.stars;
    const leaderboardList=leaderboardLists[filter];
    const cached=readLeaderboardCache(filter);
    if(cached){
      leaderboardRowsByFilter[filter]=cached.rows;
      renderConsolidatedLeaderboard();
      renderLeaderboardRows(cached.rows,mode,leaderboardList);
      if(cached.fresh) return;
    }else leaderboardList.innerHTML='<p class="home-leaderboard-loading">Loading standings…</p>';
    if(leaderboardRequests[filter]) return leaderboardRequests[filter];
    leaderboardRequests[filter]=(async()=>{
      try{
        let query=db.collection('userInfo');
        if(mode.where) query=query.where('hasScore','==',true);
        const snap=await query.orderBy(mode.primary[0],mode.primary[1]).orderBy(mode.secondary[0],mode.secondary[1]).limit(15).get();
        const rows=snap.docs.map(doc=>{const row=doc.data();return {
          uid:doc.id,
          displayName:typeof row.displayName==='string'?row.displayName:'Anonymous operator',
          photoURL:safePhotoUrl(row.photoURL),
          completedLevels:Number.isInteger(row.completedLevels)?row.completedLevels:0,
          totalStars:Number.isInteger(row.totalStars)?row.totalStars:0,
          totalSteps:Number.isInteger(row.totalSteps)?row.totalSteps:0,
          totalSize:Number.isInteger(row.totalSize)?row.totalSize:0
        };});
        writeLeaderboardCache(filter,rows);
        leaderboardRowsByFilter[filter]=rows;
        renderConsolidatedLeaderboard();
        renderLeaderboardRows(rows,mode,leaderboardList);
      }catch(_){
        if(!cached){ leaderboardRowsByFilter[filter]=[]; renderConsolidatedLeaderboard(); }
        if(!cached) leaderboardList.innerHTML='<p class="home-leaderboard-loading">Standings will appear here soon.</p>';
      }finally{ delete leaderboardRequests[filter]; }
    })();
    return leaderboardRequests[filter];
  }

  authButton.addEventListener('click',()=>currentUser?auth.signOut():signIn());
  setAuthChecking();
  auth.onAuthStateChanged(async user=>{
    setAuthUi(user);
    if(!user) return;
    try{
      const snap=await db.collection('userInfo').doc(user.uid).get();
      mergeCloudProgress(snap.exists?snap.data():null);
      await syncCloudProgress();
    }catch(err){ status.textContent='Signed in · cloud sync unavailable'; console.warn('Byte Office cloud sync failed',err); }
  });

  window.byteOfficeCloud={auth,db,get currentUser(){return currentUser;},syncCloudProgress};
  window.byteOfficeRequireAuth=()=>{ if(currentUser) return true; showAuthGate(); return false; };
  Object.keys(leaderboardModes).forEach(filter=>renderLeaderboardPreview(filter));
  }

  startFirebase();
})();
