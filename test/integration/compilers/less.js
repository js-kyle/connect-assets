var expect = require("expect.js");
var mocha = require("mocha");
var fs = require("fs");
var http = require("http");
var connect = require("connect");
var request = require("request");

var connectAssets = require("../../../index");

describe("compilers/less", function () {

  it("includes a less file with version token", function (done) {
    var req = { url: "/" };

    connectAssets({
      src: "test/integration/assets",
      pathsOnly: true,
      helperContext: this
    })(req, null, function (err) {
      if (err) throw err;

      var expected = "/css/less-with-import.css?v=";
      var actual = this.css("less-with-import");

      expect(actual).to.contain(expected);
      done();
    }.bind(this));
  });

  it("serves a less file with no minification when build=false", function (done) {
    var file = "test/integration/builtAssets/css/less-with-import.css";

    var middleware = connectAssets({
      build: false,
      src: "test/integration/assets",
      pathsOnly: true,
      helperContext: this
    });

    var server = http.createServer(connect().use(middleware));

    server.listen(3570, function () {
      request("http://localhost:3570", function (err) {
        if (err) throw err;

        fs.readFile(file, "utf-8", function (err, expected) {
          if (err) throw err;

          var url = this.css("less-with-import");

          request("http://localhost:3570" + url, function (err, res, body) {
            if (err) throw err;

            expect(body).to.be(expected);

            server.close();
            done();
          });
        }.bind(this));
      }.bind(this));
    }.bind(this));
  });

  it("serves a less file with minification when build=true", function (done) {
    var file = "test/integration/builtAssets/css/less-compressed.css";

    var middleware = connectAssets({
      build: true,
      src: "test/integration/assets",
      pathsOnly: true,
      helperContext: this
    });

    var server = http.createServer(connect().use(middleware));

    server.listen(3571, function () {
      request("http://localhost:3571", function (err) {
        if (err) throw err;

        fs.readFile(file, "utf-8", function (err, expected) {
          if (err) throw err;

          var url = this.css("less-with-import");

          request("http://localhost:3571" + url, function (err, res, body) {
            if (err) throw err;

            expect(body).to.be(expected);

            server.close();
            done();
          });
        }.bind(this));
      }.bind(this));
    }.bind(this));
  });
});
