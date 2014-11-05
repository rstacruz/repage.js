!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.page=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
;(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['page'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('page'));
  } else {
    root.repage = factory(root.page);
  }

}(this, function (page) {

  /*
   * Setimmediate helper
   */

  var setImmediate = this.setImmediate ?
    this.setImmediate :
    function (fn) { window.setTimeout(fn, 0); };

  /**
   * page([options]):
   * Starts page.js.
   *
   * Register page's `popstate` / `click` bindings. If you're doing selective
   * binding you'll like want to pass `{ click: false }` to specify this
   * yourself. The following options are available:
   *
   * - `click` bind to click events [__true__]
   * - `popstate` bind to popstate [__true__]
   * - `dispatch` perform initial dispatch [true]
   *
   * If you wish to load serve initial content from the server you likely will
   * want to set `dispatch` to __false__.
   *
   *     var page = require('repage');
   *     page('/', index);
   *     page('/user/:user', show);
   *     page('*', notfound);
   *     page();
   */

  function repage (path, fn) {
    // page(function)
    if ('function' == typeof path) {
      return repage('*', path);
    }
    // page('/x', function)
    if ('function' == typeof fn) {
      page(path, fn);
    }
    // page('/x', { .. })
    else if ('string' === typeof path) {
      repage.show(path, fn);
    }
    // page()
    else {
      repage.start(path);
    }
  }

  /**
   * Quick reference:
   *
   *     // routing:
   *     page('/', index)           // calls `index()` when navigating to /
   *     page('*', notfound)        // calls `notfound()` for all pages
   *     page.base('/blog')         // sets the base path
   *     
   *     // navigation:
   *     page('/users')             // navigate to /users
   *     page.replace('/users')     // replaces the current state with /users
   *
   * Only in repage.js:
   *
   *     page('/user/:id', { id: 20 })           // navigates to /user/20
   *     page('/search', { q: 'hello' })         // navigates to /search?q=hello
   *     page.replace('/search', { q: 'hello' }) // navigates to /user/20 by replacing
   *     
   *     page.uri('/user/:id', { id: 20 })       // returns "/user/20" (string)
   *     page.redirect('/users')                 // redirects to /users from a route
   *     
   *     page.back()                             // goes back, or returns home if available
   */

  /*
   * Propagate unchanged things
   */

  repage.start = page.start;
  repage.stop = page.stop;
  repage.dispatch = page.dispatch;

  /**
   * page(path) : page(path, [params])
   * Navigate to the given `path`.
   *
   *     $('.view').click(function (e) {
   *       e.preventDefault();
   *       page('/user/12');
   *     });
   *
   * You may also specify `params` for params to be replaced in the `path`s 
   * placeholders.
   *
   *     page('/user/:id', { id: 12 });
   *     // same as `page('/user/12')`
   */

  repage.show = function (path, params, dispatch) {
    var uri = repage.uri(path, params);
    page.show(uri, {}, dispatch);
  };

  /**
   * replace() : page.replace(path, [params])
   * Works like `page(path)`, but replaces the current state instead of pushing
   * it. Great for form submission pages.
   *
   *     $('.submit').on('click', function () {
   *       $.post('/submit', function (article) {
   *         alert("data saved");
   *         page.replace('/article/:id', { id: article.id });
   *       });
   *     });
   */

  repage.replace = function (path, params, init, dispatch) {
    var uri = repage.uri(path, params);
    page.replace(uri, {}, init, dispatch);
  };

  /**
   * len : page.len
   * Number of pages navigated to.
   *
   *     page.len == 0;
   *     page('/login');
   *     page.len == 1;
   */

  repage.len = 0;

  /**
   * uri() : page.uri(path, options)
   * Builds a URI path with dynamic parameters, mimicking Express's conventions.
   *
   *     page.uri('/api/users/:id', { id: 24 });
   *     => "/api/users/24"
   *
   * Also builds query strings.
   *
   *     page.uri('/api/trip/:id', { id: 24, token: 'abcdef' });
   *     => "/api/trip/24?token=abcdef"
   *
   * Great for using with `req.params` or `req.query`.
   */

  repage.uri = function(path, options) {
    var uri = path.replace(/:([A-Za-z_]+)/g, function(_, spec) {
      var val = options[spec];
      delete options[spec];
      return val;
    });

    if (options && Object.keys(options).length > 0) {
      uri += '?' + repage.querystring(options);
    }

    return uri;
  };

  /**
   * querystring() : page.querystring(data)
   * Converts an object into a query string.
   *
   *     page.querystring({ name: 'john smith', count: 3 })
   *     => "name=john%20smith&count=3"
   */

  repage.querystring = function (options, prefix) {
    var pairs = [], val;

    if (Array.isArray(options)) {
      for (var i = 0, len = options.length; i < len; i++) {
        val = options[i];
        pairs.push(repage.querystring({ '': val }, prefix));
      }
    }
    else if (typeof options === 'object') {
      for (var key in options) {
        if (!options.hasOwnProperty(key)) continue;

        val = options[key];
        if (typeof val === 'undefined') continue;

        if (prefix) key = prefix + '[' + key + ']';

        if (val === null) {
          pairs.push(key + '=');
        } else if (typeof val === 'object') {
          pairs.push(repage.querystring(val, key));
        } else {
          pairs.push([ key, encodeURIComponent(val) ].join('='));
        }
      }
    }

    return pairs.join('&');
  };

  /**
   * back() : page.back([path])
   * Goes back. If `path` is given, it will navigate to that instead when
   * there's no page to go back to.
   *
   *     document.getElementById('back').onclick = function() {
   *       // either goes back, or returns to the homepage when there's
   *       // no page to go back to.
   *       page.back('/');
   *     };
   */

  repage.back = function(path, params) {
    if (repage.len > 0) {
      history.back();
    } else if (arguments.length > 0) {
      repage(path, params);
    }
  };

  /**
   * redirect() : page.redirect(path, params)
   * Navigates to `path`. Works like `page.show()` or `page.replace()`, but
   * suitable to be used inside a route.
   *
   *     page('/login', function (ctx) {
   *       page.redirect('/sessions/new');
   *     });
   *
   *     page('/dashboard', function (ctx) {
   *       if (!authenticated)
   *         page.redirect('/login');
   *     });
   */

  repage.redirect = function(path, params) {
    setImmediate(function (){
      repage.replace(path, params);
    });
  };

  /*
   * Patch pushState to update `len`
   */

  var oldPushState = page.Context.prototype.pushState;
  page.Context.prototype.pushState = function () {
    repage.len++;
    oldPushState.apply(this, arguments);
  };

  /*
   * Save reference to original
   */

  repage.page = page;

  /*
   * Export
   */

  return repage;

}));

},{"page":2}],2:[function(require,module,exports){

;(function(){

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' == typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' == typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
    // show <path> with [state]
    } else if ('string' == typeof path) {
      page.show(path, fn);
    // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path){
    if (0 == arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options){
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) window.addEventListener('click', onclick, false);
    if (!dispatch) return;
    var url = location.pathname + location.search + location.hash;
    page.replace(url, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function(){
    running = false;
    removeEventListener('click', onclick, false);
    removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch){
    var ctx = new Context(path, state);
    if (false !== dispatch) page.dispatch(ctx);
    if (!ctx.unhandled) ctx.pushState();
    return ctx;
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */

  page.replace = function(path, state, init, dispatch){
    var ctx = new Context(path, state);
    ctx.init = init;
    if (null == dispatch) dispatch = true;
    if (dispatch) page.dispatch(ctx);
    ctx.save();
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx){
    var i = 0;

    function next() {
      var fn = page.callbacks[i++];
      if (!fn) return unhandled(ctx);
      fn(ctx, next);
    }

    next();
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    var current = window.location.pathname + window.location.search;
    if (current == ctx.canonicalPath) return;
    page.stop();
    ctx.unhandled = true;
    window.location = ctx.canonicalPath;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' == path[0] && 0 != path.indexOf(base)) path = base + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';

    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? path.slice(i + 1) : '';
    this.pathname = ~i ? path.slice(0, i) : path;
    this.params = [];

    // fragment
    this.hash = '';
    if (!~this.path.indexOf('#')) return;
    var parts = this.path.split('#');
    this.path = parts[0];
    this.hash = parts[1] || '';
    this.querystring = this.querystring.split('#')[0];
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function(){
    history.pushState(this.state, this.title, this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function(){
    history.replaceState(this.state, this.title, this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(path
      , this.keys = []
      , options.sensitive
      , options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn){
    var self = this;
    return function(ctx, next){
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Array} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params){
    var keys = this.keys
      , qsIndex = path.indexOf('?')
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path
      , m = this.regexp.exec(pathname);

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];

      var val = 'string' == typeof m[i]
        ? decodeURIComponent(m[i])
        : m[i];

      if (key) {
        params[key.name] = undefined !== params[key.name]
          ? params[key.name]
          : val;
      } else {
        params.push(val);
      }
    }

    return true;
  };

  /**
   * Normalize the given path string,
   * returning a regular expression.
   *
   * An empty array should be passed,
   * which will contain the placeholder
   * key names. For example "/user/:id" will
   * then contain ["id"].
   *
   * @param  {String|RegExp|Array} path
   * @param  {Array} keys
   * @param  {Boolean} sensitive
   * @param  {Boolean} strict
   * @return {RegExp}
   * @api private
   */

  function pathtoRegexp(path, keys, sensitive, strict) {
    if (path instanceof RegExp) return path;
    if (path instanceof Array) path = '(' + path.join('|') + ')';
    path = path
      .concat(strict ? '' : '/?')
      .replace(/\/\(/g, '(?:/')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
        keys.push({ name: key, optional: !! optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
          + (optional || '');
      })
      .replace(/([\/.])/g, '\\$1')
      .replace(/\*/g, '(.*)');
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');
  }

  /**
   * Handle "populate" events.
   */

  function onpopstate(e) {
    if (e.state) {
      var path = e.state.path;
      page.replace(path, e.state);
    }
  }

  /**
   * Handle "click" events.
   */

  function onclick(e) {
    if (1 != which(e)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;

    // ensure link
    var el = e.target;
    while (el && 'A' != el.nodeName) el = el.parentNode;
    if (!el || 'A' != el.nodeName) return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (el.pathname == location.pathname && (el.hash || '#' == link)) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;

    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // same page
    var orig = path + el.hash;

    path = path.replace(base, '');
    if (base && orig == path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null == e.which
      ? e.button
      : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return 0 == href.indexOf(origin);
  }

  /**
   * Expose `page`.
   */

  if ('undefined' == typeof module) {
    window.page = page;
  } else {
    module.exports = page;
  }

})();

},{}]},{},[1])(1)
});