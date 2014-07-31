var expect = require("expect.js");
var mocha = require("mocha");
var bin = require("../bin/connect-assets");
var rmrf = require("./testHelpers/rmrf");
var fs = require("fs");

describe("connect-assets command-line interface", function () {
  beforeEach(function () {
    var log = "";

    this.logger = {
      log: function (message) { log += message + "\n"; },
      time: function () {},
      timeEnd: function (message) { log += message + "\n"; },
      getLog: function () { return log; }
    };
  });

  it("compiles the assets out to disk", function (done) {
    var argv = process.argv;
    process.argv = "node connect-assets -i test/assets/js -i test/assets/css".split(" ");

    bin.execute(this.logger, function () {
      process.argv = argv;
      rmrf("builtAssets", done);
    });
  });

  it("minifies the compiled output", function (done) {
    var logger = this.logger;
    var argv = process.argv;
    var dir = "builtAssets";
    process.argv = "node connect-assets -i test/assets/js -i test/assets/css".split(" ");

    bin.execute(this.logger, function (manifest) {
      process.argv = argv;
      var css = dir + '/' + manifest.assets['unminified.css'];
      var js = dir + '/' + manifest.assets['unminified.js'];

      expect(fs.readFileSync(css, "utf8")).to.equal("body{background-color:#000;color:#fff}a{display:none}");
      expect(fs.readFileSync(js, "utf8")).to.equal('!function(){{var n="A string",a={aLongKeyName:function(){return n}};a.aLongKeyName()}}();');
      
      rmrf("builtAssets", done);
    });
  });

  it("compiles only those listed in --compile", function (done) {
    var argv = process.argv;
    process.argv = "node connect-assets -i test/assets/js -i test/assets/css -c blank.js".split(" ");

    bin.execute(this.logger, function () {
      process.argv = argv;

      var files = fs.readdirSync("builtAssets");
      expect(files.length).to.equal(2); // blank.js, manifest.json
      rmrf("builtAssets", done);
    });
  });

  it("generates a manifest.json", function (done) {
    var argv = process.argv;
    process.argv = "node connect-assets -i test/assets/js -i test/assets/css".split(" ");

    bin.execute(this.logger, function () {
      process.argv = argv;

      fs.statSync("builtAssets/manifest.json");
      rmrf("builtAssets", done);
    });
  });

  it("generates gzipped files", function (done) {
    var argv = process.argv;
    var dir = "builtAssets";
    process.argv = "node connect-assets -gz -i test/assets/js -i test/assets/css".split(" ");

    bin.execute(this.logger, function (manifest) {
      process.argv = argv;

      fs.statSync(dir + '/' + manifest.assets['unminified.js']);
      fs.statSync(dir + '/' + manifest.assets['unminified.js'] + '.gz');
      rmrf("builtAssets", done);
    });
  });

  it("compiles with asset_path helper", function (done) {
    var argv = process.argv;
    var dir = "builtAssets";
    process.argv = "node connect-assets -i test/assets/css -c asset-path-helper.css".split(" ");

    bin.execute(this.logger, function (manifest) {
      process.argv = argv;

      var css = dir + '/' + manifest.assets['asset-path-helper.css'];
      
      expect(fs.readFileSync(css, "utf8")).to.equal("@import \"/assets/asset-30a04cf33ee91a3ecf4b75c71268f316.css\";");
      rmrf("builtAssets", done);
    });
  });

  it("compiles with asset_path helper with servePath option defined", function (done) {
    var argv = process.argv;
    var dir = "builtAssets";
    process.argv = "node connect-assets -i test/assets/css -c asset-path-helper.css -s //cdn.example.com".split(" ");

    bin.execute(this.logger, function (manifest) {
      process.argv = argv;
      
      var css = dir + '/' + manifest.assets['asset-path-helper.css'];

      expect(fs.readFileSync(css, "utf8")).to.equal("@import \"//cdn.example.com/asset-30a04cf33ee91a3ecf4b75c71268f316.css\";");
      rmrf("builtAssets", done);
    });
  });
});
