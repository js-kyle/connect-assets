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

  it("allows servePath to be a URL without a protocol and without a pathname", function (done) {
    createServer.call(this, { servePath: "//cdn.example.com" }, function () {
      var path = this.assetPath("blank.js");
      var url = path;

      expect(path.indexOf("//cdn.example.com/")).to.equal(0);
      done();
    });
  });

  it("serves assets at the pathname of servePath if servePath is a URL", function (done) {
    createServer.call(this, { servePath: "http://cdn.example.com:2452/assets" }, function () {
      var path = this.assetPath("blank.js");
      var url = this.host + path.replace("http://cdn.example.com:2452", "");

      expect(path.indexOf("http://cdn.example.com:2452/assets/")).to.equal(0);

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });

  it("serves assets at the pathname of servePath if servePath is a URL without a protocol", function (done) {
    createServer.call(this, { servePath: "//cdn.example.com:2452/assets" }, function () {
      var path = this.assetPath("blank.js");
      var url = this.host + path.replace("//cdn.example.com:2452", "");

      expect(path.indexOf("//cdn.example.com:2452/assets/")).to.equal(0);

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
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

  it("does not serve asset if fingerprint doesn't match when fingerprinting is enabled", function (done) {
    createServer.call(this, { fingerprinting: true }, function () {
      var path = this.assetPath("blank.js").replace(/[a-f0-9]{32}/i, "436828974cd5282217fcbd406d41e9ca");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(404);
        done();
      });
    });
  });

  it("does not serve asset if fingerprint isn't supplied and fingerprinting is enabled", function (done) {
    createServer.call(this, { fingerprinting: true }, function () {
      var path = this.assetPath("blank.js").replace(/\-[a-f0-9]{32}/i, "");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(404);
        done();
      });
    });
  });

  it("serves asset without a fingerprint if fingerprinting is disabled", function (done) {
    createServer.call(this, { fingerprinting: false }, function () {
      var path = this.assetPath("blank.js");
      var url = this.host + path;

      expect(path).to.equal("/assets/blank.js");

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });
});
