(function () {
  'use strict';

  document.documentElement.classList.add('platformYandexBooting');
  window.jorYandexSdkPromise = typeof YaGames === 'undefined'
    ? null
    : YaGames.init().catch(function (error) {
        window.jorYandexSdkInitError = error;
        return null;
      });
})();
