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
      var filename = dir + "/unminified-d61f48fe51dc391913341167fe4b43a3.js";
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
      var filename = dir + "/unminified-a84adb14001bc08aa9cbbac4439044c3.css";
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
