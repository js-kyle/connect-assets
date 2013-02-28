var expect = require("expect.js");
var mocha = require("mocha");
var fs = require("fs");
var http = require("http");
var connect = require("connect");
var request = require("request");

var connectAssets = require("../../../index");

describe("compilers/less", function () {

  it("serves a css file", function (done) {
    var file = "test/integration/builtAssets/css/less-with-import.css";
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
        var url = context.css("less-with-import");

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
