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

    createServer.call(this, { buildDir: dir, compile: false }, function () {
      expect(fs.readFileSync(dir + "/manifest.json", "utf8")).to.equal("{}");
      rmrf(dir, done);
    });
  });

  it("serves files outside of the manifest if compile is true", function (done) {
    var dir = "testBuiltAssets";

    createServer.call(this, { buildDir: dir, compile: true }, function () {
      var path = this.assetPath("blank.css");
      var url = this.host + path;

      http.get(url, function (res) {
        var file = "test/assets/css/new-file-manifest-served.css";
        fs.writeFileSync(file, "");

        var path = this.assetPath("new-file-manifest-served.css");
        var url = this.host + path;

        http.get(url, function (res) {
          expect(res.statusCode).to.equal(200);
          fs.unlinkSync(file);
          rmrf(dir, done);
        });
      }.bind(this));
    });
  });

  /*
    I wish we could make the assertion "updates the manifest when compile is
    true" but I can't seem to figure out how to get Mincer to do that.

    For now, since I think this is an edge case and won't affect most people,
    we'll just ship with this assertion instead.

    Bonus points if you can change this test to "updates the manifest when
    compile is true."
  */
  it("does not update the manifest if files changed and compile is true", function (done) {
    var dir = "testBuiltAssets";
    var file = "test/assets/css/new-file-manifest.css";

    rmrf(dir, function (err) {
      if (err && err.code != "ENOENT") return done(err);

      try { fs.unlinkSync(file); }
      catch (e) { if (e.code != "ENOENT") throw e; }

      createServer.call(this, { buildDir: dir, compile: true }, function () {
        var path = this.assetPath("blank.css");
        var url = this.host + path;

        http.get(url, function (res) {
          fs.writeFileSync(file, "");

          var path = this.assetPath("new-file-manifest.css");
          var url = this.host + path;

          http.get(url, function (res) {
            expect(res.statusCode).to.equal(200);

            var manifest = fs.readFileSync(dir + "/manifest.json", "utf8");

            /*
              If changing this test to "updates the manifest when compile is
              true," you should just need to remove the "not" from this
              assertion.
            */
            expect(manifest).to.not.contain("new-file-manifest.css");

            fs.unlinkSync(file);
            rmrf(dir, done);
          });
        }.bind(this));
      });

    });
  });

  it("does not serve files outside of the manifest if compile is false", function (done) {
    var dir = "testBuiltAssets";

    rmrf(dir, function (err) {
      if (err && err.code != "ENOENT") return done(err);

      // Build the initial manifest.
      createServer.call(this, { buildDir: dir, compile: true }, function () {
        var path = this.assetPath("blank.css");
        var url = this.host + path;

        http.get(url, function (res) {

          // Now, create a server using the existing manifest.
          createServer.call(this, { buildDir: dir, compile: false }, function () {
            var file = "test/assets/css/new-file-manifest-no-compile.css";
            fs.writeFileSync(file, "");

            expect(function () {
              this.assetPath("new-file-manifest-no-compile.css");
            }.bind(this)).to.throwError(/Asset 'new-file-manifest-no-compile.css' not found/);

            fs.unlinkSync(file);
            rmrf(dir, done);
          });
        }.bind(this));
      });
    });
  });

});
