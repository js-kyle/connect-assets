
exports['test success'] = function(test) {
  setTimeout(function() {
      test.ok(true, 'This should be true');
      test.finish();
    }, 500);
};

exports['test fail'] = function(test) {
  setTimeout(function() {
      test.ok(false, 'This should be false');
      test.finish();
    }, 500);
};

exports['test success -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  setTimeout(function() {
      test.ok(true, 'This should be true');
      test.finish();
    }, 500);
};

// test that the num assertions error doesn't override an assertion error
exports['test fail -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  setTimeout(function() {
      test.ok(false, 'This should be false');
      test.finish();
    }, 500);
};

exports['test fail - not enough -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  setTimeout(function() {
      test.finish();
    }, 500);
};

exports['test fail - too many -- numAssertionsExpected'] = function(test) {
  test.numAssertions = 1;
  setTimeout(function() {
      test.ok(true, 'This should be true');
      test.ok(true, 'This should be true');
      test.finish();
    }, 500);
};

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
