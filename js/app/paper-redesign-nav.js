(function wirePaperRedesignNavigation(){
  const on = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  };
  const openSettings = () => {
    const settingsButton = document.getElementById('homeSettingsBtn');
    if (settingsButton) settingsButton.click();
  };

  ['homeLevelsBtn','homeTopLevelsBtn'].forEach(id=>on(id,()=>openRoadmap('home')));
  ['homeDashboardBtn','homeTopDashboardBtn'].forEach(id=>on(id,()=>showDashboard()));
  ['homeBadgesBtn','homeTopBadgesBtn'].forEach(id=>on(id,()=>showAchievements()));
  ['homeHelpBtn','homeTopHelpBtn'].forEach(id=>on(id,()=>showHelp()));
  ['homeSideSettingsBtn','homeTopSettingsBtn'].forEach(id=>on(id,openSettings));
})();
