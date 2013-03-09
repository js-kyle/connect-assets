var expect = require("expect.js");
var mocha = require("mocha");
var behaviors = module.exports = {};

behaviors.cache = function () {

  it("does not contain a file older than the requested file", function (done) {
    var filename = "css/test.css";
    var version = new Date().getTime();

    this.cache.add(filename, version, "body{display:none}", function (err) {
      if (err) throw err;

      this.cache.contains(filename, version + 10000, function (err, contains) {
        if (err) throw err;

        expect(contains).to.be(false);
        done();
      });
    }.bind(this));
  });

  it("contains a file newer than the requested file", function (done) {
    var filename = "css/test.css";
    var version = new Date().getTime();

    this.cache.add(filename, version, "body{display:none}", function (err) {
      if (err) throw err;

      this.cache.contains(filename, version - 10000, function (err, contains) {
        if (err) throw err;

        expect(contains).to.be(true);
        done();
      });
    }.bind(this));
  });

  it("does not contain a bogus file", function (done) {
    var filename = "css/test.css";
    var version = new Date().getTime();

    this.cache.contains(filename, version, function (err, contains) {
      if (err) throw err;

      expect(contains).to.be(false);
      done();
    });
  });

  it("returns appropriate file contents", function (done) {
    var filename = "css/test.css";
    var version = new Date().getTime();
    var expected = "body{display:none}";

    this.cache.add(filename, version, expected, function (err) {
      if (err) throw err;

      this.cache.get(filename, function (err, contents) {
        if (err) throw err;
        expect(contents).to.be(expected);
        done();
      });
    }.bind(this));
  });

};