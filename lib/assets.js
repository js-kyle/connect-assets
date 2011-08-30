(function() {
  var cache, compilers, fs, libs, parse, path, serveCompiled, serveRaw;
  fs = require('fs');
  path = require('path');
  parse = require('url').parse;
  cache = {};
  libs = {};
  module.exports = function(options) {
    var src, _ref;
    if (options == null) {
      options = {};
    }
    src = (_ref = options.src) != null ? _ref : 'assets';
    return function(req, res, next) {
      var targetPath;
      if (req.method !== 'GET') {
        return next();
      }
      targetPath = path.join(src, parse(req.url).pathname);
      if (targetPath.slice(-1) === '/') {
        return next();
      }
      return fs.stat(targetPath, function(err, stats) {
        var compiler, ext;
        if (!err) {
          return serveRaw(req, res, next, {
            stats: stats,
            targetPath: targetPath
          });
        }
        for (ext in compilers) {
          compiler = compilers[ext];
          if (compiler.match.test(targetPath)) {
            return serveCompiled(req, res, next, {
              compiler: compiler,
              ext: ext,
              targetPath: targetPath
            });
          }
        }
        return next();
      });
    };
  };
  serveRaw = function(req, res, next, _arg) {
    var stats, targetPath, _ref;
    stats = _arg.stats, targetPath = _arg.targetPath;
    if (((_ref = cache[targetPath]) != null ? _ref.mtime : void 0) === stats.mtime) {
      return res.end(cache.str);
    }
    return fs.readFile(targetPath, 'utf8', function(err, str) {
      if (err) {
        return next(err);
      }
      cache[targetPath] = {
        mtime: stats.mtime,
        str: str
      };
      return res.end(str);
    });
  };
  serveCompiled = function(req, res, next, _arg) {
    var compiler, ext, srcPath, targetPath;
    compiler = _arg.compiler, ext = _arg.ext, targetPath = _arg.targetPath;
    srcPath = targetPath.replace(compiler.match, "." + ext);
    return fs.stat(srcPath, function(err, stats) {
      var _ref;
      if ((err != null ? err.code : void 0) === 'ENOENT') {
        return next();
      }
      if (err) {
        return next(err);
      }
      if (((_ref = cache[targetPath]) != null ? _ref.mtime : void 0) === stats.mtime) {
        return res.end(cache.str);
      }
      return compiler.compile(srcPath, function(err, str) {
        if (err) {
          return next(err);
        }
        cache[targetPath] = {
          mtime: stats.mtime,
          str: str
        };
        return res.end(str);
      });
    });
  };
  compilers = {
    coffee: {
      match: /\.js$/,
      compile: function(filepath, callback) {
        libs.CoffeeScript || (libs.CoffeeScript = require('coffee-script'));
        return fs.readFile(filepath, 'utf8', function(err, str) {
          if (err) {
            return callback(err);
          }
          try {
            return callback(null, libs.CoffeeScript.compile(str));
          } catch (e) {
            return callback(e);
          }
        });
      }
    },
    styl: {
      match: /\.css$/,
      compile: function(filepath, callback) {
        libs.stylus || (libs.stylus = require('stylus'));
        return fs.readFile(filepath, 'utf8', function(err, str) {
          return libs.stylus.render(str, {
            filename: filepath
          }, callback);
        });
      }
    }
  };
}).call(this);
