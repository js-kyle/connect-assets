# [http://github.com/TrevorBurnham/connect-assets](http://github.com/TrevorBurnham/connect-assets)

fs      = require 'fs'
mime    = require 'mime'
path    = require 'path'
{parse} = require 'url'

cache = {}
libs = {}

module.exports = (options = {}) ->
  options.src ?= 'assets'
  options.helperContext ?= global
  if options.helperContext?
    createHelpers options.helperContext
  if options.src?
    assetsMiddleware options

# ## Asset serving and compilation

assetsMiddleware = (options) ->
  src = options.src
  (req, res, next) ->
    return next() unless req.method is 'GET'
    targetPath = path.join src, parse(req.url).pathname
    return next() if targetPath.slice(-1) is '/'  # ignore directory requests
    fs.stat targetPath, (err, stats) ->
      # if the file exists, serve it
      return serveRaw req, res, next, {stats, targetPath} unless err
      # if the file doesn't exist, see if it can be compiled
      for ext, compiler of compilers
        if compiler.match.test targetPath
          return serveCompiled req, res, next, {compiler, ext, targetPath}
      # otherwise, pass the request up the Connect stack
      next()

serveRaw = (req, res, next, {stats, targetPath}) ->
  if cache[targetPath]?.mtime is stats.mtime
    return res.end cache.str
  fs.readFile targetPath, 'utf8', sendCallback(res, next, {stats, targetPath})

serveCompiled = (req, res, next, {compiler, ext, targetPath}) ->
  srcPath = targetPath.replace(compiler.match, ".#{ext}")
  fs.stat srcPath, (err, stats) ->
    return next() if err?.code is 'ENOENT'  # no file, no problem!
    return next err if err
    if cache[targetPath]?.mtime is stats.mtime
      return res.end cache.str
    compiler.compile srcPath, sendCallback(res, next, {stats, targetPath})

sendCallback = (res, next, {stats, targetPath}) ->
  (err, str) ->
    return next err if err
    cache[targetPath] = {mtime: stats.mtime, str}
    res.setHeader 'Content-Type', mime.lookup(targetPath)
    res.end str

exports.compilers = compilers =
  coffee:
    match: /\.js$/
    compile: (filepath, callback) ->
      libs.CoffeeScript or= require 'coffee-script'
      fs.readFile filepath, 'utf8', (err, str) ->
        return callback err if err
        try
          callback null, libs.CoffeeScript.compile str
        catch e
          callback e
  styl:
    match: /\.css$/
    compile: (filepath, callback) ->
      libs.stylus or= require 'stylus'
      libs.nib or= try require 'nib' catch e then (-> ->)
      fs.readFile filepath, 'utf8', (err, str) ->
        libs.stylus(str).set('filename', filepath)
                        .use(libs.nib())
                        .render(callback)

# ## Helper functions for templates

createHelpers = (context) ->
  explicitPath = /^\/|^\.|:/
  expandPath = (filePath, ext, root) ->
    unless filePath.match explicitPath
      filePath = "#{root}/#{filePath}"
    if filePath.indexOf(ext, filePath.length - ext.length) is -1
      filePath += ext
    filePath

  cssExt = '.css'
  context.css = (cssPath) ->
    cssPath = expandPath cssPath, cssExt, context.css.root
    "<link rel='stylesheet' href='#{cssPath}'>"
  context.css.root = '/css'

  jsExt = '.js'
  context.js = (jsPath) ->
    jsPath = expandPath jsPath, jsExt, context.js.root
    "<script src='#{jsPath}'></script>"
  context.js.root = '/js'