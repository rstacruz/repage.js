var page = require('page');

/*
 * Setimmediate helper
 */

var setImmediate = this.setImmediate ?
  this.setImmediate :
  function (fn) { window.setTimeout(fn, 0); };

/**
 * page() : page([options])
 * Starts the [page.js] engine by binding event listeners to dispatch routes.
 * See page.js API for details.
 *
 *     var page = require('repage');
 *     page('/', index);
 *     page('/user/:user', show);
 *     page('*', notfound);
 *     page();
 */

function repage (path, fn) {
  // page(function)
  if ('function' === typeof path) {
    return repage('*', path);
  }
  // page('/x', function)
  if ('function' === typeof fn) {
    page.apply(page, arguments);
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

/*
 * Propagate unchanged things
 */

repage.start = page.start;
repage.stop = page.stop;
repage.dispatch = page.dispatch;
repage.base = page.base;
repage.sameOrigin = page.sameOrigin;

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
 * placeholders. *(Only in repage.js)*
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
 * You may also specify `params` for params to be replaced in the `path`s 
 * placeholders, like in `page('path')`. *(Only in repage.js)*
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
 * Number of pages navigated to. *(Only in repage.js)*
 *
 *     page.len == 0;
 *     page('/login');
 *     page.len == 1;
 */

repage.len = 0;

/**
 * uri() : page.uri(path, options)
 * Builds a URI path with dynamic parameters, mimicking Express's conventions.
 * *(Only in repage.js)*
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
  var uri = path;

  if (options) {
    uri = path.replace(/:([A-Za-z_]+)/g, function(_, spec) {
      var val = options[spec];
      delete options[spec];
      return val;
    });
  }

  if (options && Object.keys(options).length > 0) {
    uri += '?' + repage.querystring(options);
  }

  return uri;
};

/**
 * querystring() : page.querystring(data)
 * Converts an object into a query string.
 * *(Only in repage.js)*
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
 * *(Only in repage.js)*
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
  } else if (path) {
    repage(path, params);
  }
};

/**
 * redirect() : page.redirect(path, params)
 * Navigates to `path`. Works like `page(path)` or `page.replace()`, but
 * suitable to be used inside a route.
 * *(Only in repage.js)*
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

/**
 * teardown() : page.teardown()
 * Removes all traces of repage.js. Mostly useful in tests.
 */

repage.teardown = function () {
  repage.stop();
  repage.len = 0;
  page.callbacks = [];
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

module.exports = repage;
