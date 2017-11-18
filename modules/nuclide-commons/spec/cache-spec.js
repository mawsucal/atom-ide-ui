'use strict';

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

var _cache;

function _load_cache() {
  return _cache = require('../cache');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Cache', () => {
  const key1 = 'key1';
  const key2 = 'key2';
  const value = 'value';

  it('creates values on demand', () => {
    let callCount = 0;
    const factory = jasmine.createSpy('factory').andCallFake(key => {
      callCount += 1;
      expect(key).toEqual(key1);
      return value;
    });
    const cache = new (_cache || _load_cache()).Cache(factory);

    expect(factory).not.toHaveBeenCalled();
    expect(cache.has(key1)).toEqual(false);
    expect(cache.get(key1)).toEqual(value);
    expect(callCount).toEqual(1);
    expect(cache.has(key1)).toEqual(true);
    expect(factory).toHaveBeenCalledWith(key1);
    expect(Array.from(cache.values())).toEqual([value]);

    expect(cache.get(key1)).toEqual(value);
    expect(callCount).toEqual(1);
  });

  it('delete', () => {
    const factory = jasmine.createSpy('factory').andReturn(value);
    const cache = new (_cache || _load_cache()).Cache(factory);

    expect(cache.delete(key1)).toEqual(false);
    cache.get(key1);
    expect(cache.has(key1)).toEqual(true);
    expect(cache.delete(key1)).toEqual(true);
    expect(cache.has(key1)).toEqual(false);
  });

  it('delete disposes values', () => {
    const factory = jasmine.createSpy('factory').andReturn(value);
    const dispose = jasmine.createSpy('dispose');
    const cache = new (_cache || _load_cache()).Cache(factory, dispose);

    cache.get(key1);
    cache.delete(key1);
    expect(dispose).toHaveBeenCalledWith(value);
  });

  it('clear disposes values', () => {
    const factory = jasmine.createSpy('factory').andReturn(value);
    const dispose = jasmine.createSpy('dispose');
    const cache = new (_cache || _load_cache()).Cache(factory, dispose);

    cache.get(key1);
    cache.clear();
    expect(dispose).toHaveBeenCalledWith(value);
  });

  it('dispose disposes values', () => {
    const factory = jasmine.createSpy('factory').andReturn(value);
    const dispose = jasmine.createSpy('dispose');
    const cache = new (_cache || _load_cache()).Cache(factory, dispose);

    cache.get(key1);
    cache.dispose();
    expect(dispose).toHaveBeenCalledWith(value);
  });

  it('observeValues sees existing and new values', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const factory = jasmine.createSpy('factory').andCallFake(function (key) {
        return key;
      });
      const cache = new (_cache || _load_cache()).Cache(factory);

      cache.get(key1);
      const values = cache.observeValues().toArray().toPromise();
      cache.get(key2);
      cache.dispose();
      expect((yield values)).toEqual([key1, key2]);
    }));
  });

  it('observeKeys sees existing and new keys', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const factory = jasmine.createSpy('factory').andCallFake(function (key) {
        return value;
      });
      const cache = new (_cache || _load_cache()).Cache(factory);

      cache.get(key1);
      const values = cache.observeKeys().toArray().toPromise();
      cache.get(key2);
      cache.dispose();
      expect((yield values)).toEqual([key1, key2]);
    }));
  });
}); /**
     * Copyright (c) 2017-present, Facebook, Inc.
     * All rights reserved.
     *
     * This source code is licensed under the BSD-style license found in the
     * LICENSE file in the root directory of this source tree. An additional grant
     * of patent rights can be found in the PATENTS file in the same directory.
     *
     * 
     * @format
     */