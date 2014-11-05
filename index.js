;(function (root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['page'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('page'));
  } else {
    root.repage = factory(root.page);
  }

}(this, function (page) {

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

  repage.start = page.start;
  repage.stop = page.stop;

  /**
   * len : repage.len
   * Number of pages navigated to.
   */

  repage.len = 0;

  repage.show = function (path, params, dispatch) {
    var uri = repage.uri(path, params);
    page.show(uri, {}, dispatch);
  };

  repage.replace = function (path, params, init, dispatch) {
    var uri = repage.uri(path, params);
    page.replace(uri, {}, init, dispatch);
  };

  /**
   * uri() : uri(path, options)
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
   * querystring() : querystring(data)
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
   * back() : back([path])
   * Goes back. If `path` is given, it will navigate to that instead when
   * there's no page to go back to.
   */

  repage.back = function(path, params) {
    if (repage.len > 0) {
      history.back();
    } else if (arguments.length > 0) {
      repage(path, params);
    }
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
   * Export
   */

  return repage;

}));
