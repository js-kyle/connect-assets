var expect = require("expect.js");
var mocha = require("mocha");
var http = require("http");
var fs = require("fs");
var createServer = require("./testHelpers/createServer");

describe("serveAsset manifest", function () {
  it("outputs a manifest if it does not exist");
  it("uses an existing manifest if it exists");
  it("serves files outside of the manifest if compile is true");
  it("does not serve files outside of the manifest if compile is false");
});
