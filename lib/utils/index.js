'use strict';

// Dependencies.
const { isEmpty } = require('lodash');
const openBrowser = require('./openBrowser');

module.exports = {
  /*
   * Return false where there is no administrator, otherwise return true.
   */
  async isInitialised(siapi) {
    try {
      if (isEmpty(siapi.admin)) {
        return true;
      }

      const numberOfAdministrators = await siapi.query('user', 'admin').find({ _limit: 1 });

      return numberOfAdministrators.length > 0;
    } catch (err) {
      siapi.stopWithError(err);
    }
  },
  openBrowser,
};
