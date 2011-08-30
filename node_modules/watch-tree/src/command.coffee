
_ = require 'underscore'
watch_tree = require './watch-tree'


exports.main = () ->
  
  argv = require('optimist').argv
  arg = if argv._.length then argv._[0] else '.'
  path = require('path').join(process.cwd(), arg)
  
  w = watch_tree.watchTree(path, argv)
  _.forEach watch_tree.EVENTS, (k, path, stats) ->
    w.on k, (path, stats) ->
      x = if k == 'allPreexistingFilesReported'
        [k]
      else if k == 'fileDeleted'
        [k, path]
      else
        [k, path, stats.mtime.toISOString()]
      process.stdout.write(JSON.stringify(x) + '\n')

