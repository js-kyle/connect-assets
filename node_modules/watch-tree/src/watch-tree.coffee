
{StatWatcher} = require './watchers/stat'


exports.EVENTS = [
  'allPreexistingFilesReported'
  'filePreexisted'
  'fileCreated'
  'fileModified'
  'fileDeleted'
]

exports.watchTree = (path, options) ->
  options = options or {}
  new StatWatcher path, options


