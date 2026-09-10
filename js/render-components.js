(function renderByteOfficeComponents() {
  const C = window.ByteOfficeComponents || {};
  const required = [
    'home', 'roadmap', 'pageCurtain', 'gameShell', 'missionPanel',
    'factoryPanel', 'robot', 'programPanel', 'modal'
  ];
  const missing = required.filter(name => typeof C[name] !== 'string');
  if (missing.length) {
    throw new Error(`Missing Byte Office components: ${missing.join(', ')}`);
  }

  const factory = C.factoryPanel.replace(
    '<div data-component="components/robot.html"></div>',
    C.robot
  );

  const game = C.gameShell
    .replace('<div data-component="components/mission-panel.html"></div>', C.missionPanel)
    .replace('<div data-component="components/factory-panel.html"></div>', factory)
    .replace('<div data-component="components/program-panel.html"></div>', C.programPanel);

  const root = document.getElementById('byteOfficeRoot');
  root.innerHTML = C.home + C.roadmap + C.pageCurtain + game + C.modal;
})();
