# connect-assets

[![Build Status](https://travis-ci.org/adunkman/connect-assets.png)](https://travis-ci.org/adunkman/connect-assets)

Transparent file compilation and dependency management for Node’s [connect](https://github.com/senchalabs/connect) framework in the spirit of the Rails 3.1 asset pipeline.

## What can it do?

connect-assets can:

1. Serve `.js.coffee` ([CoffeeScript](http://coffeescript.org)) files as compiled `.js`
2. Concatenate `.js.coffee` and `.js` together.
3. Serve `.css.styl` ([Stylus](http://learnboost.github.com/stylus/)) as compiled `.css`
4. Serve `.css.less` ([Less](http://lesscss.org/)) as compiled `.css`
5. Serve `.css.sass` or `.css.scss` ([SASS](http://sass-lang.com)) as compiled `.css`
6. Serve `.jst.hamlc` ([Haml-Coffee templates](https://github.com/netzpirat/haml-coffee)) as compiled JavaScript functions.
7. Serve `.jst.jade` ([Jade templates](https://github.com/visionmedia/jade)) as compiled JavaScript functions (be sure to include the Jade runtime — see below).
7. Serve `.jst.ejs` as compiled JavaScript functions.
8. Preprocess `style.css.ejs` and `script.js.ejs` with [EJS](http://embeddedjs.com/) — just append `.ejs` to any file.
8. Serve files with a cache-control token and use a far-future expires header for maximum efficiency.
9. Avoid redundant git diffs by storing compiled `.js` and `.css` files in memory rather than writing them to the disk when in development.

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
npm install node-sass
npm install haml-coffee
npm install jade
npm install ejs
```

Then add this line to your app's configuration:

```javascript
app.use(require("connect-assets")());
```

Finally, create an `assets` directory in your project and throw all assets compiled into JavaScript into `/assets/js` and all assets compiled into CSS into `/assets/css`.

### Markup functions

connect-assets provides three global functions named `js`, `css`, and `assetPath`. Use them in your views. They return the HTML markup needed to include the most recent version of your assets (or, the path to the asset), taking advantage of caching when available. For instance, in a [Jade template](http://jade-lang.com/), the code

```
!= css("normalize")
!= js("jquery")
```

(where `!= is Jade's syntax for running JS and displaying its output) results in the markup

```html
<link rel="stylesheet" href="/css/normalize-[hash].css" />
<script src="/js/jquery-[hash].js"></script>
```

You can pass a Hash of special attributes to helper method `css` or `js`:

```
!= css("normalize", { 'data-turbolinks-track': true } })
!= js("jquery", { async: true })
```

Results in:

```html
<link rel="stylesheet" href="/css/normalize-[hash].css" data-turbolinks-track />
<script src="/js/jquery-[hash].js" async></script>
```

### Sprockets-style concatenation

You can indicate dependencies in your `.js.coffee` and `.js` files using the Sprockets-style syntax.

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

See [Mincer](https://github.com/nodeca/mincer) for more information.

## Options

If you like, you can pass any of these options to the function returned by `require('connect-assets')`:

Option        | Default Value                   | Description
--------------|---------------------------------|-------------------------------
paths         | ["assets/js", "assets/css"]     | The directories that assets will be read from, in order of preference.
helperContext | global                          | The object that helper functions (css, js, assetPath) will be attached to.
servePath     | "assets"                        | The virtual path in which assets will be served over HTTP. If hosting assets locally, supply a local path (say, "assets"). If hosting assets remotely on a CDN, supply a URL: "http://myassets.example.com/assets".
precompile    | ["\*.\*"]                       | An array of assets to precompile while the server is initializing. Patterns should match the filename only, not including the directory.
build         | dev: false; prod: true          | Should assets be saved to disk (true), or just served from memory (false)?
buildDir      | dev: false; prod: "builtAssets" | The directory to save (and load) compiled assets to/from.
compile       | true                            | Should assets be compiled if they don’t already exist in the `buildDir`?
compress      | dev: false; prod: true          | Should assets be minified? If enabled, requires `uglify-js` and `csso`.
gzip          | false                           | Should assets have gzipped copies in `buildDir`?

## Serving Assets from a CDN

connect-assets includes a command-line utility, `connect-assets`, which can be used to precompile assets on your filesystem (which you can then upload to your CDN of choice). From your application directory, you can execute it with `./node_modules/.bin/connect-assets [options]`.

```
Usage: connect-assets [-h] [-v] [-gz] [-i [DIRECTORY [DIRECTORY ...]]]
                      [-c [FILE [FILE ...]]] [-o DIRECTORY]

Precompiles assets supplied into their production-ready form, ready for
upload to a CDN or static file server. The generated manifest.json is all
that is required on your application server if connect-assets is properly
configured.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -i [DIRECTORY [DIRECTORY ...]], --include [DIRECTORY [DIRECTORY ...]]
                        Adds the directory to a list of directories that
                        assets will be read from, in order of preference.
                        Defaults to 'assets/js' and 'assets/css'.
  -c [FILE [FILE ...]], --compile [FILE [FILE ...]]
                        Adds the file (or pattern) to a list of files to
                        compile. Defaults to all files.
  -o DIRECTORY, --output DIRECTORY
                        Specifies the output directory to write compiled
                        assets to. Defaults to 'builtAssets'.
  -s PATH, --servePath PATH
                        The virtual path in which assets will be served
                        over HTTP. If hosting assets locally, supply a
                        local path (say, "assets"). If hosting assets
                        remotely on a CDN, supply a URL.
  -gz, --gzip
                        Enables gzip file generation, which is disabled by
                        default.
```

## Credits

Follows in the footsteps of sstephenson's [Sprockets](https://github.com/sstephenson/sprockets), through the [Mincer](https://github.com/nodeca/mincer) project.

Take a look at the [contributors](https://github.com/adunkman/connect-assets/contributors) who make this project possible.
