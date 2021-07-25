'use strict';

module.exports = siapi => {
  return {
    initialize() {
      siapi.app.use(async (ctx, next) => {
        await next();

        ctx.set(
          'X-Powered-By',
          siapi.config.get('middleware.settings.poweredBy.value', 'Siapi <siapi.io>')
        );
      });
    },
  };
};
