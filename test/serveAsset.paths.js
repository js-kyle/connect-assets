var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var fs = require("fs");
var createServer = require("./testHelpers/createServer");

describe("serveAsset paths", function () {
  it("allows the served path to be changed", function (done) {
    createServer.call(this, { servePath: "arsets" }, function () {
      var path = this.assetPath("blank.js");
      var url = this.host + path;

      expect(path).to.contain("/arsets/");

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });

  it("allows servePath to be a URL", function (done) {
    createServer.call(this, { servePath: "http://cdn.example.com/" }, function () {
      var path = this.assetPath("blank.js");
      var url = path;

      expect(path.indexOf("http://cdn.example.com/")).to.equal(0);
      done();
    });
  });

  it("allows servePath to be a URL without a protocol", function (done) {
    createServer.call(this, { servePath: "//cdn.example.com/" }, function () {
      var path = this.assetPath("blank.js");
      var url = path;

      expect(path.indexOf("//cdn.example.com/")).to.equal(0);
      done();
    });
  });

  it("does not serve assets for URLs outside of serve path", function (done) {
    createServer.call(this, {}, function () {
      var path = this.assetPath("blank.js").replace("/assets", "");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(404);
        done();
      });
    });
  });

  it("does not serve asset if fingerprint doesn't match", function (done) {
    createServer.call(this, {}, function () {
      var path = this.assetPath("blank.js").replace("3d2afa4aef421f17310e48c12eb39145", "436828974cd5282217fcbd406d41e9ca");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(404);
        done();
      });
    });
  });

  it("does not serve asset if fingerprint isn't supplied", function (done) {
    createServer.call(this, {}, function () {
      var path = this.assetPath("blank.js").replace("-3d2afa4aef421f17310e48c12eb39145", "");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(404);
        done();
      });
    });
  });
});
