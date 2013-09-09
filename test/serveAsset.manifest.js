var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var fs = require("fs");
var assets = require("..");
var createServer = require("./testHelpers/createServer");
var rmrf = require("./testHelpers/rmrf");

describe("serveAsset manifest", function () {
  it("outputs a manifest if it does not exist", function (done) {
    var dir = "testBuiltAssets";

    createServer.call(this, { buildDir: dir }, function () {
      var path = this.assetPath("blank.css");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(fs.statSync(dir).isDirectory()).to.equal(true);
        expect(fs.statSync(dir + "/manifest.json").isFile()).to.equal(true);

        rmrf(dir, done);
      });
    });
  });

  it("uses an existing manifest if it exists", function (done) {
    var dir = "testBuiltAssets";

    fs.mkdirSync(dir);
    fs.writeFileSync(dir + "/manifest.json", "{}");

    createServer.call(this, { buildDir: dir }, function () {
      expect(fs.readFileSync(dir + "/manifest.json", "utf8")).to.equal("{}");
      rmrf(dir, done);
    });
  });

  it("serves files outside of the manifest if compile is true");

  it("does not serve files outside of the manifest if compile is false");

});
