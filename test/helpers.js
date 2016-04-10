var expect = require("expect.js");
var mocha = require("mocha");
var assets = require("..");
var rmrf = require("./testHelpers/rmrf");

describe("helper functions", function () {
  it("do not pollute global scope if helperContext is passed", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx });

    expect(ctx.css).to.be.a("function");
    expect(ctx.cssInline).to.be.a("function");
    expect(ctx.js).to.be.a("function");
    expect(ctx.jsInline).to.be.a("function");
    expect(ctx.assetPath).to.be.a("function");

    expect(global.css).to.equal(undefined);
    expect(global.cssInline).to.equal(undefined);
    expect(global.js).to.equal(undefined);
    expect(global.jsInline).to.equal(undefined);
    expect(global.assetPath).to.equal(undefined);
  });

  it("throw an Error if asset is not found", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx });

    expect(function () {
      ctx.assetPath("non-existant-asset.js");
    }).to.throwError(/'non-existant-asset.js' not found/i);
  });

  it("returns many paths if options.bundle is false", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx, paths: "test/assets/css", bundle: false });
    var files = ctx.assetPath("depends-on-blank.css");

    expect(files).to.equal(
      '/assets/blank.css\n' +
      '/assets/depends-on-blank.css'
    );
  });

  it("returns a single path if options.bundle is true", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx, paths: "test/assets/css", bundle: true });
    var files = ctx.assetPath("depends-on-blank.css");

    expect(files).to.equal('/assets/depends-on-blank.css');
  });

  it("returns a path without fingerprints if option is set to false", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx, paths: "test/assets/css", fingerprinting: false });
    var files = ctx.assetPath("blank.css");

    expect(files).to.equal("/assets/blank.css");
  });

  it("returns a path with fingerprints if option is set to true", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx, paths: "test/assets/css", fingerprinting: true });
    var files = ctx.assetPath("blank.css");

    expect(files).to.equal("/assets/blank-e89e45b0019f8d3feb5341de6b815cdb.css");
  });

  describe("css", function () {
    it("returns a <link> tag for each asset found (separated by \\n)", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var link = ctx.css("depends-on-blank.css");

      expect(link).to.equal(
        '<link rel="stylesheet" href="/assets/blank.css" />\n' +
        '<link rel="stylesheet" href="/assets/depends-on-blank.css" />'
      );
    });

    it("should serve correct asset even if extention is not supplied", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var link = ctx.css("asset");
      expect(link).to.equal(
        '<link rel="stylesheet" href="/assets/asset.css" />'
      );
    });

    it("should have additional attributes in result tag", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var link = ctx.css("asset", { 'data-turbolinks-track': true });
      expect(link).to.equal(
        '<link rel="stylesheet" href="/assets/asset.css" data-turbolinks-track />'
      );
    });
  });

  describe("cssInline", function () {
    it("returns a <style> tag for each asset found (separated by \\n)", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var tag = ctx.cssInline("depends-on-blank.css");
      expect(tag).to.equal(
        "<style>\n</style>\n" +
        "<style>/*(=) require blank */\n\n</style>"
      );
    });

    it("should serve correct asset even if extention is not supplied", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var tag = ctx.cssInline("unminified");
      expect(tag).to.equal("<style>body\n{\n  background-color: #000000;\n  color: #ffffff;\n}\n\na\n{\n  display: none;\n}\n\n</style>");
    });

    it("should have additional attributes in result tag", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var tag = ctx.cssInline("asset.css", { 'data-turbolinks-track': true });
      expect(tag).to.equal("<style data-turbolinks-track>\n</style>");
    });

    it("returns a single <style> tag containing the bundled asset when bundle=true", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css", bundle: true });
      var tag = ctx.cssInline("depends-on-blank.css");
      expect(tag).to.equal("<style>\n/*(=) require blank */\n\n</style>");
    });

    it("should serve asset from manifest", function (done) {
      var dir = "testBuiltAssets";
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css", build: true, buildDir: dir, compile: true });
      var tag = ctx.cssInline("unminified");

      expect(tag).to.equal("<style>body\n{\n  background-color: #000000;\n  color: #ffffff;\n}\n\na\n{\n  display: none;\n}\n\n</style>");
      rmrf(dir, done);
    });
  });

  describe("js", function () {
    it("returns a <script> tag for each asset found (separated by \\n)", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var script = ctx.js("depends-on-blank.js");

      expect(script).to.equal(
        '<script src="/assets/blank.js"></script>\n' +
        '<script src="/assets/depends-on-blank.js"></script>'
      );
    });

    it("should serve correct asset even if extention is not supplied", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var script = ctx.js("asset.js");

      expect(script).to.equal(
        '<script src="/assets/asset.js"></script>'
      );
    });

    it("should have additional attributes in result tag", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var script = ctx.js("asset.js", { async: true });

      expect(script).to.equal(
        '<script src="/assets/asset.js" async></script>'
      );
    });
  });

  describe("jsInline", function () {
    it("returns a <script> tag for each asset found (separated by \\n)", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var script = ctx.jsInline("depends-on-blank.js");

      expect(script).to.equal(
        "<script>\n;\n</script>\n" +
        "<script>//(=) require blank\n;\n</script>"
      );
    });

    it("should serve correct asset even if extention is not supplied", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var script = ctx.jsInline("asset.js");

      expect(script).to.equal("<script>\n;\n</script>");
    });

    it("should have additional attributes in result tag", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var script = ctx.jsInline("asset.js", { async: true });

      expect(script).to.equal("<script async>\n;\n</script>");
    });

    it("returns a single <script> tag containing the bundled asset when bundle=true", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js", bundle: true });
      var tag = ctx.jsInline("depends-on-blank.js");
      expect(tag).to.equal("<script>\n;\n//(=) require blank\n;\n</script>");
    });
    
    it("should serve asset from manifest", function (done) {
      var dir = "testBuiltAssets";
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js", build: true, buildDir: dir, compile: true });
      var tag = ctx.jsInline("depends-on-blank.js");

      expect(tag).to.equal("<script>\n;\n//(=) require blank\n;\n</script>");
      rmrf(dir, done);
    });
  });

  describe("assetPath", function () {
    it("returns a file path for each asset found (separated by \\n)", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var path = ctx.assetPath("depends-on-blank.js");

      expect(path).to.equal(
        '/assets/blank.js\n' +
        '/assets/depends-on-blank.js'
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
