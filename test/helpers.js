var expect = require("expect.js");
var mocha = require("mocha");
var assets = require("..");

describe("helper functions", function () {
  it("do not pollute global scope if helperContext is passed", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx });

    expect(ctx.css).to.be.a("function");
    expect(ctx.js).to.be.a("function");
    expect(ctx.assetPath).to.be.a("function");

    expect(global.css).to.equal(undefined);
    expect(global.js).to.equal(undefined);
    expect(global.assetPath).to.equal(undefined);
  });

  it("throw an Error if asset is not found", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx });

    expect(function () {
      ctx.assetPath("non-existant-asset.js");
    }).to.throwError(/'non-existant-asset.js' not found/i);
  });

  it("returns many paths if options.build is false", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx, paths: "test/assets/css", build: false });
    var files = ctx.assetPath("depends-on-blank.css");

    expect(files).to.equal(
      '/assets/blank-43cb29c66d0fd6194738cc0fb51afb22.css\n' +
      '/assets/depends-on-blank-7b2fab4234c3593202fcb2ac07505f4a.css'
    );
  });

  it("returns a single path if options.build is true", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx, paths: "test/assets/css", build: true });
    var files = ctx.assetPath("depends-on-blank.css");

    expect(files).to.equal('/assets/depends-on-blank-20c863f1d9051886da2f5fdc3babb547.css');
  });

  describe("css", function () {
    it("returns a <link> tag for each asset found (separated by \\n)", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var link = ctx.css("depends-on-blank.css");

      expect(link).to.equal(
        '<link rel="stylesheet" href="/assets/blank-43cb29c66d0fd6194738cc0fb51afb22.css" />\n' +
        '<link rel="stylesheet" href="/assets/depends-on-blank-7b2fab4234c3593202fcb2ac07505f4a.css" />'
      );
    });

    it("should serve correct asset even if extention is not supplied", function() {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var link = ctx.css("asset");
      expect(link).to.equal(
        '<link rel="stylesheet" href="/assets/asset-43cb29c66d0fd6194738cc0fb51afb22.css" />'
      );
    });

    it("should have additional attributes in result tag", function() {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var link = ctx.css("asset", { 'data-turbolinks-track': true });
      expect(link).to.equal(
        '<link rel="stylesheet" href="/assets/asset-43cb29c66d0fd6194738cc0fb51afb22.css" data-turbolinks-track />'
      );
    });

  });

  describe("js", function () {
    it("returns a <script> tag for each asset found (separated by \\n)", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var script = ctx.js("depends-on-blank.js");

      expect(script).to.equal(
        '<script src="/assets/blank-db98a791c6de155314e4e3a00312cebc.js"></script>\n' +
        '<script src="/assets/depends-on-blank-2a7da717210edef513b9a2b7dc001f25.js"></script>'
      );
    });

    it("should serve correct asset even if extention is not supplied", function() {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var script = ctx.js("asset.js");

      expect(script).to.equal(
        '<script src="/assets/asset-db98a791c6de155314e4e3a00312cebc.js"></script>'
      );
    });

    it("should have additional attributes in result tag", function() {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var script = ctx.js("asset.js", { async: true });

      expect(script).to.equal(
        '<script src="/assets/asset-db98a791c6de155314e4e3a00312cebc.js" async></script>'
      );
    });
  });

  describe("assetPath", function () {
    it("returns a file path for each asset found (separated by \\n)", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var path = ctx.assetPath("depends-on-blank.js");

      expect(path).to.equal(
        '/assets/blank-db98a791c6de155314e4e3a00312cebc.js\n' +
        '/assets/depends-on-blank-2a7da717210edef513b9a2b7dc001f25.js'
      );
    });

    it("is accessible from javascript assets");
    it("is accessible from coffeescript assets");
    it("is accessible from stylus assets");
    it("is accessible from less assets");
    it("is accessible from sass assets");
    it("is accessible from haml coffeescript assets");
    it("is accessible from ejs assets");
  });

  describe("asset", function () {
    it("returns the contents of the asset");
    it("is accessible from javascript assets");
    it("is accessible from coffeescript assets");
    it("is accessible from stylus assets");
    it("is accessible from less assets");
    it("is accessible from sass assets");
    it("is accessible from haml coffeescript assets");
    it("is accessible from ejs assets");
  });
});
