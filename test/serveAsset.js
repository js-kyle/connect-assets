var expect = require("expect.js");
var mocha = require("mocha");
var assets = require("..");
var connect = require("connect");
var http = require("http");
var fs = require("fs");

describe("serveAsset", function () {
  var createServer = function (opts, done) {
    opts.paths = [ "test/assets/js", "test/assets/css" ];
    opts.helperContext = this;

    var app = this.app = connect().use(assets(opts));

    app.listen(function () {
      var address = this.address();
      opts.helperContext.host = "http://" + address.address + ":" + address.port;
      done();
    });
  };

  it("allows the served path to be changed", function (done) {
    createServer({ servePath: "arsets" }, function () {
      var path = this.assetPath("blank.js");
      var url = this.host + path;

      expect(path).to.contain("/arsets/");

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });

  it("serves new files as they exist on disk in development", function (done) {
    createServer({}, function () {
      var file = "test/assets/css/new-file.css";
      expect(function () { fs.statSync(file); }).to.throwError(/ENOENT/);
      fs.writeFileSync(file, "");

      var path = this.assetPath("new-file.css");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        fs.unlinkSync(file);
        done();
      });
    });
  });

  it("serves file changes as they are made in development", function (done) {
    var file = "test/assets/css/file-changes-dev.css";
    expect(function () { fs.statSync(file); }).to.throwError(/ENOENT/);
    fs.writeFileSync(file, "");

    createServer({}, function () {
      var content = "body { color: #fff; }";
      fs.writeFileSync(file, content);

      var path = this.assetPath("file-changes-dev.css");
      var url = this.host + path;
      var body = "";

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);

        res.setEncoding("utf8");
        res.on("data", function (chunk) { body += chunk });
        res.on("end", function () {
          expect(body).to.equal(content);
          fs.unlinkSync(file);
          done();
        });
      });
    });
  });

  it("does not serve file changes in production", function (done) {
    var env = process.env.NODE_ENV;
    var file = "test/assets/css/file-changes-prod.css";
    var content = "body { color: #fff; }";
    process.env.NODE_ENV = "production";
    expect(function () { fs.statSync(file); }).to.throwError(/ENOENT/);
    fs.writeFileSync(file, content);

    createServer({}, function () {

      fs.writeFileSync(file, "");

      var path = this.assetPath("file-changes-prod.css");
      var url = this.host + path;
      var body = "";

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);

        res.setEncoding("utf8");
        res.on("data", function (chunk) { body += chunk });
        res.on("end", function () {
          expect(body).to.equal(content + "\n");
          fs.unlinkSync(file);
          process.env.NODE_ENV = env;
          done();
        });
      });
    });
  });

  it("does not serve assets for URLs outside of serve path", function (done) {
    createServer({}, function () {
      var path = this.assetPath("blank.js").replace("/assets", "");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(404);
        done();
      });
    });
  });

  it("does not serve asset if fingerprint doesn't match", function (done) {
    createServer({}, function () {
      var path = this.assetPath("blank.js").replace("af7c72e86aadcfde95bb29d286c27034", "436828974cd5282217fcbd406d41e9ca");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(404);
        done();
      });
    });
  });

  it("does not serve asset if fingerprint isn't supplied", function (done) {
    createServer({}, function () {
      var path = this.assetPath("blank.js").replace("-af7c72e86aadcfde95bb29d286c27034", "");
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(404);
        done();
      });
    });
  });
});
