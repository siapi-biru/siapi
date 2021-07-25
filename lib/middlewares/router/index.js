'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const Router = require('koa-router');
const createEndpointComposer = require('./utils/composeEndpoint');
/**
 * Router hook
 */

module.exports = siapi => {
  const composeEndpoint = createEndpointComposer(siapi);

  return {
    /**
     * Initialize the hook
     */

    initialize() {
      _.forEach(siapi.config.routes, value => {
        composeEndpoint(value, { router: siapi.router });
      });

      siapi.router.prefix(siapi.config.get('middleware.settings.router.prefix', ''));

      if (_.has(siapi.admin, 'config.routes')) {
        const router = new Router({
          prefix: '/admin',
        });

        _.get(siapi.admin, 'config.routes', []).forEach(route => {
          composeEndpoint(route, { plugin: 'admin', router });
        });

        // Mount admin router on Siapi router
        siapi.app.use(router.routes()).use(router.allowedMethods());
      }

      if (siapi.plugins) {
        // Parse each plugin's routes.
        _.forEach(siapi.plugins, (plugin, pluginName) => {
          const router = new Router({
            prefix: `/${pluginName}`,
          });

          (plugin.config.routes || []).forEach(route => {
            const hasPrefix = _.has(route.config, 'prefix');
            composeEndpoint(route, {
              plugin: pluginName,
              router: hasPrefix ? siapi.router : router,
            });
          });

          // Mount plugin router
          siapi.app.use(router.routes()).use(router.allowedMethods());
        });
      }
    },
  };
};
