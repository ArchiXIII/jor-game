(function () {
  'use strict';

  window.jorYandexSdkPromise = typeof YaGames === 'undefined'
    ? null
    : YaGames.init().then(function (sdk) {
        try {
          if (typeof sdk.features?.LoadingAPI?.ready === 'function') {
            sdk.features.LoadingAPI.ready();
            window.jorLoadingReadySent = true;
          }
        } catch (error) {
          window.jorLoadingReadyError = error;
        }
        return sdk;
      }).catch(function (error) {
        window.jorYandexSdkInitError = error;
        return null;
      });
})();
