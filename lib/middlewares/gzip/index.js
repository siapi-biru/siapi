'use strict';

/**
 * Gzip hook
 */
const compress = require('koa-compress');

module.exports = siapi => {
  return {
    /**
     * Initialize the hook
     */

    initialize() {
      const { options = {} } = siapi.config.middleware.settings.gzip;
      siapi.app.use(compress(options));
    },
  };
};
