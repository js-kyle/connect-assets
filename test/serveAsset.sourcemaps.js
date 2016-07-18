var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var fs = require("fs");
var createServer = require("./testHelpers/createServer");
var rmrf = require("./testHelpers/rmrf");

describe("serveAsset sourcemaps", function () {

  it("adds source map header to asset", function (done) {
    createServer.call(this, { bundle: true, compress: true, sourceMaps: true }, function () {
      var path = this.assetPath("unminified.js");
      var url = this.host + path;
      var sourceMapPath = path + ".map";

      http.get(url, function (res) {
        expect(res.statusCode).to.equal(200);
        expect(res.headers["x-sourcemap"]).to.equal(sourceMapPath);
        done();
      });
    });
  });

  it("serves source map", function (done) {
    createServer.call(this, { bundle: true, compress: true, sourceMaps: true }, function () {
      var path = this.assetPath("unminified.js");
      var url = this.host + path + ".map";

      http.get(url, function (res) {
        res.setEncoding("utf8");
        var body = "";
        res.on("data", function (chunk) { body += chunk });
        res.on("end", function () {
          expect(res.statusCode).to.equal(200);
          expect(body).to.equal("{\"version\":3,\"sources\":[\"test/assets/js/unminified.js\"],\"names\":[\"aVeryLongVariableName\",\"someFunctions\",\"aLongKeyName\"],\"mappings\":\"CAAA,WACA,GAAAA,GAAA,WAEAC,GACAC,aAAA,WACA,MAAAF,IAGAC,GAAAC\",\"file\":\"unminified.js\",\"sourcesContent\":[\"(function () {\\n  var aVeryLongVariableName = \\\"A string\\\";\\n\\n  var someFunctions = {\\n    aLongKeyName: function () {\\n      return aVeryLongVariableName;\\n    }\\n  };\\n  var x = someFunctions.aLongKeyName();\\n})();\"],\"sourceRoot\":\"/\"}");
          done();
        });
      });
    });
  });

  it("serves source map of concatenated file", function (done) {
    createServer.call(this, { bundle: true, compress: true, sourceMaps: true }, function () {
      var path = this.assetPath("depends-on-unminified.js");
      var url = this.host + path + ".map";
      
      http.get(url, function (res) {
        res.setEncoding("utf8");
        var body = "";
        res.on("data", function (chunk) { body += chunk });
        res.on("end", function () {
          expect(res.statusCode).to.equal(200);
          expect(body).to.equal("{\"version\":3,\"sources\":[\"test/assets/js/unminified.js\",\"test/assets/js/depends-on-unminified.js\"],\"names\":[\"aVeryLongVariableName\",\"someFunctions\",\"aLongKeyName\",\"someFunction\"],\"mappings\":\"CAAA,WACA,GAAAA,GAAA,WAEAC,GACAC,aAAA,WACA,MAAAF,IAGAC,GAAAC,iBCNA,IAAAC,cAAA\",\"file\":\"depends-on-unminified.js\",\"sourcesContent\":[\"(function () {\\n  var aVeryLongVariableName = \\\"A string\\\";\\n\\n  var someFunctions = {\\n    aLongKeyName: function () {\\n      return aVeryLongVariableName;\\n    }\\n  };\\n  var x = someFunctions.aLongKeyName();\\n})();\",\"//(=) require unminified\\n\\nvar someFunction = function () {};\"],\"sourceRoot\":\"/\"}");
          done();
        });
      });
    });
  });
});
