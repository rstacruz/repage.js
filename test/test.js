var page, expect, old = {};
var isNode = typeof process === 'object';

if (isNode) {
  expect = require('chai').expect;
  require('mocha-jsdom')();
} else {
  expect = chai.expect;
}

before(function () {
  if (isNode) {
    page = require('../index');
    page({ popstate: false });
  } else {
    old.location = window.location.pathname;
    page = window.page;
    page();
  }
});

after(function () {
  if (!isNode) {
    history.replaceState("", {}, old.location);
  }
});

describe('ctx.querystring', function () {
  it('defaults to ""', function (done) {
    page('/querystring-default', function (ctx) {
      expect(ctx.querystring).to.equal('');
      done();
    });

    page('/querystring-default');
  });
});

describe('.show()', function () {
  it('works', function (done) {
    page('/showid/:id', function (ctx) {
      expect(ctx.params.id).eql('john');
      done();
    });

    page('/showid/:id', { id: 'john' });
  });

  it('handles page(uri)', function (done) {
    page('/show/hello', function (ctx) { done(); });
    page('/show/hello');
  });

  it('handles page(uri, {})', function (done) {
    page('/show/user/:id', function (ctx) {
      expect(ctx.params.id).eq('2');
      done();
    });
    page('/show/user/:id', { id: 2 });
  });
});

describe('.uri()', function(){
  it('should work for uri(string)', function() {
    var str = page.uri('/users');
    expect(str).to.eq('/users');
  });

  it('should work for uri(string, params)', function() {
    var str = page.uri('/user/:id', { id: 2 });    expect(str).to.eq('/user/2');
  });

  it('should work with query strings', function() {
    var str = page.uri('/search', { q: 'hello' });
    expect(str).to.eq('/search?q=hello');
  });

  it('should work with both params and query strings', function() {
    var str = page.uri('/:country/search', { country: 'de', q: 'hello' });
    expect(str).to.eq('/de/search?q=hello');
  });
});


describe('.querystring()', function(){
  it('should work with a single key-value', function() {
    var str = page.querystring({ q: 'hello world' });
    expect(str).to.eq('q=hello%20world');
  });

  it('should handle arrays', function() {
    var str = page.querystring({ q: 'hello world', attrs: ['title','author'] });
    expect(str).to.eq('q=hello%20world&attrs[]=title&attrs[]=author');
  });

  it('should discard undefineds', function() {
    var str = page.querystring({ q: 'hello world', context: undefined });
    expect(str).to.eq('q=hello%20world');
  });

  it('should include nulls', function() {
    var str = page.querystring({ q: 'hello world', context: null });
    expect(str).to.eq('q=hello%20world&context=');
  });

  it('should handle objects', function() {
    var str = page.querystring({ book: {title: 'hello', author: 'world'} });
    expect(str).to.eq('book[title]=hello&book[author]=world');
  });

  it('should handle recursive objects', function() {
    var str = page.querystring({ my: { book: {title: 'hello', author: 'world'} }});
    expect(str).to.eq('my[book][title]=hello&my[book][author]=world');
  });
});

describe('.replace()', function() {
  it('should not change history.length', function(done) {
    var length = history.length;

    page('/replace/x', function(ctx){
      expect(history.length).to.eq(length);
      done();
    });
    page.replace('/replace/x');
  });
});

describe('.replace(uri)', function() {
  it('should work with replace(uri)', function(done) {
    page('/replace/hello', function(ctx){ done(); });
    page.replace('/replace/hello');
  });

  it('should work with replace(uri, {})', function(done) {
    page('/replace/user/:id', function(ctx){
      expect(ctx.params.id).eq('2');
      done();
    });
    page.replace('/replace/user/:id', { id: 2 });
  });
});


describe('.back()', function () {
  it('should go back', function () {
    page('/back/1', function () {});
    page('/back/2', function () {});

    page('/back/1');
    page('/back/2');
    page.back();
    expect(location.pathname).to.eq('/back/1');
  });
});

describe('.stop()', function() {
  it('doesn\'t produce errors', function() {
    page.stop();
  });
});

describe('.redirect()', function () {
  it('should work', function (done) {
    page('/redirect/one', function () {
      page.redirect('/redirect/two');
    });

    page('/redirect/two', function () {
      done();
    });

    page('/redirect/one');
  });
});
