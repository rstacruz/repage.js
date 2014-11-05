var page, expect, old = {};
var isNode = typeof process === 'object';

if (isNode) {
  expect = require('chai').expect;
  require('./setup');
} else {
  expect = chai.expect;
}

describe('page.js tests', function () {

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
    page.teardown();
    if (!isNode) history.replaceState("", {}, old.location);
  });

  describe('ctx.querystring', function(){
    it('should default to ""', function(done){
      page('/querystring-default', function(ctx){
        expect(ctx.querystring).to.equal('');
        done();
      });

      page('/querystring-default');
    });

    it('should expose the query string', function(done){
      page('/querystring', function(ctx){
        expect(ctx.querystring).to.equal('hello=there');
        done();
      });

      page('/querystring?hello=there');
    });
  });

  describe('ctx.pathname', function(){
    it('should default to ctx.path', function(done){
      page('/pathname-default', function(ctx){
        expect(ctx.pathname).to.equal('/pathname-default');
        done();
      });

      page('/pathname-default');
    });

    it('should omit the query string', function(done){
      page('/pathname', function(ctx){
        expect(ctx.pathname).to.equal('/pathname');
        done();
      });

      page('/pathname?hello=there');
    });
  });

  describe('dispatcher', function(){
    it('should ignore query strings', function(done){
      page('/qs', function(ctx){
        done();
      });

      page('/qs?test=true');
    });

    it('should ignore query strings with params', function(done){
      page('/qs/:name', function(ctx){
        expect(ctx.params.name).to.equal('tobi');
        done();
      });

      page('/qs/tobi?test=true');
    });

    it('should invoke the matching callback', function(done){
      page('/user/:name', function(ctx){
        done();
      });

      page('/user/tj');
    });

    it('should populate ctx.params', function(done){
      page('/blog/post/:name', function(ctx){
        expect(ctx.params.name).to.equal('something');
        done();
      });

      page('/blog/post/something');
    });

    describe('when next() is invoked', function(){
      it('should invoke subsequent matching middleware', function(done){
        page('/forum/*', function(ctx, next){
          ctx.fullPath = ctx.params[0];
          next();
        });

        page('/user', function(){

        });

        page('/forum/:fid/thread/:tid', function(ctx){
          // expect(ctx.fullPath).to.equal('1/thread/2');
          expect(ctx.params.tid).to.equal('2');
          done();
        });

        page('/forum/1/thread/2');
      });
      xit('should not redirect to page will be already dispatched', function() {
        // hacky test
        var _ctx;
        page('/page/:page', function(ctx, next) {
          _ctx = ctx;
          next();
        });
        page('/page/:page');
        var unhandled = _ctx.unhandled;
        expect(unhandled).to.not.exist;
      });
    });
  });

  after(function(){
    page('/');
  });
});
