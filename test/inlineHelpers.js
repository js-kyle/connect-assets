var expect = require("expect.js");
var mocha = require("mocha");
var assets = require("..");

describe("inline-helper functions", function () {
  it("do not pollute global scope if helperContext is passed", function () {
    var ctx = {};
    var instance = assets({ helperContext: ctx });

    expect(ctx.css_inline).to.be.a("function");
    expect(ctx.js_inline).to.be.a("function");

    expect(global.css_inline).to.equal(undefined);
    expect(global.js_inline).to.equal(undefined);
  });

  describe("css", function () {
    it("throw an Error if asset is not found", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx });

      expect(function () {
        ctx.js_inline("non-existant-asset.js");
      }).to.throwError(/'non-existant-asset.js' not found/i);
    });

    it("returns a <style> tag", function () {
      var ctx      = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var tag      = ctx.css_inline("unminified.css");

      expect(tag).to.match(/<style>([\s\S]+?)<\/style>/m);
    });

    it("should serve correct asset even if extention is not supplied", function () {
      var ctx      = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var tag      = ctx.css_inline("unminified");

      expect(tag).to.match(/<style>([\s\S]+?)<\/style>/m);
    });

    it("should have additional attributes in result tag", function () {
      var ctx      = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/css" });
      var tag      = ctx.css_inline("asset.css", { 'data-turbolinks-track': true });

      expect(tag).to.match(/data-turbolinks-track>/);
    });
  });

  describe("js", function () {
    it("throw an Error if asset is not found", function () {
      var ctx = {};
      var instance = assets({ helperContext: ctx });

      expect(function () {
        ctx.js_inline("non-existant-asset.js");
      }).to.throwError(/'non-existant-asset.js' not found/i);
    });

    it("returns a <style> tag", function () {
      var ctx      = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var tag      = ctx.js_inline("simple.js");

      expect(tag).to.match(/<script>var a = true;<\/script>/m);
    });

    it("should serve correct asset even if extention is not supplied", function () {
      var ctx      = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var tag      = ctx.js_inline("simple");

      expect(tag).to.match(/<script>var a = true;<\/script>/m);
    });

    it("should have additional attributes in result tag", function () {
      var ctx      = {};
      var instance = assets({ helperContext: ctx, paths: "test/assets/js" });
      var tag      = ctx.js_inline("unminified.js", { 'data-turbolinks-track': true });

      expect(tag).to.match(/data-turbolinks-track>/);
    });
  });

});
