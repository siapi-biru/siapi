'use strict';

/**
 * Module dependencies
 */
const convert = require('koa-convert');
const { hsts } = require('koa-lusca');

/**
 * HSTS hook
 */

module.exports = siapi => {
  return {
    /**
     * Initialize the hook
     */

    initialize() {
      siapi.app.use(async (ctx, next) => {
        if (ctx.request.admin) return next();

        return await convert(hsts(siapi.config.middleware.settings.hsts))(
          ctx,
          next
        );
      });
    },
  };
};
