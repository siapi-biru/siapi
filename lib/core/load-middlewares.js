'use strict';

// Dependencies.
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const glob = require('../load/glob');
const findPackagePath = require('../load/package-path');

/**
 * Load middlewares
 */
module.exports = async function(siapi) {
  const { installedMiddlewares, installedPlugins, appPath } = siapi.config;

  let middlewares = {};

  const loaders = createLoaders(siapi);

  await loaders.loadMiddlewareDependencies(installedMiddlewares, middlewares);
  // internal middlewares
  await loaders.loadInternalMiddlewares(middlewares);
  // local middleware
  await loaders.loadLocalMiddlewares(appPath, middlewares);
  // plugins middlewares
  await loaders.loadPluginsMiddlewares(installedPlugins, middlewares);
  // local plugin middlewares
  await loaders.loadLocalPluginsMiddlewares(appPath, middlewares);
  // load admin middlwares
  await loaders.loadAdminMiddlewares(middlewares);

  return middlewares;
};

/**
 * Build loader functions
 * @param {*} siapi - siapi instance
 */
const createLoaders = siapi => {
  const loadMiddlewaresInDir = async (dir, middlewares) => {
    const files = await glob('*/*(index|defaults).*(js|json)', {
      cwd: dir,
    });

    files.forEach(f => {
      const name = f.split('/')[0];
      mountMiddleware(name, [path.resolve(dir, f)], middlewares);
    });
  };

  const loadInternalMiddlewares = middlewares =>
    loadMiddlewaresInDir(path.resolve(__dirname, '..', 'middlewares'), middlewares);

  const loadLocalMiddlewares = (appPath, middlewares) =>
    loadMiddlewaresInDir(path.resolve(appPath, 'middlewares'), middlewares);

  const loadPluginsMiddlewares = async (plugins, middlewares) => {
    for (let pluginName of plugins) {
      const dir = path.resolve(findPackagePath(`siapi-plugin-${pluginName}`), 'middlewares');
      await loadMiddlewaresInDir(dir, middlewares);
    }
  };

  const loadLocalPluginsMiddlewares = async (appPath, middlewares) => {
    const pluginsDir = path.resolve(appPath, 'plugins');
    if (!fs.existsSync(pluginsDir)) return;

    const pluginsNames = await fs.readdir(pluginsDir);

    for (let pluginFolder of pluginsNames) {
      // ignore files
      const stat = await fs.stat(path.resolve(pluginsDir, pluginFolder));
      if (!stat.isDirectory()) continue;

      const dir = path.resolve(pluginsDir, pluginFolder, 'middlewares');
      await loadMiddlewaresInDir(dir, middlewares);
    }
  };

  const loadAdminMiddlewares = async middlewares => {
    const middlewaresDir = 'middlewares';
    const dir = path.resolve(findPackagePath(`siapi-admin`), middlewaresDir);
    await loadMiddlewaresInDir(dir, middlewares);

    // load ee admin middlewares if they exist
    if (process.env.STRAPI_DISABLE_EE !== 'true' && siapi.EE) {
      await loadMiddlewaresInDir(`${dir}/../ee/${middlewaresDir}`, middlewares);
    }
  };

  const loadMiddlewareDependencies = async (packages, middlewares) => {
    for (let packageName of packages) {
      const baseDir = path.dirname(require.resolve(`siapi-middleware-${packageName}`));
      const files = await glob('*(index|defaults).*(js|json)', {
        cwd: baseDir,
        absolute: true,
      });

      mountMiddleware(packageName, files, middlewares);
    }
  };

  const mountMiddleware = (name, files, middlewares) => {
    files.forEach(file => {
      middlewares[name] = middlewares[name] || { loaded: false };

      if (_.endsWith(file, 'index.js') && !middlewares[name].load) {
        return Object.defineProperty(middlewares[name], 'load', {
          configurable: false,
          enumerable: true,
          get: () => require(file)(siapi),
        });
      }

      if (_.endsWith(file, 'defaults.json')) {
        middlewares[name].defaults = require(file);
        return;
      }
    });
  };

  return {
    loadInternalMiddlewares,
    loadLocalMiddlewares,
    loadPluginsMiddlewares,
    loadLocalPluginsMiddlewares,
    loadMiddlewareDependencies,
    loadAdminMiddlewares,
  };
};
