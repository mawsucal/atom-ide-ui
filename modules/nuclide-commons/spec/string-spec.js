'use strict';

var _string;

function _load_string() {
  return _string = require('../string');
}

describe('relativeDate', () => {
  it('works', () => {
    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const YEAR = DAY * 365;
    const MONTH = YEAR / 12;

    const reference = 157765000000; // 01.01.1975 00:00
    const now = new Date().getTime();

    // test long format
    expect((0, (_string || _load_string()).relativeDate)(0)).toEqual(Math.round(now / YEAR) + ' years ago');
    expect((0, (_string || _load_string()).relativeDate)(reference * SECOND, reference)).toEqual('just now');
    expect((0, (_string || _load_string()).relativeDate)(reference - 41 * SECOND, reference)).toEqual('just now');
    expect((0, (_string || _load_string()).relativeDate)(reference - 42 * SECOND, reference)).toEqual('a minute ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - MINUTE, reference)).toEqual('a minute ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - MINUTE * 1.5, reference)).toEqual('2 minutes ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - MINUTE * 59, reference)).toEqual('59 minutes ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - HOUR, reference)).toEqual('an hour ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - HOUR * 1.5, reference)).toEqual('2 hours ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - HOUR * 16, reference)).toEqual('16 hours ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - HOUR * 23, reference)).toEqual('23 hours ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - DAY * 1.8, reference)).toEqual('yesterday');
    expect((0, (_string || _load_string()).relativeDate)(reference - DAY * 3, reference)).toEqual('3 days ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - DAY * 6, reference)).toEqual('6 days ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - WEEK, reference)).toEqual('a week ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - WEEK * 2, reference)).toEqual('2 weeks ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - WEEK * 4, reference)).toEqual('4 weeks ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - MONTH * 1.2, reference)).toEqual('a month ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - YEAR + HOUR, reference)).toEqual('12 months ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - YEAR, reference)).toEqual('a year ago');
    expect((0, (_string || _load_string()).relativeDate)(reference - YEAR * 2, reference)).toEqual('2 years ago');
    expect((0, (_string || _load_string()).relativeDate)(0, reference)).toEqual('5 years ago');

    // test short format
    expect((0, (_string || _load_string()).relativeDate)(0, undefined, /* short */true)).toEqual(Math.round(now / YEAR) + 'y');
    expect((0, (_string || _load_string()).relativeDate)(reference * SECOND, reference, /* short */true)).toEqual('now');
    expect((0, (_string || _load_string()).relativeDate)(reference - 41 * SECOND, reference, /* short */true)).toEqual('now');
    expect((0, (_string || _load_string()).relativeDate)(reference - 42 * SECOND, reference, /* short */true)).toEqual('1m');
    expect((0, (_string || _load_string()).relativeDate)(reference - MINUTE, reference, /* short */true)).toEqual('1m');
    expect((0, (_string || _load_string()).relativeDate)(reference - MINUTE * 1.5, reference, /* short */true)).toEqual('2m');
    expect((0, (_string || _load_string()).relativeDate)(reference - MINUTE * 59, reference, /* short */true)).toEqual('59m');
    expect((0, (_string || _load_string()).relativeDate)(reference - HOUR, reference, /* short */true)).toEqual('1h');
    expect((0, (_string || _load_string()).relativeDate)(reference - HOUR * 1.5, reference, /* short */true)).toEqual('2h');
    expect((0, (_string || _load_string()).relativeDate)(reference - HOUR * 16, reference, /* short */true)).toEqual('16h');
    expect((0, (_string || _load_string()).relativeDate)(reference - HOUR * 23, reference, /* short */true)).toEqual('23h');
    expect((0, (_string || _load_string()).relativeDate)(reference - DAY * 1.8, reference, /* short */true)).toEqual('1d');
    expect((0, (_string || _load_string()).relativeDate)(reference - DAY * 3, reference, /* short */true)).toEqual('3d');
    expect((0, (_string || _load_string()).relativeDate)(reference - DAY * 6, reference, /* short */true)).toEqual('6d');
    expect((0, (_string || _load_string()).relativeDate)(reference - WEEK, reference, /* short */true)).toEqual('1w');
    expect((0, (_string || _load_string()).relativeDate)(reference - WEEK * 2, reference, /* short */true)).toEqual('2w');
    expect((0, (_string || _load_string()).relativeDate)(reference - WEEK * 4, reference, /* short */true)).toEqual('4w');
    expect((0, (_string || _load_string()).relativeDate)(reference - MONTH * 1.2, reference, /* short */true)).toEqual('1mo');
    expect((0, (_string || _load_string()).relativeDate)(reference - YEAR + HOUR, reference, /* short */true)).toEqual('12mo');
    expect((0, (_string || _load_string()).relativeDate)(reference - YEAR, reference, /* short */true)).toEqual('1y');
    expect((0, (_string || _load_string()).relativeDate)(reference - YEAR * 2, reference, /* short */true)).toEqual('2y');
    expect((0, (_string || _load_string()).relativeDate)(0, reference, /* short */true)).toEqual('5y');
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

describe('maybeToString', () => {
  it("returns 'undefined'", () => {
    expect((0, (_string || _load_string()).maybeToString)(undefined)).toEqual('undefined');
  });

  it("returns 'null'", () => {
    expect((0, (_string || _load_string()).maybeToString)(null)).toEqual('null');
  });

  it('returns an ordinary string', () => {
    expect((0, (_string || _load_string()).maybeToString)('foo')).toEqual('foo');
  });
});

describe('countOccurrences', () => {
  it('counts the number of characters', () => {
    expect((0, (_string || _load_string()).countOccurrences)('abcaaa', 'a')).toBe(4);
  });

  it('throws for non-length-1 searches', () => {
    expect(() => {
      (0, (_string || _load_string()).countOccurrences)('abc', 'abc');
    }).toThrow();
  });
});

describe('shellParse', () => {
  it('parses a list of arguments', () => {
    expect((0, (_string || _load_string()).shellParse)('1 2 3 "a b c"')).toEqual(['1', '2', '3', 'a b c']);
  });

  it('throws if operators are given', () => {
    expect(() => {
      (0, (_string || _load_string()).shellParse)('a | b');
    }).toThrow(Error('Unexpected operator "|" provided to shellParse'));
    expect(() => {
      (0, (_string || _load_string()).shellParse)('a > b');
    }).toThrow(Error('Unexpected operator ">" provided to shellParse'));
  });
});

describe('removeCommonPrefix', () => {
  it('does nothing if there is no common prefix', () => {
    expect((0, (_string || _load_string()).removeCommonPrefix)('foo', 'bar')).toEqual(['foo', 'bar']);
  });

  it('removes a common prefix', () => {
    expect((0, (_string || _load_string()).removeCommonPrefix)('foo', 'fbar')).toEqual(['oo', 'bar']);
    expect((0, (_string || _load_string()).removeCommonPrefix)('asdffoo', 'asdfbar')).toEqual(['foo', 'bar']);
  });

  it('works with the empty string', () => {
    expect((0, (_string || _load_string()).removeCommonPrefix)('', 'bar')).toEqual(['', 'bar']);
    expect((0, (_string || _load_string()).removeCommonPrefix)('foo', '')).toEqual(['foo', '']);
    expect((0, (_string || _load_string()).removeCommonPrefix)('', '')).toEqual(['', '']);
  });

  it('returns empty strings for identical strings', () => {
    expect((0, (_string || _load_string()).removeCommonPrefix)('foo', 'foo')).toEqual(['', '']);
  });
});

describe('removeCommonSuffix', () => {
  it('does nothing if there is no common suffix', () => {
    expect((0, (_string || _load_string()).removeCommonSuffix)('foo', 'bar')).toEqual(['foo', 'bar']);
  });

  it('removes a common suffix', () => {
    expect((0, (_string || _load_string()).removeCommonSuffix)('foo', 'baro')).toEqual(['fo', 'bar']);
    expect((0, (_string || _load_string()).removeCommonSuffix)('fooasdf', 'baroasdf')).toEqual(['fo', 'bar']);
  });

  it('works with the empty string', () => {
    expect((0, (_string || _load_string()).removeCommonSuffix)('', 'bar')).toEqual(['', 'bar']);
    expect((0, (_string || _load_string()).removeCommonSuffix)('foo', '')).toEqual(['foo', '']);
    expect((0, (_string || _load_string()).removeCommonSuffix)('', '')).toEqual(['', '']);
  });

  it('returns empty strings for identical strings', () => {
    expect((0, (_string || _load_string()).removeCommonSuffix)('foo', 'foo')).toEqual(['', '']);
  });
});

describe('shorten', () => {
  it('works', () => {
    expect((0, (_string || _load_string()).shorten)('', 1)).toEqual('');
    expect((0, (_string || _load_string()).shorten)('test', 3)).toEqual('tes');
    expect((0, (_string || _load_string()).shorten)('test', 100)).toEqual('test');
    expect((0, (_string || _load_string()).shorten)('test', 1, '...')).toEqual('t...');
  });
});

describe('splitOnce', () => {
  it('splits once', () => {
    expect((0, (_string || _load_string()).splitOnce)('ab-cd-ef', '-')).toEqual(['ab', 'cd-ef']);
  });
  it("handles when there's no match", () => {
    expect((0, (_string || _load_string()).splitOnce)('ab-cd-ef', '_')).toEqual(['ab-cd-ef', null]);
  });
});

describe('indent', () => {
  it('indents lines', () => {
    expect((0, (_string || _load_string()).indent)('a\nb')).toBe('  a\n  b');
  });

  it("doesn't indent empty lines", () => {
    expect((0, (_string || _load_string()).indent)('a\n\nb')).toBe('  a\n\n  b');
  });

  it('uses the provided level', () => {
    expect((0, (_string || _load_string()).indent)('a\n\nb', 4)).toBe('    a\n\n    b');
  });

  it('uses the provided character', () => {
    expect((0, (_string || _load_string()).indent)('a\n\nb', 1, '\t')).toBe('\ta\n\n\tb');
  });
});

describe('pluralize', () => {
  it('works', () => {
    expect((0, (_string || _load_string()).pluralize)('test', 0)).toEqual('tests');
    expect((0, (_string || _load_string()).pluralize)('test', 1)).toEqual('test');
    expect((0, (_string || _load_string()).pluralize)('test', 2)).toEqual('tests');
    expect((0, (_string || _load_string()).pluralize)('test', 123)).toEqual('tests');
  });
});

describe('capitalize', () => {
  it('works', () => {
    expect((0, (_string || _load_string()).capitalize)('')).toEqual('');
    expect((0, (_string || _load_string()).capitalize)('t')).toEqual('T');
    expect((0, (_string || _load_string()).capitalize)('te')).toEqual('Te');
    expect((0, (_string || _load_string()).capitalize)('test')).toEqual('Test');
  });
});