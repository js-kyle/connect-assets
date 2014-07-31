var expect = require("expect.js");
var mocha = require("mocha");
var assets = require("..");

describe("parseOptions", function () {
  describe("paths", function () {
    it("defaults to assets/js and assets/css", function () {
      var opts = assets._parseOptions({});
      expect(opts.paths).to.eql(["assets/js", "assets/css"]);
    });

    it("can be overridden with a string", function () {
      var opts = assets._parseOptions({ paths: "assets" });
      expect(opts.paths).to.eql(["assets"]);
    });

    it("can be overridden with an array of paths", function () {
      var opts = assets._parseOptions({ paths: ["assets", "vendor/assets"] });
      expect(opts.paths).to.eql(["assets", "vendor/assets"]);
    });

    it("supports using legacy 'options.src'", function () {
      var opts = assets._parseOptions({ src: ["assets", "vendor/assets"] });
      expect(opts.paths).to.eql(["assets", "vendor/assets"]);
    });
  });

  describe("helperContext", function () {
    it("defaults to global", function () {
      var opts = assets._parseOptions({});
      expect(opts.helperContext).to.equal(global);
    });

    it("can be overridden", function () {
      var a = {};
      var opts = assets._parseOptions({ helperContext: a });
      expect(opts.helperContext).to.equal(a);
    });
  });

  describe("servePath", function () {
    it("defaults to 'assets'", function () {
      var opts = assets._parseOptions({});
      expect(opts.servePath).to.equal("assets");
    });

    it("can be overridden", function () {
      var opts = assets._parseOptions({ servePath: "connect" });
      expect(opts.servePath).to.equal("connect");
    });

    it("trims off leading slashes", function () {
      var opts = assets._parseOptions({ servePath: "/assets" });
      expect(opts.servePath).to.equal("assets");
    });

    it("trims off trailing slashes", function () {
      var opts = assets._parseOptions({ servePath: "assets/" });
      expect(opts.servePath).to.equal("assets");
    });

    it("plays nicely with URLs", function () {
      var opts = assets._parseOptions({ servePath: "http://cache.example.com" });
      expect(opts.servePath).to.equal("http://cache.example.com");
    });
  });

  describe("precompile", function () {
    it("defaults to all files with extensions", function () {
      var opts = assets._parseOptions({});
      expect(opts.precompile).to.eql(["*.*"]);
    });

    it("can be overridden with a string", function () {
      var opts = assets._parseOptions({ precompile: "application.js" });
      expect(opts.precompile).to.eql(["application.js"]);
    });

    it("can be overridden with an array", function () {
      var opts = assets._parseOptions({ precompile: ["application.js", "main.css"] });
      expect(opts.precompile).to.eql(["application.js", "main.css"]);
    });
  });

  describe("build", function () {
    it("defaults to false in development", function () {
      var env = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      var opts = assets._parseOptions({});
      expect(opts.build).to.equal(false);
      process.env.NODE_ENV = env;
    });

    it("defaults to true in production", function () {
      var env = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      var opts = assets._parseOptions({});
      expect(opts.build).to.equal(true);
      process.env.NODE_ENV = env;
    });

    it("can be overridden", function () {
      var env = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      var opts = assets._parseOptions({ build: true });
      expect(opts.build).to.equal(true);
      process.env.NODE_ENV = env;
    });
  });

  describe("buildDir", function () {
    it("defaults to false in development", function () {
      var env = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      var opts = assets._parseOptions({});
      expect(opts.buildDir).to.equal(false);
      process.env.NODE_ENV = env;
    });

    it("defaults to 'builtAssets' in production", function () {
      var env = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      var opts = assets._parseOptions({});
      expect(opts.buildDir).to.equal("builtAssets");
      process.env.NODE_ENV = env;
    });

    it("can be overridden", function () {
      var opts = assets._parseOptions({ buildDir: "connect" });
      expect(opts.buildDir).to.equal("connect");
    });

    it("trims off leading slashes", function () {
      var opts = assets._parseOptions({ buildDir: "/assets" });
      expect(opts.buildDir).to.equal("assets");
    });

    it("trims off trailing slashes", function () {
      var opts = assets._parseOptions({ buildDir: "assets/" });
      expect(opts.buildDir).to.equal("assets");
    });
  });

  describe("compile", function () {
    it("defaults to true", function () {
      var opts = assets._parseOptions({});
      expect(opts.compile).to.equal(true);
    });

    it("can be overridden", function () {
      var opts = assets._parseOptions({ compile: false });
      expect(opts.compile).to.equal(false);
    });
  });

  describe("compress", function () {
    it("defaults to false in development", function () {
      var env = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      var opts = assets._parseOptions({});
      expect(opts.compress).to.equal(false);
      process.env.NODE_ENV = env;
    });

    it("defaults to true in production", function () {
      var env = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      var opts = assets._parseOptions({});
      expect(opts.compress).to.equal(true);
      process.env.NODE_ENV = env;
    });

    it("can be overridden", function () {
      var env = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      var opts = assets._parseOptions({ compress: true });
      expect(opts.compress).to.equal(true);
      process.env.NODE_ENV = env;
    });
  });

  describe("gzip", function () {
    it("defaults to false", function () {
      var opts = assets._parseOptions({});
      expect(opts.gzip).to.equal(false);
    });

    it("can be overridden", function () {
      var opts = assets._parseOptions({ gzip: true });
      expect(opts.gzip).to.equal(true);
    });
  });
});
