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

  const status=$('#homeAuthStatus'), authTitle=$('#homeAuthTitle'), authKicker=$('#homeAuthKicker'), authButton=$('#homeAuthBtn'), resumeButton=$('#homeResumeBtn'), leaderboardList=$('#homeLeaderboardList');
  if(!status||!authButton||!leaderboardList) return;

  function startFirebase(){
    // Firebase scripts are deferred so they do not block the game shell. Keep
    // initialization alive until the SDK arrives instead of silently leaving
    // the account and leaderboard buttons without handlers.
    if(!window.firebase){ setTimeout(startFirebase,80); return; }

  const app=firebase.initializeApp(firebaseConfig);
  const auth=firebase.auth(app), db=firebase.firestore(app);
  const provider=new firebase.auth.GoogleAuthProvider();
  let currentUser=null;

  function cloudStats(){
    const levelMetaValues=Object.values(metaStore.levels||{});
    return {
      completedLevels:completed.length,
      totalSteps:levelMetaValues.reduce((n,m)=>n+(Number.isFinite(m.bestSteps)?m.bestSteps:0),0),
      totalSize:levelMetaValues.reduce((n,m)=>n+(Number.isFinite(m.bestSize)?m.bestSize:0),0),
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
      db.collection('usersInfo').doc(currentUser.uid).set({completed,meta:{levels:metaStore.levels||{}}},{merge:true}),
      db.collection('leaderboard').doc(currentUser.uid).set({
        uid:currentUser.uid,
        displayName:currentUser.displayName||'Anonymous operator',
        photoURL:currentUser.photoURL||'',
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

  async function renderLeaderboardPreview(){
    try{
      const snap=await db.collection('leaderboard').orderBy('completedLevels','desc').orderBy('totalSteps','asc').limit(15).get();
      const rows=snap.docs.map(doc=>doc.data());
      if(!rows.length){ leaderboardList.innerHTML='<p class="home-leaderboard-loading">No operators have posted a score yet.</p>'; return; }
      leaderboardList.innerHTML=rows.map((row,i)=>`<div class="home-leaderboard-row"><b>${String(i+1).padStart(2,'0')}</b>${avatarMarkup(row.displayName,row.photoURL,'leaderboard-avatar')}<span title="${escapeHtml(row.displayName||'Anonymous operator')}">${escapeHtml(row.displayName||'Anonymous operator')}</span><strong>${row.completedLevels||0}</strong><small>${row.totalSteps||0}</small></div>`).join('');
    }catch(_){ leaderboardList.innerHTML='<p class="home-leaderboard-loading">Standings will appear here soon.</p>'; }
  }

  authButton.addEventListener('click',()=>currentUser?auth.signOut():signIn());
  setAuthChecking();
  auth.onAuthStateChanged(async user=>{
    setAuthUi(user);
    if(!user) return;
    try{
      const snap=await db.collection('usersInfo').doc(user.uid).get();
      mergeCloudProgress(snap.exists?snap.data():null);
      await syncCloudProgress();
    }catch(err){ status.textContent='Signed in · cloud sync unavailable'; console.warn('Byte Office cloud sync failed',err); }
  });

  window.byteOfficeCloud={auth,db,get currentUser(){return currentUser;},syncCloudProgress};
  window.byteOfficeRequireAuth=()=>{ if(currentUser) return true; showAuthGate(); return false; };
  renderLeaderboardPreview();
  }

  startFirebase();
})();
