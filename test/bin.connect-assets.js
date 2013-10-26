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
