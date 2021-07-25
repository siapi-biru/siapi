'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const _ = require('lodash');
const koaStatic = require('koa-static');
const utils = require('../../utils');
const serveStatic = require('./serve-static');

/**
 * Public assets hook
 */

module.exports = siapi => {
  return {
    /**
     * Initialize the hook
     */

    async initialize() {
      const { defaultIndex, maxAge, path: publicPath } = siapi.config.middleware.settings.public;
      const staticDir = path.resolve(siapi.dir, publicPath || siapi.config.paths.static);

      if (defaultIndex === true) {
        const index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

        const serveIndexPage = async (ctx, next) => {
          // defer rendering of siapi index page
          await next();
          if (ctx.body != null || ctx.status !== 404) return;

          ctx.url = 'index.html';
          const isInitialised = await utils.isInitialised(siapi);
          const data = {
            serverTime: new Date().toUTCString(),
            isInitialised,
            ..._.pick(siapi, [
              'config.info.version',
              'config.info.name',
              'config.admin.url',
              'config.server.url',
              'config.environment',
              'config.serveAdminPanel',
            ]),
          };
          const content = _.template(index)(data);
          const body = stream.Readable({
            read() {
              this.push(Buffer.from(content));
              this.push(null);
            },
          });
          // Serve static.
          ctx.type = 'html';
          ctx.body = body;
        };

        siapi.router.get('/', serveIndexPage);
        siapi.router.get('/index.html', serveIndexPage);
        siapi.router.get(
          '/assets/images/(.*)',
          serveStatic(path.resolve(__dirname, 'assets/images'), { maxage: maxAge, defer: true })
        );
      }

      // serve files in public folder unless a sub router renders something else
      siapi.router.get(
        '/(.*)',
        koaStatic(staticDir, {
          maxage: maxAge,
          defer: true,
        })
      );

      if (!siapi.config.serveAdminPanel) return;

      const buildDir = path.resolve(siapi.dir, 'build');
      const serveAdmin = ctx => {
        ctx.type = 'html';
        ctx.body = fs.createReadStream(path.join(buildDir + '/index.html'));
      };

      siapi.router.get(
        `${siapi.config.admin.path}/*`,
        serveStatic(buildDir, { maxage: maxAge, defer: false, index: 'index.html' })
      );

      siapi.router.get(`${siapi.config.admin.path}`, serveAdmin);
      siapi.router.get(`${siapi.config.admin.path}/*`, serveAdmin);
    },
  };
};
