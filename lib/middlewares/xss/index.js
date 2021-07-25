'use strict';

const convert = require('koa-convert');
const { xssProtection } = require('koa-lusca');

module.exports = siapi => {
  return {
    initialize() {
      const defaults = require('./defaults.json');

      siapi.app.use(async (ctx, next) => {
        if (ctx.request.admin) {
          return await convert(
            xssProtection({
              enabled: true,
              mode: defaults.xss.mode,
            })
          )(ctx, next);
        }

        const xssConfig = siapi.config.get('middleware.settings.xss');
        if (xssConfig.enabled) {
          return await convert(xssProtection(xssConfig))(ctx, next);
        }

        await next();
      });
    },
  };
};
