'use strict';

const REPL = require('repl');
const siapi = require('../index');

/**
 * `$ siapi console`
 */
module.exports = () => {
  // Now load up the Siapi framework for real.
  const app = siapi();

  app.start(() => {
    const repl = REPL.start(app.config.info.name + ' > ' || 'siapi > '); // eslint-disable-line prefer-template

    repl.on('exit', function(err) {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }

      app.server.destroy();
      process.exit(0);
    });
  });
};
