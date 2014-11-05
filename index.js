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
   *     page('/user/:user/edit', edit);
   *     page('/user/:user/album', album);
   *     page('/user/:user/album/sort', sort);
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
   * page.replace():
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
   * len : repage.len
   * Number of pages navigated to.
   *
   *     page.len == 0;
   *     page('/login');
   *     page.len == 1;
   */

  repage.len = 0;

  /**
   * page.uri() : uri(path, options)
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
   * page.redirect() : page.redirect(path, params)
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

  page.redirect = function(path, params) {
    setImmediate(function (){
      page.replace(path, params);
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
