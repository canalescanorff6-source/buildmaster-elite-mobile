'use strict';

const noopListener = { remove: async () => undefined };
const plugin = new Proxy({}, {
  get(_target, property) {
    if (property === 'addListener') return async () => noopListener;
    if (property === 'removeAllListeners') return async () => undefined;
    return async () => ({ value: null, data: null, bytes: 0, ok: true });
  }
});

module.exports = {
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
    isPluginAvailable: () => false,
    convertFileSrc: (value) => value
  },
  CapacitorHttp: {
    request: async () => ({ status: 0, data: null, headers: {}, url: '' }),
    get: async () => ({ status: 0, data: null, headers: {}, url: '' }),
    post: async () => ({ status: 0, data: null, headers: {}, url: '' })
  },
  registerPlugin: () => plugin
};
