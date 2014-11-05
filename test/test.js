var repage, page, expect;
var isNode = typeof process === 'object';

if (isNode) {
  expect = require('chai').expect;
  require('mocha-jsdom')();
} else {
  expect = chai.expect;
}

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

describe('ctx.querystring', function () {
  it('defaults to ""', function (done) {
    repage('/querystring-default', function (ctx) {
      expect(ctx.querystring).to.equal('');
      done();
    });

    repage('/querystring-default');
  });
});

describe('.show()', function () {
  it('works', function (done) {
    repage('/showid/:id', function (ctx) {
      expect(ctx.params.id).eql('john');
      done();
    });

    repage('/showid/:id', { id: 'john' });
  });

  it('handles page(uri)', function (done) {
    repage('/show/hello', function (ctx) { done(); });
    repage('/show/hello');
  });

  it('handles page(uri, {})', function (done) {
    repage('/show/user/:id', function (ctx) {
      expect(ctx.params.id).eq('2');
      done();
    });
    repage('/show/user/:id', { id: 2 });
  });
});

describe('.uri()', function(){
  it('should work for uri(string)', function() {
    var str = repage.uri('/users');
    expect(str).to.eq('/users');
  });

  it('should work for uri(string, params)', function() {
    var str = repage.uri('/user/:id', { id: 2 });    expect(str).to.eq('/user/2');
  });

  it('should work with query strings', function() {
    var str = repage.uri('/search', { q: 'hello' });
    expect(str).to.eq('/search?q=hello');
  });

  it('should work with both params and query strings', function() {
    var str = repage.uri('/:country/search', { country: 'de', q: 'hello' });
    expect(str).to.eq('/de/search?q=hello');
  });
});


describe('.querystring()', function(){
  it('should work with a single key-value', function() {
    var str = repage.querystring({ q: 'hello world' });
    expect(str).to.eq('q=hello%20world');
  });

  it('should handle arrays', function() {
    var str = repage.querystring({ q: 'hello world', attrs: ['title','author'] });
    expect(str).to.eq('q=hello%20world&attrs[]=title&attrs[]=author');
  });

  it('should discard undefineds', function() {
    var str = repage.querystring({ q: 'hello world', context: undefined });
    expect(str).to.eq('q=hello%20world');
  });

  it('should include nulls', function() {
    var str = repage.querystring({ q: 'hello world', context: null });
    expect(str).to.eq('q=hello%20world&context=');
  });

  it('should handle objects', function() {
    var str = repage.querystring({ book: {title: 'hello', author: 'world'} });
    expect(str).to.eq('book[title]=hello&book[author]=world');
  });

  it('should handle recursive objects', function() {
    var str = repage.querystring({ my: { book: {title: 'hello', author: 'world'} }});
    expect(str).to.eq('my[book][title]=hello&my[book][author]=world');
  });
});

describe('.replace()', function() {
  it('should not change history.length', function(done) {
    var length = history.length;

    repage('/replace/x', function(ctx){
      expect(history.length).to.eq(length);
      done();
    });
    repage.replace('/replace/x');
  });
});

describe('.replace(uri)', function() {
  it('should work with replace(uri)', function(done) {
    repage('/replace/hello', function(ctx){ done(); });
    repage.replace('/replace/hello');
  });

  it('should work with replace(uri, {})', function(done) {
    repage('/replace/user/:id', function(ctx){
      expect(ctx.params.id).eq('2');
      done();
    });
    repage.replace('/replace/user/:id', { id: 2 });
  });
});


xdescribe('.back()', function () {
  it('should go back', function () {
    repage('/back/1', function () {});
    repage('/back/2', function () {});

    repage('/back/1');
    repage('/back/2');
    repage.back();
    expect(location.pathname).to.eq('/back/1');
  });
});
