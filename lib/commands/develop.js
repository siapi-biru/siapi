'use strict';

const path = require('path');
const cluster = require('cluster');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const execa = require('execa');

const { logger } = require('siapi-utils');
const loadConfiguration = require('../core/app-configuration');
const siapi = require('../index');

/**
 * `$ siapi develop`
 *
 */
module.exports = async function({ build, watchAdmin, polling, browser }) {
  const dir = process.cwd();
  const config = loadConfiguration(dir);

  const adminWatchIgnoreFiles = config.get('server.admin.watchIgnoreFiles', []);
  const serveAdminPanel = config.get('server.admin.serveAdminPanel', true);

  const buildExists = fs.existsSync(path.join(dir, 'build'));
  // Don't run the build process if the admin is in watch mode
  if (build && !watchAdmin && serveAdminPanel && !buildExists) {
    try {
      execa.shellSync('npm run -s build -- --no-optimization', {
        stdio: 'inherit',
      });
    } catch (err) {
      process.exit(1);
    }
  }

  try {
    if (cluster.isMaster) {
      if (watchAdmin) {
        try {
          execa('npm', ['run', '-s', 'siapi', 'watch-admin', '--', '--browser', browser], {
            stdio: 'inherit',
          });
        } catch (err) {
          process.exit(1);
        }
      }

      cluster.on('message', (worker, message) => {
        switch (message) {
          case 'reload':
            logger.info('The server is restarting\n');
            worker.send('isKilled');
            break;
          case 'kill':
            worker.kill();
            cluster.fork();
            break;
          case 'stop':
            worker.kill();
            process.exit(1);
          default:
            return;
        }
      });

      cluster.fork();
    }

    if (cluster.isWorker) {
      const siapiInstance = siapi({
        dir,
        autoReload: true,
        serveAdminPanel: watchAdmin ? false : true,
      });

      watchFileChanges({
        dir,
        siapiInstance,
        watchIgnoreFiles: adminWatchIgnoreFiles,
        polling,
      });

      process.on('message', message => {
        switch (message) {
          case 'isKilled':
            siapiInstance.server.destroy(() => {
              process.send('kill');
            });
            break;
          default:
          // Do nothing.
        }
      });

      return siapiInstance.start();
    }
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
};

/**
 * Init file watching to auto restart siapi app
 * @param {Object} options - Options object
 * @param {string} options.dir - This is the path where the app is located, the watcher will watch the files under this folder
 * @param {Siapi} options.siapi - Siapi instance
 * @param {array} options.watchIgnoreFiles - Array of custom file paths that should not be watched
 */
function watchFileChanges({ dir, siapiInstance, watchIgnoreFiles, polling }) {
  const restart = () => {
    if (siapiInstance.reload.isWatching && !siapiInstance.reload.isReloading) {
      siapiInstance.reload.isReloading = true;
      siapiInstance.reload();
    }
  };

  const watcher = chokidar.watch(dir, {
    ignoreInitial: true,
    usePolling: polling,
    ignored: [
      /(^|[/\\])\../, // dot files
      /tmp/,
      '**/admin',
      '**/admin/**',
      'extensions/**/admin',
      'extensions/**/admin/**',
      '**/documentation',
      '**/documentation/**',
      '**/node_modules',
      '**/node_modules/**',
      '**/plugins.json',
      '**/index.html',
      '**/public',
      '**/public/**',
      '**/*.db*',
      '**/exports/**',
      ...watchIgnoreFiles,
    ],
  });

  watcher
    .on('add', path => {
      siapiInstance.log.info(`File created: ${path}`);
      restart();
    })
    .on('change', path => {
      siapiInstance.log.info(`File changed: ${path}`);
      restart();
    })
    .on('unlink', path => {
      siapiInstance.log.info(`File deleted: ${path}`);
      restart();
    });
}
