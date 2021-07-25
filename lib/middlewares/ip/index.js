'use strict';

const ip = require('koa-ip');
/**
 * IP filter hook
 */

module.exports = siapi => {
  return {
    /**
     * Initialize the hook
     */

    initialize() {
      const { whiteList, blackList } = siapi.config.middleware.settings.ip;

      siapi.app.use(
        ip({
          whitelist: whiteList,
          blacklist: blackList,
        })
      );
    },
  };
};
