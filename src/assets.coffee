# [connect-assets](http://github.com/TrevorBurnham/connect-assets)

connectCache  = require 'connect-file-cache'
Snockets      = require 'snockets'

crypto        = require 'crypto'
fs            = require 'fs'
path          = require 'path'
_             = require 'underscore'
{parse}       = require 'url'

connectAssets = null
libs = {}

module.exports = (options = {}) ->
  options.src ?= 'assets'
  options.helperContext ?= global
  if process.env.NODE_ENV is 'production'
    options.build ?= true
    cssCompilers.styl.compress ?= true
  options.buildDir ?= 'builtAssets'
  options.buildFilenamer ?= md5Filenamer
  options.buildsExpire ?= false
  options.minifyBuilds ?= true

  connectAssets = new ConnectAssets options
  connectAssets.createHelpers options
  connectAssets.cache.middleware

class ConnectAssets
  constructor: (@options) ->
    @cache = connectCache()
    @snockets = new Snockets src: @options.src

  # ## CSS and JS tag functions
  createHelpers: ->
    context = @options.helperContext
    expandRoute = (shortRoute, ext, rootDir) ->
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
      else
        routes = @compileJS route
      ("<script src='#{r}'></script>" for r in routes).join '\n'
    context.js.root = 'js'

  # Synchronously compile Stylus to CSS (if needed) and return the route
  compileCSS: (route) ->
    for ext in ['css'].concat (ext for ext of cssCompilers)
      sourcePath = stripExt(route) + ".#{ext}"
      try
        stats = fs.statSync @absPath(sourcePath)
        if ext is 'css'
          if timeEq stats.mtime, @cache.map[route]?.mtime
            css = @cache.map[route].data
          else
            css = fs.readFileSync @absPath(sourcePath)
        else
          source = fs.readFileSync @absPath(sourcePath), 'utf8'
          css = cssCompilers[ext].compileSync @absPath(sourcePath), source
        if @options.build
          filename = @options.buildFilenamer route, css
          cacheFlags = expires: @options.buildsExpire, mtime: stats.mtime
          @cache.set filename, css, cacheFlags
          if @options.buildDir
            buildPath = path.join process.cwd(), @options.buildDir, filename
            mkdirRecursive path.dirname(buildPath), 0755, ->
              fs.writeFile buildPath, css
          return "/#{filename}"
        else
          @cache.set route, css, mtime: stats.mtime
          return "/#{route}"
      catch e
        if e.code is 'ENOENT' then continue else throw e
    throw new Error("No file found for route #{route}")

  # Synchronously compile to JS with Snockets (if needed) and return route(s)
  compileJS: (route) ->
    for ext in ['js'].concat (ext for ext of jsCompilers)
      sourcePath = stripExt(route) + ".#{ext}"
      try
        if @options.build
          snocketsFlags = minify: @options.minifyBuilds, async: false
          concatenation = @snockets.getConcatenation sourcePath, snocketsFlags
          filename = @options.buildFilenamer route, concatenation
          cacheFlags = expires: @options.buildsExpire
          @cache.set filename, concatenation, cacheFlags
          if @options.buildDir
            buildPath = path.join process.cwd(), @options.buildDir, filename
            mkdirRecursive path.dirname(buildPath), 0755, (err) ->
              console.log err if err
              fs.writeFile buildPath, concatenation
          return ["/#{filename}"]
        else
          chain = @snockets.getCompiledChain sourcePath, async: false
          return filenames = for {filename, js} in chain
            filename = stripExt(filename) + '.js'
            @cache.set filename, js
            "/#{filename}"
      catch e
        if e.code is 'ENOENT' then continue else throw e
    throw new Error("No file found for route #{route}")

  absPath: (route) ->
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

# Utility functions
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
