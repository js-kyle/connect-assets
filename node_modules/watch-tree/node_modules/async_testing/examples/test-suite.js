
// create suite:
exports['asynchronousTest'] = function(test) {
  setTimeout(function() {
    // make an assertion (these are just regular assertions)
    test.ok(true);
    // finish the test
    test.finish();
  },500);
};

exports['synchronousTest'] = function(test) {
  test.ok(true);
  test.finish();
};

exports['test assertions expected'] = function(test) {
  test.numAssertions = 1;

  test.ok(true);
  test.finish();
}

exports['test catch async error'] = function(test) {
  var e = new Error();

  test.uncaughtExceptionHandler = function(err) {
    test.equal(e, err);
    test.finish();
  }

  setTimeout(function() {
      throw e;
    }, 500);
};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
