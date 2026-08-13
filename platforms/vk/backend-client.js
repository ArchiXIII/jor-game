(function () {
  'use strict';

  class JorVkBackendClient {
    constructor(options) {
      const source = options && typeof options === 'object' ? options : {};
      this.baseUrl = String(source.baseUrl || '').replace(/\/+$/, '');
      this.getLaunchParams = typeof source.getLaunchParams === 'function' ? source.getLaunchParams : () => '';
      this.clientVersion = Math.max(0, Math.floor(Number(source.clientVersion) || 0));
      this.timeout = Math.max(1000, Math.floor(Number(source.timeout) || 6000));
    }

    async request(path, options) {
      if (!this.baseUrl || !window.fetch) throw new Error('BACKEND_UNAVAILABLE');
      const source = options && typeof options === 'object' ? options : {};
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const headers = { Accept: 'application/json' };
      const launchParams = String(this.getLaunchParams() || '');
      if (launchParams) headers['X-VK-Launch-Params'] = launchParams;
      if (this.clientVersion) headers['X-Client-Version'] = String(this.clientVersion);
      if (source.body !== undefined) headers['Content-Type'] = 'application/json';
      const timer = controller ? window.setTimeout(() => controller.abort(), this.timeout) : 0;
      try {
        const response = await window.fetch(this.baseUrl + path, {
          method: source.method || 'GET',
          headers,
          body: source.body === undefined ? undefined : JSON.stringify(source.body),
          signal: controller ? controller.signal : undefined,
          cache: 'no-store',
          credentials: 'omit'
        });
        if (!response.ok) {
          const error = new Error('BACKEND_HTTP_' + response.status);
          error.status = response.status;
          throw error;
        }
        const text = await response.text();
        return text ? JSON.parse(text) : null;
      } catch (error) {
        if (error?.name === 'AbortError') throw new Error('BACKEND_TIMEOUT');
        throw error;
      } finally {
        if (timer) window.clearTimeout(timer);
      }
    }

    submitVkScore(score) {
      return this.request('/v1/vk/jor/endless-score', {
        method: 'POST',
        body: { score: Math.max(0, Math.floor(Number(score) || 0)) }
      });
    }

    submitOkScore(score, playerName) {
      return this.request('/v1/ok/jor/endless-score', {
        method: 'POST',
        body: {
          score: Math.max(0, Math.floor(Number(score) || 0)),
          playerName: String(playerName || '').trim()
        }
      });
    }

    getOkLeaderboard() {
      return this.request('/v1/ok/jor/leaderboards/endless');
    }
  }

  window.JorVkBackendClient = JorVkBackendClient;
})();
