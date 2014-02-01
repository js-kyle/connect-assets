var expect = require("expect.js");
var mocha = require("mocha");
var bin = require("../bin/connect-assets");

describe("connect-assets command-line interface options", function () {
  describe("include", function () {
    it("defaults to 'assets/js' and 'assets/css'", function () {
      var argv = process.argv;
      process.argv = "node connect-assets".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.include).to.eql([ "assets/js", "assets/css" ]);

      process.argv = argv;
    });

    it("responds to -i", function () {
      var argv = process.argv;
      process.argv = "node connect-assets -i dir".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.include).to.eql([ "assets/js", "assets/css", "dir" ]);

      process.argv = argv;
    });

    it("responds to --include", function () {
      var argv = process.argv;
      process.argv = "node connect-assets --include dir".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.include).to.eql([ "assets/js", "assets/css", "dir" ]);

      process.argv = argv;
    });

    it("can be added to by passing a space-separated list", function () {
      var argv = process.argv;
      process.argv = "node connect-assets --include dir1 dir2".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.include).to.eql([ "assets/js", "assets/css", "dir1", "dir2" ]);

      process.argv = argv;
    });

    it("can be added to by passing multiple arguments", function () {
      var argv = process.argv;
      process.argv = "node connect-assets --include dir1 --include dir2".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.include).to.eql([ "assets/js", "assets/css", "dir1", "dir2" ]);

      process.argv = argv;
    });
  });

  describe("compile", function () {
    it("defaults to all assets with extensions", function () {
      var argv = process.argv;
      process.argv = "node connect-assets".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.compile).to.eql(["*.*"]);

      process.argv = argv;
    });

    it("responds to -c", function () {
      var argv = process.argv;
      process.argv = "node connect-assets -c file".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.compile).to.eql([ "file" ]);

      process.argv = argv;
    });

    it("responds to --compile", function () {
      var argv = process.argv;
      process.argv = "node connect-assets --compile file".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.compile).to.eql([ "file" ]);

      process.argv = argv;
    });

    it("can be added to by passing a space-separated list", function () {
      var argv = process.argv;
      process.argv = "node connect-assets --compile file1 file2".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.compile).to.eql([ "file1", "file2" ]);

      process.argv = argv;
    });

    it("can be added to by passing multiple arguments", function () {
      var argv = process.argv;
      process.argv = "node connect-assets --compile file1 --compile file2".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.compile).to.eql([ "file1", "file2" ]);

      process.argv = argv;
    });
  });

  describe("output", function () {
    it("defaults to 'builtAssets'", function () {
      var argv = process.argv;
      process.argv = "node connect-assets".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.output).to.equal("builtAssets");

      process.argv = argv;
    });

    it("responds to -o", function () {
      var argv = process.argv;
      process.argv = "node connect-assets -o dir".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.output).to.equal("dir");

      process.argv = argv;
    });

    it("responds to --output", function () {
      var argv = process.argv;
      process.argv = "node connect-assets --output dir".split(" ");
      var cli = bin.initialize();
      var args = bin.prepare(cli);

      expect(args.output).to.equal("dir");

      process.argv = argv;
    });
  });
});
