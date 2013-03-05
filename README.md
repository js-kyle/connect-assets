# connect-assets

[![Build Status](https://travis-ci.org/adunkman/connect-assets.png?branch=v3)](https://travis-ci.org/adunkman/connect-assets)

Transparent file compilation and dependency management for Node's [connect](https://github.com/senchalabs/connect) framework in the spirit of the Rails 3.1 asset pipeline.

## What can it do?

connect-assets can:

1. Serve `.coffee` ([CoffeeScript](http://coffeescript.org)) files as compiled `.js`
2. Concatenate `.coffee` and `.js` together using [Snockets](https://github.com/TrevorBurnham/snockets)
3. Serve `.styl` ([Stylus](http://learnboost.github.com/stylus/)) as compiled `.css`
4. Serve `.less` ([Less](http://lesscss.org/)) as compiled `.css`
5. Serve files with a cache-control token and use a far-future expires header for maximum efficiency
6. Avoid redundant git diffs by storing compiled `.js` and `.css` files in memory rather than writing them to the disk when in development.

## How do I use it?

First, install it in your project's directory:

```shell
npm install connect-assets
```

Also install any specific compilers you'll need, e.g.:

```shell
npm install coffee-script
npm install stylus
npm install less
```

Then add this line to your app's configuration:

```javascript
app.use(require("connect-assets")());
```

Finally, create an `assets` directory in your project and throw all your `.coffee` and `.js` files in /assets/js and `.styl`, `.less`, and `.css` files in /assets/css.

### Markup functions

connect-assets provides two global functions named `js` and `css`. Use them in your views. They return the HTML markup needed to include the most recent version of your assets, taking advantage of caching when available. For instance, in a [Jade template](http://jade-lang.com/), the code

```
!= css("normalize")
!= js("jquery")
```

(where `!= is Jade's syntax for running JS and displaying its output) results in the markup

```html
<link rel="stylesheet" href="/css/normalize.css?v=[some number]" />
<script src="/js/jquery.js?v=[some number]"></script>
```

### Sprockets-style concatenation

You can indicate dependencies in your `.coffee` and `.js` files using the Sprockets-style syntax.

In CoffeeScript:

```coffeescript
#= require dependency
```

In JavaScript:

```javascript
//= require dependency
```

When you do so, and point the `js` function at that file, two things can happen:

1. By default, you'll get multiple `<script>` tags out, in an order that gives you all of your dependencies.
2. If you passed the `build: true` option to connect-assets (enabled by default when `env == 'production'`), you'll just get a single tag, wich will point to a JavaScript file that encompasses the target's entire dependency graph—compiled, concatenated, and minified (with [UglifyJS](https://github.com/mishoo/UglifyJS)).

If you want to bring in a whole folder of scripts, use `//= require_tree dir` instead of `//= require file`.

See [Snockets](http://github.com/TrevorBurnham/snockets) for more information.

**Note:** CSS concatenation is not supported by connect-assets directly, because Stylus and Less already do a fine job of this. Stylus and Less are basically supersets of CSS, so just rename your `.css` files to `.styl` or `.less` and learn about the @import ([Stylus](http://learnboost.github.com/stylus/docs/import.html), [Less](http://lesscss.org/#-importing)) syntax.

## Options

If you like, you can pass any of these options to the function returned by `require('connect-assets')`:

* `env` (defaults to `process.env.NODE_ENV`): Sets a number of defaults, see below.
* `src` (defaults to `'assets'`): The directory assets will be read from.
* `tagWriter` (defaults to `'xHtml5Writer'`): The writer to use when creating `<link>` and `<script>` tags. See [lib/tagWriters](https://github.com/adunkman/connect-assets/tree/v3/lib/tagWriters) for available options, or pass in an object implementing `.cssTag(path)` and `.jsTag(path, options)` functions.
* `helperContext` (defaults to `global`): The object the `css` and `js` helper functions will attach to. It's considered good practice to pass in an object here instead of using the default.
* `buildDir` (defaults to `builtAssets`): Writes built asset files to disk using this directory when `saveToDisk` is `true`.
* `detectChanges` (defaults to `false` when `env == 'production'`, otherwise `true`): watches the `src` directory for changes and recompiles the built assets.
* `saveToDisk` (defaults to `true` when `env == 'production'`, otherwise `false`): Saves the compiled assets to disk in the `buildDir` when `true`.
* `assetFolders` (defaults to `{ css: 'css', js: 'js' }`): The asset-type-specific folders within the `src` directory. If you do not wish to separate your assets into `css` and `js` folders, set both properties to blank.

To override these roots, start a path with `'/'`. So, for instance,

```
css('style.css')
```

generates

```html
<link rel="stylesheet" href="/css/style.css" />
```

while

```
css('/style.css')
```

gives you

```html
<link rel="stylesheet" href="/style.css" />
```

## Credits

Borrows heavily from Connect's [compiler](https://github.com/senchalabs/connect/blob/1.6.4/lib/middleware/compiler.js) and [static](https://github.com/senchalabs/connect/blob/1.6.4/lib/middleware/static.js) middlewares, and of course sstephenson's [Sprockets](https://github.com/sstephenson/sprockets).

Take a look at the [contributors](https://github.com/adunkman/connect-assets/contributors) who make this project possible.