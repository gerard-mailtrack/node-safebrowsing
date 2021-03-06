var Ranges = require('../util/Ranges');

var _ = require('lodash');
var package = require('../../package.json');
var url = require('url');

var PROTOCOL_VERSION = '3.0';

var DataRequestType = {
  getRequestURL: function(props) {
    return url.format({
      protocol: 'https',
      hostname: 'safebrowsing.google.com',
      pathname: 'safebrowsing/downloads',
      query: {
        client: 'api',
        key: props.apiKey,
        appver: props.clientVersion || package.version,
        pver: PROTOCOL_VERSION
      }
    });
  },

  getRequestBody: function(props) {
    var body = [];

    if (props.size) {
      body.push(`s;${props.size}`);
    }

    _.forOwn(props.lists || {}, function(value, key) {
      var chunkList = ['add', 'sub'].reduce(function(chunkList, type) {
        if (_.isArray(value[type]) && value[type].length > 0) {
          return chunkList.concat([
            type.charAt(0),
            Ranges.formatRanges(value[type])
          ]);
        }
        return chunkList;
      }, []);

      body.push([key, chunkList.join(':')].join(';'));
    });

    return body.join('\n') + '\n';
  },

  parseResponseBody: function(body) {
    var lines = body.split('\n');
    var list = null;
    var result = {delay: 0, isReset: false, lists: []};

    lines.forEach(function(line) {
      var keyAndValue = line.split(':', 2);
      var key = keyAndValue[0];
      var value = keyAndValue[1];

      switch (key) {
        case 'n':
          result.delay = parseInt(value, 10);
          break;
        case 'r':
          result.isReset = true;
          break;
        case 'i':
          list = {
            name: value,
            urls: [], 
            expireAdd: [], 
            expireSub: []
          };
          result.lists.push(list);
          break;
        case 'u':
          list.urls.push(`https://${value}`);
          break;
        case 'ad':
          list.expireAdd = Ranges.parseRanges(value);
          break;
        case 'sd':
          list.expireSub = Ranges.parseRanges(value);
          break;
      }
    });

    return result;
  }
};

module.exports = DataRequestType;