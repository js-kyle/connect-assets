(function() {
  var watch_tree, _;
  _ = require('underscore');
  watch_tree = require('./watch-tree');
  exports.main = function() {
    var arg, argv, path, w;
    argv = require('optimist').argv;
    arg = argv._.length ? argv._[0] : '.';
    path = require('path').join(process.cwd(), arg);
    w = watch_tree.watchTree(path, argv);
    return _.forEach(watch_tree.EVENTS, function(k, path, stats) {
      return w.on(k, function(path, stats) {
        var x;
        x = k === 'allPreexistingFilesReported' ? [k] : k === 'fileDeleted' ? [k, path] : [k, path, stats.mtime.toISOString()];
        return process.stdout.write(JSON.stringify(x) + '\n');
      });
    });
  };
}).call(this);
