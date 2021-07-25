'use strict';

const convert = require('koa-convert');
const { csp } = require('koa-lusca');
/**
 * CSP hook
 */

module.exports = siapi => {
  return {
    /**
     * Initialize the hook
     */

    initialize() {
      siapi.app.use(async (ctx, next) => {
        if (ctx.request.admin) return await next();

        return await convert(csp(siapi.config.middleware.settings.csp))(
          ctx,
          next
        );
      });
    },
  };
};
