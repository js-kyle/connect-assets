(function() {
  var DIRECTIVE, EXPLICIT_PATH, HEADER, REMOTE_PATH, assetsMiddleware, cache, collectDependencies, compilers, concatenate, createHelpers, crypto, dependencies, directivesInCode, fileExistsSync, fs, generateTags, libs, md5Suffix, mime, minify, parse, path, productionJsPath, readFileOrCompile, relPath, sendCallback, sendFile, serveCompiled, serveRaw, srcDir, uglify, updateDependenciesSync;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  crypto = require('crypto');
  fs = require('fs');
  mime = require('mime');
  path = require('path');
  parse = require('url').parse;
  uglify = require('uglify-js');
  cache = {};
  libs = {};
  dependencies = {};
  srcDir = null;
  module.exports = function(options) {
    var _ref, _ref2, _ref3;
    if (options == null) {
      options = {};
    }
    if ((_ref = options.src) == null) {
      options.src = 'assets';
    }
    srcDir = options.src;
    if ((_ref2 = options.helperContext) == null) {
      options.helperContext = global;
    }
    if ((_ref3 = options.suffixGenerator) == null) {
      options.suffixGenerator = process.env.NODE_ENV === 'production' ? md5Suffix : (function() {
        return '';
      });
    }
    if (options.helperContext != null) {
      createHelpers(options);
    }
    if (options.src != null) {
      return assetsMiddleware(options);
    }
  };
  module.exports.FAR_FUTURE_EXPIRES = "Wed, 01 Feb 2034 12:34:56 GMT";
  assetsMiddleware = function(options) {
    var src;
    src = options.src;
    return function(req, res, next) {
      var cachedTarget, static, str, targetPath;
      if (req.method !== 'GET') {
        return next();
      }
      targetPath = path.join(src, parse(req.url).pathname);
      if (targetPath.slice(-1) === '/') {
        return next();
      }
      cachedTarget = cache[targetPath];
      if (cachedTarget && (!cachedTarget.mtime)) {
        static = cachedTarget.static, str = cachedTarget.str;
        return sendFile(res, next, {
          static: static,
          str: str,
          targetPath: targetPath
        });
      }
      return fs.stat(targetPath, function(err, stats) {
        var compiler, ext, srcPath;
        if (!err) {
          return serveRaw(req, res, next, {
            stats: stats,
            targetPath: targetPath
          });
        }
        for (ext in compilers) {
          compiler = compilers[ext];
          srcPath = targetPath.replace(compiler.match, "." + ext);
          if (compiler.match.test(targetPath)) {
            if (fileExistsSync(srcPath)) {
              return serveCompiled(req, res, next, {
                compiler: compiler,
                ext: ext,
                targetPath: targetPath,
                srcPath: srcPath
              });
            }
          }
        }
        return next();
      });
    };
  };
  fileExistsSync = function(f) {
    try {
      return fs.statSync(f).isFile();
    } catch (er) {
      return false;
    }
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
    compiler = _arg.compiler, ext = _arg.ext, targetPath = _arg.targetPath, srcPath = _arg.srcPath;
    return fs.stat(srcPath, function(err, stats) {
      var str, _ref;
      if ((err != null ? err.code : void 0) === 'ENOENT') {
        return next();
      }
      if (err) {
        return next(err);
      }
      if ((_ref = cache[targetPath]) != null ? _ref.mtime : void 0) {
        if (!(stats.mtime > cache[targetPath].mtime)) {
          if (compiler === compilers.styl) {
            cache[targetPath].str = compiler.compileStr(cache[srcPath].str, srcPath);
          }
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
    var static, stats, targetPath;
    static = _arg.static, stats = _arg.stats, targetPath = _arg.targetPath;
    return function(err, str) {
      if (err) {
        return next(err);
      }
      return sendFile(res, next, {
        str: str,
        static: static,
        stats: stats,
        targetPath: targetPath
      });
    };
  };
  sendFile = function(res, next, _arg) {
    var static, stats, str, targetPath;
    str = _arg.str, static = _arg.static, stats = _arg.stats, targetPath = _arg.targetPath;
    if (stats) {
      cache[targetPath] = {
        mtime: stats.mtime,
        str: str
      };
    }
    res.setHeader('Content-Type', mime.lookup(targetPath));
    if (static) {
      res.setHeader('Expires', module.exports.FAR_FUTURE_EXPIRES);
    }
    return res.end(str);
  };
  module.exports.compilers = compilers = {
    coffee: {
      match: /\.js$/,
      compile: function(filePath, callback) {
        return fs.readFile(filePath, 'utf8', function(err, coffee) {
          if (err) {
            return callback(err);
          }
          try {
            return callback(null, compilers.coffee.compileStr(coffee, filePath));
          } catch (e) {
            return callback(e);
          }
        });
      },
      compileStr: function(coffee, filePath) {
        libs.CoffeeScript || (libs.CoffeeScript = require('coffee-script'));
        return libs.CoffeeScript.compile(coffee, {
          filename: filePath
        });
      }
    },
    styl: {
      match: /\.css$/,
      optionsMap: {},
      compress: process.env.NODE_ENV === 'production',
      compile: function(filePath, callback) {
        return fs.readFile(filePath, 'utf8', function(err, styl) {
          if (err) {
            return callback(err);
          }
          try {
            return callback(null, compilers.styl.compileStr(styl, filePath));
          } catch (e) {
            return callback(e);
          }
        });
      },
      compileStr: function(styl, filePath) {
        var callback, options, result, _base, _ref;
        options = (_ref = (_base = compilers.styl.optionsMap)[filePath]) != null ? _ref : _base[filePath] = {
          filename: filePath,
          compress: compilers.styl.compress
        };
        result = '';
        callback = function(err, css) {
          if (err) {
            throw err;
          }
          return result = css;
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
        libs.stylus(styl, options).use(libs.nib()).render(callback);
        return result;
      }
    },
    hbs: {
      match: /\.js$/,
      compile: function(filePath, callback) {
        return fs.readFile(filePath, 'utf8', function(err, hbs) {
          if (err) {
            return callback(err);
          }
          try {
            return callback(null, compilers.hbs.compileStr(hbs, filePath));
          } catch (e) {
            return callback(e);
          }
        });
      },
      compileStr: function(hbs, filePath) {
        var handlebarsPartial, handlebarsTemplate, hbsTemplate, jstTemplate, partialName, preCompiledHbs, templateName;
        libs.Hbs || (libs.Hbs = require('hbs'));
        jstTemplate = function(name, str) {
          return "(function() {\n   this.JST || (this.JST = {});\n   this.JST[\"" + name + "\"] = " + str + "\n }).call(this);   ";
        };
        handlebarsTemplate = function(name, str) {
          return "function(context) {\n  return HandlebarsTemplates[\"" + name + "\"](context);\n};\nthis.HandlebarsTemplates || (this.HandlebarsTemplates = {});\nthis.HandlebarsTemplates[\"" + name + "\"] = Handlebars.template(" + str + ");";
        };
        handlebarsPartial = function(name, str) {
          return "(function() {\n  Handlebars.registerPartial(\"" + name + "\", Handlebars.template(" + str + "));\n}).call(this);";
        };
        templateName = filePath.replace(new RegExp("^" + srcDir + js.root + "/"), "");
        templateName = templateName.replace(/\.hbs$/, "");
        templateName = templateName.replace(/\.jst$/, "");
        preCompiledHbs = libs.Hbs.handlebars.precompile(hbs);
        if (partialName = templateName.match(/\/_([^\/]*)$/)) {
          return handlebarsPartial(partialName[1], preCompiledHbs);
        } else {
          hbsTemplate = handlebarsTemplate(templateName, preCompiledHbs);
          return jstTemplate(templateName, hbsTemplate);
        }
      }
    }
  };
  HEADER = /(?:(\#\#\#.*\#\#\#\n?)|(\/\/.*\n?)|(\#.*\n?))+/;
  DIRECTIVE = /^[\W]*=\s*(\w+.*?)(\*\\\/)?$/gm;
  EXPLICIT_PATH = /^\/|^\.|:/;
  REMOTE_PATH = /\/\//;
  relPath = function(root, fullPath) {
    return fullPath.slice(root.length);
  };
  productionJsPath = function(filePath, str, options) {
    var suffix;
    suffix = options.suffixGenerator(filePath, str);
    return filePath.replace(/\.js$/, ".complete" + suffix + ".js");
  };
  createHelpers = function(options) {
    var context, cssExt, expandPath, jsExt;
    context = options.helperContext;
    expandPath = function(filePath, ext, root) {
      if (!filePath.match(EXPLICIT_PATH)) {
        filePath = path.join(root, filePath);
      }
      if (filePath.indexOf(ext, filePath.length - ext.length) === -1) {
        filePath += ext;
      }
      return filePath;
    };
    cssExt = '.css';
    context.css = function(cssPath) {
      var cssUrl, filePath, staticPath, suffix;
      cssUrl = expandPath(cssPath, cssExt, context.css.root);
      if ((options.src != null) && !cssPath.match(EXPLICIT_PATH)) {
        filePath = path.join(options.src, cssUrl);
        readFileOrCompile(filePath);
        suffix = options.suffixGenerator(filePath, cache[filePath].str);
        staticPath = cssUrl.replace(/\.css$/, "" + suffix + ".css");
        if (suffix !== '') {
          cache[path.join(options.src, staticPath)] = {
            str: cache[filePath].str,
            static: true
          };
        }
        return "<link rel='stylesheet' href='" + staticPath + "'>";
      } else {
        return "<link rel='stylesheet' href='" + cssUrl + "'>";
      }
    };
    context.css.root = '/css';
    jsExt = '.js';
    context.js = function(jsPath) {
      var dependencyTags, filePath, jsUrl, packagePath, str, tag;
      jsUrl = expandPath(jsPath, jsExt, context.js.root);
      if (context.js.concatenate) {
        if ((options.src != null) && !jsUrl.match(REMOTE_PATH)) {
          filePath = path.join(options.src, jsUrl);
          updateDependenciesSync(filePath);
          str = concatenate(filePath, options);
          str = minify(str);
          packagePath = productionJsPath(filePath, str, options);
          cache[packagePath] = {
            str: str,
            static: true
          };
          tag = "<script src='" + (relPath(options.src, packagePath)) + "'></script>";
        } else {
          tag = "<script src='" + jsUrl + "'></script>";
        }
      } else {
        dependencyTags = '';
        if ((options.src != null) && !jsUrl.match(REMOTE_PATH)) {
          filePath = path.join(options.src, jsUrl);
          updateDependenciesSync(filePath);
          tag = generateTags(filePath, options).join('\n');
        } else {
          tag = "<script src='" + jsUrl + "'></script>";
        }
      }
      return tag;
    };
    context.js.root = '/js';
    return context.js.concatenate = process.env.NODE_ENV === 'production';
  };
  updateDependenciesSync = function(filePath) {
    var c, depPath, directive, directivePath, ext, jsExtList, oldTime, p, requireTree, words, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3, _ref4, _ref5;
    if ((_ref = dependencies[filePath]) == null) {
      dependencies[filePath] = [];
    }
    if (filePath.match(REMOTE_PATH)) {
      return;
    }
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
    jsExtList = ['.js'];
    for (ext in compilers) {
      c = compilers[ext];
      if (c.match('.js')) {
        jsExtList.push("." + ext);
      }
    }
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
            if (path.extname(depPath) !== '.js') {
              depPath += '.js';
            }
            if (!depPath.match(EXPLICIT_PATH)) {
              depPath = path.join(filePath, '../', depPath);
            }
            if (depPath === filePath) {
              throw new Error("Script tries to require itself: " + filePath);
            }
            if (__indexOf.call(dependencies[filePath], depPath) >= 0) {
              continue;
            }
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
              p = path.join(parentDir, p);
              if (p === filePath) {
                continue;
              }
              stats = fs.statSync(p);
              if (stats.isFile()) {
                if (_ref6 = path.extname(p), __indexOf.call(jsExtList, _ref6) < 0) {
                  continue;
                }
                if (path.extname(p) !== '.js') {
                  p = p.replace(/[^.]+$/, 'js');
                }
                if (p === filePath) {
                  continue;
                }
                if (__indexOf.call(dependencies[filePath], p) >= 0) {
                  continue;
                }
                updateDependenciesSync(p);
                dependencies[filePath].push(p);
              } else if (stats.isDirectory()) {
                requireTree(p, fs.readdirSync(p));
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
      if ((_ref3 = cache[filePath]) != null ? _ref3.mtime : void 0) {
        if (!(stats.mtime > cache[filePath].mtime)) {
          return stats;
        }
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
            if ((_ref = cache[sourcePath]) != null ? _ref.mtime : void 0) {
              if (!(stats.mtime > ((_ref2 = cache[sourcePath]) != null ? _ref2.mtime : void 0))) {
                if (compiler === compilers.styl) {
                  cache[filePath].str = compiler.compileStr(cache[sourcePath].str, sourcePath);
                }
                if (typeof compileCallback === "function") {
                  compileCallback(sourcePath);
                }
                break;
              }
            }
            str = fs.readFileSync(sourcePath, 'utf8');
            cache[sourcePath] = {
              mtime: stats.mtime,
              str: str
            };
          } catch (ex) {
            continue;
          }
          str = compiler.compileStr(str, sourcePath);
          cache[filePath] = {
            mtime: stats.mtime,
            str: str
          };
          if (typeof compileCallback === "function") {
            compileCallback(sourcePath);
          }
          break;
        }
      }
    }
    if (!stats) {
      throw new Error("File not found: " + filePath);
    }
    return stats;
  };
  directivesInCode = function(code) {
    var header, match, _results;
    if (!(match = HEADER.exec(code))) {
      return [];
    }
    header = match[0];
    _results = [];
    while (match = DIRECTIVE.exec(header)) {
      _results.push(match[1]);
    }
    return _results;
  };
  collectDependencies = function(filePath, traversedPaths, traversedBranch) {
    var depPath, _i, _len, _ref;
    if (traversedPaths == null) {
      traversedPaths = [];
    }
    if (traversedBranch == null) {
      traversedBranch = [];
    }
    _ref = dependencies[filePath].slice(0).reverse();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      depPath = _ref[_i];
      if (__indexOf.call(traversedBranch, depPath) >= 0) {
        throw new Error("Cyclic dependency from " + filePath + " to " + depPath);
      }
      if (__indexOf.call(traversedPaths, depPath) >= 0) {
        continue;
      }
      traversedPaths.unshift(depPath);
      traversedBranch.unshift(depPath);
      collectDependencies(depPath, traversedPaths, traversedBranch.slice(0));
    }
    return traversedPaths;
  };
  generateTags = function(filePath, options) {
    var depPath, outputPath, suffix, tags;
    if (filePath.match(REMOTE_PATH)) {
      return ["<script src='" + filePath + "'></script>"];
    }
    tags = (function() {
      var _i, _len, _ref, _results;
      _ref = collectDependencies(filePath).concat([filePath]);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        depPath = _ref[_i];
        outputPath = relPath(options.src, depPath);
        suffix = options.suffixGenerator(filePath, cache[filePath].str);
        if (suffix !== '') {
          cache["" + outputPath + suffix] = {
            str: str,
            static: true
          };
        }
        _results.push("<script src='" + outputPath + suffix + "'></script>");
      }
      return _results;
    })();
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
  md5Suffix = function(filePath, str) {
    var hash, md5Hex;
    hash = crypto.createHash('md5');
    hash.update(str);
    md5Hex = hash.digest('hex');
    return "-" + md5Hex;
  };
}).call(this);
