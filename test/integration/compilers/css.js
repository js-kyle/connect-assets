var expect = require("expect.js");
var mocha = require("mocha");
var fs = require("fs");
var http = require("http");
var connect = require("connect");
var request = require("request");

var connectAssets = require("../../../index");

describe("compilers/css", function () {

  it("includes a css file with version token", function () {
    connectAssets({
      src: "test/integration/assets",
      pathsOnly: true,
      helperContext: this
    });

    var expected = "/css/no-dependencies.css?v=";
    var actual = this.css("no-dependencies");

    expect(actual).to.contain(expected);
  });

  it("serves a css file with no minification when build=false", function (done) {
    var file = "test/integration/assets/css/no-dependencies.css";
    var context = {};

    var server = http.createServer(connect().use(connectAssets({
      build: false,
      src: "test/integration/assets",
      pathsOnly: true,
      helperContext: context
    })));

    fs.readFile(file, "utf-8", function (err, expected) {
      if (err) throw err;

      server.listen(3588, function () {
        var url = context.css("no-dependencies");

        request("http://localhost:3588" + url, function (err, res, body) {
          if (err) throw err;

          expect(body).to.be(expected);

          server.close();
          done();
        });
      });
    });
  });

  it("serves a css file with minification when build=true", function (done) {
    var file = "test/integration/builtAssets/css/no-dependencies.css";
    var context = {};

    var server = http.createServer(connect().use(connectAssets({
      build: true,
      src: "test/integration/assets",
      pathsOnly: true,
      helperContext: context
    })));

    fs.readFile(file, "utf-8", function (err, expected) {
      if (err) throw err;

      server.listen(3588, function () {
        var url = context.css("no-dependencies");

        request("http://localhost:3588" + url, function (err, res, body) {
          if (err) throw err;

          expect(body).to.be(expected);

          server.close();
          done();
        });
      });
    });
  });

});
