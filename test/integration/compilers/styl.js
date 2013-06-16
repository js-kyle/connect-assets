var expect = require("expect.js");
var mocha = require("mocha");
var fs = require("fs");
var http = require("http");
var connect = require("connect");
var request = require("request");

var connectAssets = require("../../../index");

describe("lib/compilers/styl", function () {

  it("includes a stylus file with version token", function (done) {
    var req = { url: "/" };

    connectAssets({
      src: "test/integration/assets",
      tagWriter: "passthroughWriter",
      helperContext: this
    })(req, null, function (err) {
      if (err) throw err;

      var expected = "/css/styl-with-import.css?v=";
      var actual = this.css("styl-with-import");

      expect(actual).to.contain(expected);
      done();
    }.bind(this));
  });

  it("serves a stylus file with no minification when build=false", function (done) {
    var file = "test/integration/builtAssets/css/styl-with-import.css";

    var middleware = connectAssets({
      build: false,
      src: "test/integration/assets",
      tagWriter: "passthroughWriter",
      helperContext: this
    });

    var server = http.createServer(connect().use(middleware));

    server.listen(3610, function () {
      request("http://localhost:3610", function (err) {
        if (err) throw err;

        fs.readFile(file, "utf-8", function (err, expected) {
          if (err) throw err;

          var url = this.css("styl-with-import");

          request("http://localhost:3610" + url, function (err, res, body) {
            if (err) throw err;

            expect(body).to.be(expected);

            server.close();
            done();
          });
        }.bind(this));
      }.bind(this));
    }.bind(this));
  });

  it("serves a stylus file with minification when build=true", function (done) {
    var file = "test/integration/builtAssets/css/styl-compressed.css";

    var middleware = connectAssets({
      build: true,
      src: "test/integration/assets",
      tagWriter: "passthroughWriter",
      helperContext: this
    });

    var server = http.createServer(connect().use(middleware));

    server.listen(3611, function () {
      request("http://localhost:3611", function (err) {
        if (err) throw err;

        fs.readFile(file, "utf-8", function (err, expected) {
          if (err) throw err;

          var url = this.css("styl-with-import");

          request("http://localhost:3611" + url, function (err, res, body) {
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
