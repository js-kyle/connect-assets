# Changes between version 2.x and 3

## Options

- `options.minifyBuilds` no longer exists; now when `options.build` is `true`, builds will be minified.
- `options.buildFilenamer` no longer exists; built filenames now use the source file's modification time and cannot be overrided.
- `options.buildsExpire` no longer exists.
- `options.pathsOnly` no longer exists; it has been replaced by `options.tagWriter`. To return the file paths without tags from the `js()` and `css()` functions, pass `options.tagWriter = "passthroughWriter"`.

## `css()` and `js()` root folders

The property which used to be `css.root = "css";` which defined what folder within `options.src` contained css files is now specified as `options.assetFolders.css`.

The property which used to be `js.root = "js";` which defined what folder within `options.src` contained js files is now specified as `options.assetFolders.js`.

## Instance creation

When calling `require("connect-assets")();`, a singleton used to be created. Now, each instance is fully independent.