var expect = require("expect.js");
var mocha = require("mocha");
var fs = require("fs");
var http = require("http");
var connect = require("connect");
var request = require("request");

var connectAssets = require("../../../index");

describe("compilers/js", function () {

  it("includes a js file with version token", function () {
    connectAssets({
      src: "test/integration/assets",
      pathsOnly: true,
      helperContext: this
    });

    var expected = "/js/no-dependencies.js?v=";
    var actual = this.js("no-dependencies");

    expect(actual).to.contain(expected);
  });

  it("serves a js file with no compression when build=false", function (done) {
    var file = "test/integration/assets/js/no-dependencies.js";
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
        var url = context.js("no-dependencies");

        request("http://localhost:3588" + url, function (err, res, body) {
          if (err) throw err;

          expect(body).to.be(expected);

          server.close();
          done();
        });
      });
    });
  });

  it("serves a js file with compression when build=true", function (done) {
    var file = "test/integration/builtAssets/js/no-dependencies.js";
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
        var url = context.js("no-dependencies");

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
