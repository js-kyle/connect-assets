
exports['test async error 1'] = function(test) {
  process.nextTick(function() {
      throw new Error();
    });
};

exports['test sync error'] = function(test) {
  throw new Error('Oooops');
};

exports['test async error 2'] = function(test) {
  setTimeout(function() {
      throw new Error();
    }, 500);
};

exports['test async error 3'] = function(test) {
  setTimeout(function() {
      throw new Error();
    }, 500);
};

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
