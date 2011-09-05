(function() {
  var DIRECTIVE, EXPLICIT_PATH, HEADER, REMOTE_PATH, assetsMiddleware, cache, compilers, concatenate, createHelpers, dependencies, directivesInCode, fs, generateTags, libs, mime, minify, parse, path, productionPath, readFileOrCompile, relPath, sendCallback, serveCompiled, serveRaw, uglify, updateDependenciesSync;
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
      if (stats) {
        cache[targetPath] = {
          mtime: stats.mtime,
          str: str
        };
      }
      res.setHeader('Content-Type', mime.lookup(targetPath));
      return res.end(str);
    };
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
  HEADER = /(?:(\#\#\#.*\#\#\#\n?)|(\\\/\\\/.*\n?)|(\#.*\n?))+/;
  DIRECTIVE = /^[\W]*=\s*(\w+.*?)(\*\\\/)?$/gm;
  EXPLICIT_PATH = /^\/|^\.|:/;
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
          updateDependenciesSync(filePath, jsPath);
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
    var depPath, directive, directivePath, oldTime, words, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;
    if ((_ref = dependencies[filePath]) == null) dependencies[filePath] = [];
    if (filePath.match(REMOTE_PATH)) return;
    oldTime = (_ref2 = cache[filePath]) != null ? _ref2.mtime : void 0;
    directivePath = filePath;
    readFileOrCompile(filePath, function(sourcePath) {
      return directivePath = sourcePath;
    });
    if (cache[filePath].mtime === oldTime) return;
    dependencies[filePath] = [];
    _ref3 = directivesInCode(cache[directivePath].str);
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      directive = _ref3[_i];
      words = directive.split(/\s+/);
      switch (words[0]) {
        case 'require':
          _ref4 = words.slice(1);
          for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
            depPath = _ref4[_j];
            depPath = depPath.replace(/['"]/g, '');
            if (path.extname(depPath) !== '.js') depPath += '.js';
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
  readFileOrCompile = function(filePath, compileCallback) {
    var compiler, ext, sourcePath, stats, str, _ref;
    try {
      stats = fs.statSync(filePath);
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
            if (((_ref = cache[sourcePath]) != null ? _ref.mtime : void 0) === stats.mtime) {
              break;
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
  generateTags = function(filePath, options) {
    var depPath, tags, _i, _len, _ref;
    if (filePath.match(REMOTE_PATH)) {
      return ["<script src='" + filePath + "'></script>"];
    }
    tags = [];
    _ref = dependencies[filePath];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      depPath = _ref[_i];
      tags = tags.concat(generateTags(depPath, options));
    }
    tags.push("<script src='" + (relPath(options.src, filePath)) + "'></script>");
    return tags;
  };
  concatenate = function(filePath, options) {
    var depPath, script, _i, _len, _ref;
    script = '';
    _ref = dependencies[filePath];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      depPath = _ref[_i];
      script += concatenate(depPath, options);
    }
    return script += cache[filePath].str + '\n';
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
