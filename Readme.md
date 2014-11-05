# Repage.js

Extensions to [visionmedia/page.js], an Express-inspired client-side router.

[visionmedia/page.js]: https://github.com/visionmedia/page.js

## Basic usage

Use `repage` as you typically would use *page.js*.

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

The new `page` object implements all the API of [visionmedia/page.js], plus other
convenient extensions described below. As such, refer to the page.js API first.

## API

<!-- include: index.js -->

### page([options])

Starts page.js.

Register page's `popstate` / `click` bindings. If you're doing selective
binding you'll like want to pass `{ click: false }` to specify this
yourself. The following options are available:

- `click` bind to click events [__true__]
- `popstate` bind to popstate [__true__]
- `dispatch` perform initial dispatch [true]

If you wish to load serve initial content from the server you likely will
want to set `dispatch` to __false__.

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

### Quick reference


    // routing:
    page('/', index)           // calls `index()` when navigating to /
    page('*', notfound)        // calls `notfound()` for all pages
    page.base('/blog')         // sets the base path

```js
// navigation:
page('/users')             // navigate to /users
page.replace('/users')     // replaces the current state with /users
```

Only in repage.js:

```js
page('/user/:id', { id: 20 })           // navigates to /user/20
page('/search', { q: 'hello' })         // navigates to /search?q=hello
page.replace('/search', { q: 'hello' }) // navigates to /user/20 by replacing

page.uri('/user/:id', { id: 20 })       // returns "/user/20" (string)
page.redirect('/users')                 // redirects to /users from a route

page.back()                             // goes back, or returns home if available
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
placeholders.

```js
page('/user/:id', { id: 12 });
// same as `page('/user/12')`
```

### page.replace()

Works like `page(path)`, but replaces the current state instead of pushing
it. Great for form submission pages.

```js
$('.submit').on('click', function () {
  $.post('/submit', function (article) {
    alert("data saved");
    page.replace('/article/:id', { id: article.id });
  });
});
```

### len
> `repage.len`

Number of pages navigated to.

```js
page.len == 0;
page('/login');
page.len == 1;
```

### page.uri()
> `uri(path, options)`

Builds a URI path with dynamic parameters, mimicking Express's conventions.

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

```js
page.querystring({ name: 'john smith', count: 3 })
=> "name=john%20smith&count=3"
```

### back()
> `page.back([path])`

Goes back. If `path` is given, it will navigate to that instead when
there's no page to go back to.

```js
document.getElementById('back').onclick = function() {
  // either goes back, or returns to the homepage when there's
  // no page to go back to.
  page.back('/');
};
```

### page.redirect()
> `page.redirect(path, params)`

Navigates to `path`. Works like `page.show()` or `page.replace()`, but
suitable to be used inside a route.

```js
page('/login', function (ctx) {
  page.redirect('/sessions/new');
});

page('/dashboard', function (ctx) {
  if (!authenticated)
    page.redirect('/login');
});
```

<!-- /include -->

