## Don't edit repage.js

Don't edit:

 * `repage.js`
 * `Readme.md` API notes

Use `npm run prepublish` to automatically update both files. `repage.js` is 
built from index.js (via browserify).

## Browser tests

Tests need to be run in `http:` (and not `file:`).

    $ python -m SimpleHTTPServer
    $ open http://localhost:8000/test/

## Updating versions with [bump](http://npmjs.org/package/bump-cli)

    $ bump Readme.md *.json

## Publishing

    $ npm test && npm publish && git release v2.0.0

## Coverage report

Opens in your browser.

    $ npm run coverage
