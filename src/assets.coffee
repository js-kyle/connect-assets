# [connect-assets](http://github.com/TrevorBurnham/connect-assets)

connectCache  = require 'connect-file-cache'
Snockets      = require 'snockets'

crypto        = require 'crypto'
fs            = require 'fs'
path          = require 'path'
_             = require 'underscore'
{parse}       = require 'url'

libs = {}
jsCompilers = Snockets.compilers

module.exports = exports = (options = {}) ->
  return connectAssets if connectAssets
  options.src ?= 'assets'
  options.helperContext ?= global
  if process.env.NODE_ENV is 'production'
    options.build ?= true
    cssCompilers.styl.compress ?= true
    cssCompilers.less.compress ?= true
  options.servePath ?= ''
  options.buildDir ?= 'builtAssets'
  options.buildFilenamer ?= md5Filenamer
  options.buildsExpire ?= false
  options.detectChanges ?= true
  options.minifyBuilds ?= true
  options.pathsOnly ?= false
  jsCompilers = _.extend jsCompilers, options.jsCompilers || {}

  connectAssets = module.exports.instance = new ConnectAssets options
  connectAssets.createHelpers options
  connectAssets.cache.middleware

class ConnectAssets
  constructor: (@options) ->
    @cache = connectCache()
    @snockets = new Snockets src: @options.src

    # Things that we must cache to work efficiently with CSS compilers
    @cssSourceFiles = {}
    @compiledCss    = {}

    # Things that we must cache to efficiently use MD5 suffixes
    @buildFilenames = {}

    # Things that we must cache if changes aren't detected
    @cachedRoutePaths = {}

  # ## CSS and JS tag functions
  createHelpers: ->
    context = @options.helperContext
    srcIsRemote = @options.src.match REMOTE_PATH
    expandRoute = (shortRoute, ext, rootDir) ->
      context.js.root = context.js.root[1..] if context.js.root[0] is '/'
      if shortRoute.match EXPLICIT_PATH
        unless shortRoute.match REMOTE_PATH
          if shortRoute[0] is '/' then shortRoute = shortRoute[1..]
      else
        shortRoute = rootDir + '/' + shortRoute
      if ext and shortRoute.indexOf(ext, shortRoute.length - ext.length) is -1
        shortRoute += ext
      shortRoute

    context.css = (route) =>
      route = expandRoute route, '.css', context.css.root
      unless route.match REMOTE_PATH
        route = @options.servePath + @compileCSS route
      return route if @options.pathsOnly
      "<link rel='stylesheet' href='#{route}'>"
    context.css.root = 'css'

    context.js = (route, routeOptions) =>
      loadingKeyword = ''
      route = expandRoute route, '.js', context.js.root
      if route.match REMOTE_PATH
        routes = [route]
      else if srcIsRemote
        routes = ["#{@options.src}/#{route}"]
      else
        routes = (@options.servePath + p for p in @compileJS route)

      return routes if @options.pathsOnly
      if routeOptions? and @options.build
        loadingKeyword = 'async ' if routeOptions.async?
        loadingKeyword = 'defer ' if routeOptions.defer?

      ("<script #{loadingKeyword}src='#{r}'></script>" for r in routes).join '\n'
    context.js.root = 'js'

    context.img = (route) =>
      route = expandRoute route, null, context.img.root
      if route.match REMOTE_PATH
        routes = route
      else if srcIsRemote
        route = "#{@options.src}/#{route}"
      else
        route = @options.servePath + @cacheImg route
      route
    context.img.root = 'img'

  # Synchronously lookup image and return the route
  cacheImg: (route) ->
    if !@options.detectChanges and @cachedRoutePaths[route]
      return @cachedRoutePaths[route]

    sourcePath = route
    try
      stats = fs.statSync @absPath(sourcePath)
      if timeEq mtime, @cache.map[route]?.mtime
        alreadyCached = true
      else
        {mtime} = stats
        img = fs.readFileSync @absPath(sourcePath)

      if alreadyCached and @options.build
        filename = @buildFilenames[sourcePath]
        return "/#{filename}"
      else if alreadyCached
        return "/#{route}"
      else if @options.build
        filename = @options.buildFilenamer(route, getExt route)
        @buildFilenames[sourcePath] = filename
        cacheFlags = {expires: @options.buildsExpire, mtime}
        @cache.set filename, img, cacheFlags
        if @options.buildDir
          buildPath = path.join process.cwd(), @options.buildDir, filename
          mkdirRecursive path.dirname(buildPath), 0o0755, ->
            fs.writeFile buildPath, img
        return @cachedRoutePaths[route] = "/#{filename}"
      else
        @cache.set route, img, {mtime}
        return @cachedRoutePaths[route] = "/#{route}"
    catch e
      ''
    throw new Error("No file found for route #{route}")

  resolveImgPath: (path) ->
    resolvedPath = path + ""
    resolvedPath = resolvedPath.replace /url\(|'|"|\)/g, ''
    try
      resolvedPath = @options.helperContext.img resolvedPath
    catch e
      console.error "Can't resolve image path: #{resolvedPath}"
    return "url('#{resolvedPath}')"

  fixCSSImagePaths: (css) ->
    regex = /url\([^\)]+\)/g
    css = css.replace regex, @resolveImgPath.bind(@)
    return css

  # Synchronously compile Stylus to CSS (if needed) and return the route
  compileCSS: (route) ->
    if !@options.detectChanges and @cachedRoutePaths[route]
      return @cachedRoutePaths[route]

    for ext in ['css'].concat (ext for ext of cssCompilers)
      sourcePath = stripExt(route) + ".#{ext}"
      try
        stats = fs.statSync @absPath(sourcePath)
        if ext is 'css'
          if timeEq mtime, @cache.map[route]?.mtime
            alreadyCached = true
          else
            {mtime} = stats
            css = (fs.readFileSync @absPath(sourcePath)).toString 'utf8'
            css = @fixCSSImagePaths css
        else
          if timeEq stats.mtime, @cssSourceFiles[sourcePath]?.mtime
            source = @cssSourceFiles[sourcePath].data.toString 'utf8'
          else
            data = fs.readFileSync @absPath(sourcePath)
            @cssSourceFiles[sourcePath] = {data, mtime: stats.mtime}
            source = data.toString 'utf8'
          startTime = new Date
          css = cssCompilers[ext].compileSync @absPath(sourcePath), source
          if css is @compiledCss[sourcePath]?.data.toString 'utf8'
            alreadyCached = true
          else
            mtime = new Date
            @compiledCss[sourcePath] = {data: new Buffer(css), mtime}

        if alreadyCached and @options.build
          filename = @buildFilenames[sourcePath]
          return "/#{filename}"
        else if alreadyCached
          return "/#{route}"
        else if @options.build
          filename = @options.buildFilenamer route, css
          @buildFilenames[sourcePath] = filename
          cacheFlags = {expires: @options.buildsExpire, mtime}
          @cache.set filename, css, cacheFlags
          if @options.buildDir
            buildPath = path.join process.cwd(), @options.buildDir, filename
            mkdirRecursive path.dirname(buildPath), 0o0755, ->
              fs.writeFile buildPath, css
          return @cachedRoutePaths[route] = "/#{filename}"
        else
          @cache.set route, css, {mtime}
          return @cachedRoutePaths[route] = "/#{route}"
      catch e
        if e.code is 'ENOENT' then continue else throw e
    throw new Error("No file found for route #{route}")

  # Synchronously compile to JS with Snockets (if needed) and return route(s)
  compileJS: (route) ->
    if !@options.detectChanges and @cachedRoutePaths[route]
      return @cachedRoutePaths[route]

    for ext in ['js'].concat (ext for ext of jsCompilers)
      sourcePath = stripExt(route) + ".#{ext}"
      try
        if @options.build
          filename = null
          callback = (err, concatenation, changed) =>
            throw err if err
            if changed
              filename = @options.buildFilenamer route, concatenation
              @buildFilenames[sourcePath] = filename
              cacheFlags = expires: @options.buildsExpire
              @cache.set filename, concatenation, cacheFlags
              if buildDir = @options.buildDir
                buildPath = path.join process.cwd(), buildDir, filename
                mkdirRecursive path.dirname(buildPath), 0o0755, (err) ->
                  fs.writeFile buildPath, concatenation
            else
              filename = @buildFilenames[sourcePath]
          snocketsFlags = minify: @options.minifyBuilds, async: false
          @snockets.getConcatenation sourcePath, snocketsFlags, callback
          return @cachedRoutePaths[route] = ["/#{filename}"]
        else
          chain = @snockets.getCompiledChain sourcePath, async: false
          return @cachedRoutePaths[route] = for {filename, js} in chain
            filename = stripExt(filename) + '.js'
            @cache.set filename, js
            "/#{filename}"
      catch e
        if e.code is 'ENOENT' then continue else throw e
    throw new Error("No file found for route #{route}")

  absPath: (route) ->
    if @options.src.match EXPLICIT_PATH
      path.join @options.src, route
    else
      path.join process.cwd(), @options.src, route

# ## Asset compilers
exports.cssCompilers = cssCompilers =

  styl:
    optionsMap: {}
    compileSync: (sourcePath, source) ->
      result = ''
      callback = (err, js) ->
        throw err if err
        result = js

      libs.stylus or= require 'stylus'
      libs.bootstrap or= try require 'bootstrap-stylus' catch e then (-> ->)
      libs.nib or= try require 'nib' catch e then (-> ->)
      libs.bootstrap or= try require 'bootstrap-stylus' catch e then (-> ->)
      options = @optionsMap[sourcePath] ?=
        filename: sourcePath
      libs.stylus(source, options)
          .use(libs.bootstrap())
          .use(libs.nib())
          .use(libs.bootstrap())
          .set('compress', @compress)
          .set('include css', true)
          .render callback
      result

  less:
    optionsMap:
      optimization: 1
      silent: false
      paths: []
      color: true

    patchLess: (less) ->
      # Monkey patch importer of LESS to load files synchronously
      less.Parser.importer = (file, paths, callback) ->
        paths.unshift "."

        i = 0
        while i < paths.length
          try
            pathname = path.join(paths[i], file)
            fs.statSync(pathname)
            break
          catch e
            pathname = null

          i++

        if not pathname
          throw new Error "File #{file} not found"

        data = fs.readFileSync(pathname, 'utf-8')
        new(less.Parser)(
          paths: [path.dirname(pathname)].concat(paths)
          filename: pathname
        ).parse(data, (e, root) ->
          if (e)
            less.writeError(e)
          callback(e, root)
        )

      less

    compileSync: (sourcePath, source) ->
      result = ""
      libs.less or= @patchLess (require 'less')
      options = @optionsMap
      options.filename = sourcePath
      options.paths = [path.dirname(sourcePath)].concat(options.paths)
      compress = @compress ? false

      callback = (err, tree) ->
        throw err if err
        result = tree.toCSS({compress: compress})

      new libs.less.Parser(options).parse(source, callback)
      result


exports.jsCompilers = jsCompilers
# ## Regexes
BEFORE_DOT = /([^.]*)(\..*)?$/

EXPLICIT_PATH = /^\/|\/\/|\w:/

REMOTE_PATH = /\/\//

# ## Utility functions
getExt = (filePath) ->
  if(lastDotIndex = filePath.lastIndexOf '.') >= 0
    filePath[(lastDotIndex + 1)...]
  ''

stripExt = (filePath) ->
  if (lastDotIndex = filePath.lastIndexOf '.') >= 0
    filePath[0...lastDotIndex]
  else
    filePath

cssExts = ->
  (".#{ext}" for ext of cssCompilers).concat '.css'

timeEq = (date1, date2) ->
  date1? and date2? and date1.getTime() is date2.getTime()

mkdirRecursive = (dir, mode, callback) ->
  pathParts = path.normalize(dir).split '/'
  if fs.existsSync dir
    return callback null

  mkdirRecursive pathParts.slice(0,-1).join('/'), mode, (err) ->
    return callback err if err and err.errno isnt process.EEXIST
    fs.mkdirSync dir, mode
    callback()

exports.md5Filenamer = md5Filenamer = (filename, code) ->
  hash = crypto.createHash('md5')
  hash.update code
  md5Hex = hash.digest 'hex'
  ext = path.extname filename
  "#{stripExt filename}-#{md5Hex}#{ext}"
