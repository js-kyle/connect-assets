(function() {
  var DIRECTIVE, EXPLICIT_PATH, HEADER, REMOTE_PATH, assetsMiddleware, cache, compilers, createHelpers, dependencies, directivesInCode, fs, libs, mime, parse, path, relPath, sendCallback, serveCompiled, serveRaw, updateDependenciesSync;
  fs = require('fs');
  mime = require('mime');
  path = require('path');
  parse = require('url').parse;
  cache = {};
  libs = {};
  dependencies = {};
  module.exports = function(options) {
    var _ref, _ref2;
    if (options == null) options = {};
    if ((_ref = options.src) == null) options.src = 'assets';
    if ((_ref2 = options.helperContext) == null) options.helperContext = global;
    if (options.helperContext != null) createHelpers(options);
    if (options.src != null) return assetsMiddleware(options);
  };
  assetsMiddleware = function(options) {
    var src;
    src = options.src;
    return function(req, res, next) {
      var targetPath;
      if (req.method !== 'GET') return next();
      targetPath = path.join(src, parse(req.url).pathname);
      if (targetPath.slice(-1) === '/') return next();
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
    return fs.readFile(targetPath, 'utf8', sendCallback(res, next, {
      stats: stats,
      targetPath: targetPath
    }));
  };
  serveCompiled = function(req, res, next, _arg) {
    var compiler, ext, srcPath, targetPath;
    compiler = _arg.compiler, ext = _arg.ext, targetPath = _arg.targetPath;
    srcPath = targetPath.replace(compiler.match, "." + ext);
    return fs.stat(srcPath, function(err, stats) {
      var _ref;
      if ((err != null ? err.code : void 0) === 'ENOENT') return next();
      if (err) return next(err);
      if (((_ref = cache[targetPath]) != null ? _ref.mtime : void 0) === stats.mtime) {
        return res.end(cache.str);
      }
      return compiler.compile(srcPath, sendCallback(res, next, {
        stats: stats,
        targetPath: targetPath
      }));
    });
  };
  sendCallback = function(res, next, _arg) {
    var stats, targetPath;
    stats = _arg.stats, targetPath = _arg.targetPath;
    return function(err, str) {
      if (err) return next(err);
      cache[targetPath] = {
        mtime: stats.mtime,
        str: str
      };
      res.setHeader('Content-Type', mime.lookup(targetPath));
      return res.end(str);
    };
  };
  exports.compilers = compilers = {
    coffee: {
      match: /\.js$/,
      compile: function(filepath, callback) {
        libs.CoffeeScript || (libs.CoffeeScript = require('coffee-script'));
        return fs.readFile(filepath, 'utf8', function(err, str) {
          if (err) return callback(err);
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
        libs.nib || (libs.nib = (function() {
          try {
            return require('nib');
          } catch (e) {
            return function() {
              return function() {};
            };
          }
        })());
        return fs.readFile(filepath, 'utf8', function(err, str) {
          return libs.stylus(str).set('filename', filepath).use(libs.nib()).render(callback);
        });
      }
    }
  };
  HEADER = /(?:(\#\#\#.*\#\#\#\n?)|(\\\/\\\/.*\n?)|(\#.*\n?))+/;
  DIRECTIVE = /^[\W]*=\s*(\w+.*?)(\*\\\/)?$/gm;
  EXPLICIT_PATH = /^\/|^\.|:/;
  REMOTE_PATH = /\/\//;
  relPath = function(root, fullPath) {
    return fullPath.slice(root.length);
  };
  createHelpers = function(options) {
    var context, cssExt, expandPath, jsExt;
    context = options.helperContext;
    expandPath = function(filePath, ext, root) {
      if (!filePath.match(EXPLICIT_PATH)) filePath = "" + root + "/" + filePath;
      if (filePath.indexOf(ext, filePath.length - ext.length) === -1) {
        filePath += ext;
      }
      return filePath;
    };
    cssExt = '.css';
    context.css = function(cssPath) {
      cssPath = expandPath(cssPath, cssExt, context.css.root);
      return "<link rel='stylesheet' href='" + cssPath + "'>";
    };
    context.css.root = '/css';
    jsExt = '.js';
    context.js = function(jsPath) {
      var dependencyTags, filePath, generateTags;
      jsPath = expandPath(jsPath, jsExt, context.js.root);
      if (context.js.concatenate) {
        return "<script src='" + jsPath + "'></script>";
      } else {
        generateTags = function(filePath) {
          var depPath, tags, _i, _len, _ref;
          if (filePath.match(REMOTE_PATH)) {
            return ["<script src='" + filePath + "'></script>"];
          }
          tags = [];
          _ref = dependencies[filePath];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            depPath = _ref[_i];
            tags = tags.concat(generateTags(depPath));
          }
          tags.push("<script src='" + (relPath(options.src, filePath)) + "'></script>");
          return tags;
        };
        dependencyTags = '';
        if ((options.src != null) && !jsPath.match(REMOTE_PATH)) {
          filePath = path.join(options.src, jsPath);
          updateDependenciesSync(filePath, jsPath);
          return generateTags(filePath).join('\n');
        } else {
          return "<script src='" + jsPath + "'></script>";
        }
      }
    };
    context.js.root = '/js';
    return context.js.concatenate = !!process.env.PRODUCTION;
  };
  updateDependenciesSync = function(filePath) {
    var compiler, depPath, directive, directives, ext, fallbackPath, processFile, words, _i, _j, _len, _len2, _ref, _ref2;
    if ((_ref = dependencies[filePath]) == null) dependencies[filePath] = [];
    if (filePath.match(REMOTE_PATH)) return;
    processFile = function(filePath) {
      var stats, str, _ref2;
      stats = fs.statSync(filePath);
      if (((_ref2 = cache[filePath]) != null ? _ref2.mtime : void 0) === stats.mtime) {
        return null;
      }
      str = fs.readFileSync(filePath, 'utf8');
      cache[filePath] = {
        mtime: stats.mtime,
        str: str
      };
      return directivesInCode(str);
    };
    try {
      directives = processFile(filePath);
    } catch (e) {
      for (ext in compilers) {
        compiler = compilers[ext];
        if (compiler.match.test(filePath)) {
          try {
            fallbackPath = filePath.replace(compiler.match, "." + ext);
            directives = processFile(fallbackPath);
            break;
          } catch (_error) {}
        }
      }
    }
    if (directives != null) {
      dependencies[filePath] = [];
    } else {
      return;
    }
    for (_i = 0, _len = directives.length; _i < _len; _i++) {
      directive = directives[_i];
      words = directive.split(/\s+/);
      switch (words[0]) {
        case 'require':
          _ref2 = words.slice(1);
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            depPath = _ref2[_j];
            depPath = depPath.replace(/'"/g, '');
            if (depPath.indexOf('.') === -1) depPath += '.js';
            if (!depPath.match(EXPLICIT_PATH)) {
              depPath = path.join(filePath, '../', depPath);
            }
            updateDependenciesSync(depPath);
            dependencies[filePath].push(depPath);
          }
      }
    }
    return dependencies[filePath];
  };
  directivesInCode = function(code) {
    var header, match, _results;
    header = HEADER.exec(code)[0];
    _results = [];
    while (match = DIRECTIVE.exec(header)) {
      _results.push(match[1]);
    }
    return _results;
  };
}).call(this);
