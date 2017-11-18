'use strict';

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

let captureParallelismHistory = (() => {
  var _ref34 = (0, _asyncToGenerator.default)(function* (asyncFunction, args) {
    const parallelismHistory = [];
    let parralelism = 0;
    const result = yield asyncFunction(...args.map(function (arg) {
      if (typeof arg !== 'function') {
        return arg;
      }
      const func = arg;
      return (() => {
        var _ref35 = (0, _asyncToGenerator.default)(function* (item) {
          ++parralelism;
          parallelismHistory.push(parralelism);
          const value = yield func(item);
          --parralelism;
          return value;
        });

        return function (_x4) {
          return _ref35.apply(this, arguments);
        };
      })();
    }));
    return { result, parallelismHistory };
  });

  return function captureParallelismHistory(_x2, _x3) {
    return _ref34.apply(this, arguments);
  };
})();

var _promise;

function _load_promise() {
  return _promise = require('../promise');
}

var _testHelpers;

function _load_testHelpers() {
  return _testHelpers = require('../test-helpers');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
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

/* eslint-disable prefer-promise-reject-errors */

describe('promises::asyncFind()', () => {
  it('Empty list of items should resolve to null.', () => {
    let isResolved = false;
    let observedResult;
    let isRejected = false;
    let observedError;

    const args = [];
    const test = value => {
      throw new Error('Should not be called.');
    };

    runs(() => {
      (0, (_promise || _load_promise()).asyncFind)(args, test).then(result => {
        observedResult = result;
        isResolved = true;
      }).catch(error => {
        observedError = error;
        isRejected = true;
      });
    });

    waitsFor(() => isResolved || isRejected);

    runs(() => {
      expect(isResolved).toBe(true);
      expect(observedResult).toBe(null);
      expect(isRejected).toBe(false);
      expect(observedError).toBe(undefined);
    });
  });

  it('Last item in list resolves.', () => {
    let isResolved = false;
    let observedResult;
    let isRejected = false;
    let observedError;

    const args = ['foo', 'bar', 'baz'];
    const test = value => {
      if (value === 'foo') {
        return null;
      } else if (value === 'bar') {
        return Promise.resolve(null);
      } else {
        return Promise.resolve('win');
      }
    };

    runs(() => {
      (0, (_promise || _load_promise()).asyncFind)(args, test).then(result => {
        observedResult = result;
        isResolved = true;
      }).catch(error => {
        observedError = error;
        isRejected = true;
      });
    });

    waitsFor(() => isResolved || isRejected);

    runs(() => {
      expect(isResolved).toBe(true);
      expect(observedResult).toBe('win');
      expect(isRejected).toBe(false);
      expect(observedError).toBe(undefined);
    });
  });
});

describe('promises::denodeify()', () => {
  /**
   * Vararg function that assumes that all elements except the last are
   * numbers, as the last argument is a callback function. All of the
   * other arguments are multiplied together. If the result is not NaN,
   * then the callback is called with the product. Otherwise, the callback
   * is called with an error.
   *
   * This function exhibits some of the quirky behavior of Node APIs that
   * accept a variable number of arguments in the middle of the parameter list
   * rather than at the end. The type signature of this function cannot be
   * expressed in Flow.
   */
  function asyncProduct(...factors) {
    const callback = factors.pop();
    const product = factors.reduce((previousValue, currentValue) => {
      return previousValue * currentValue;
    }, 1);

    if (isNaN(product)) {
      callback(new Error('product was NaN'));
    } else {
      callback(null, product);
    }
  }

  it('resolves Promise when callback succeeds', () => {
    const denodeifiedAsyncProduct = (0, (_promise || _load_promise()).denodeify)(asyncProduct);
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const trivialProduct = yield denodeifiedAsyncProduct();
      expect(trivialProduct).toBe(1);

      const product = yield denodeifiedAsyncProduct(1, 2, 3, 4, 5);
      expect(product).toBe(120);
    }));
  });

  it('rejects Promise when callback fails', () => {
    const denodeifiedAsyncProduct = (0, (_promise || _load_promise()).denodeify)(asyncProduct);
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      yield (0, (_testHelpers || _load_testHelpers()).expectAsyncFailure)(denodeifiedAsyncProduct('a', 'b'), function (error) {
        expect(error.message).toBe('product was NaN');
      });
    }));
  });

  function checksReceiver(expectedReceiver, callback) {
    if (this === expectedReceiver) {
      callback(null, 'winner');
    } else {
      callback(new Error('unexpected receiver'));
    }
  }

  it('result of denodeify propagates receiver as expected', () => {
    const denodeifiedChecksReceiver = (0, (_promise || _load_promise()).denodeify)(checksReceiver);

    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const receiver = { denodeifiedChecksReceiver };
      const result = yield receiver.denodeifiedChecksReceiver(receiver);
      expect(result).toBe('winner');
    }));

    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const receiver = { denodeifiedChecksReceiver };
      yield (0, (_testHelpers || _load_testHelpers()).expectAsyncFailure)(receiver.denodeifiedChecksReceiver(null), function (error) {
        expect(error.message).toBe('unexpected receiver');
      });
    }));
  });
});

describe('promises::serializeAsyncCall()', () => {
  it('Returns the same result when called after scheduled', () => {
    let i = 0;
    const asyncFunSpy = jasmine.createSpy('async');
    const oneAsyncCallAtATime = (0, (_promise || _load_promise()).serializeAsyncCall)(() => {
      i++;
      const resultPromise = waitPromise(10, i);
      asyncFunSpy();
      return resultPromise;
    });
    // Start an async, and resolve to 1 in 10 ms.
    const result1Promise = oneAsyncCallAtATime();
    // Schedule the next async, and resolve to 2 in 20 ms.
    const result2Promise = oneAsyncCallAtATime();
    // Reuse scheduled promise and resolve to 2 in 20 ms.
    const result3Promise = oneAsyncCallAtATime();

    advanceClock(11);
    // Wait for the promise to call the next chain
    // That isn't synchrnously guranteed because it happens on `process.nextTick`.
    waitsFor(() => asyncFunSpy.callCount === 2);
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      advanceClock(11);
      const results = yield Promise.all([result1Promise, result2Promise, result3Promise]);
      expect(results).toEqual([1, 2, 2]);
    }));
  });

  it('Calls and returns (even if errors) the same number of times if serially called', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      let i = 0;
      const oneAsyncCallAtATime = (0, (_promise || _load_promise()).serializeAsyncCall)(function () {
        i++;
        if (i === 4) {
          return Promise.reject('ERROR');
        }
        return waitPromise(10, i);
      });
      const result1Promise = oneAsyncCallAtATime();
      advanceClock(11);
      const result1 = yield result1Promise;

      const result2Promise = oneAsyncCallAtATime();
      advanceClock(11);
      const result2 = yield result2Promise;

      const result3Promise = oneAsyncCallAtATime();
      advanceClock(11);
      const result3 = yield result3Promise;

      const errorPromoise = oneAsyncCallAtATime();
      advanceClock(11);
      yield (0, (_testHelpers || _load_testHelpers()).expectAsyncFailure)(errorPromoise, function (error) {
        expect(error).toBe('ERROR');
      });

      const result5Promise = oneAsyncCallAtATime();
      advanceClock(11);
      const result5 = yield result5Promise;
      expect([result1, result2, result3, result5]).toEqual([1, 2, 3, 5]);
    }));
  });
});

describe('promises::asyncLimit()', () => {
  beforeEach(() => {
    jasmine.useRealClock();
  });

  it('runs in series if limit is 1', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const {
        result,
        parallelismHistory
      } = yield captureParallelismHistory((_promise || _load_promise()).asyncLimit, [[1, 2, 3], 1, function (item) {
        return waitPromise(10, item + 1);
      }]);
      expect(parallelismHistory).toEqual([1, 1, 1]);
      expect(result).toEqual([2, 3, 4]);
    }));
  });

  it('runs with the specified limit, until finishing', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const {
        result,
        parallelismHistory
      } = yield captureParallelismHistory((_promise || _load_promise()).asyncLimit, [[1, 2, 3, 4, 5, 6, 7, 8, 9], 3, function (item) {
        return waitPromise(10 + item, item - 1);
      }]);
      expect(result).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      expect(parallelismHistory).toEqual([1, 2, 3, 3, 3, 3, 3, 3, 3]);
    }));
  });

  it('works when the limit is bigger than the array length', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const result = yield (0, (_promise || _load_promise()).asyncLimit)([1, 2, 3], 10, function (item) {
        return waitPromise(10, item * 2);
      });
      expect(result).toEqual([2, 4, 6]);
    }));
  });

  it('a rejected promise rejects the whole call with the error', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      yield (0, (_testHelpers || _load_testHelpers()).expectAsyncFailure)((0, (_promise || _load_promise()).asyncLimit)([1], 1, (() => {
        var _ref11 = (0, _asyncToGenerator.default)(function* (item) {
          throw new Error('rejected iterator promise');
        });

        return function (_x) {
          return _ref11.apply(this, arguments);
        };
      })()), function (error) {
        expect(error.message).toBe('rejected iterator promise');
      });
    }));
  });

  it('works when the array is empty', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const result = yield (0, (_promise || _load_promise()).asyncLimit)([], 1, function () {
        return Promise.resolve();
      });
      expect(result).toEqual([]);
    }));
  });
});

describe('promises::asyncFilter()', () => {
  beforeEach(() => {
    jasmine.useRealClock();
  });

  // eslint-disable-next-line max-len
  it('filters an array with an async iterator and maximum parallelization when no limit is specified', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const {
        result: filtered,
        parallelismHistory
      } = yield captureParallelismHistory((_promise || _load_promise()).asyncFilter, [[1, 2, 3, 4, 5], function (item) {
        return waitPromise(10 + item, item > 2);
      }]);
      expect(filtered).toEqual([3, 4, 5]);
      expect(parallelismHistory).toEqual([1, 2, 3, 4, 5]);
    }));
  });

  it('filters an array with a limit on parallelization', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const {
        result: filtered,
        parallelismHistory
      } = yield captureParallelismHistory((_promise || _load_promise()).asyncFilter, [[1, 2, 3, 4, 5], function (item) {
        return waitPromise(10 + item, item > 2);
      }, 3]);
      expect(filtered).toEqual([3, 4, 5]);
      // Increasing promise resolve time will gurantee maximum parallelization.
      expect(parallelismHistory).toEqual([1, 2, 3, 3, 3]);
    }));
  });
});

describe('promises::asyncObjFilter()', () => {
  beforeEach(() => {
    jasmine.useRealClock();
  });

  // eslint-disable-next-line max-len
  it('filters an object with an async iterator and maximum parallelization when no limit is specified', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const {
        result: filtered,
        parallelismHistory
      } = yield captureParallelismHistory((_promise || _load_promise()).asyncObjFilter, [{ a: 1, b: 2, c: 3, d: 4, e: 5 }, function (value, key) {
        return waitPromise(5 + value, value > 2);
      }]);
      expect(filtered).toEqual({ c: 3, d: 4, e: 5 });
      expect(parallelismHistory).toEqual([1, 2, 3, 4, 5]);
    }));
  });

  it('filters an array with a limit on parallelization', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const {
        result: filtered,
        parallelismHistory
      } = yield captureParallelismHistory((_promise || _load_promise()).asyncObjFilter, [{ a: 1, b: 2, c: 3, d: 4, e: 5 }, function (value, key) {
        return waitPromise(5 + value, value > 2);
      }, 3]);
      expect(filtered).toEqual({ c: 3, d: 4, e: 5 });
      // Increasing promise resolve time will gurantee maximum parallelization.
      expect(parallelismHistory).toEqual([1, 2, 3, 3, 3]);
    }));
  });
});

describe('promises::asyncSome()', () => {
  beforeEach(() => {
    jasmine.useRealClock();
  });

  // eslint-disable-next-line max-len
  it('some an array with an async iterator and maximum parallelization when no limit is specified', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const {
        result,
        parallelismHistory
      } = yield captureParallelismHistory((_promise || _load_promise()).asyncSome, [[1, 2, 3, 4, 5], function (item) {
        return waitPromise(10, item === 6);
      }]);
      expect(result).toEqual(false);
      expect(parallelismHistory).toEqual([1, 2, 3, 4, 5]);
    }));
  });

  it('some an array with a limit on parallelization', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const {
        result,
        parallelismHistory
      } = yield captureParallelismHistory((_promise || _load_promise()).asyncSome, [[1, 2, 3, 4, 5], function (item) {
        return waitPromise(10 + item, item === 5);
      }, 3]);
      expect(result).toEqual(true);
      expect(parallelismHistory).toEqual([1, 2, 3, 3, 3]);
    }));
  });
});

describe('promises::lastly', () => {
  it('executes after a resolved promise', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const spy = jasmine.createSpy('spy');
      const result = yield (0, (_promise || _load_promise()).lastly)(Promise.resolve(1), spy);
      expect(result).toBe(1);
      expect(spy).toHaveBeenCalled();
    }));
  });

  it('executes after a rejected promise', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const spy = jasmine.createSpy('spy');
      yield (0, (_testHelpers || _load_testHelpers()).expectAsyncFailure)((0, (_promise || _load_promise()).lastly)(Promise.reject(2), spy), function (err) {
        expect(err).toBe(2);
      });
      expect(spy).toHaveBeenCalled();
    }));
  });

  it('works for async functions', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const spy = jasmine.createSpy('spy');
      const result = yield (0, (_promise || _load_promise()).lastly)(Promise.resolve(1), (0, _asyncToGenerator.default)(function* () {
        spy();
      }));
      expect(result).toBe(1);
      expect(spy).toHaveBeenCalled();
    }));
  });
});

describe('promises::retryLimit()', () => {
  beforeEach(() => {
    jasmine.useRealClock();
  });

  it('retries and fails 2 times before resolving to an acceptable result where limit = 5', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      let succeedAfter = 2;
      let calls = 0;
      let validationCalls = 0;
      const retrialsResult = yield (0, (_promise || _load_promise()).retryLimit)(function () {
        return new Promise(function (resolve, reject) {
          calls++;
          if (succeedAfter-- === 0) {
            resolve('RESULT');
          } else {
            reject('ERROR');
          }
        });
      }, function (result) {
        validationCalls++;
        return result === 'RESULT';
      }, 5);
      expect(calls).toBe(3);
      expect(validationCalls).toBe(1);
      expect(retrialsResult).toBe('RESULT');
    }));
  });

  it('retries and fails consistently', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      let calls = 0;
      let validationCalls = 0;
      const failRetriesPromise = (0, (_promise || _load_promise()).retryLimit)(function () {
        calls++;
        return Promise.reject('ERROR');
      }, function (result) {
        validationCalls++;
        return result != null;
      }, 2);
      yield (0, (_testHelpers || _load_testHelpers()).expectAsyncFailure)(failRetriesPromise, function (error) {
        expect(error).toBe('ERROR');
      });
      expect(calls).toBe(2);
      expect(validationCalls).toBe(0);
    }));
  });

  it('accepts a null response', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      let succeedAfter = 2;
      let calls = 0;
      let validationCalls = 0;
      const retryResult = yield (0, (_promise || _load_promise()).retryLimit)(function () {
        calls++;
        if (succeedAfter-- === 0) {
          return Promise.resolve(null);
        } else {
          return Promise.resolve('NOT_GOOD');
        }
      }, function (result) {
        validationCalls++;
        return result == null;
      }, 5);
      expect(retryResult).toBe(null);
      expect(calls).toBe(3);
      expect(validationCalls).toBe(3);
    }));
  });

  it('no valid response is ever got', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const nonValidRetriesPromise = (0, (_promise || _load_promise()).retryLimit)(function () {
        return Promise.resolve('A');
      }, function (result) {
        return result === 'B';
      }, 2);
      yield (0, (_testHelpers || _load_testHelpers()).expectAsyncFailure)(nonValidRetriesPromise, function (error) {
        expect(error.message).toBe('No valid response found!');
      });
    }));
  });
});

describe('promises::RequestSerializer()', () => {
  let requestSerializer = null;

  beforeEach(() => {
    jasmine.useRealClock();
    requestSerializer = new (_promise || _load_promise()).RequestSerializer();
  });

  it('gets outdated result for old promises resolving after newer calls', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const oldPromise = requestSerializer.run(waitPromise(10, 'OLD'));
      const newPromise = requestSerializer.run(waitPromise(5, 'NEW'));
      const { status: oldStatus } = yield oldPromise;
      expect(oldStatus).toBe('outdated');
      const newResult = yield newPromise;

      if (!(newResult.status === 'success')) {
        throw new Error('Invariant violation: "newResult.status === \'success\'"');
      }

      expect(newResult.result).toBe('NEW');
    }));
  });

  it('waitForLatestResult: waits for the latest result', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      requestSerializer.run(waitPromise(5, 'OLD'));
      requestSerializer.run(waitPromise(10, 'NEW'));
      const latestResult = yield requestSerializer.waitForLatestResult();
      expect(latestResult).toBe('NEW');
    }));
  });

  it('waitForLatestResult: waits even if the first run did not kick off', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const latestResultPromise = requestSerializer.waitForLatestResult();
      requestSerializer.run(waitPromise(10, 'RESULT'));
      const latestResult = yield latestResultPromise;
      expect(latestResult).toBe('RESULT');
    }));
  });

  it('waitForLatestResult: does not wait for the first, if the second resolves faster', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      requestSerializer.run(waitPromise(1000000, 'OLD')); // This will never resolve.
      requestSerializer.run(waitPromise(10, 'NEW'));
      const latestResult = yield requestSerializer.waitForLatestResult();
      expect(latestResult).toBe('NEW');
    }));
  });
});

describe('timeoutPromise', () => {
  it('should resolve normally if within the timeout', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const inputPromise = new Promise(function (resolve) {
        return resolve('foo');
      });
      const outputPromise = (0, (_promise || _load_promise()).timeoutPromise)(inputPromise, 1000);
      expect((yield outputPromise)).toBe('foo');
    }));
  });

  it('should reject if the given promise rejects', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const inputPromise = new Promise(function (resolve, reject) {
        return reject('foo');
      });
      const outputPromise = (0, (_promise || _load_promise()).timeoutPromise)(inputPromise, 1000).catch(function (value) {
        return `rejected with ${value}`;
      });
      expect((yield outputPromise)).toBe('rejected with foo');
    }));
  });

  it('should reject if the given promise takes too long', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const inputPromise = new Promise(function (resolve) {
        return setTimeout(resolve, 2000);
      });
      const outputPromise = (0, (_promise || _load_promise()).timeoutPromise)(inputPromise, 1000).catch(function (value) {
        return value;
      });
      advanceClock(1500);
      expect((yield outputPromise)).toEqual(new (_promise || _load_promise()).TimedOutError(1000));
    }));
  });
});

function waitPromise(timeoutMs, value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(value), timeoutMs);
  });
}