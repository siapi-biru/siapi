'use strict';

const path = require('path');
const _ = require('lodash');
const session = require('koa-session');

/**
 * Session middleware
 */
module.exports = siapi => {
  const requireStore = store => {
    return require(path.resolve(siapi.config.appPath, 'node_modules', 'koa-' + store));
  };

  const defineStore = session => {
    if (_.isEmpty(_.get(session, 'client'))) {
      return siapi.log.error(
        '(middleware:session) please provide a valid client to store session'
      );
    } else if (_.isEmpty(_.get(session, 'connection'))) {
      return siapi.log.error(
        '(middleware:session) please provide connection for the session store'
      );
    } else if (!siapi.config.get(`database.connections.${session.connection}`)) {
      return siapi.log.error(
        '(middleware:session) please provide a valid connection for the session store'
      );
    }

    session.settings = siapi.config.get(`database.connections.${session.connection}`);

    // Define correct store name to avoid require to failed.
    switch (session.client.toLowerCase()) {
      case 'redis': {
        const store = requireStore('redis');

        session.settings.db = session.settings.database;

        return store(session.settings);
      }
      case 'mysql': {
        const Store = requireStore('mysql-session');

        return new Store(session.settings);
      }
      case 'mongo': {
        const Store = requireStore('generic-session-mongo');

        session.settings.db = session.settings.database;

        return new Store(session.settings);
      }
      case 'postgresql': {
        const Store = requireStore('pg-session');

        return new Store(session.settings, session.options);
      }
      case 'rethink': {
        const Store = requireStore('generic-session-rethinkdb');

        session.settings.dbName = session.settings.database;
        session.settings.tableName = session.settings.table;

        const sessionStore = new Store({
          connection: session.settings,
        });

        // Create the DB, tables and indexes to store sessions.
        sessionStore.setup();

        return sessionStore;
      }
      case 'sqlite': {
        const Store = requireStore('sqlite3-session');

        return new Store(session.fileName, session.options);
      }
      case 'sequelize': {
        const Store = requireStore('generic-session-sequelize');

        // Sequelize needs to be instantiated.
        if (!_.isObject(siapi.sequelize)) {
          return null;
        }

        return new Store(siapi.sequelize, session.options);
      }
      default: {
        return null;
      }
    }
  };

  return {
    initialize() {
      siapi.app.keys = siapi.config.get('middleware.settings.session.secretKeys');

      if (
        _.has(siapi.config.middleware.settings.session, 'client') &&
        _.isString(siapi.config.middleware.settings.session.client) &&
        siapi.config.middleware.settings.session.client !== 'cookie'
      ) {
        const store = defineStore(siapi.config.middleware.settings.session);

        if (!_.isEmpty(store)) {
          // Options object contains the defined store, the custom middlewares configurations
          // and also the function which are located to `./config/functions/session.js`
          const options = _.assign(
            {
              store,
            },
            siapi.config.middleware.settings.session
          );

          siapi.app.use(session(options, siapi.app));
          siapi.app.use((ctx, next) => {
            ctx.state = ctx.state || {};
            ctx.state.session = ctx.session || {};

            return next();
          });
        }
      } else if (
        _.has(siapi.config.middleware.settings.session, 'client') &&
        _.isString(siapi.config.middleware.settings.session.client) &&
        siapi.config.middleware.settings.session.client === 'cookie'
      ) {
        const options = _.assign(siapi.config.middleware.settings.session);

        siapi.app.use(session(options, siapi.app));
        siapi.app.use((ctx, next) => {
          ctx.state = ctx.state || {};
          ctx.state.session = ctx.session || {};

          return next();
        });
      }
    },
  };
};
