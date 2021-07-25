'use strict';

const _ = require('lodash');
const { getConfigUrls, contentTypes: contentTypesUtils } = require('siapi-utils');

const { createCoreApi } = require('../core-api');

module.exports = function(siapi) {
  // Set connections.
  siapi.connections = {};

  const defaultConnection = siapi.config.get('database.defaultConnection');

  // Set current connections.
  siapi.config.connections = siapi.config.get('database.connections', {});

  siapi.contentTypes = {};

  // Set models.
  siapi.models = Object.keys(siapi.api || []).reduce((acc, apiName) => {
    const api = siapi.api[apiName];

    for (let modelName in api.models) {
      let model = siapi.api[apiName].models[modelName];

      // mutate model
      contentTypesUtils.createContentType(model, { modelName, defaultConnection }, { apiName });

      siapi.contentTypes[model.uid] = model;

      const { service, controller } = createCoreApi({ model, api, siapi });

      _.set(siapi.api[apiName], ['services', modelName], service);
      _.set(siapi.api[apiName], ['controllers', modelName], controller);

      acc[modelName] = model;
    }
    return acc;
  }, {});

  // Set components
  Object.keys(siapi.components).forEach(componentName => {
    const component = siapi.components[componentName];
    component.connection = component.connection || defaultConnection;
  });

  // Set controllers.
  siapi.controllers = Object.keys(siapi.api || []).reduce((acc, key) => {
    for (let index in siapi.api[key].controllers) {
      let controller = siapi.api[key].controllers[index];
      controller.identity = controller.identity || _.upperFirst(index);
      acc[index] = controller;
    }

    return acc;
  }, {});

  // Set services.
  siapi.services = Object.keys(siapi.api || []).reduce((acc, key) => {
    for (let index in siapi.api[key].services) {
      acc[index] = siapi.api[key].services[index];
    }

    return acc;
  }, {});

  // Set routes.
  siapi.config.routes = Object.keys(siapi.api || []).reduce((acc, key) => {
    return acc.concat(_.get(siapi.api[key], 'config.routes') || {});
  }, []);

  // Init admin controllers.
  Object.keys(siapi.admin.controllers || []).forEach(key => {
    if (!siapi.admin.controllers[key].identity) {
      siapi.admin.controllers[key].identity = key;
    }
  });

  // Init admin models.
  Object.keys(siapi.admin.models || []).forEach(modelName => {
    let model = siapi.admin.models[modelName];

    // mutate model
    contentTypesUtils.createContentType(model, { modelName, defaultConnection });

    siapi.contentTypes[model.uid] = model;
  });

  Object.keys(siapi.plugins).forEach(pluginName => {
    let plugin = siapi.plugins[pluginName];
    Object.assign(plugin, {
      controllers: plugin.controllers || [],
      services: plugin.services || [],
      models: plugin.models || [],
    });

    Object.keys(plugin.controllers).forEach(key => {
      let controller = plugin.controllers[key];

      Object.assign(controller, {
        identity: controller.identity || key,
      });
    });

    Object.keys(plugin.models || []).forEach(modelName => {
      let model = plugin.models[modelName];

      // mutate model
      contentTypesUtils.createContentType(model, { modelName, defaultConnection }, { pluginName });

      siapi.contentTypes[model.uid] = model;
    });
  });

  // Preset config in alphabetical order.
  siapi.config.middleware.settings = Object.keys(siapi.middleware).reduce((acc, current) => {
    // Try to find the settings in the current environment, then in the main configurations.
    const currentSettings = _.merge(
      _.cloneDeep(_.get(siapi.middleware[current], ['defaults', current], {})),
      siapi.config.get(['middleware', 'settings', current], {})
    );

    acc[current] = !_.isObject(currentSettings) ? {} : currentSettings;

    // Ensure that enabled key exist by forcing to false.
    _.defaults(acc[current], { enabled: false });

    return acc;
  }, {});

  siapi.config.hook.settings = Object.keys(siapi.hook).reduce((acc, current) => {
    // Try to find the settings in the current environment, then in the main configurations.
    const currentSettings = _.merge(
      _.cloneDeep(_.get(siapi.hook[current], ['defaults', current], {})),
      siapi.config.get(['hook', 'settings', current], {})
    );

    acc[current] = !_.isObject(currentSettings) ? {} : currentSettings;

    // Ensure that enabled key exist by forcing to false.
    _.defaults(acc[current], { enabled: false });

    return acc;
  }, {});

  // default settings
  siapi.config.port = siapi.config.get('server.port') || siapi.config.port;
  siapi.config.host = siapi.config.get('server.host') || siapi.config.host;

  const { serverUrl, adminUrl, adminPath } = getConfigUrls(siapi.config.get('server'));

  siapi.config.server = siapi.config.server || {};
  siapi.config.server.url = serverUrl;
  siapi.config.admin.url = adminUrl;
  siapi.config.admin.path = adminPath;

  // check if we should serve admin panel
  const shouldServeAdmin = siapi.config.get(
    'server.admin.serveAdminPanel',
    siapi.config.serveAdminPanel
  );

  if (!shouldServeAdmin) {
    siapi.config.serveAdminPanel = false;
  }
};
