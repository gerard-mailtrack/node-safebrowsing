'use strict';

var DefaultLists = require('../list/DefaultLists');
var MatchResults = require('./MatchResults');
var MatchResultTypes = require('./MatchResultTypes');
var Promise = require('bluebird');
var Hashes = require('../util/Hashes');

var _ = require('lodash');
var getCanonicalizedURL = require('../util/getCanonicalizedURL');
var getLookupExpressions = require('../util/getLookupExpressions');
var getListResult = require('./getListResult');

class Matcher {
  constructor(cache) {
    this._cache = cache;
  }

  match(url, optLists) {
    var lists = optLists || DefaultLists;
    var canonicalized = getCanonicalizedURL(url);
    var exprs = getLookupExpressions(canonicalized);
    var prefixes = exprs.map((expr) => Hashes.getHashObject(expr));

    return Promise.map(
      lists, 
      (list) => getListResult(this._cache, list, prefixes, exprs)
    ).then((matches) => new MatchResults(url, matches, this, lists));
  }
}

module.exports = Matcher;