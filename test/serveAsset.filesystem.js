var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var fs = require("fs");
var createServer = require("./testHelpers/createServer");
var rmrf = require("./testHelpers/rmrf");
var bin = require("../bin/connect-assets");

describe("serveAsset filesystem", function () {
  describe("development", function () {
    it("serves new files as they exist on disk in development", function (done) {
      createServer.call(this, {}, function () {
        var file = "test/assets/css/new-file.css";
        fs.writeFileSync(file, "");

        var path = this.assetPath("new-file.css");
        var url = this.host + path;

        http.get(url, function (res) {
          expect(res.statusCode).to.equal(200);
          fs.unlink(file, done);
        });
      });
    });

    it("serves file changes as they are made in development", function (done) {
      var file = "test/assets/css/file-changes-dev.css";
      fs.writeFileSync(file, "");

      // Pretend like this file was last touched a minute ago.
      var stats = fs.statSync(file);
      var newmtime = new Date(stats.mtime.getTime() - 60 * 1000);
      fs.utimesSync(file, stats.atime, newmtime);

      createServer.call(this, {}, function () {
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
            expect(body).to.equal(content + "\n");
            fs.unlink(file, done);
          });
        });
      });
    });
  });

  describe("production", function () {
    it("stores compiled files to disk in production", function (done) {
      var env = process.env.NODE_ENV;
      var dir = "testBuiltAssets";
      process.env.NODE_ENV = "production";

      createServer.call(this, { buildDir: dir }, function () {
        var path = this.assetPath("blank.css");
        var url = this.host + path;

        http.get(url, function (res) {
          expect(res.statusCode).to.equal(200);
          expect(fs.statSync(dir).isDirectory()).to.equal(true);
          expect(fs.statSync(dir + "/blank-1e6dbfaaa068a191cfd257c013ddd699.css").isFile()).to.equal(true);

          process.env.NODE_ENV = env;
          rmrf(dir, done);
        });
      });
    });

    it("serves pre-generated assets from disk in production", function(done) {
      var consoleStub = {
        log: function (message) {},
        time: function () {},
        timeEnd: function (message) {}
      };

      var dir = "builtAssets";
      var env = process.env.NODE_ENV;

      var options = {
        compile: false,
        build: false,
        buildDir: dir
      };

      var argv = process.argv;
      process.argv = "node connect-assets -i test/assets/js -i test/assets/css -c unminified.css".split(" ");

      bin.execute(consoleStub, function(manifest) {
        process.argv = argv;

        createServer.call(this, options, function () {
          var path = manifest.assets["unminified.css"];
          var url = this.host + "/assets/" + path;

          http.get(url, function (res) {
            expect(res.statusCode).to.equal(200);
            expect(fs.statSync(dir).isDirectory()).to.equal(true);
            expect(res.headers).to.have.property("content-type");

            var data = "";

            res.on("data", function(chunk) {
              data += chunk.toString();
            });

            res.on("end", function() {
              var content = fs.readFileSync("builtAssets/" + path).toString();
              expect(data).to.equal(content);
              rmrf(dir, done);
            });

            process.env.NODE_ENV = env;
          });
        });
      });
    });
  });
});
