'use strict';

const licenseInfo = {
  type: "gold",
  customerId: "siapi"
};

const features = {
  bronze: [],
  silver: [],
  gold: ['sso'],
};

const EE = () => true;

EE["licenseInfo"] = licenseInfo;
EE["isEE"] = true;
EE["features"] = {
  isEnabled: (feature) => {
    const {type} = licenseInfo;
    return features[type].includes(feature);
  },
  getEnabled: () => {
    const {type} = licenseInfo;
    return features[type];
  }
};

module.exports = EE;
