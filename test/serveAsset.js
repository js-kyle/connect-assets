var expect = require("expect.js");
var mocha = require("mocha");
var assets = require("..");

describe("serveAsset", function () {
  it("serves files at the path returned from helper functions");
  it("allows the served path to be changed");
  it("serves new files as they exist on disk in development");
  it("serves file changes as they are made in development");
  it("does not serve file changes in production");

  it("does not serve assets for URLs outside of serve path");

  it("does not serve asset if fingerprint doesn't match");
  it("does not serve asset if fingerprint isn't supplied");
});
