# [http://github.com/TrevorBurnham/connect-assets](http://github.com/TrevorBurnham/connect-assets)

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
    cachedTarget = cache[targetPath]
    if cachedTarget and (!cachedTarget.mtime)  # memory content
      return sendCallback(res, next, {targetPath}) null, cachedTarget.str
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
        str = cache[targetPath].str
        return sendFile res, next, {str, stats, targetPath}
    compiler.compile srcPath, sendCallback(res, next, {stats, targetPath})

sendCallback = (res, next, {stats, targetPath}) ->
  (err, str) ->
    return next err if err
    sendFile res, next, {str, stats, targetPath}

sendFile = (res, next, {str, stats, targetPath}) ->
    if stats then cache[targetPath] = {mtime: stats.mtime, str}
    res.setHeader 'Content-Type', mime.lookup(targetPath)
    res.end str

exports.compilers = compilers =
  coffee:
    match: /\.js$/
    compile: (filePath, callback) ->
      libs.CoffeeScript or= require 'coffee-script'
      fs.readFile filePath, 'utf8', (err, str) ->
        return callback err if err
        try
          callback null, libs.CoffeeScript.compile str
        catch e
          callback e
    compileStr: (code) ->
      libs.CoffeeScript or= require 'coffee-script'
      libs.CoffeeScript.compile code
  styl:
    match: /\.css$/
    compile: (filePath, callback) ->
      libs.stylus or= require 'stylus'
      libs.nib or= try require 'nib' catch e then (-> ->)
      fs.readFile filePath, 'utf8', (err, str) ->
        libs.stylus(str).set('filename', filePath)
                        .use(libs.nib())
                        .render(callback)

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

EXPLICIT_PATH = /^\/|:/
REMOTE_PATH = /\/\//

relPath = (root, fullPath) ->
  fullPath.slice root.length

productionPath = (devPath) ->
  devPath.replace /\.js$/, '.complete.js'

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
    cssPath = expandPath cssPath, cssExt, context.css.root
    "<link rel='stylesheet' href='#{cssPath}'>"
  context.css.root = '/css'

  jsExt = '.js'
  context.js = (jsPath) ->
    jsPath = expandPath jsPath, jsExt, context.js.root
    if context.js.concatenate
      if options.src? and !jsPath.match REMOTE_PATH
        filePath = path.join options.src, jsPath
        updateDependenciesSync filePath
        str = concatenate filePath, options
        str = minify str
        cache[productionPath filePath] = {str}
      tag = "<script src='#{productionPath jsPath}'></script>"
    else
      dependencyTags = ''
      if options.src? and !jsPath.match REMOTE_PATH
        filePath = path.join options.src, jsPath
        updateDependenciesSync filePath
        tag = generateTags(filePath, options).join('\n')
      else
        tag = "<script src='#{jsPath}'></script>"
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
            unless p.match EXPLICIT_PATH
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
            compileCallback sourcePath
            break
        str = fs.readFileSync(sourcePath, 'utf8')
        cache[sourcePath] = {mtime: stats.mtime, str}
        str = compiler.compileStr str
        cache[filePath] = {mtime: stats.mtime, str}
        compileCallback sourcePath
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
  tags = for depPath in collectDependencies(filePath)
    "<script src='#{relPath options.src, depPath}'></script>"
  tags.push "<script src='#{relPath options.src, filePath}'></script>"
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