'use strict';

const createTelemetryInstance = () => {
  return {
    destroy: () => {
    },
     send: async(event, payload) => {
      return true;
    },
  };
};

module.exports = createTelemetryInstance;
