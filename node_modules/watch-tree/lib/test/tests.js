(function() {
  var EventBuffer, check_exec, check_exec_options, cwd, delay, fs, listsContainSameElements, testWatch, tmp, watch_tree, _, _ref;
  fs = require('fs');
  _ = require('underscore');
  watch_tree = require('./../watch-tree');
  _ref = require('./testing_util'), check_exec_options = _ref.check_exec_options, check_exec = _ref.check_exec, EventBuffer = _ref.EventBuffer, listsContainSameElements = _ref.listsContainSameElements;
  cwd = process.cwd();
  tmp = "" + cwd + "/lib/test/temp";
  console.log(tmp);
  delay = function(callback) {
    return setTimeout(callback, 1200);
  };
  testWatch = function(t, options) {
    return check_exec("mkdir -p " + tmp, function() {
      return check_exec("touch " + tmp + "/temp", function() {
        return check_exec_options("rm *", {
          cwd: tmp
        }, function() {
          return check_exec("touch " + tmp + "/X", function() {
            return check_exec("touch " + tmp + "/Y", function() {
              var eb, w;
              if (options) {
                w = watch_tree.watchTree(tmp, options);
              } else {
                w = watch_tree.watchTree(tmp);
              }
              eb = new EventBuffer;
              _.forEach(watch_tree.EVENTS, function(k) {
                return w.on(k, function(x) {
                  return eb.event([k, x]);
                });
              });
              return eb.expect(t, 'filePreexisted', function(ev) {
                return eb.expect(t, 'filePreexisted', function(ev2) {
                  listsContainSameElements(t, [ev[1], ev2[1]], ["" + tmp + "/X", "" + tmp + "/Y"]);
                  return eb.expect(t, 'allPreexistingFilesReported', function() {
                    delay(function() {
                      return check_exec("touch " + tmp + "/Z");
                    });
                    return eb.expect(t, 'fileCreated', "" + tmp + "/Z", function() {
                      delay(function() {
                        return check_exec("date >> " + tmp + "/Y");
                      });
                      return eb.expect(t, 'fileModified', "" + tmp + "/Y", function() {
                        check_exec("rm " + tmp + "/X");
                        return eb.expect(t, 'fileDeleted', "" + tmp + "/X", function() {
                          check_exec("touch " + tmp + "/X");
                          return eb.expect(t, 'fileCreated', "" + tmp + "/X", function() {
                            w.end();
                            return t.finish();
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  };
  module.exports = {
    undefined: function(t) {
      return testWatch(t);
    },
    empty: function(t) {
      return testWatch(t, {});
    },
    match: function(t) {
      return testWatch(t, {
        match: '.*'
      });
    },
    ignore: function(t) {
      return testWatch(t, {
        ignore: 'vMk8F6eB'
      });
    },
    sample_rate: function(t) {
      return testWatch(t, {
        'sample-rate': 1
      });
    }
  };
}).call(this);
