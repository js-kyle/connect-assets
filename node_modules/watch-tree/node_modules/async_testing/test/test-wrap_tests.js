var async_testing = require('../lib/async_testing');

function wrapTestsWrapper(func) {
  return function(test) {
    test.ok(true, 'make sure we get here');
    func(test);
  }
}

exports['test wrapTests'] = function(test) {
  test.numAssertions = 1;
  test.finish();
}

async_testing.wrapTests(exports, wrapTestsWrapper);

var extra1 = {}
  , extra2 = {}
  ;

function setupWrapper(func) {
  return function(test) {
    func(test, extra1, extra2);
  }
}

exports['test setup'] = setupWrapper(function(test, one, two) {
  test.strictEqual(one, extra1);
  test.strictEqual(two, extra2);
  test.finish();
});

function errorWrapper(func) {
  return function(test) {
    throw new Error();
  }
}

// just to make sure errors still work the same way...
exports['test wrapper errors'] = errorWrapper(function(test) {
  test.finish();
});

// writing a teardown function is a bit more complicated because we have to
// account for the asynchronous nature of Node.  Basically, when a test
// finishes it calls `finish`, so we hijack that method, wait for it to be
// called, and then when it is, run our teardown code.  Finally, we have to
// call the original finish to make the sure the test is finished.
function teardownWrapper(func) {
  return function(test) {
    var finish = test.finish;

    test.finish = function() {
      // teardown code goes here
      test.ok(true, 'make sure we get here');

      // finish the test
      finish();
    }

    func(test);
  }
}

exports['test teardown'] = teardownWrapper(function(test) {
  test.numAssertions = 1;
  test.finish();
});

exports['test teardown async'] = teardownWrapper(function(test) {
  test.numAssertions = 1;

  setTimeout(function() {
      test.finish();
    }, 500);
});

if (module == require.main) {
  async_testing.run(__filename, process.ARGV);
}
