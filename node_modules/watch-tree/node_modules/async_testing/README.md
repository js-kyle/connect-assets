node-async-testing
==================

A simple test runner for testing asynchronous code

Goals of the project:

+ Tests should just be functions. Simple and intuitive.
+ You shouldn't have to learn new assertion functions.  Use the assertion module
  that comes with Node. If you are familiar with it you won't have any problems.
+ Test files should be executable by Node.  No preprocessors or eval.  If your
  test file is called "my_test_file.js" then "node my_test_file.js" should run
  the tests.
+ Node is asynchronous, so testing should be too.
+ Not another Behavior Driven Development testing framework. I don't
  like specifications and what not. They only add verbosity.
+ Make no assumptions about the code being tested.  You should be able to test
  any code, and all aspects of it.
+ Be able to run tests in parallel or serially.  Running tests in parallel is
  much quicker, but makes it harder to deal with errors.

Feedback/suggestions encouraged!

Example
-------

**examples/test-suite.js**:

    exports['asynchronous test'] = function(test) {
      setTimeout(function() {
        test.ok(true);
        test.finish();
      },500);
    };

    exports['synchronous test'] = function(test) {
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
      require('async_testing').run(__filename, process.ARGV);
    }

The above file can be run on the command line with:

    node examples/test-suite.js

Installing
----------

**node-async-testing** can be installed using npm

    npm install async_testing

Detailed Overview
-----------------

The hard part of writing a test suite for asynchronous code is that when a test
fails, you don't know which test it was that failed. Errors won't get caught by
`try`/`catch` statements.

**node-async-testing** addresses that by

1.  Giving each test its own unique assert object. This way you know which
    assertions correspond to which tests.
2.  Running (by default) the tests one at a time.  This way it is possible to
    add a global exceptionHandler to the process and catch the errors whenever
    they happen.
3.  Requiring you to tell the test runner when the test is finished.  This way
    you don't have any doubt as to whether or not an asynchronous test still
    has code to run.
4.  Allowing you to declare how many assertions should take place in a test.
    This way you can ensure that your callbacks aren't being called too many
    or too few times.

**node-async-testing** tests are just a functions:

    function asynchronousTest(test) {
      setTimeout(function() {
        // make an assertion (these are just regular Node assertions)
        test.ok(true);
        // finish the test
        test.finish();
      });
    }

As you can see, these test functions receive a `test` object, which is where all
the action takes place. You make your assertions using this object (`test.ok()`,
`test.deepEquals()`, etc) and use it to finish the test (`test.finish()`).
Basically, all the actions that are directly related to a test use this object.

**node-async-testing** makes no assumptions about tests, so even if your test is
not asynchronous you still have to finish it:

    function synchronousTest(test) {
      test.ok(true);
      test.finish();
    };

**node-async-testing** is written for running suites of tests, not individual
tests. A test suite is just an object with test functions:

    var suite = {
      asynchronousTest: function(test) {
        setTimeout(function() {
          test.ok(true);
          test.finish();
        });
      },
      synchronousTest: function(test) {
        test.ok(true);
        test.finish();
      }
    }

**node-async-testing** lets you be explicit about the number of assertions run
in a given test: set `numAssertions` on the test object. This can be
very helpful in asynchronous tests where you want to be sure all callbacks
get fired:

    suite['test assertions expected'] = function(test) {
      test.numAssertions = 1;

      test.ok(true);
      test.finish();
    }

**node-async-testing** lets you deal with uncaught errors.  If you expect an
error to be thrown asynchronously in your code somewhere (this is not good
practice, but sometimes when using other people's code you have no choice.  Or
maybe _it is_ what you want to happen, who am I to judge?), you can set an
`uncaughtExceptionHandler` on the test object:

    suite['test catch async error'] = function(test) {
      var e = new Error();

      test.uncaughtExceptionHandler = function(err) {
        test.equal(e, err);
        test.finish();
      }

      setTimeout(function() {
          throw e;
        }, 500);
    };

**node-async-testing** doesn't have an explicit way for writing setup or
teardown functions, but because all tests are just functions, doing setup or
teardown is as simple as writing a wrapper function which takes a test and
returns a new test:

    function setup(testFunc) {
      return function newTestFunc(test) {
        // run set up code here...
        var extra1 = 1
        var extra2 = 2;

        // pass the variables we just created to the original test function
        testFunc(test, extra1, extra2);
      }
    }

    suite['wrapped test'] = setup(function(test, one, two) {
      test.equal(1, one);
      test.equal(2, two);
      test.finish();
    });

**node-async-testing** comes with a convenience function for wrapping all tests
in a suite with a setup/teardown function:

    require('async_testing').wrapTests(suite, setup);

See `test/test-wrap_tests.js` for more detailed examples of wrapping in action.
Or for that matter, check out any of the files in the `test` directory to see
all that **node-async-testing** has to offer.

Running Test Suites
-------------------

**node-async-testing** assumes you are going to have a one to one mapping
between suites and files.  So, to run a test suite, you actually tell it to run
the file:

    require('async_testing').run('test-suite.js');

The `run` method can take a file name or a directory name (it
recursively searches directories for javascript files that start with `test-`)
or an array of any combination of those two options.

In order for **node-async-testing** to be able to run a file, the exports
object of the module needs to be the test suite:

    // create suite:
    exports['first test'] = function(test) { ... };
    exports['second test'] = function(test) { ... };
    exports['third test'] = function(test) { ... };

We want to be able to run suites via the `node` command. Here's
how to make a script executable by Node.  Some where in the file put
this code:

    // if this module is the script being run, then run the tests:
    if (module === require.main) {
      require('async_testing').run(__filename);
    }

That suite can now be run by executing the following on the command line (if it
were in a file called `test-suite.js`):

    node test-suite.js

Additionally, the `run` method can be passed the `process.ARGV` array of command
line arguments, so **node-async-testing** settings can be altered at run time:

    exports['first test'] = function(test) { ... };
    exports['second test'] = function(test) { ... };
    exports['third test'] = function(test) { ... };

    if (module === require.main) {
      require('async_testing').run(__filename, process.ARGV);
    }

Now, you could tell **node-async-testing** to run the tests in parallel:

    node test-suite.js --parallel

Or to only run some specific tests:

    node test-suite.js --test-name "first test" --test-name "third test"

Use the `help` flag to see all the options:

    node test-suite.js --help

**node-async-testing** also comes with a command line script that will run all
test files in a specified directory. To use the script, make sure
**node-async-testing** has been installed properly and then run:

    node-async-test tests-directory

Or you could give it a specific file to run:

    node-async-test tests-directory/test-suite.js

It takes the same arguments as can be used on an individual file above.
Check out `node-async-test --help` for the complete list of options.

The advantage of using the `node-async-test` command is that its exit status
will output the number of failed tests.  This way you can write shell scripts
that do different things depending on whether or not the suite was successful.

If you want to organize your tests in a different manner and not have them
organized by file you are going to have to write your own test runner. See 
`runSuite()` in `lib/async_testing.js` for more details.

Web Test Runner
---------------

**node-async-testing** comes with a "web" test runner.  This runner launches a
web server which can be used to run suites manually.  Launch it with the
`--web` flag:

    node test/test-suite.js --web

Or
 
    node-async-test --web tests-directory

Once the server is started, from a browser you can pick and choose which suites
to run, and run them as many times as you like.  **node-async-testing** reloads
the suites (and any code they use) from scratch each time they are run so you
can leave the web server running and switch back and forth between editing tests
or code and running the tests. Very handy!

To use the web runner you also need to install [Socket.IO][socket] and
[node-webworker][webwork]:

    npm install socket.io webworker

\[The server is known to work in the lastest versions of Safari, Chrome and
Firefox.  Any help in getting it to work in Opera would be much appreciated. I
don't have means of testing in IE.\]

Custom Assertion Functions
--------------------------
It is possible to write your own assertion functions that are fully supported
by **node-async-testing**.  You can't just use any assert function at any time
because **node-async-testing** needs to know which assertions go with which
tests. As such each test is given its own unique wrapped assertion methods.  To
add your own assertion function use the `registerAssertion()` method.

    var async_testing = require('async_testing');
    async_testing.registerAssertion('assertionName', function() { ... });

    exports['test assert'] = function(test) {
      test.assertionName();
      test.finish();
    }

See `test/test-custom_assertions.js` for a working example.

Custom Reporting
----------------

It is possible to write your own test runners.  See `node-async-test`,
`lib/console-runner.js` or `lib/web-runner.js` for examples, or `API.markdown`
for a description of the different events and what arguments they receive.

This feature is directly inspired by Caolan McMahon's [nodeunit].  Which is an
awesome library.

[nodeunit]: http://github.com/caolan/nodeunit
[socket]: http://github.com/LearnBoost/Socket.IO-node
[webwork]: http://github.com/pgriess/node-webworker
