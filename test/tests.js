var isNode = typeof window !== "object";

if (isNode) {
  require('./support/jsdom');
  global.chai = require('chai');
  global.page = require('../index');
}

var expect = chai.expect;
var called;

// XXX: super lame hack

before(function() {
  page('/', function(){
    called = true;
  })
})

// start
before(function() {
  page();
})

// return to / after all tests
after(function(){
  page('/');
})

describe('page', function(){
  describe('on page load', function(){
    it('should invoke the matching callback', function(){
      expect(called).to.equal(true);
    })
  })

  describe('ctx.querystring', function(){
    it('should default to ""', function(done){
      page('/querystring-default', function(ctx){
        expect(ctx.querystring).to.equal('');
        done();
      });

      page('/querystring-default');
    })

    it('should expose the query string', function(done){
      page('/querystring', function(ctx){
        expect(ctx.querystring).to.equal('hello=there');
        done();
      });

      page('/querystring?hello=there');
    })
  })

  describe('ctx.pathname', function(){
    it('should default to ctx.path', function(done){
      page('/pathname-default', function(ctx){
        expect(ctx.pathname).to.equal('/pathname-default');
        done();
      });

      page('/pathname-default');
    })

    it('should omit the query string', function(done){
      page('/pathname', function(ctx){
        expect(ctx.pathname).to.equal('/pathname');
        done();
      });

      page('/pathname?hello=there');
    })
  })

  describe('dispatcher', function(){
    it('should ignore query strings', function(done){
      page('/qs', function(ctx){
        done();
      });

      page('/qs?test=true');
    })

    it('should ignore query strings with params', function(done){
      page('/qs/:name', function(ctx){
        expect(ctx.params.name).to.equal('tobi');
        done();
      });

      page('/qs/tobi?test=true');
    })

    it('should invoke the matching callback', function(done){
      page('/user/:name', function(ctx){
        done();
      })

      page('/user/tj');
    })

    it('should populate ctx.params', function(done){
      page('/blog/post/:name', function(ctx){
        expect(ctx.params.name).to.equal('something');
        done();
      })

      page('/blog/post/something');
    })

    describe('when next() is invoked', function(){
      it('should invoke subsequent matching middleware', function(done){
        page('/forum/*', function(ctx, next){
          ctx.fullPath = ctx.params[0];
          next();
        });

        page('/user', function(){

        });

        page('/forum/:fid/thread/:tid', function(ctx){
          expect(ctx.fullPath).to.equal('1/thread/2');
          expect(ctx.params.tid).to.equal('2');
          done();
        });

        page('/forum/1/thread/2');
      })
    })
  })

  describe('page.uri', function(){
    it('should work for uri(string)', function() {
      var str = page.uri('/users');
      expect(str).to.eq('/users');
    })

    it('should work for uri(string, params)', function() {
      var str = page.uri('/user/:id', { id: 2 });
      expect(str).to.eq('/user/2');
    })

    it('should work with query strings', function() {
      var str = page.uri('/search', { q: 'hello' });
      expect(str).to.eq('/search?q=hello');
    })

    it('should work with both params and query strings', function() {
      var str = page.uri('/:country/search', { country: 'de', q: 'hello' });
      expect(str).to.eq('/de/search?q=hello');
    })
  })

  describe('page.querystring', function(){
    it('should work with a single key-value', function() {
      var str = page.querystring({ q: 'hello world' });
      expect(str).to.eq('q=hello%20world');
    })

    it('should handle arrays', function() {
      var str = page.querystring({ q: 'hello world', attrs: ['title','author'] });
      expect(str).to.eq('q=hello%20world&attrs[]=title&attrs[]=author');
    })

    it('should discard undefineds', function() {
      var str = page.querystring({ q: 'hello world', context: undefined });
      expect(str).to.eq('q=hello%20world');
    })

    it('should include nulls', function() {
      var str = page.querystring({ q: 'hello world', context: null });
      expect(str).to.eq('q=hello%20world&context=');
    })

    it('should handle objects', function() {
      var str = page.querystring({ book: {title: 'hello', author: 'world'} });
      expect(str).to.eq('book[title]=hello&book[author]=world');
    })

    it('should handle recursive objects', function() {
      var str = page.querystring({ my: { book: {title: 'hello', author: 'world'} }});
      expect(str).to.eq('my[book][title]=hello&my[book][author]=world');
    })
  })

  describe('page.show', function() {
    it('should handle page(uri)', function(done) {
      page('/show/hello', function(ctx){ done(); });
      page('/show/hello');
    })

    it('should handle page(uri, {})', function(done) {
      page('/show/user/:id', function(ctx){
        expect(ctx.params.id).eq('2');
        done();
      });
      page('/show/user/:id', { id: 2 });
    })
  })

  describe('page.replace', function() {
    it('should not change history.length', function(done) {
      var length = history.length;

      page('/replace/x', function(ctx){
        expect(history.length).to.eq(length);
        done();
      });
      page.replace('/replace/x');
    })
  })

  describe('page.replace uri', function() {
    it('should work with replace(uri)', function(done) {
      page('/replace/hello', function(ctx){ done(); });
      page.replace('/replace/hello');
    })

    it('should work with replace(uri, {})', function(done) {
      page('/replace/user/:id', function(ctx){
        expect(ctx.params.id).eq('2');
        done();
      });
      page.replace('/replace/user/:id', { id: 2 });
    })
  })

  describe('page.redirect', function() {
    it('should work', function(done) {
      page('/redirect/one', function() {
        page.redirect('/redirect/two');
      });

      page('/redirect/two', function() {
        done();
      });

      page('/redirect/one');
    })
  })

  describe('page.base', function() {
    afterEach(function() {
      page.base('');
    });

    it('should default to blank', function() {
      expect(page.base()).to.eq('');
    });

    it('should work as setter/getter', function() {
      page.base('/blog');
      expect(page.base()).to.eq('/blog');
    })
  })

  describe('page.back', function() {
    it('should go back', function() {
      page('/back/1', function() {});
      page('/back/2', function() {});

      page('/back/1');
      page('/back/2');
      page.back();
      expect(location.pathname).to.eq('/back/1');
    })
  })
})
