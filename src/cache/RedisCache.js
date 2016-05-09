var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;

function getChunkSetKey(listName, type) { 
  return `safe:list:${listName}:chunks:${type}`;
}

function getChunkKey(listName, chunkID) {
  return `safe:list:${listName}:chunk:${chunkID}`;
}

function getPendingSubKey(listName, chunkID) {
  return `safe:list:${listName}:chunk:${chunkID}:sub`;
}

function getPrefixesKey(listName) {
  return `safe:list:${listName}:prefixes`;
}

function getPrefixDetailsKey(listName, prefix) {
  return `safe:list:${listName}:prefix:${prefix}`;
}

function ensureArrayIfEmpty(promise) {
  return promise.then((val) => val || []);
}

function ensureParsedJSONObject(promise) {
  return promise.then((val) => (val) ? JSON.parse(val) : {});
}

function ensureBoolean(promise) {
  return promise.then((val) => !!val);
}

class RedisCache {
  constructor(redisClient) {
    this._client = Promise.promisifyAll(redisClient);
    this._emitter = new EventEmitter();
  }
    
  on(eventName, eventHandler) {
    this._emitter.addListener(eventName, eventHandler.bind(this));
  }

  getChunkIDs(listName, type) {
    return ensureArrayIfEmpty(
      this._client.zrangeAsync(getChunkSetKey(listName, type), 0, -1)
    ).then((ids) => ids.map((id) => parseInt(id, 10)));
  }

  hasChunkID(listName, type, chunkID) {
    return ensureBoolean(
      this._client.zrankAsync(getChunkSetKey(listName, type), chunkID)
    );
  }

  getChunkByID(listName, chunkID) {
    return ensureArrayIfEmpty(
      this._client.smembersAsync(getChunkKey(listName, chunkID))
    );
  }

  putChunk(listName, type, chunkID, prefixes) {
    this._emitter.emit('message',`Putting chunk ${getChunkSetKey(listName, type)}:${chunkID}`);
    
    var transaction = this._client.multi()
      .zadd(getChunkSetKey(listName, type), chunkID, chunkID);

    if (prefixes.length > 0) {
      transaction.sadd(getChunkKey(listName, chunkID), prefixes);
    }

    return Promise.promisify(transaction.exec, transaction)();
  }

  dropChunkByID(listName, type, chunkID) {
    this._emitter.emit('message',`Dropping chunk ${getChunkSetKey(listName, type)}:${chunkID}`);
    
    var transaction = this._client.multi()
      .zrem(getChunkSetKey(listName, type), chunkID)
      .del(getChunkKey(listName, chunkID));

    return Promise.promisify(transaction.exec, transaction)();
  }

  hasPendingSubChunk(listName, chunkID, prefix) {
    return this._client.sismemberAsync(
      getPendingSubKey(listName, chunkID),
      prefix
    ).then((hasSubChunk) => !!hasSubChunk);
  }

  putPendingSubChunk(listName, chunkID, prefix) {
    return this._client.saddAsync(
      getPendingSubKey(listName, chunkID), 
      prefix
    );
  }

  dropPendingSubChunk(listName, chunkID, prefix) {
    return this._client.sremAsync(
      getPendingSubKey(listName, chunkID),
      prefix
    );
  }

  dropPendingSubChunksByChunkID(listName, chunkID) {
    return this._client.delAsync(
      getPendingSubKey(listName, chunkID)
    );
  }

  isPrefixMatch(listName, prefix) {
    return ensureBoolean(
      this._client.sismemberAsync(getPrefixesKey(listName), prefix)
    );
  }

  putPrefixes(listName, prefixes) {
    if (prefixes.length === 0) {
      return Promise.resolve();
    }
    return this._client.saddAsync(getPrefixesKey(listName), prefixes);
  }

  dropPrefixes(listName, prefixes) {
    if (prefixes.length === 0) {
      return Promise.resolve();
    }
    return this._client.sremAsync(getPrefixesKey(listName), prefixes);
  }

  hasPrefixDetails(listName, prefix) {
    return ensureBoolean(
      this._client.existsAsync(getPrefixDetailsKey(listName, prefix))
    );
  }

  isPrefixDetailsMatch(listName, prefix, hash) {
    return ensureBoolean(
      this._client.hexistsAsync(getPrefixDetailsKey(listName, prefix), hash)
    );
  }

  getPrefixDetailsMetadata(listName, prefix, hash) {
    return ensureParsedJSONObject(
      this._client.hgetAsync(getPrefixDetailsKey(listName, prefix), hash)
    );
  }

  putPrefixDetails(listName, prefix, hashes, expiration, optMetadata) {
    var metadata = optMetadata || [];
    var interleaved = {};
    hashes.forEach((hash, idx) => 
      interleaved[hash] = JSON.stringify(metadata[idx] || {}));

    var prefixDetailsKey = getPrefixDetailsKey(listName, prefix);
    var transaction = this._client.multi()
      .hmset(prefixDetailsKey, interleaved)
      .expireat(prefixDetailsKey, expiration);
      
    return Promise.promisify(transaction.exec, transaction)();
  }
}

module.exports = RedisCache;
