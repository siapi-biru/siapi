'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const { resolve } = require('path');
const favicon = require('koa-favicon');

/**
 * Favicon hook
 */

module.exports = siapi => {
  return {
    /**
     * Initialize the hook
     */

    initialize() {
      const { dir } = siapi;
      const {
        maxAge,
        path: faviconPath,
      } = siapi.config.middleware.settings.favicon;

      siapi.app.use(
        favicon(resolve(dir, faviconPath), {
          maxAge,
        })
      );
    },
  };
};
