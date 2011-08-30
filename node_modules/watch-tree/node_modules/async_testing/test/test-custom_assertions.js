var async_testing = require('../lib/async_testing')
  , assert = require('assert')
  ;

function isTwo(actual, message) {
  if (actual !== 2) {
    assert.fail(actual, 2, message, '==', isTwo);
  }
}
async_testing.registerAssertion('isTwo', isTwo);

exports['test custom assertion pass'] = function(test) {
  test.isTwo(2);
  test.finish();
}

exports['test custom assertion fail'] = function(test) {
  test.isTwo(1);
  test.finish();
}

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
