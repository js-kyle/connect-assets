# [http://github.com/TrevorBurnham/connect-assets](http://github.com/TrevorBurnham/connect-assets)

crypto  = require 'crypto'
fs      = require 'fs'
mime    = require 'mime'
path    = require 'path'
{parse} = require 'url'
uglify  = require 'uglify-js'

cache = {}
libs = {}
dependencies = {}

module.exports = (options = {}) ->
  options.src ?= 'assets'
  options.helperContext ?= global
  options.suffixGenerator ?=
    if process.env.NODE_ENV is 'production' then md5Suffix else (-> '')
  if options.helperContext?
    createHelpers options
  if options.src?
    assetsMiddleware options

# ## Asset serving and compilation

module.exports.FAR_FUTURE_EXPIRES = "Wed, 01 Feb 2034 12:34:56 GMT"

assetsMiddleware = (options) ->
  src = options.src
  (req, res, next) ->
    return next() unless req.method is 'GET'
    targetPath = path.join src, parse(req.url).pathname
    return next() if targetPath.slice(-1) is '/'  # ignore directory requests
    cachedTarget = cache[stripSuffix targetPath]
    if cachedTarget and (!cachedTarget.mtime)  # memory content
      {static, str} = cachedTarget
      return sendFile(res, next, {static, str, targetPath})
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
  if cache[targetPath]?.mtime
    unless stats.mtime > cache[targetPath].mtime
      str = cache[targetPath].str
      return sendFile res, next, {str, stats, targetPath}
  fs.readFile targetPath, 'utf8', sendCallback(res, next, {stats, targetPath})

serveCompiled = (req, res, next, {compiler, ext, targetPath}) ->
  srcPath = targetPath.replace(compiler.match, ".#{ext}")
  fs.stat srcPath, (err, stats) ->
    return next() if err?.code is 'ENOENT'  # no file, no problem!
    return next err if err
    if cache[targetPath]?.mtime
      unless stats.mtime > cache[targetPath].mtime
        if compiler is compilers.styl  # @import-ed files may have changed
          cache[targetPath].str = compiler.compileStr cache[srcPath].str, srcPath
        str = cache[targetPath].str
        return sendFile res, next, {str, stats, targetPath}
    compiler.compile srcPath, sendCallback(res, next, {stats, targetPath})

sendCallback = (res, next, {static, stats, targetPath}) ->
  (err, str) ->
    return next err if err
    sendFile res, next, {str, static, stats, targetPath}

sendFile = (res, next, {str, static, stats, targetPath}) ->
  if stats then cache[targetPath] = {mtime: stats.mtime, str}
  res.setHeader 'Content-Type', mime.lookup(targetPath)
  res.setHeader 'Expires', module.exports.FAR_FUTURE_EXPIRES if static
  res.end str

module.exports.compilers = compilers =
  coffee:
    match: /\.js$/
    compile: (filePath, callback) ->
      fs.readFile filePath, 'utf8', (err, coffee) ->
        return callback err if err
        try
          callback null, compilers.coffee.compileStr coffee, filePath
        catch e
          callback e
    compileStr: (coffee, filePath) ->
      libs.CoffeeScript or= require 'coffee-script'
      libs.CoffeeScript.compile coffee, {filename: filePath}
  styl:
    match: /\.css$/
    optionsMap: {}
    compress: process.env.NODE_ENV is 'production'
    compile: (filePath, callback) ->
      fs.readFile filePath, 'utf8', (err, styl) ->
        return callback err if err
        try
          callback null, compilers.styl.compileStr styl, filePath
        catch e
          callback e
    compileStr: (styl, filePath) ->
      options = compilers.styl.optionsMap[filePath] ?=
        filename: filePath
        compress: compilers.styl.compress
      result = ''
      callback = (err, css) ->
        throw err if err
        result = css
      libs.stylus or= require 'stylus'
      libs.nib or= try require 'nib' catch e then (-> ->)
      libs.stylus(styl, options)
          .use(libs.nib())
          .render callback
      result

# ## Helper functions for templates

HEADER = ///
(?:
  (\#\#\# .* \#\#\#\n?) |
  (// .* \n?) |
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

productionJsPath = (filePath, suffix='') ->
  filePath.replace /\.js$/, ".complete#{suffix}.js"

stripSuffix = (filePath) ->
  filePath.replace /-[a-f0-9]*\.js$/, ".js"

jsProductionUrl = (jsUrl, options) ->
  filePath = path.join options.src, jsUrl
  jsPath = productionJsPath filePath
  cache[jsPath] ?= prepareJs filePath, options
  productionJsPath filePath, cache[jsPath].suffix

prepareJs = (filePath, options) ->
  updateDependenciesSync filePath
  str = concatenate filePath, options
  str = minify str
  suffix = options.suffixGenerator filePath, str
  {str, static: true, suffix: suffix}

  
createHelpers = (options) ->
  context = options.helperContext
  expandPath = (filePath, ext, root) ->
    unless filePath.match EXPLICIT_PATH
      filePath = path.join root, filePath
    if filePath.indexOf(ext, filePath.length - ext.length) is -1
      filePath += ext
    filePath

  cssExt = '.css'
  context.css = (cssPath) ->
    cssUrl = expandPath cssPath, cssExt, context.css.root
    if options.src? and !cssPath.match EXPLICIT_PATH
      filePath = path.join options.src, cssUrl
      readFileOrCompile filePath
      suffix = options.suffixGenerator filePath, cache[filePath].str
      staticPath = cssUrl.replace /\.css$/, "#{suffix}.css"
      if suffix isnt ''
        cache[path.join options.src, staticPath] = {str: cache[filePath].str, static: true}
      "<link rel='stylesheet' href='#{staticPath}'>"
    else
      "<link rel='stylesheet' href='#{cssUrl}'>"
  context.css.root = '/css'

  jsExt = '.js'
  context.js = (jsPath) ->
    jsUrl = expandPath jsPath, jsExt, context.js.root
    if context.js.concatenate
      if options.src? and !jsUrl.match REMOTE_PATH
        packagePath = jsProductionUrl jsUrl, options
        tag = "<script src='#{relPath options.src, packagePath}'></script>"
      else
        tag = "<script src='#{jsUrl}'></script>"
    else
      dependencyTags = ''
      if options.src? and !jsUrl.match REMOTE_PATH
        filePath = path.join options.src, jsUrl
        updateDependenciesSync filePath
        tag = generateTags(filePath, options).join('\n')
      else
        tag = "<script src='#{jsUrl}'></script>"
    tag
  context.js.root = '/js'
  context.js.concatenate = process.env.NODE_ENV is 'production'

# ## Dependency management

updateDependenciesSync = (filePath) ->
  dependencies[filePath] ?= []
  return if filePath.match REMOTE_PATH

  oldTime = cache[filePath]?.mtime
  directivePath = filePath
  readFileOrCompile filePath, (sourcePath) -> directivePath = sourcePath
  if cache[filePath].mtime.getTime() is oldTime?.getTime()
    updateDependenciesSync(p) for p in dependencies[filePath]
    return

  jsCompilerExts = ".#{ext}" for ext, c of compilers when c.match '.js'
  jsExtList = ['.js'].concat jsCompilerExts

  dependencies[filePath] = []
  for directive in directivesInCode cache[directivePath].str
    words = directive.replace(/['"]/g, '').split /\s+/
    switch words[0]
      when 'require'
        for depPath in words[1..]
          if path.extname(depPath) isnt '.js' then depPath += '.js'
          unless depPath.match EXPLICIT_PATH
            depPath = path.join filePath, '../', depPath
          if depPath is filePath
            throw new Error("Script tries to require itself: #{filePath}")
          continue if depPath in dependencies[filePath]
          updateDependenciesSync depPath
          dependencies[filePath].push depPath
      when 'require_tree'
        requireTree = (parentDir, paths) ->
          for p in paths
            p = path.join parentDir, p
            continue if p is filePath
            stats = fs.statSync p
            if stats.isFile()
              continue unless path.extname(p) in jsExtList
              if path.extname(p) isnt '.js' then p = p.replace /[^.]+$/, 'js'
              continue if p is filePath
              continue if p in dependencies[filePath]
              updateDependenciesSync p
              dependencies[filePath].push p
            else if stats.isDirectory()
              requireTree p, fs.readdirSync(p)
        requireTree path.dirname(filePath), words[1..]

  dependencies[filePath]

readFileOrCompile = (filePath, compileCallback) ->
  try
    stats = fs.statSync filePath
    if cache[filePath]?.mtime
      return stats unless stats.mtime > cache[filePath].mtime
    str = fs.readFileSync filePath, 'utf8'
    cache[filePath] = {mtime: stats.mtime, str}
  catch e
    for ext, compiler of compilers when compiler.match.test(filePath)
      try
        sourcePath = filePath.replace(compiler.match, ".#{ext}")
        stats = fs.statSync sourcePath
        if cache[sourcePath]?.mtime
          unless stats.mtime > cache[sourcePath]?.mtime
            if compiler is compilers.styl  # @import-ed files may have changed
              cache[filePath].str = compiler.compileStr cache[sourcePath].str, sourcePath
            compileCallback? sourcePath
            break
        str = fs.readFileSync(sourcePath, 'utf8')
        cache[sourcePath] = {mtime: stats.mtime, str}
      catch ex
        continue
      str = compiler.compileStr str, sourcePath
      cache[filePath] = {mtime: stats.mtime, str}
      compileCallback? sourcePath
      break
  throw new Error("File not found: #{filePath}") unless stats
  stats

directivesInCode = (code) ->
  return [] unless match = HEADER.exec(code)
  header = match[0]
  match[1] while match = DIRECTIVE.exec header

# recurse through the dependency graph, avoiding duplicates and cycles
collectDependencies = (filePath, traversedPaths = [], traversedBranch = []) ->
  for depPath in dependencies[filePath].slice(0).reverse()
    if depPath in traversedBranch          # cycle
        throw new Error("Cyclic dependency from #{filePath} to #{depPath}")
    continue if depPath in traversedPaths  # duplicate
    traversedPaths.unshift depPath
    traversedBranch.unshift depPath
    collectDependencies depPath, traversedPaths, traversedBranch.slice(0)
  traversedPaths

generateTags = (filePath, options) ->
  if filePath.match REMOTE_PATH
    return ["<script src='#{filePath}'></script>"]
  tags = for depPath in collectDependencies(filePath).concat [filePath]
    outputPath = relPath options.src, depPath
    suffix = options.suffixGenerator filePath, cache[filePath].str
    if suffix isnt ''
      cache["#{outputPath}#{suffix}"] = {str, static: true}
    "<script src='#{outputPath}#{suffix}'></script>"
  tags

concatenate = (filePath, options) ->
  script = ''
  for depPath in collectDependencies(filePath)
    script += cache[depPath].str + '\n'
  script += cache[filePath].str

minify = (js) ->
  jsp = uglify.parser
  pro = uglify.uglify
  ast = jsp.parse js
  ast = pro.ast_mangle ast
  ast = pro.ast_squeeze ast
  pro.gen_code ast

md5Suffix = (filePath, str) ->
  hash = crypto.createHash('md5')
  hash.update str
  md5Hex = hash.digest 'hex'
  "-#{md5Hex}"
