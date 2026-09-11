(function wirePaperRedesignNavigation(){
  const on = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  };

  on('homeLevelsNav', () => openRoadmap('home'));
  on('homeDashboardNav', () => showDashboard());
  on('homeBadgesNav', () => showAchievements());
  on('homeHelpNav', () => showHelp());
  on('homeSettingsNav', () => {
    const settingsButton = document.getElementById('homeSettingsBtn');
    if (settingsButton) settingsButton.click();
  });
})();
