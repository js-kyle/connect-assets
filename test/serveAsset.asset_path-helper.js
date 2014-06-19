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

    createServer.call(this, { buildDir: dir, compile: true }, function () {
      var path = this.assetPath("asset-path-helper.css");
      var filename = dir + "/asset-path-helper-7e2feaf5cce60b2ef010192da0f7da2b.css";
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(fs.statSync(dir).isDirectory()).to.equal(true);
        expect(fs.statSync(filename).isFile()).to.equal(true);
        expect(fs.readFileSync(filename, "utf8")).to.equal("@import \"/assets/asset-20069ab163c070349198aa05124dcaa8.css\";\n");

        process.env.NODE_ENV = env;
        rmrf(dir, done);
      });
    });
  });

});
