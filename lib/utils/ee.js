'use strict';

const licenseInfo = {
  type: "gold",
  customerId: "siapi",
  expireAt: "2099-12-04T00:00:00.000Z",
  isTrial: false,
  licenseKey: "930559d0-6eb3-4fe7-b79d-a59e1b47f26b",
  createdAt: 1606994305308
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
