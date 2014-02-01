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

    bin.execute(this.logger, function () {
      process.argv = argv;

      var css = dir + "/unminified-a92caa3439ab1d33f88573b44104154d.css";
      var js = dir + "/unminified-c771058bc21c8e09279507dc9898c2a1.js";

      expect(fs.readFileSync(js, "utf8")).to.equal('(function(){var n="A string";var r={aLongKeyName:function(){return n}}})();');
      expect(fs.readFileSync(css, "utf8")).to.equal("body{background-color:#000;color:#fff}a{display:none}");
      rmrf("builtAssets", done);
    });
  });

  it("compiles only those listed in --compile", function (done) {
    var argv = process.argv;
    process.argv = "node connect-assets -i test/assets/js -i test/assets/css -c blank.js".split(" ");

    bin.execute(this.logger, function () {
      process.argv = argv;

      var files = fs.readdirSync("builtAssets");
      expect(files.length).to.equal(3); // blank.js, blank.js.gz, manifest.json
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
});
