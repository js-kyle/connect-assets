# [http://github.com/TrevorBurnham/connect-assets](http://github.com/TrevorBurnham/connect-assets)

fs      = require 'fs'
mime    = require 'mime'
path    = require 'path'
{parse} = require 'url'

cache = {}
libs = {}
dependencies = {}

module.exports = (options = {}) ->
  options.src ?= 'assets'
  options.helperContext ?= global
  if options.helperContext?
    createHelpers options
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

HEADER = ///
(?:
  (\#\#\# .* \#\#\#\n?) |
  (\\/\\/ .* \n?) |
  (\# .* \n?)
)+
///

DIRECTIVE = ///
^[\W] *= \s* (\w+.*?) (\*\\/)?$
///gm

EXPLICIT_PATH = /^\/|^\.|:/
REMOTE_PATH = /\/\//

relPath = (root, fullPath) ->
  fullPath.slice root.length

createHelpers = (options) ->
  context = options.helperContext
  expandPath = (filePath, ext, root) ->
    unless filePath.match EXPLICIT_PATH
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
    if context.js.concatenate
      #TODO
      "<script src='#{jsPath}'></script>"
    else
      generateTags = (filePath) ->
        if filePath.match REMOTE_PATH
          return ["<script src='#{filePath}'></script>"]
        tags = []
        # generate tags of dependencies
        for depPath in dependencies[filePath]
          tags = tags.concat generateTags(depPath)
        tags.push "<script src='#{relPath options.src, filePath}'></script>"
        tags
      dependencyTags = ''
      if options.src? and !jsPath.match REMOTE_PATH
        filePath = path.join options.src, jsPath
        updateDependenciesSync filePath, jsPath
        generateTags(filePath).join('\n')
      else
        "<script src='#{jsPath}'></script>"
  context.js.root = '/js'
  context.js.concatenate = !!process.env.PRODUCTION

# ## Dependency management

updateDependenciesSync = (filePath) ->
  dependencies[filePath] ?= []
  return if filePath.match REMOTE_PATH

  processFile = (filePath) ->
    stats = fs.statSync filePath
    return null if cache[filePath]?.mtime is stats.mtime
    str = fs.readFileSync(filePath, 'utf8')
    cache[filePath] = {mtime: stats.mtime, str}
    directivesInCode str

  try
    directives = processFile filePath
  catch e
    for ext, compiler of compilers when compiler.match.test(filePath)
      try
        fallbackPath = filePath.replace(compiler.match, ".#{ext}")
        directives = processFile fallbackPath
        break

  if directives?
    dependencies[filePath] = []
  else
    return # no file found, or no changes since last time

  for directive in directives
    words = directive.split /\s+/
    switch words[0]
      when 'require'
        for depPath in words[1..]
          depPath = depPath.replace /'"/g, ''
          if depPath.indexOf('.') is -1 then depPath += '.js'
          unless depPath.match EXPLICIT_PATH
            depPath = path.join filePath, '../', depPath
          updateDependenciesSync depPath
          dependencies[filePath].push depPath

  dependencies[filePath]

directivesInCode = (code) ->
  header = HEADER.exec(code)[0]
  match[1] while match = DIRECTIVE.exec header