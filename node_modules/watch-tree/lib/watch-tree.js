(function() {
  var StatWatcher;
  StatWatcher = require('./watchers/stat').StatWatcher;
  exports.EVENTS = ['allPreexistingFilesReported', 'filePreexisted', 'fileCreated', 'fileModified', 'fileDeleted'];
  exports.watchTree = function(path, options) {
    options = options || {};
    return new StatWatcher(path, options);
  };
}).call(this);
