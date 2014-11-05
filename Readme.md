# repage.js

Extensions to [visionmedia/page.js], an Express-inspired client-side router.

[visionmedia/page.js]: https://github.com/visionmedia/page.js

[![Status](http://img.shields.io/travis/rstacruz/repage.js/master.svg?style=flat)](https://travis-ci.org/rstacruz/repage.js "See test builds")
[![CodeClimate](http://img.shields.io/codeclimate/github/rstacruz/repage.js.svg?style=flat)](https://codeclimate.com/github/rstacruz/repage.js "CodeClimate")
[![Coveralls](http://img.shields.io/coveralls/rstacruz/repage.js.svg?style=flat)](https://coveralls.io/r/rstacruz/repage.js)

<br>

## Basic usage

Use repage as you typically would use *page.js*. (This new `page` object is a
decorated version of the original page.js `page`.)

```js
var page = require('repage');

page('/', index);
page('/user/:user', show);
page('/user/:user/edit', edit);
page('/user/:user/album', album);
page('/user/:user/album/sort', sort);
page('*', notfound);
page();
```

<br>

## Quick reference

The new `page` object implements all the API of [visionmedia/page.js], plus other
convenient extensions described later. As such, refer to the page.js API first.

```js
// routing:
page('/', index)           // calls `index()` when navigating to /
page('*', notfound)        // calls `notfound()` for all pages
page.base('/blog')         // sets the base path

// navigation:
page('/users')             // navigate to /users
page.replace('/users')     // replaces the current state with /users
```

These are features only available in repage.js:

```js
page('/user/:id', { id: 20 })           // navigates to /user/20
page('/search', { q: 'hello' })         // navigates to /search?q=hello
page.replace('/search', { q: 'hello' }) // navigates by replacing

page.uri('/user/:id', { id: 20 })       // returns "/user/20" (string)
page.redirect('/users')                 // redirects to /users from a route

page.back()                             // goes back, or returns home if available
```

<br>

## Installation

### Via npm or bower

The npm version lists [page.js] as a `dependency`, while the bower version ships as a standalone .js file.

```sh
$ npm install --save repage
$ bower install --save repage
```

[![npm version](http://img.shields.io/npm/v/repage.svg?style=flat)](https://npmjs.org/package/repage "View this project on npm")

### Standalone

[version]: https://cdn.rawgit.com/rstacruz/repage.js/v2.0.2/repage.js

Download or hotlink: __[repage.js][version]__. It will then be exported as `window.page`.

<br>

## API

<!-- include: index.js -->

### page()
> `page([options])`

Starts the [page.js] engine by binding event listeners to dispatch routes.
See page.js API for details.

```js
var page = require('repage');
page('/', index);
page('/user/:user', show);
page('*', notfound);
page();
```

### page(path)
> `page(path, [params])`

Navigate to the given `path`.

```js
$('.view').click(function (e) {
  e.preventDefault();
  page('/user/12');
});
```

You may also specify `params` for params to be replaced in the `path`s
placeholders. *(Only in repage.js)*

```js
page('/user/:id', { id: 12 });
// same as `page('/user/12')`
```

### replace()
> `page.replace(path, [params])`

Works like `page(path)`, but replaces the current state instead of pushing
it. Great for form submission pages.

You may also specify `params` for params to be replaced in the `path`s
placeholders, like in `page('path')`. *(Only in repage.js)*

```js
$('.submit').on('click', function () {
  $.post('/submit', function (article) {
    alert("data saved");
    page.replace('/article/:id', { id: article.id });
  });
});
```

### len
> `page.len`

Number of pages navigated to. *(Only in repage.js)*

```js
page.len == 0;
page('/login');
page.len == 1;
```

### uri()
> `page.uri(path, options)`

Builds a URI path with dynamic parameters, mimicking Express's conventions.
*(Only in repage.js)*

```js
page.uri('/api/users/:id', { id: 24 });
=> "/api/users/24"
```

Also builds query strings.

```js
page.uri('/api/trip/:id', { id: 24, token: 'abcdef' });
=> "/api/trip/24?token=abcdef"
```

Great for using with `req.params` or `req.query`.

### querystring()
> `page.querystring(data)`

Converts an object into a query string.
*(Only in repage.js)*

```js
page.querystring({ name: 'john smith', count: 3 })
=> "name=john%20smith&count=3"
```

### back()
> `page.back([path])`

Goes back. If `path` is given, it will navigate to that instead when
there's no page to go back to.
*(Only in repage.js)*

```js
document.getElementById('back').onclick = function() {
  // either goes back, or returns to the homepage when there's
  // no page to go back to.
  page.back('/');
};
```

### redirect()
> `page.redirect(path, params)`

Navigates to `path`. Works like `page(path)` or `page.replace()`, but
suitable to be used inside a route.
*(Only in repage.js)*

```js
page('/login', function (ctx) {
  page.redirect('/sessions/new');
});

page('/dashboard', function (ctx) {
  if (!authenticated)
    page.redirect('/login');
});
```

### teardown()
> `page.teardown()`

Removes all traces of repage.js. Mostly useful in tests.

<!-- /include -->

<br>

## Thanks

**repage.js** © 2014+, Rico Sta. Cruz. Released under the [MIT] License.<br>
Authored and maintained by Rico Sta. Cruz with help from contributors ([list][contributors]).

> [ricostacruz.com](http://ricostacruz.com) &nbsp;&middot;&nbsp;
> GitHub [@rstacruz](https://github.com/rstacruz) &nbsp;&middot;&nbsp;
> Twitter [@rstacruz](https://twitter.com/rstacruz)

[MIT]: http://mit-license.org/
[contributors]: http://github.com/rstacruz/repage.js/contributors
[page.js]: https://github.com/visionmedia/page.js
