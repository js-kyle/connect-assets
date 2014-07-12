var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var fs = require("fs");
var createServer = require("./testHelpers/createServer");
var rmrf = require("./testHelpers/rmrf");

describe("serveAsset minification", function () {

  it("minifies javascript in production", function (done) {
    var env = process.env.NODE_ENV;
    var dir = "testBuiltAssets";
    process.env.NODE_ENV = "production";

    createServer.call(this, { buildDir: dir }, function () {
      var path = this.assetPath("unminified.js");
      var filename = dir + "/unminified-0ff32dbfa7c8070831d4124699c7dc55.js";
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(fs.statSync(dir).isDirectory()).to.equal(true);
        expect(fs.statSync(filename).isFile()).to.equal(true);
        expect(fs.readFileSync(filename, "utf8")).to.equal('!function(){{var n="A string",a={aLongKeyName:function(){return n}};a.aLongKeyName()}}();');

        process.env.NODE_ENV = env;
        rmrf(dir, done);
      });
    });
  });

  it("minifies css in production", function (done) {
    var env = process.env.NODE_ENV;
    var dir = "testBuiltAssets";
    process.env.NODE_ENV = "production";

    createServer.call(this, { buildDir: dir }, function () {
      var path = this.assetPath("unminified.css");
      var filename = dir + "/unminified-8aff1f1e1fc7dc6c678a01e223f10620.css";
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(fs.statSync(dir).isDirectory()).to.equal(true);
        expect(fs.statSync(filename).isFile()).to.equal(true);
        expect(fs.readFileSync(filename, "utf8")).to.equal("body{background-color:#000;color:#fff}a{display:none}");

        process.env.NODE_ENV = env;
        rmrf(dir, done);
      });
    });
  });

});
