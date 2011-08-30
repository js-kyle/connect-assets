The events that are called by `testing.runSuites` and/or `testing.runSuite` make
it possible to write your own test runners and format the output however you'd
like.  See `runners.js` for example of how all these functions work.

Events
------
`onStart`: called when runSuites starts running suites.  This gets 1 argument:
the number of suites being ran.

`onDone`: called when runSuites finishes running the suites.  This gets 2
arguments: an array of suite results (see below), and the duration in seconds
that it took to run all the suites.

`onSuiteStart`: called when a suite is started.  This gets 1 optional argument:
the name of the suite.  A suite might not have name if a suite object is passed
to `runSuites` as opposed to a file name.

`onSuiteDone`: called when a suite finishes. This gets 1 argument: the suite
result object for the specific suite. See below.

`onTestStart`: called when a test is started. This gets 1 argument: the name of
the test.

Carefull! The test runner will think errors thrown in this function belong to
the test suite and you'll get inaccurate results.  Basically, make sure you
don't throw any errors in this listener.

`onTestDone`: Called when a test finishes. This gets 1 argument, the test
result object for the specific test.  See below.

Carefull! The test runner will think errors thrown in this function belong to
the test suite and you'll get inaccurate results.  Basically, make sure you
don't throw any errors in this listener.

`onPrematureExit`: called when the process exits and there are still tests that
haven't finished. This occurs when people forget to finish their tests or their
tests don't work like the expected.  This gets 1 argument: an array of the
names of the tests that haven't finished.

Suite Result
------------
A suite result is an object that looks like this:

    { name: suite name (if applicable)
    , results: an array of test results for each test ran (see below)
    , duration: how long the suite took
    , numErrors: number of errors
    , numFailures: number of failures
    , numSuccesses: number of successes
    }

Note: even if a suite has many tests, the array of tests results might not have
them all if a specific test was requested.  So a Suite Result could have the
results of 0 tests.

Test Result
-----------
A test result is an object that looks like one of the following:

success: the test completed successfully

    { duration: how long the test took
    , name: test name
    , status: 'success'
    , numAssertions: number of assertions
    }

failure: the test had an assertion error

    { duration: how long the test took
    , name: test name
    , status: 'failure'
    , failure: the assertion error
    }

error: the test had an uncaught error

    { duration: how long the test took
    , name: test name
    , status: 'error'
    , error: the error
    }

multiError: this result occurs when tests are ran in parallel and it isn't
possible to accurately figure out which errors went with which tests.

    { name: [testName1, testName2, testName3]
    , status: 'multiError'
    , errors: [err1, err2, err3]
    }
