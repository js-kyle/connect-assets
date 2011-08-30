exports['test catch sync error'] = function(test) {
  var e = new Error();

  test.uncaughtExceptionHandler = function(err) {
    test.equal(e, err);
    test.finish();
  }

  throw e;
};

exports['test catch async error'] = function(test) {
  var e = new Error();

  test.uncaughtExceptionHandler = function(err) {
    test.equal(err, e);
    test.finish();
  }

  setTimeout(function() {
      throw e;
    }, 500);
};

exports['test sync error fail'] = function(test) {
  var e = new Error();

  test.uncaughtExceptionHandler = function(err) {
    test.ok(false, 'this fails synchronously');
    test.finish();
  }

  throw e;
};

exports['test async error fail'] = function(test) {
  var e = new Error();

  test.uncaughtExceptionHandler = function(err) {
    test.ok(false, 'this fails asynchronously');
    test.finish();
  }

  setTimeout(function() {
      throw e;
    }, 500);
};

exports['test sync error async fail'] = function(test) {
  var e = new Error();

  test.uncaughtExceptionHandler = function(err) {
    test.ok(false, 'this errors synchronously');
    test.finish();
  }

  throw e;
};

exports['test async error async fail'] = function(test) {
  var e = new Error();

  test.uncaughtExceptionHandler = function(err) {
    test.ok(false, 'this errors asynchronously');
    test.finish();
  }

  setTimeout(function() {
      throw e;
    }, 500);
};

exports['test sync error error again'] = function(test) {
  var e = new Error('first error');

  test.uncaughtExceptionHandler = function(err) {
    throw new Error('second error');
  }

  throw e;
};

exports['test async error error again'] = function(test) {
  var e = new Error('first error');

  test.uncaughtExceptionHandler = function(err) {
    throw new Error('second error');
  }

  setTimeout(function() {
      throw e;
    }, 500);
};

exports['test sync error error again async'] = function(test) {
  var e = new Error('first error');

  test.uncaughtExceptionHandler = function(err) {
    process.nextTick(function() {
        throw new Error('second error');
      });
  }

  throw e;
};

exports['test async error error again async'] = function(test) {
  var e = new Error('first error');

  test.uncaughtExceptionHandler = function(err) {
    process.nextTick(function() {
        throw new Error('second error');
      });
  }

  setTimeout(function() {
      throw e;
    }, 500);
};

if (module == require.main) {
  require('../lib/async_testing').run(__filename, process.ARGV);
}
