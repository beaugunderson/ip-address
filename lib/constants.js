module.exports.BITS = 128;
module.exports.GROUPS = 8;

module.exports.SCOPES = {
  0: 'Reserved',
  1: 'Interface local',
  2: 'Link local',
  4: 'Admin local',
  5: 'Site local',
  8: 'Organization local',
  15: 'Global',
  16: 'Reserved'
};

module.exports.RE_BAD_CHARACTERS = /([^0-9a-f:\/%])/ig;
module.exports.RE_BAD_ADDRESS = /([0-9a-f]{5,}|:{3,}|[^:]:$|^:[^:]|\/$)/ig;

module.exports.RE_SUBNET_STRING = /\/\d{1,3}(?=%|$)/;
module.exports.RE_ZONE_STRING = /%.*$/;

module.exports.RE_URL = new RegExp(/\[{0,1}([0-9a-f:]+)\]{0,1}/);
module.exports.RE_URL_WITH_PORT = new RegExp(/\[([0-9a-f:]+)\]:([0-9]{1,5})/);
