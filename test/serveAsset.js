var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var fs = require("fs");
var createServer = require("./testHelpers/createServer");

describe("serveAsset file changes", function () {
  it("serves new files as they exist on disk in development", function (done) {
    createServer({}, function () {
      var file = "test/assets/css/new-file.css";
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
    var instance = this;
    fs.writeFileSync(file, "");

    createServer({}, function () {
      var content = "body { color: #fff; }";
      fs.writeFileSync(file, content);

      // We need to let mincer detect the filesystem change — and therefore we
      // can't use process.nextTick here as that will jump ahead of IO calls.
      setTimeout(function () {
        var path = instance.assetPath("file-changes-dev.css");
        var url = instance.host + path;
        var body = "";

        http.get(url, function (res) {
          expect(res.statusCode).to.equal(200);

          res.setEncoding("utf8");
          res.on("data", function (chunk) { body += chunk });
          res.on("end", function () {
            expect(body).to.equal(content + "\n");
            fs.unlinkSync(file);
            done();
          });
        });
      }, 0);
    });
  });

  it("does not serve file changes in production", function (done) {
    var env = process.env.NODE_ENV;
    var file = "test/assets/css/file-changes-prod.css";
    var content = "body { color: #fff; }";
    process.env.NODE_ENV = "production";
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
});
