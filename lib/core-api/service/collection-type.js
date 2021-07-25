'use strict';

const { propOr } = require('lodash/fp');

const {
  hasDraftAndPublish,
  constants: { PUBLISHED_AT_ATTRIBUTE },
} = require('siapi-utils').contentTypes;

const setPublishedAt = data => {
  data[PUBLISHED_AT_ATTRIBUTE] = propOr(new Date(), PUBLISHED_AT_ATTRIBUTE, data);
};

/**
 *
 * Returns a collection type service to handle default core-api actions
 */
const createCollectionTypeService = ({ model, siapi, utils }) => {
  const { modelName } = model;

  const { sanitizeInput, getFetchParams } = utils;

  return {
    /**
     * Promise to fetch all records
     *
     * @return {Promise}
     */
    find(params, populate) {
      return siapi.entityService.find(
        { params: getFetchParams(params), populate },
        { model: modelName }
      );
    },

    /**
     * Promise to fetch record
     *
     * @return {Promise}
     */

    findOne(params, populate) {
      return siapi.entityService.findOne(
        { params: getFetchParams(params), populate },
        { model: modelName }
      );
    },

    /**
     * Promise to count record
     *
     * @return {Promise}
     */

    count(params) {
      return siapi.entityService.count({ params: getFetchParams(params) }, { model: modelName });
    },

    /**
     * Promise to add record
     *
     * @return {Promise}
     */

    create(data, { files } = {}) {
      const sanitizedData = sanitizeInput(data);
      if (hasDraftAndPublish(model)) {
        setPublishedAt(sanitizedData);
      }

      return siapi.entityService.create({ data: sanitizedData, files }, { model: modelName });
    },

    /**
     * Promise to edit record
     *
     * @return {Promise}
     */

    update(params, data, { files } = {}) {
      const sanitizedData = sanitizeInput(data);
      return siapi.entityService.update(
        { params, data: sanitizedData, files },
        { model: modelName }
      );
    },

    /**
     * Promise to delete a record
     *
     * @return {Promise}
     */

    delete(params) {
      return siapi.entityService.delete({ params }, { model: modelName });
    },

    /**
     * Promise to search records
     *
     * @return {Promise}
     */

    search(params) {
      return siapi.entityService.search({ params: getFetchParams(params) }, { model: modelName });
    },

    /**
     * Promise to count searched records
     *
     * @return {Promise}
     */
    countSearch(params) {
      return siapi.entityService.countSearch(
        { params: getFetchParams(params) },
        { model: modelName }
      );
    },
  };
};

module.exports = createCollectionTypeService;
