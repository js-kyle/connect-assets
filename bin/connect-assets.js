var ArgumentParser = require("argparse").ArgumentParser;
var mincer = require("mincer");

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
  help: "Adds the file (or pattern) to a list of files to compile. Specify " +
    "the option multiple times for multiple files (or patterns). Defaults to " +
    "all files.",
  metavar: "FILE",
  action: "append",
  nargs: "*",
  defaultValue: []
});

cli.addArgument(["-o", "--output"], {
  help: "Specifies the output directory to write compiled assets to. " +
    "Defaults to 'builtAssets'.",
  metavar: "DIRECTORY",
  defaultValue: "builtAssets"
});

var execute = function () {
  var args = prepare();
  describe(args);

  compile(args, function () {
    process.exit(0);
  });
};

var prepare = function () {
  var args = cli.parseArgs();

  args.include = flatten(args.include);
  args.compile = flatten(args.compile);

  return args;
};

var describe = function (args) {
  console.log("\nIncluded directories:");

  for (var i = 0; i < args.include.length; i++) {
    console.log("  " + args.include[i]);
  };

  console.log("\nCompile:");

  if (args.compile.length) {
    for (var i = 0; i < args.compile.length; i++) {
      console.log("  " + args.compile[i]);
    };
  }
  else {
    console.log("  (all files)");
  }

  console.log("\nOutput:");
  console.log("  " + args.output + "\n");
};

var compile = function (args, callback) {
  console.log("Compiling...");
  console.time("Completed compilation");
  _compile(args, function (err) {
    if (err) { throw err; }
    console.timeEnd("Completed compilation");
    callback();
  });
};

var _compile = function (args, callback) {
  var environment = new mincer.Environment();
  var manifest = new mincer.Manifest(environment, args.output);

  args.include.forEach(environment.appendPath, environment);
  manifest.compile(args.compile, callback);
};

var flatten = function (arr) { return [].concat.apply([], arr); };

execute();
