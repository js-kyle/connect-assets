var expect = require("expect.js");
var mocha = require("mocha");
var fs = require("fs");
var http = require("http");
var connect = require("connect");
var request = require("request");

var connectAssets = require("../../../index");

describe("lib/compilers/css", function () {

  it("includes a css file with version token", function (done) {
    var req = { url: "/" };

    connectAssets({
      src: "test/integration/assets",
      tagWriter: "passthroughWriter",
      helperContext: this
    })(req, null, function (err) {
      if (err) throw err;

      var expected = "/css/no-dependencies.css?v=";
      var actual = this.css("no-dependencies");

      expect(actual).to.contain(expected);
      done();
    }.bind(this));
  });

  it("serves a css file with no minification when build=false", function (done) {
    var file = "test/integration/assets/css/no-dependencies.css";

    var middleware = connectAssets({
      build: false,
      src: "test/integration/assets",
      tagWriter: "passthroughWriter",
      helperContext: this
    });

    var server = http.createServer(connect().use(middleware));

    server.listen(3580, function () {
      request("http://localhost:3580", function (err) {
        if (err) throw err;

        fs.readFile(file, "utf-8", function (err, expected) {
          if (err) throw err;

          var url = this.css("no-dependencies");

          request("http://localhost:3580" + url, function (err, res, body) {
            if (err) throw err;

            expect(body).to.be(expected);

            server.close();
            done();
          });
        }.bind(this));
      }.bind(this));
    }.bind(this));
  });

  it("serves a css file with minification when build=true", function (done) {
    var file = "test/integration/builtAssets/css/no-dependencies.css";

    var middleware = connectAssets({
      build: true,
      src: "test/integration/assets",
      tagWriter: "passthroughWriter",
      helperContext: this
    });

    var server = http.createServer(connect().use(middleware));

    server.listen(3581, function () {
      request("http://localhost:3581", function (err) {
        if (err) throw err;

        fs.readFile(file, "utf-8", function (err, expected) {
          if (err) throw err;

          var url = this.css("no-dependencies");

          request("http://localhost:3581" + url, function (err, res, body) {
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
