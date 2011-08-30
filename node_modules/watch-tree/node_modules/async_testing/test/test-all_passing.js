
exports['test A'] = function(test) {
  test.ok(true);
  test.finish();
};

exports['test B'] = function(test) {
  test.ok(true);
  test.finish();
};

exports['test C'] = function(test) {
  test.ok(true);
  test.finish();
};

exports['test D'] = function(test) {
  test.ok(true);
  test.finish();
};

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
