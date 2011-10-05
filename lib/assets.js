(function() {
  var BEFORE_DOT, ConnectAssets, EXPLICIT_PATH, REMOTE_PATH, Snockets, connectAssets, connectCache, crypto, cssCompilers, cssExts, fs, jsCompilers, libs, md5Filenamer, mkdirRecursive, parse, path, stripExt, timeEq, _;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  connectCache = require('connect-file-cache');
  Snockets = require('snockets');
  crypto = require('crypto');
  fs = require('fs');
  path = require('path');
  _ = require('underscore');
  parse = require('url').parse;
  connectAssets = null;
  libs = {};
  module.exports = function(options) {
    var _base, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    if (options == null) {
      options = {};
    }
        if ((_ref = options.src) != null) {
      _ref;
    } else {
      options.src = 'assets';
    };
        if ((_ref2 = options.helperContext) != null) {
      _ref2;
    } else {
      options.helperContext = global;
    };
    if (process.env.NODE_ENV === 'production') {
            if ((_ref3 = options.build) != null) {
        _ref3;
      } else {
        options.build = true;
      };
            if ((_ref4 = (_base = cssCompilers.styl).compress) != null) {
        _ref4;
      } else {
        _base.compress = true;
      };
    }
        if ((_ref5 = options.buildDir) != null) {
      _ref5;
    } else {
      options.buildDir = 'builtAssets';
    };
        if ((_ref6 = options.buildFilenamer) != null) {
      _ref6;
    } else {
      options.buildFilenamer = md5Filenamer;
    };
        if ((_ref7 = options.buildsExpire) != null) {
      _ref7;
    } else {
      options.buildsExpire = false;
    };
        if ((_ref8 = options.minifyBuilds) != null) {
      _ref8;
    } else {
      options.minifyBuilds = true;
    };
    connectAssets = new ConnectAssets(options);
    connectAssets.createHelpers(options);
    return connectAssets.cache.middleware;
  };
  ConnectAssets = (function() {
    function ConnectAssets(options) {
      this.options = options;
      this.cache = connectCache();
      this.snockets = new Snockets({
        src: this.options.src
      });
      this.jsFilenames = {};
    }
    ConnectAssets.prototype.createHelpers = function() {
      var context, expandRoute;
      context = this.options.helperContext;
      expandRoute = function(shortRoute, ext, rootDir) {
        if (shortRoute.match(EXPLICIT_PATH)) {
          if (!shortRoute.match(REMOTE_PATH)) {
            if (shortRoute[0] === '/') {
              shortRoute = shortRoute.slice(1);
            }
          }
        } else {
          shortRoute = path.join(rootDir, shortRoute);
        }
        if (shortRoute.indexOf(ext, shortRoute.length - ext.length) === -1) {
          shortRoute += ext;
        }
        return shortRoute;
      };
      context.css = __bind(function(route) {
        route = expandRoute(route, '.css', context.css.root);
        if (!route.match(REMOTE_PATH)) {
          route = this.compileCSS(route);
        }
        return "<link rel='stylesheet' href='" + route + "'>";
      }, this);
      context.css.root = 'css';
      context.js = __bind(function(route) {
        var r, routes;
        route = expandRoute(route, '.js', context.js.root);
        if (route.match(REMOTE_PATH)) {
          routes = [route];
        } else {
          routes = this.compileJS(route);
        }
        return ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = routes.length; _i < _len; _i++) {
            r = routes[_i];
            _results.push("<script src='" + r + "'></script>");
          }
          return _results;
        })()).join('\n');
      }, this);
      return context.js.root = 'js';
    };
    ConnectAssets.prototype.compileCSS = function(route) {
      var buildPath, cacheFlags, css, ext, filename, source, sourcePath, stats, _i, _len, _ref, _ref2;
      _ref = ['css'].concat((function() {
        var _results;
        _results = [];
        for (ext in cssCompilers) {
          _results.push(ext);
        }
        return _results;
      })());
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ext = _ref[_i];
        sourcePath = stripExt(route) + ("." + ext);
        try {
          stats = fs.statSync(this.absPath(sourcePath));
          if (ext === 'css') {
            if (timeEq(stats.mtime, (_ref2 = this.cache.map[route]) != null ? _ref2.mtime : void 0)) {
              css = this.cache.map[route].data;
            } else {
              css = fs.readFileSync(this.absPath(sourcePath));
            }
          } else {
            source = fs.readFileSync(this.absPath(sourcePath), 'utf8');
            css = cssCompilers[ext].compileSync(this.absPath(sourcePath), source);
          }
          if (this.options.build) {
            filename = this.options.buildFilenamer(route, css);
            cacheFlags = {
              expires: this.options.buildsExpire,
              mtime: stats.mtime
            };
            this.cache.set(filename, css, cacheFlags);
            if (this.options.buildDir) {
              buildPath = path.join(process.cwd(), this.options.buildDir, filename);
              mkdirRecursive(path.dirname(buildPath), 0755, function() {
                return fs.writeFile(buildPath, css);
              });
            }
            return "/" + filename;
          } else {
            this.cache.set(route, css, {
              mtime: stats.mtime
            });
            return "/" + route;
          }
        } catch (e) {
          if (e.code === 'ENOENT') {
            continue;
          } else {
            throw e;
          }
        }
      }
      throw new Error("No file found for route " + route);
    };
    ConnectAssets.prototype.compileJS = function(route) {
      var buildPath, cacheFlags, chain, concatenation, ext, filename, filenames, js, snocketsFlags, sourcePath, _i, _len, _ref;
      _ref = ['js'].concat((function() {
        var _results;
        _results = [];
        for (ext in jsCompilers) {
          _results.push(ext);
        }
        return _results;
      })());
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ext = _ref[_i];
        sourcePath = stripExt(route) + ("." + ext);
        try {
          if (this.options.build) {
            if (!(filename = this.jsFilenames[route])) {
              snocketsFlags = {
                minify: this.options.minifyBuilds,
                async: false
              };
              concatenation = this.snockets.getConcatenation(sourcePath, snocketsFlags);
              filename = this.options.buildFilenamer(route, concatenation);
              cacheFlags = {
                expires: this.options.buildsExpire
              };
              this.cache.set(filename, concatenation, cacheFlags);
              this.jsFilenames[route] = filename;
              if (this.options.buildDir) {
                buildPath = path.join(process.cwd(), this.options.buildDir, filename);
                mkdirRecursive(path.dirname(buildPath), 0755, function(err) {
                  if (err) {
                    console.log(err);
                  }
                  return fs.writeFile(buildPath, concatenation);
                });
              }
            }
            return ["/" + filename];
          } else {
            chain = this.snockets.getCompiledChain(sourcePath, {
              async: false
            });
            return filenames = (function() {
              var _j, _len2, _ref2, _results;
              _results = [];
              for (_j = 0, _len2 = chain.length; _j < _len2; _j++) {
                _ref2 = chain[_j], filename = _ref2.filename, js = _ref2.js;
                filename = stripExt(filename) + '.js';
                this.cache.set(filename, js);
                _results.push("/" + filename);
              }
              return _results;
            }).call(this);
          }
        } catch (e) {
          if (e.code === 'ENOENT') {
            continue;
          } else {
            throw e;
          }
        }
      }
      throw new Error("No file found for route " + route);
    };
    ConnectAssets.prototype.absPath = function(route) {
      return path.join(process.cwd(), this.options.src, route);
    };
    return ConnectAssets;
  })();
  exports.cssCompilers = cssCompilers = {
    styl: {
      optionsMap: {},
      compileSync: function(sourcePath, source) {
        var callback, options, result, _base, _ref;
        result = '';
        callback = function(err, js) {
          if (err) {
            throw err;
          }
          return result = js;
        };
        libs.stylus || (libs.stylus = require('stylus'));
        libs.nib || (libs.nib = (function() {
          try {
            return require('nib');
          } catch (e) {
            return function() {
              return function() {};
            };
          }
        })());
        options = (_ref = (_base = this.optionsMap)[sourcePath]) != null ? _ref : _base[sourcePath] = {
          filename: sourcePath,
          compress: this.compress
        };
        libs.stylus(source, options).use(libs.nib()).render(callback);
        return result;
      }
    }
  };
  exports.jsCompilers = jsCompilers = Snockets.compilers;
  BEFORE_DOT = /([^.]*)(\..*)?$/;
  EXPLICIT_PATH = /^\/|\/\//;
  REMOTE_PATH = /\/\//;
  stripExt = function(filePath) {
    var lastDotIndex;
    if ((lastDotIndex = filePath.lastIndexOf('.')) >= 0) {
      return filePath.slice(0, lastDotIndex);
    } else {
      return filePath;
    }
  };
  cssExts = function() {
    var ext;
    return ((function() {
      var _results;
      _results = [];
      for (ext in cssCompilers) {
        _results.push("." + ext);
      }
      return _results;
    })()).concat('.css');
  };
  timeEq = function(date1, date2) {
    return (date1 != null) && (date2 != null) && date1.getTime() === date2.getTime();
  };
  mkdirRecursive = function(dir, mode, callback) {
    var pathParts;
    pathParts = path.normalize(dir).split('/');
    return path.exists(dir, function(exists) {
      if (exists) {
        return callback(null);
      }
      return mkdirRecursive(pathParts.slice(0, -1).join('/'), mode, function(err) {
        if (err && err.errno !== process.EEXIST) {
          return callback(err);
        }
        return fs.mkdir(dir, mode, callback);
      });
    });
  };
  exports.md5Filenamer = md5Filenamer = function(filename, code) {
    var ext, hash, md5Hex;
    hash = crypto.createHash('md5');
    hash.update(code);
    md5Hex = hash.digest('hex');
    ext = path.extname(filename);
    return "" + (stripExt(filename)) + "-" + md5Hex + ext;
  };
}).call(this);
