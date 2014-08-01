var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var fs = require("fs");
var createServer = require("./testHelpers/createServer");
var rmrf = require("./testHelpers/rmrf");
var connectAssets = require("..");

var autoprefixer = require("autoprefixer");

// By default autoprefixer uses usage statistics which changes over time
// In attempt to make the test a little more predictable we use some constant browsers here
autoprefixer.default = ['ie 8', 'chrome 21', 'firefox 3.5'];

describe("serveAsset prefixcss", function () {
  it("prefixes css in production", function (done) {
    var env = process.env.NODE_ENV;
    var dir = "testBuiltAssets";
    process.env.NODE_ENV = "production";

    createServer.call(this, { buildDir: dir, prefixCss: true }, function () {
      var path = this.assetPath("unprefixed.css");
      var filename = dir + "/unprefixed-0f6c34878e78f8f7c8e3f9ae872f7b6f.css";
      var url = this.host + path;

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(fs.statSync(dir).isDirectory()).to.equal(true);
        expect(fs.statSync(filename).isFile()).to.equal(true);
        expect(fs.readFileSync(filename, "utf8")).to.equal("a{-moz-border-radius:5px;border-radius:5px;-moz-border-radius-topleft:3px;border-top-left-radius:3px;-moz-border-radius-bottomright:3px;border-bottom-right-radius:3px}.simple1{background:-webkit-linear-gradient(black, white);background:linear-gradient(black, white)}.simple2{background:-webkit-linear-gradient(right, black 0, rgba(0, 0, 0, .5) 50%, white 100%);background:linear-gradient(to left, black 0, rgba(0, 0, 0, .5) 50%, white 100%)}");

        process.env.NODE_ENV = env;
        rmrf(dir, done);
      });
    });
  });
});
