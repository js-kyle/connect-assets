
fs = require 'fs'
events = require 'events'
assert = require 'assert'
async = require 'async'


ENOENT = 2
ENOTDIR = 20


class Paths
  
  constructor: () ->
    
    @items = []
    @itemsDict = {}
    
    @numItems = 0
    @pos = 0
  
  add: (x) ->
    assert.ok not @contains x
    @items.push x
    @numItems += 1
    @itemsDict[x] = true
  
  contains: (x) ->
    @itemsDict[x]?
  
  next: () ->
    return null if @items.length == 0
    @pos = (@pos + 1) % @numItems
    @items[@pos]



exports.StatWatcher = class StatWatcher extends events.EventEmitter
  
  constructor: (top, opt) ->
    
    events.EventEmitter.call this
    
    options = opt or {}
    @ignore = if opt.ignore? then new RegExp opt.ignore else null
    @match = if opt.match? then new RegExp opt.match else null
    @sampleRate = if opt['sample-rate']? then (1 * opt['sample-rate']) else 5
    @maxStatsPending = 10 # Does not apply to the initial scan
    
    @paths = new Paths()
    @paths.add top
    @path_mtime = {}
    @numStatsPending = 0
    @preexistingPathsToReport = {}
    @numPreexistingPathsToReport = 0
    
    pathsIn top, (paths) =>
      for path in paths
        if (not @paths.contains path) and
           (not @ignore or not path.match @ignore) and 
           (not @match or path.match @match)
          
          @preexistingPathsToReport[path] = true
          @numPreexistingPathsToReport++
          
          @paths.add path
          @statPath path
      @intervalId = setInterval (() => @tick()), @sampleRate
  
  end: () ->
    clearInterval @intervalId
  
  tick: () ->
    if @numStatsPending <= @maxStatsPending
      path = @paths.next()
      if path
        @statPath path
  
  statPath: (path) ->
    
    @numStatsPending++
    fs.stat path, (err, stats) =>
      @numStatsPending--
      last_mtime = @path_mtime[path] or null
      
      if err
        
        # file deleted
        if err.errno == ENOENT
          if last_mtime
            @emit 'fileDeleted', path
            delete @path_mtime[path]
        
        # error
        else
          throw err
      
      else
        
        @path_mtime[path] = stats.mtime
        
        # (new or modified) dir
        if stats.isDirectory()
          if (not last_mtime) or (stats.mtime > last_mtime)
            @scanDir path
        
        else
          
          # new file
          if not last_mtime
            
            eventName = 'fileCreated'
            if @preexistingPathsToReport[path]
              eventName = 'filePreexisted'
              delete @preexistingPathsToReport[path]
              @numPreexistingPathsToReport--            
            @emit eventName, path, stats
          
          # modified file
          else if stats.mtime > last_mtime
            @emit 'fileModified', path, stats
      
      if @numPreexistingPathsToReport == 0
        @emit 'allPreexistingFilesReported'
        @numPreexistingPathsToReport = -1
  
  scanDir: (path) ->
    fs.readdir path, (err, files) =>
      for file in files
        path2 = "#{path}/#{file}"
        if (not @paths.contains path2) and
           (not @ignore or not path2.match @ignore) and 
           (not @match or path2.match @match)
          @paths.add path2
          @statPath path2


_pathsIn = (path, paths, callback) ->
  fs.readdir path, (err, files) ->
    
    # Case: file
    if err and err.errno == ENOTDIR
      paths.push path
      return callback()
    
    # Case: error
    throw err if err
    
    # Case: dir
    async.forEach(
      files,
      ((file, cb) ->
        _pathsIn("#{path}/#{file}", paths, cb)),
      ((err) ->
        throw err if err
        callback())
    )


pathsIn = (dir, callback) ->
  paths = []
  _pathsIn dir, paths, () ->
    callback paths


