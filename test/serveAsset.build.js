var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var fs = require("fs");
var createServer = require("./testHelpers/createServer");
var rmrf = require("./testHelpers/rmrf");

describe("serveAsset build", function () {

  before(function () {
    this.env = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
  });

  after(function () {
    process.env.NODE_ENV = this.env;
  });

  it("serves individual files in dev", function (done) {
    createServer.call(this, {}, function () {
      var paths = this.assetPath("depends-on-simple.js").split("\n");

      // Check that the dependency was found.
      expect(paths).to.have.length(2);

      var url = this.host + paths[1];

      http.get(url, function (res) {
        res.setEncoding("utf8");
        var body = "";
        res.on("data", function (chunk) { body += chunk });
        res.on("end", function () {
          expect(res.statusCode).to.equal(200);
          expect(body).to.not.contain("var a = true;");
          done();
        });
      });
    });
  });

});
