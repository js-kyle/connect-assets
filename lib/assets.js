(function() {
  var DIRECTIVE, EXPLICIT_PATH, HEADER, REMOTE_PATH, assetsMiddleware, cache, collectDependencies, compilers, concatenate, createHelpers, dependencies, directivesInCode, fs, generateTags, libs, mime, minify, parse, path, productionPath, readFileOrCompile, relPath, sendCallback, sendFile, serveCompiled, serveRaw, uglify, updateDependenciesSync;
  var __hasProp = Object.prototype.hasOwnProperty, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (__hasProp.call(this, i) && this[i] === item) return i;
    }
    return -1;
  };
  fs = require('fs');
  mime = require('mime');
  path = require('path');
  parse = require('url').parse;
  uglify = require('uglify-js');
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
      var cachedTarget, targetPath;
      if (req.method !== 'GET') return next();
      targetPath = path.join(src, parse(req.url).pathname);
      if (targetPath.slice(-1) === '/') return next();
      cachedTarget = cache[targetPath];
      if (cachedTarget && (!cachedTarget.mtime)) {
        return sendCallback(res, next, {
          targetPath: targetPath
        })(null, cachedTarget.str);
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
    var stats, str, targetPath, _ref;
    stats = _arg.stats, targetPath = _arg.targetPath;
    if ((_ref = cache[targetPath]) != null ? _ref.mtime : void 0) {
      if (!(stats.mtime > cache[targetPath].mtime)) {
        str = cache[targetPath].str;
        return sendFile(res, next, {
          str: str,
          stats: stats,
          targetPath: targetPath
        });
      }
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
      var str, _ref;
      if ((err != null ? err.code : void 0) === 'ENOENT') return next();
      if (err) return next(err);
      if ((_ref = cache[targetPath]) != null ? _ref.mtime : void 0) {
        if (!(stats.mtime > cache[targetPath].mtime)) {
          str = cache[targetPath].str;
          return sendFile(res, next, {
            str: str,
            stats: stats,
            targetPath: targetPath
          });
        }
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
      return sendFile(res, next, {
        str: str,
        stats: stats,
        targetPath: targetPath
      });
    };
  };
  sendFile = function(res, next, _arg) {
    var stats, str, targetPath;
    str = _arg.str, stats = _arg.stats, targetPath = _arg.targetPath;
    if (stats) {
      cache[targetPath] = {
        mtime: stats.mtime,
        str: str
      };
    }
    res.setHeader('Content-Type', mime.lookup(targetPath));
    return res.end(str);
  };
  exports.compilers = compilers = {
    coffee: {
      match: /\.js$/,
      compile: function(filePath, callback) {
        libs.CoffeeScript || (libs.CoffeeScript = require('coffee-script'));
        return fs.readFile(filePath, 'utf8', function(err, str) {
          if (err) return callback(err);
          try {
            return callback(null, libs.CoffeeScript.compile(str));
          } catch (e) {
            return callback(e);
          }
        });
      },
      compileStr: function(code) {
        libs.CoffeeScript || (libs.CoffeeScript = require('coffee-script'));
        return libs.CoffeeScript.compile(code);
      }
    },
    styl: {
      match: /\.css$/,
      compile: function(filePath, callback) {
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
        return fs.readFile(filePath, 'utf8', function(err, str) {
          return libs.stylus(str).set('filename', filePath).use(libs.nib()).render(callback);
        });
      }
    }
  };
  HEADER = /(?:(\#\#\#.*\#\#\#\n?)|(\/\/.*\n?)|(\#.*\n?))+/;
  DIRECTIVE = /^[\W]*=\s*(\w+.*?)(\*\\\/)?$/gm;
  EXPLICIT_PATH = /^\/|:/;
  REMOTE_PATH = /\/\//;
  relPath = function(root, fullPath) {
    return fullPath.slice(root.length);
  };
  productionPath = function(devPath) {
    return devPath.replace(/\.js$/, '.complete.js');
  };
  createHelpers = function(options) {
    var context, cssExt, expandPath, jsExt;
    context = options.helperContext;
    expandPath = function(filePath, ext, root) {
      if (!filePath.match(EXPLICIT_PATH)) filePath = path.join(root, filePath);
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
      var dependencyTags, filePath, str, tag;
      jsPath = expandPath(jsPath, jsExt, context.js.root);
      if (context.js.concatenate) {
        if ((options.src != null) && !jsPath.match(REMOTE_PATH)) {
          filePath = path.join(options.src, jsPath);
          updateDependenciesSync(filePath);
          str = concatenate(filePath, options);
          str = minify(str);
          cache[productionPath(filePath)] = {
            str: str
          };
        }
        tag = "<script src='" + (productionPath(jsPath)) + "'></script>";
      } else {
        dependencyTags = '';
        if ((options.src != null) && !jsPath.match(REMOTE_PATH)) {
          filePath = path.join(options.src, jsPath);
          updateDependenciesSync(filePath);
          tag = generateTags(filePath, options).join('\n');
        } else {
          tag = "<script src='" + jsPath + "'></script>";
        }
      }
      return tag;
    };
    context.js.root = '/js';
    return context.js.concatenate = process.env.NODE_ENV === 'production';
  };
  updateDependenciesSync = function(filePath) {
    var c, depPath, directive, directivePath, ext, jsCompilerExts, jsExtList, oldTime, p, requireTree, words, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3, _ref4, _ref5;
    if ((_ref = dependencies[filePath]) == null) dependencies[filePath] = [];
    if (filePath.match(REMOTE_PATH)) return;
    oldTime = (_ref2 = cache[filePath]) != null ? _ref2.mtime : void 0;
    directivePath = filePath;
    readFileOrCompile(filePath, function(sourcePath) {
      return directivePath = sourcePath;
    });
    if (cache[filePath].mtime.getTime() === (oldTime != null ? oldTime.getTime() : void 0)) {
      _ref3 = dependencies[filePath];
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        p = _ref3[_i];
        updateDependenciesSync(p);
      }
      return;
    }
    for (ext in compilers) {
      c = compilers[ext];
      if (c.match('.js')) jsCompilerExts = "." + ext;
    }
    jsExtList = ['.js'].concat(jsCompilerExts);
    dependencies[filePath] = [];
    _ref4 = directivesInCode(cache[directivePath].str);
    for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
      directive = _ref4[_j];
      words = directive.replace(/['"]/g, '').split(/\s+/);
      switch (words[0]) {
        case 'require':
          _ref5 = words.slice(1);
          for (_k = 0, _len3 = _ref5.length; _k < _len3; _k++) {
            depPath = _ref5[_k];
            if (path.extname(depPath) !== '.js') depPath += '.js';
            if (!depPath.match(EXPLICIT_PATH)) {
              depPath = path.join(filePath, '../', depPath);
            }
            if (depPath === filePath) {
              throw new Error("Script tries to require itself: " + filePath);
            }
            if (__indexOf.call(dependencies[filePath], depPath) >= 0) continue;
            updateDependenciesSync(depPath);
            dependencies[filePath].push(depPath);
          }
          break;
        case 'require_tree':
          requireTree = function(parentDir, paths) {
            var p, stats, _l, _len4, _ref6, _results;
            _results = [];
            for (_l = 0, _len4 = paths.length; _l < _len4; _l++) {
              p = paths[_l];
              if (!p.match(EXPLICIT_PATH)) p = path.join(parentDir, p);
              if (p === filePath) continue;
              stats = fs.statSync(p);
              if (stats.isFile()) {
                if (_ref6 = path.extname(p), __indexOf.call(jsExtList, _ref6) < 0) {
                  continue;
                }
                if (path.extname(p) !== '.js') p = p.replace(/[^.]+$/, 'js');
                if (p === filePath) continue;
                if (__indexOf.call(dependencies[filePath], p) >= 0) continue;
                updateDependenciesSync(p);
                _results.push(dependencies[filePath].push(p));
              } else if (stats.isDirectory()) {
                _results.push(requireTree(p, fs.readdirSync(p)));
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          };
          requireTree(path.dirname(filePath), words.slice(1));
      }
    }
    return dependencies[filePath];
  };
  readFileOrCompile = function(filePath, compileCallback) {
    var compiler, ext, sourcePath, stats, str, _ref, _ref2, _ref3;
    try {
      stats = fs.statSync(filePath);
      if ((_ref = cache[filePath]) != null ? _ref.mtime : void 0) {
        if (!(stats.mtime > cache[filePath].mtime)) return stats;
      }
      str = fs.readFileSync(filePath, 'utf8');
      cache[filePath] = {
        mtime: stats.mtime,
        str: str
      };
    } catch (e) {
      for (ext in compilers) {
        compiler = compilers[ext];
        if (compiler.match.test(filePath)) {
          try {
            sourcePath = filePath.replace(compiler.match, "." + ext);
            stats = fs.statSync(sourcePath);
            if ((_ref2 = cache[sourcePath]) != null ? _ref2.mtime : void 0) {
              if (!(stats.mtime > ((_ref3 = cache[sourcePath]) != null ? _ref3.mtime : void 0))) {
                compileCallback(sourcePath);
                break;
              }
            }
            str = fs.readFileSync(sourcePath, 'utf8');
            cache[sourcePath] = {
              mtime: stats.mtime,
              str: str
            };
            str = compiler.compileStr(str);
            cache[filePath] = {
              mtime: stats.mtime,
              str: str
            };
            compileCallback(sourcePath);
            break;
          } catch (_error) {}
        }
      }
    }
    if (!stats) throw new Error("File not found: " + filePath);
    return stats;
  };
  directivesInCode = function(code) {
    var header, match, _results;
    if (!(match = HEADER.exec(code))) return [];
    header = match[0];
    _results = [];
    while (match = DIRECTIVE.exec(header)) {
      _results.push(match[1]);
    }
    return _results;
  };
  collectDependencies = function(filePath, traversedPaths, traversedBranch) {
    var depPath, _i, _len, _ref;
    if (traversedPaths == null) traversedPaths = [];
    if (traversedBranch == null) traversedBranch = [];
    _ref = dependencies[filePath].slice(0).reverse();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      depPath = _ref[_i];
      if (__indexOf.call(traversedBranch, depPath) >= 0) {
        throw new Error("Cyclic dependency from " + filePath + " to " + depPath);
      }
      if (__indexOf.call(traversedPaths, depPath) >= 0) continue;
      traversedPaths.unshift(depPath);
      traversedBranch.unshift(depPath);
      collectDependencies(depPath, traversedPaths, traversedBranch.slice(0));
    }
    return traversedPaths;
  };
  generateTags = function(filePath, options) {
    var depPath, tags;
    if (filePath.match(REMOTE_PATH)) {
      return ["<script src='" + filePath + "'></script>"];
    }
    tags = (function() {
      var _i, _len, _ref, _results;
      _ref = collectDependencies(filePath);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        depPath = _ref[_i];
        _results.push("<script src='" + (relPath(options.src, depPath)) + "'></script>");
      }
      return _results;
    })();
    tags.push("<script src='" + (relPath(options.src, filePath)) + "'></script>");
    return tags;
  };
  concatenate = function(filePath, options) {
    var depPath, script, _i, _len, _ref;
    script = '';
    _ref = collectDependencies(filePath);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      depPath = _ref[_i];
      script += cache[depPath].str + '\n';
    }
    return script += cache[filePath].str;
  };
  minify = function(js) {
    var ast, jsp, pro;
    jsp = uglify.parser;
    pro = uglify.uglify;
    ast = jsp.parse(js);
    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);
    return pro.gen_code(ast);
  };
}).call(this);
