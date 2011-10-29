# [connect-assets](http://github.com/TrevorBurnham/connect-assets)

connectCache  = require 'connect-file-cache'
Snockets      = require 'snockets'

crypto        = require 'crypto'
fs            = require 'fs'
path          = require 'path'
_             = require 'underscore'
{parse}       = require 'url'

libs = {}

module.exports = (options = {}) ->
  return connectAssets if connectAssets
  options.src ?= 'assets'
  options.helperContext ?= global
  if process.env.NODE_ENV is 'production'
    options.build ?= true
    cssCompilers.styl.compress ?= true
  options.buildDir ?= 'builtAssets'
  options.buildFilenamer ?= md5Filenamer
  options.buildsExpire ?= false
  options.detectChanges ?= true
  options.minifyBuilds ?= true

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
        shortRoute = path.join rootDir, shortRoute
      if shortRoute.indexOf(ext, shortRoute.length - ext.length) is -1
        shortRoute += ext
      shortRoute

    context.css = (route) =>
      route = expandRoute route, '.css', context.css.root
      unless route.match REMOTE_PATH
        route = @compileCSS route
      "<link rel='stylesheet' href='#{route}'>"
    context.css.root = 'css'

    context.js = (route) =>
      route = expandRoute route, '.js', context.js.root
      if route.match REMOTE_PATH
        routes = [route]
      else if srcIsRemote
        routes = ["#{@options.src}/#{route}"]
      else
        routes = @compileJS route
      ("<script src='#{r}'></script>" for r in routes).join '\n'
    context.js.root = 'js'

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
            css = fs.readFileSync @absPath(sourcePath)
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
            mkdirRecursive path.dirname(buildPath), 0755, ->
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
                mkdirRecursive path.dirname(buildPath), 0755, (err) ->
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
      libs.nib or= try require 'nib' catch e then (-> ->)
      options = @optionsMap[sourcePath] ?=
        filename: sourcePath
        compress: @compress
      libs.stylus(source, options)
          .use(libs.nib())
          .render callback
      result

exports.jsCompilers = jsCompilers = Snockets.compilers

# ## Regexes
BEFORE_DOT = /([^.]*)(\..*)?$/

EXPLICIT_PATH = /^\/|\/\//

REMOTE_PATH = /\/\//

# ## Utility functions
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
  path.exists dir, (exists) ->
    return callback null if exists
    mkdirRecursive pathParts.slice(0,-1).join('/'), mode, (err) ->
      return callback err if err and err.errno isnt process.EEXIST
      fs.mkdir dir, mode, callback

exports.md5Filenamer = md5Filenamer = (filename, code) ->
  hash = crypto.createHash('md5')
  hash.update code
  md5Hex = hash.digest 'hex'
  ext = path.extname filename
  "#{stripExt filename}-#{md5Hex}#{ext}"