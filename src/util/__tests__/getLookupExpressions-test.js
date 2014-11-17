var _ = require('lodash');
var expect = require('expect');
var getLookupExpressions = require('../getLookupExpressions');

describe('getLookupExpressions', function() {
  it('should work with http://a.b.c/1/2.html?param=1', function() {
    expect(_.difference(
      getLookupExpressions('http://a.b.c/1/2.html?param=1'),
      [
        'a.b.c/1/2.html?param=1',
        'a.b.c/1/2.html',
        'a.b.c/',
        'a.b.c/1/',
        'b.c/1/2.html?param=1',
        'b.c/1/2.html',
        'b.c/',
        'b.c/1/'
      ]
    )).toEqual([]);
  });

  it('should work with http://a.b.c.d.e.f.g/1.html', function() {
    expect(_.difference(
      getLookupExpressions('http://a.b.c.d.e.f.g/1.html'),
      [
        'a.b.c.d.e.f.g/1.html',
        'a.b.c.d.e.f.g/',
        'c.d.e.f.g/1.html',
        'c.d.e.f.g/',
        'd.e.f.g/1.html',
        'd.e.f.g/',
        'e.f.g/1.html',
        'e.f.g/',
        'f.g/1.html',
        'f.g/'
      ]
    )).toEqual([]);
  });

  it('should work with http://1.2.3.4/1/', function() {
    expect(_.difference(
      getLookupExpressions('http://1.2.3.4/1/'),
      [
        '1.2.3.4/1/',
        '1.2.3.4/'
      ]
    )).toEqual([]);
  });
});