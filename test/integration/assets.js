var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var connect = require("connect");
var request = require("request");

var connectAssets = require("../../index");

describe("lib/assets", function () {

  describe("middleware", function () {

    it("uses an expires header at least a year from now", function (done) {
      var server = http.createServer(connect().use(connectAssets({
        src: "test/integration/assets",
        tagWriter: "passthroughWriter",
        helperContext: this
      })));

      server.listen(3560, function () {
        request("http://localhost:3560", function (err) {
          if (err) throw err;

          var url = this.css("no-dependencies");

          request("http://localhost:3560" + url, function (err, res, body) {
            if (err) throw err;
            var header = res.headers["expires"];

            expect(header).to.be.ok();

            var expiration = new Date(header).getTime();
            var oneYearInMilliseconds = 31556900000;
            var oneYearFromNow = new Date().getTime() + oneYearInMilliseconds;

            expect(expiration).to.be.greaterThan(oneYearFromNow);
            server.close();
            done();
          });
        }.bind(this));
      }.bind(this));
    });

    it("uses content-type: text/javascript for .js files", function (done) {
      var server = http.createServer(connect().use(connectAssets({
        src: "test/integration/assets",
        tagWriter: "passthroughWriter",
        helperContext: this
      })));

      server.listen(3561, function () {
        request("http://localhost:3561", function (err) {
          if (err) throw err;

          var url = this.js("no-dependencies");

          request("http://localhost:3561" + url, function (err, res, body) {
            if (err) throw err;
            var header = res.headers["content-type"];

            expect(header).to.be("text/javascript");
            server.close();
            done();
          });
        }.bind(this));
      }.bind(this));
    });

    it("uses content-type: text/css for .css files", function (done) {
      var server = http.createServer(connect().use(connectAssets({
        src: "test/integration/assets",
        tagWriter: "passthroughWriter",
        helperContext: this
      })));

      server.listen(3562, function () {
        request("http://localhost:3562", function (err) {
          if (err) throw err;

          var url = this.css("no-dependencies");

          request("http://localhost:3562" + url, function (err, res, body) {
            if (err) throw err;
            var header = res.headers["content-type"];

            expect(header).to.be("text/css");
            server.close();
            done();
          });
        }.bind(this));
      }.bind(this));
    });

    it("doesn't require using the css() function to serve css assets", function (done) {
      var server = http.createServer(connect().use(connectAssets({
        src: "test/integration/assets",
        tagWriter: "passthroughWriter",
        helperContext: this
      })));

      server.listen(3563, function () {
        request("http://localhost:3563", function (err) {
          if (err) throw err;

          var url = "/css/no-dependencies.css";

          request("http://localhost:3563" + url, function (err, res, body) {
            if (err) throw err;
            var header = res.headers["content-type"];

            expect(header).to.be("text/css");
            server.close();
            done();
          });
        }.bind(this));
      }.bind(this));
    });

    it("doesn't require using the js() function to serve js assets", function (done) {
      var server = http.createServer(connect().use(connectAssets({
        src: "test/integration/assets",
        tagWriter: "passthroughWriter",
        helperContext: this
      })));

      server.listen(3564, function () {
        request("http://localhost:3564", function (err) {
          if (err) throw err;

          var url = "/js/no-dependencies.js";

          request("http://localhost:3564" + url, function (err, res, body) {
            if (err) throw err;
            var header = res.headers["content-type"];

            expect(header).to.be("text/javascript");
            server.close();
            done();
          });
        }.bind(this));
      }.bind(this));
    });

  });

  describe("css view helper", function () {

    beforeEach(function () {
      connectAssets({
        src: "test/integration/assets",
        tagWriter: "passthroughWriter",
        helperContext: this
      });
    });

    it("prepends the asset folder to the URL (css)", function () {
      var expected = "/css/some/path.css";
      var actual = this.css("some/path");

      expect(actual).to.be(expected);
    });

    it("doesn't do anything to full URLs (http://example.com)", function () {
      var expected = "http://example.com/test.css";
      var actual = this.css(expected);

      expect(actual).to.be(expected);
    });

    it("doesn't do anything to almost full URLs (//example.com)", function () {
      var expected = "//example.com/test.css";
      var actual = this.css(expected);

      expect(actual).to.be(expected);
    });
    
  });

  describe("js view helper", function () {

    beforeEach(function () {
      connectAssets({
        src: "test/integration/assets",
        tagWriter: "passthroughWriter",
        helperContext: this
      });
    });

    it("prepends the asset folder to the URL (js)", function () {
      var expected = "/js/some/path.js";
      var actual = this.js("some/path");

      expect(actual).to.be(expected);
    });

    it("doesn't do anything to full URLs (http://example.com)", function () {
      var expected = "http://example.com/test.js";
      var actual = this.js(expected);

      expect(actual).to.be(expected);
    });

    it("doesn't do anything to almost full URLs (//example.com)", function () {
      var expected = "//example.com/test.js";
      var actual = this.js(expected);

      expect(actual).to.be(expected);
    });
    
  });

});