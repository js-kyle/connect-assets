(function() {
  var EventBuffer, check_exec, check_exec_options, exec, listsContainSameElements, sys;
  var __slice = Array.prototype.slice;
  exec = require('child_process').exec;
  sys = require('sys');
  exports.check_exec_options = check_exec_options = function(cmd, options, callback) {
    return exec(cmd, options, function(e, stdout, stderr) {
      if (e) {
        throw e;
      }
      if (callback) {
        return callback();
      }
    });
  };
  exports.check_exec = check_exec = function(cmd, callback) {
    return exec(cmd, function(e, stdout, stderr) {
      if (e) {
        throw e;
      }
      if (callback) {
        return callback();
      }
    });
  };
  exports.listsContainSameElements = listsContainSameElements = function(t, arr1, arr2) {
    var d1, d2, x, _i, _j, _len, _len2;
    d1 = {};
    d2 = {};
    for (_i = 0, _len = arr1.length; _i < _len; _i++) {
      x = arr1[_i];
      d1[x] = true;
    }
    for (_j = 0, _len2 = arr2.length; _j < _len2; _j++) {
      x = arr2[_j];
      d2[x] = true;
    }
    return t.deepEqual(d1, d2);
  };
  exports.EventBuffer = EventBuffer = (function() {
    function EventBuffer() {
      this.stack = [];
      this.callback = null;
    }
    EventBuffer.prototype.wait = function(callback) {
      var event;
      if (this.stack.length > 0) {
        event = this.stack.pop();
        return callback(event);
      } else {
        if (this.callback) {
          throw new Error("Only store one callback");
        }
        return this.callback = callback;
      }
    };
    EventBuffer.prototype.expect = function() {
      var args, t;
      t = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      sys.debug("Expecting " + args[0] + "...");
      return this.wait(function(event) {
        var i, x, _len, _ref;
        _ref = args.slice(0, -1);
        for (i = 0, _len = _ref.length; i < _len; i++) {
          x = _ref[i];
          t.equal(event[i], x);
        }
        return args.slice(-1)[0](event);
      });
    };
    EventBuffer.prototype.event = function(event) {
      var callback;
      if (this.callback) {
        callback = this.callback;
        this.callback = null;
        return callback(event);
      } else {
        return this.stack.push(event);
      }
    };
    return EventBuffer;
  })();
}).call(this);
