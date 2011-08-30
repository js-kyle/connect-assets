// a file for holding different built-in test runners.  It only has one right
// now.

var sys = require('sys')
  , path = require('path')
  ;

var testing = require('./async_testing');

/* The defualt test runner
 *
 * list: an array of filename or commonjs modules to be run, or a commonjs module
 * options: options for running the suites
 * args: command line arguments to override/augment the options
 * callback: a function to be called then the suites are finished
 */
exports.run = function(list, options, callback) {

  var red   = function(str){return "\033[31m" + str + "\033[39m"}
    , yellow   = function(str){return "\033[33m" + str + "\033[39m"}
    , green = function(str){return "\033[32m" + str + "\033[39m"}
    , bold  = function(str){return "\033[1m" + str + "\033[22m"}
    ;

  // clean up and parse options
  if ('0' in options) {
    options.verbosity = 0;
    delete options['0'];
  }
  if ('1' in options) {
    options.verbosity = 1;
    delete options['1'];
  }
  if ('2' in options) {
    options.verbosity = 2;
    delete options['2'];
  }
  if ('log-level' in options) {
    options.verbosity = options['log-level'][0];
    delete options['log-level'];
  }
  if (typeof options.verbosity == 'undefined') {
    options.verbosity = 1;
  }
  if (typeof options.parallel == 'undefined') {
    options.parallel = false;
  }
  if (options['no-color']) {
    red = green = yellow = function(str) { return str; };
    delete options['no-color'];
  }
  if (options.all) {
    options.printSuccesses = true;
    delete options.all;
  }

  // some state
  var currentSuite = null
    , printedCurrentSuite = null
    , numSuites = null
    ;

  opts =
    { parallel: options.parallel
    , testName: options.testName
    , suiteName: options.suiteName
    , onStart: function(num) {
        numSuites = num;
      }
    , onSuiteStart: function(name) {
        currentSuite = name;
        printedCurrentSuite = false;
      }
    , onSuiteDone: function(suiteResults) {
        var tests = suiteResults.tests;

        if (tests.length == 0) {
          return;
        }

        if(options.verbosity > 0) {
          if (numSuites > 1 || suiteResults.numErrors > 0 || suiteResults.numFailures > 0) {
            if (!printedCurrentSuite) {
              sys.puts(bold(currentSuite));
            }
          }

          if (options.printSuccesses || suiteResults.numErrors > 0 || suiteResults.numFailures > 0) {
            sys.puts('');
          }

          var totalAssertions = 0;

          for(var i = 0; i < tests.length; i++) {
            var r = tests[i];
            if (r.status == 'success') {
              totalAssertions += r.numAssertions;
            }
            else if (r.status == 'failure') {
              sys.puts('  Failure: '+red(r.name));
              var s = r.failure.stack.split("\n");
              sys.puts('    '+ s[0].substr(16));
              if (options.verbosity == 1) {
                if (s.length > 1) {
                  sys.puts(s[1].replace(process.cwd(), '.'));
                }
                if (s.length > 2) {
                  sys.puts(s[2].replace(process.cwd(), '.'));
                }
              }
              else {
                for(var k = 1; k < s.length; k++) {
                  sys.puts(s[k].replace(process.cwd(), '.'));
                }
              }
            }
            else if (r.status == 'error') {
              sys.puts('  Error: '+yellow(r.name));

              if (r.error.message) {
                sys.puts('    '+r.error.message);
              }
              var s = r.error.stack.split("\n");
              if (options.verbosity == 1) {
                if (s.length > 1) {
                  sys.puts(s[1].replace(process.cwd(), '.'));
                }
                if (s.length > 2) {
                  sys.puts(s[2].replace(process.cwd(), '.'));
                }
              }
              else {
                for(var k = 1; k < s.length; k++) {
                  sys.puts(s[k].replace(process.cwd(), '.'));
                }
              }
            }
            else if (r.status == 'multiError') {
              sys.print('  Non-specific errors: ');
              for(var j = 0; j < r.name.length; j++) {
                if (j > 0) {
                  sys.print(', ');
                }
                sys.print(yellow(r.name[j]));
              }
              sys.puts('');
              for(var j = 0; j < r.errors.length; j++) {
                var s = r.errors[j].stack.split("\n");
                sys.puts('  + '+s[0]);
                if (options.verbosity == 1) {
                  if (s.length > 1) {
                    sys.puts(s[1].replace(process.cwd(), '.'));
                  }
                  if (s.length > 2) {
                    sys.puts(s[2].replace(process.cwd(), '.'));
                  }
                }
                else {
                  for(var k = 1; k < s.length; k++) {
                    sys.puts(s[k]);
                  }
                }
              }
            }
          }

          var total = suiteResults.numFailures+suiteResults.numErrors+suiteResults.numSuccesses;

          if (suiteResults.numFailures + suiteResults.numErrors > 0) {
            sys.puts('');
            sys.print(' ');
            if (suiteResults.numFailures > 0) {
              sys.print(' FAILURES: '+suiteResults.numFailures+'/'+total+' tests failed.');
            }
            if (suiteResults.numFailures > 0 && suiteResults.numErrors > 0) {
              sys.puts('');
              sys.print(' ');
            }
            if (suiteResults.numErrors > 0) {
              sys.print(' ERRORS: '+suiteResults.numErrors+'/'+total+' tests errored.');
            }
          }
          else {
            if (options.verbosity > 0 && numSuites > 1) {
              sys.print('  '+green('OK: ')+total+' test'+(total == 1 ? '' : 's')+'. '+totalAssertions+' assertion'+(totalAssertions == 1 ? '' : 's')+'.');
            }
          }

          if (suiteResults.numFailures > 0 && suiteResults.numErrors > 0) {
            sys.puts('');
            sys.print(' ');
          }
        }

        if (options.verbosity == 0) {
          if (options.printSuccesses || suiteResults.numErrors > 0 || suiteResults.numFailures >0) {
            sys.puts('');
          }
        }
        else if(suiteResults.numFailures > 0 || suiteResults.numErrors > 0 || numSuites > 1) {
          sys.puts(' '+(suiteResults.duration/1000)+' seconds.');
          sys.puts('');
        }
      }
    , onTestDone: function(result) {
        if (!printedCurrentSuite) {
          if (options.printSuccesses || result.status != 'success') {
            if (currentSuite) {
              sys.puts(bold(currentSuite));
            }
            printedCurrentSuite = true;
          }
        }

        if (result.status == 'success') {
          if (options.printSuccesses) {
            sys.puts('  ✔ ' + result.name);
          }
        }
        else if (result.status == 'failure') {
          sys.puts(red('  ✖ ' + result.name));
        }
        else if (result.status == 'error') {
          sys.puts(yellow('  ✖ ' + result.name))
        }
        else if (result.status == 'multiError') {
          for(var i = 0; i < result.name.length; i++) {
            sys.puts(yellow('  ✖ ' + result.name[i]));
          }
        }
      }
    , onDone: function(allResults, duration) {
        var successes = 0;
        var total = 0;
        var tests = 0;

        for(var i = 0; i < allResults.length; i++) {
          if (allResults[i].tests.length > 0) {
            total++;

            if (allResults[i].numErrors == 0 && allResults[i].numFailures == 0) {
              successes++;
            }

            tests += allResults[i].numErrors;
            tests += allResults[i].numFailures;
            tests += allResults[i].numSuccesses;
          }
        }

        if (successes != total) {
          sys.print(bold(red('PROBLEMS: ')+(total-successes)+'/'+total+' suites had problems.'));
        }
        else {
          sys.print(bold(green('SUCCESS:')));
          if (total > 1) {
            sys.print(bold(' '+total+'/'+total+' suites passed successfully.'));
          }
        }
        sys.puts(bold(' ' + tests+(tests == 1 ? ' test' : ' total tests')+'. '+(duration/1000)+' seconds.'));

        if (callback) {
          callback(allResults, duration);
        }
      }
    , onPrematureExit: function(tests) {
        sys.puts('');
        sys.puts('Process exited.  The following test'+(tests.length == 1 ? '' : 's')+' never finished:');

        sys.puts('');
        for(var i = 0; i < tests.length; i++) {
          sys.puts('  + '+tests[i]);
        }
        sys.puts('');

        sys.puts('Did you forget to call test.finish()?');
      }
    }

  testing.runFiles(list, opts);
}

exports.flags = 
  [ { longFlag: 'log-level'
    , shortFlag: 'l'
    , description: '0 => succinct, 1 => default, 2 => full stack traces'
    , varName: 'level'
    }
  , { longFlag: null
    , shortFlag: '0'
    , description: 'set log level to 0'
    }
  , { longFlag: null
    , shortFlag: '1'
    , description: 'set log level to 1'
    }
  , { longFlag: null
    , shortFlag: '2'
    , description: 'set log level to 2'
    }
  , { longFlag: 'all'
    , shortFlag: 'a'
    , description: 'don\'t supress information about passing tests'
    }
  , { longFlag: 'no-color'
    , shortFlag: 'b'
    , description: 'don\'t use colored output'
    }
  ];
