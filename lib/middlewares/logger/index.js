'use strict';
const chalk = require('chalk');
const _ = require('lodash');

const codeToColor = code => {
  return code >= 500
    ? chalk.red(code)
    : code >= 400
    ? chalk.yellow(code)
    : code >= 300
    ? chalk.cyan(code)
    : code >= 200
    ? chalk.green(code)
    : code;
};

/**
 * Logger hook
 */

module.exports = siapi => {
  return {
    /**
     * Initialize the hook
     */
    initialize() {
      const { level, exposeInContext, requests } = siapi.config.middleware.settings.logger;

      const logLevels = Object.keys(siapi.log.levels.values);

      if (!_.includes(logLevels, level)) {
        throw new Error(
          "Invalid log level set in middleware configuration. Accepted values are: '" +
            logLevels.join("', '") +
            "'."
        );
      }

      siapi.log.level = level;

      if (exposeInContext) {
        siapi.app.context.log = siapi.log;
      }

      const isLogLevelEnvVariableSet = _.isString(process.env.STRAPI_LOG_LEVEL);

      if (isLogLevelEnvVariableSet && siapi.log.levelVal <= 20) {
        siapi.log.debug(
          `STRAPI_LOG_LEVEL environment variable is overridden by logger middleware. It only applies outside Siapi's middleware context.`
        );
      }

      if (requests && siapi.log.levelVal <= 20) {
        siapi.app.use(async (ctx, next) => {
          const start = Date.now();
          await next();
          const delta = Math.ceil(Date.now() - start);
          siapi.log.debug(`${ctx.method} ${ctx.url} (${delta} ms) ${codeToColor(ctx.status)}`);
        });
      }
    },
  };
};
