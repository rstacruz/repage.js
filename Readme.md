This is a fork of the original [page.js] by visionmedia that extends the API with the following conveniences:

page('/user/:id', { id: 20 })           // navigates to /user/20
page('/search', { q: 'hello' })         // navigates to /search?q=hello
page.replace('/search', { q: 'hello' }) // navigates to /user/20 by replacing

page.uri('/user/:id', { id: 20 })       // returns "/user/20" (string)
page.redirect('/users')                 // redirects to /users from a route

page.back()                             // goes back, or returns home if available

...this breaks an undocumented (and usually unused) feature of page.js of allowing you to pass state objects into page(path, options).
