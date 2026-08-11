(function () {
  'use strict';

  window.JorPlatform?.registerAdapter({
    name: 'local',
    init() {
      return { ready: false, language: '' };
    },
    isAuthorized() {
      return false;
    },
    getPlayerId() {
      return 'guest';
    },
    getPlayerName() {
      return '';
    }
  });
})();
