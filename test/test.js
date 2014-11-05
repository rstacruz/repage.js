var jsdom = require('mocha-jsdom');
var expect = require('chai').expect;
var isNode = typeof process === 'object';

var repage, page;


describe('repage', function () {
  jsdom();

  before(function () {
    repage = require('../index');
    page = require('page');
  });

  before(function () {
    if (isNode)
      repage({ popstate: false });
    else
      repage();
  });

  it('works', function (done) {
    repage('/querystring-default', function (ctx) {
      expect(ctx.querystring).to.equal('');
      done();
    });

    repage('/querystring-default');
  });
});
