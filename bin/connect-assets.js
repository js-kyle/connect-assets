var ArgumentParser = require("argparse").ArgumentParser;
var mincer = require("mincer");

var initialize = exports.initialize = function () {
  var cli = new ArgumentParser({
    prog: "connect-assets",
    version: require("../package.json").version,
    addHelp: true,
    description: "Precompiles assets supplied into their production-ready " +
      "form, ready for upload to a CDN or static file server. The generated " +
      "manifest.json is all that is required on your application server if " +
      "connect-assets is properly configured.",
    epilog: "If more advanced options are needed (such as supplying custom " +
      "file-type parsers), you'll have to write a custom build script (see the " +
      "source of this file for help)."
  });

  cli.addArgument(["-i", "--include"], {
    help: "Adds the directory to a list of directories that assets will be " +
      "read from, in order of preference. Defaults to 'assets/js' and " +
      "'assets/css'.",
    metavar: "DIRECTORY",
    action: "append",
    nargs: "*",
    defaultValue: [ "assets/js", "assets/css" ]
  });

  cli.addArgument(["-c", "--compile"], {
    help: "Adds the file (or pattern) to a list of files to compile. " +
      "Defaults to all files with extensions.",
    metavar: "FILE",
    action: "append",
    nargs: "*",
    defaultValue: ["*.*"]
  });

  cli.addArgument(["-o", "--output"], {
    help: "Specifies the output directory to write compiled assets to. " +
      "Defaults to 'builtAssets'.",
    metavar: "DIRECTORY",
    defaultValue: "builtAssets"
  });

  return cli;
};

var execute = exports.execute = function (logger, callback) {
  var cli = initialize();
  var args = prepare(cli);
  describe(logger, args);

  compile(logger, args, callback || function () {});
};

var prepare = exports.prepare = function (cli) {
  var args = cli.parseArgs();

  args.include = flatten(args.include);
  args.compile = flatten(args.compile);

  // Remove the default "all files" argument if more files are specified.
  if (args.compile.length > 1) {
    args.compile.shift();
  }

  return args;
};

var describe = exports.describe = function (logger, args) {
  logger.log("\nIncluded directories:");

  for (var i = 0; i < args.include.length; i++) {
    logger.log("  " + args.include[i]);
  };

  logger.log("\nCompile:");

  if (args.compile[0] != "*.*") {
    for (var i = 0; i < args.compile.length; i++) {
      logger.log("  " + args.compile[i]);
    };
  }
  else {
    logger.log("  (all files)");
  }

  logger.log("\nOutput:");
  logger.log("  " + args.output + "\n");
};

var compile = exports.compile = function (logger, args, callback) {
  logger.log("Compiling...");
  logger.time("Completed compilation");
  _compile(args, function (err) {
    if (err) { throw err; }
    logger.timeEnd("Completed compilation");
    callback();
  });
};

var _compile = exports._compile = function (args, callback) {
  var environment = new mincer.Environment();
  var manifest = new mincer.Manifest(environment, args.output);

  environment.cssCompressor = "csso";
  environment.jsCompressor = "uglify";

  args.include.forEach(environment.appendPath, environment);
  manifest.compile(args.compile, callback);
};

var flatten = function (arr) { return [].concat.apply([], arr); };
if (require.main === module) { execute(console); }
