'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const { resolve } = require('path');
const locale = require('koa-locale');
const i18n = require('koa-i18n');
/**
 * Language hook
 */

module.exports = siapi => {
  return {
    /**
     * Initialize the hook
     */

    initialize() {
      locale(siapi.app);

      const { defaultLocale, modes, cookieName } = siapi.config.middleware.settings.language;

      const directory = resolve(siapi.config.appPath, siapi.config.paths.config, 'locales');

      siapi.app.use(
        i18n(siapi.app, {
          directory,
          locales: siapi.config.get('middleware.settings.language.locales', []),
          defaultLocale,
          modes,
          cookieName,
          extension: '.json',
        })
      );
    },
  };
};
