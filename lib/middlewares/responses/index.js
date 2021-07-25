'use strict';

const _ = require('lodash');

module.exports = siapi => {
  return {
    initialize() {
      siapi.app.use(async (ctx, next) => {
        await next();

        const responseFn = siapi.config.get(['functions', 'responses', ctx.status]);
        if (_.isFunction(responseFn)) {
          await responseFn(ctx);
        }
      });
    },
  };
};
