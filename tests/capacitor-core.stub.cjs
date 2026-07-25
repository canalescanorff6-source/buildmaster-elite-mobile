const noopPlugin = new Proxy({}, {
  get() {
    return async () => ({ value: null });
  }
});

module.exports = {
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web'
  },
  CapacitorHttp: {
    request: async () => ({ status: 503, data: {}, headers: {}, url: '' })
  },
  registerPlugin: () => noopPlugin
};
