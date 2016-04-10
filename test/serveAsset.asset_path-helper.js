var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var fs = require("fs");
var createServer = require("./testHelpers/createServer");
var rmrf = require("./testHelpers/rmrf");

describe("serveAsset asset_path environment helper", function () {

  it("minifies css in production", function (done) {
    var env = process.env.NODE_ENV;
    var dir = "testBuiltAssetsFoo";

    createServer.call(this, { build: true, buildDir: dir, compile: true, fingerprinting: true }, function () {
      var path = this.assetPath("asset-path-helper.css");
      var filename = dir + "/asset-path-helper-ecc5d891145d56a0274eb4f34670671e.css";
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(fs.statSync(dir).isDirectory()).to.equal(true);
        expect(fs.statSync(filename).isFile()).to.equal(true);
        expect(fs.readFileSync(filename, "utf8")).to.equal("@import \"/assets/asset-e89e45b0019f8d3feb5341de6b815cdb.css\";\n\n");

        process.env.NODE_ENV = env;
        rmrf(dir, done);
      });
    });
  });

});
