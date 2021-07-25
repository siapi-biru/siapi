'use strict';

const convert = require('koa-convert');
const { xframe } = require('koa-lusca');

/**
 * CRON hook
 */

module.exports = siapi => {
  return {
    /**
     * Initialize the hook
     */

    initialize() {
      const defaults = require('./defaults.json');

      siapi.app.use(async (ctx, next) => {
        if (ctx.request.admin) {
          return await convert(xframe(defaults.xframe))(ctx, next);
        }

        const { enabled, value } = siapi.config.get('middleware.settings.xframe', {});
        if (enabled) {
          return await convert(xframe(value))(ctx, next);
        }

        await next();
      });
    },
  };
};
