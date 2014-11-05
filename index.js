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

  repage.show = function (path, params, dispatch) {
    page.show(path, params, dispatch);
  };

  return repage;

}));
