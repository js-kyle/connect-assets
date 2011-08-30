io.setPath('/client/');

(function() {
  var container, suitesList, files, suites, curSuite;

  var socket = new io.Socket(null, {transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']});
  socket.connect();

  socket.on('connect', function() {
    // create doc
    container = document.createElement('DIV');
    container.id = 'container';

    var suitesHeader = document.createElement('H2');
    suitesHeader.innerHTML = 'Suites';
    suitesList = document.createElement('UL');
    suitesList.id = 'suites-list';

    var runAllSpan = document.createElement('SPAN');
    runAllSpan.className = 'run-all-button';
    runAllSpan.innerHTML = 'Run All';
    runAllSpan.onclick = function(e) {
      suites.forEach(enqueueSuite);
    }
    suitesHeader.appendChild(runAllSpan);

    container.appendChild(suitesHeader);
    container.appendChild(suitesList);

    document.body.appendChild(container);
  });

  socket.on('message', function(msg) {
    obj = JSON.parse(msg);

    if (obj.cmd in handlers) {
      handlers[obj.cmd](obj);
    }
    else {
      console.log(obj);
    }
  });

  var handlers =
    { queued: function(obj) {
        suite = suites[obj.index];
        suite.parallel = obj.parallel;
        suiteQueued(suite);
      }
    , suitesList: function(obj) {
        suites = suites || [];
        obj.suites.forEach(function(s) {
          if (s.index+1 > suites.length) {
            suites.push(s);
            suitesList.appendChild(buildSuiteElement(s));
          }
          else {
            clearSuiteResults(suites[s.index]);
            suites[s.index] = s;
            var old = suitesList.childNodes[s.index];
            suitesList.insertBefore(buildSuiteElement(s), old);
            suitesList.removeChild(old);
            if (/(^|\s)open(\s|$)/.test(old.className)) {
              s.el.className += ' open';
            }
          }
        });
      }
    , suiteStart: function(obj) {
        curSuite = suites[obj.index];

        var el = curSuite.el;

        removeClass(el, 'queued');
        el.className += ' running';

        curSuite.runSpan.innerHTML = 'Running [';
        var cancelSpan = document.createElement('SPAN');
        cancelSpan.className = 'cancel';
        cancelSpan.innerHTML = 'x';
        cancelSpan.onclick = cancel;
        curSuite.runSpan.appendChild(cancelSpan);
        curSuite.runSpan.appendChild(document.createTextNode(']'));
      }
    , testStart: function(obj) {
        var test = curSuite.tests[obj.name];
        test.el.className += ' running';
      }
    , testDone: function(obj) {
        if (obj.result.errors) {
          // multi error
          var names = obj.result.name;
          for (var i = 0; i < names.length; i++) {
            var test = curSuite.tests[names[i]];
            var el = test.el;
            removeClass(el, 'running');
            el.className += ' error';

            var code = document.createElement('P');
            code.className = 'result';
            code.innerHTML = 'The specific error for this test could not be determined.  See the \'Non-specific Errors\' below.';
            el.insertBefore(code, el.lastChild);

            var summarySpan = document.createElement('SPAN');
            summarySpan.className = 'summary';
            summarySpan.innerHTML = 'Non-specific error';
            test.nameEl.appendChild(summarySpan);
          }

          var li = document.createElement('LI');
          li.className = 'non-specific-errors';

          var span = document.createElement('SPAN');
          span.className = 'name';
          span.innerHTML = 'Non-specific Errors';

          span.onclick = function(e) {
            toggleItem({el: li});
          }
          li.appendChild(span);

          var errors = obj.result.errors;
          code = document.createElement('CODE');
          code.className = 'result';
          for (var i = 0; i < errors.length; i++) {
            code.appendChild(document.createTextNode(errors[i].stack));
            code.appendChild(document.createElement('BR'));
          }
          li.appendChild(code);

          curSuite.el.getElementsByClassName('tests-list')[0].appendChild(li);
        }
        else {
          // normal error
          var test = curSuite.tests[obj.result.name];
          var el = test.el;
          removeClass(el, 'running');
          el.className += ' ' + obj.result.status;

          if (obj.result.error || obj.result.failure) {
            var code = document.createElement('CODE');
            code.className = 'result';
            code.innerHTML = (obj.result.error || obj.result.failure).stack;
            el.insertBefore(code, el.lastChild);

            var summarySpan = document.createElement('SPAN');
            summarySpan.className = 'summary';
            summarySpan.innerHTML = (obj.result.error || obj.result.failure).message;
            test.nameEl.appendChild(summarySpan);
          }
        }
        //TODO HANDLE MULTI ERROR
      }
    , suiteDone: function(obj) {
        var el = curSuite.el;

        if (obj.numFailures > 0) {
          var status = 'failure';
        }
        else if (obj.numErrors > 0) {
          var status = 'error';
        }
        else {
          var status = 'success';
        }

        updateFavicon(status);

        removeClass(el, 'running');
        el.className += ' '+status;

        var input = el.getElementsByTagName('input')[0];
        input.disabled = false;

        var doneSpan = document.createElement('SPAN');
        doneSpan.className = 'done';
        doneSpan.innerHTML = 'Done';
        el.insertBefore(doneSpan, curSuite.runSpan);

        var suite = curSuite;
        doneSpan.onclick = function(e) {
          clearSuiteResults(suite);
        }

        curSuite.runSpan.innerHTML = 'Run';

        curSuite = null;
      }
    , suiteError: function(obj) {
        removeClass(curSuite.el, 'running');
        curSuite.el.className += ' compile-error';
        curSuite.runSpan.innerHTML = 'Error running';
        curSuite.runSpan.onclick = null;

        clearSuiteResults(curSuite);

        curSuite = null;
      }
    , cancelled: function(obj) {
        var el = curSuite.el;

        var input = el.getElementsByTagName('input')[0];
        input.disabled = false;

        removeClass(el, 'running');
        el.className += ' '+status;

        clearSuiteResults(curSuite);

        curSuite.runSpan.innerHTML = 'Run';

        curSuite = null;
      }
    };

  function clearSuiteResults(suite) {
    removeClass(suite.el, ['success', 'failure', 'error']);

    var els = suite.el.getElementsByClassName('non-specific-errors');
    while(els.length) {
      els[0].parentNode.removeChild(els[0]);
    }

    var testLis = suite.el.getElementsByTagName('li');
    for (var i=0; i < testLis.length; i++) {
      removeClass(testLis[i], ['success', 'failure', 'error', 'running']);
    }

    els = suite.el.getElementsByClassName('done');
    while(els.length) {
      els[0].parentNode.removeChild(els[0]);
    }

    els = suite.el.getElementsByClassName('result');
    while(els.length) {
      els[0].parentNode.removeChild(els[0]);
    }

    els = suite.el.getElementsByClassName('summary');
    while(els.length) {
      els[0].parentNode.removeChild(els[0]);
    }

  }

  function buildSuiteElement(suite) {
    var suiteLi = document.createElement('LI');

    var nameSPAN = document.createElement('SPAN');
    nameSPAN.className = 'name';
    nameSPAN.innerHTML = suite.name;
    nameSPAN.onclick = function(e) {
      toggleItem(suite);
    }
    suiteLi.appendChild(nameSPAN);

    if (suite.error) {
      suiteLi.className = 'compile-error';

      var runSpan = document.createElement('SPAN');
      runSpan.className = 'run-button';
      runSpan.innerHTML = 'Error: ' + (suite.error.lineno ? 'line ' + suite.error.lineno + ' - ' : '') + suite.error.message;
      suiteLi.appendChild(runSpan);
      suite.runSpan = runSpan;
    }
    else {
      var runSpan = document.createElement('SPAN');
      runSpan.className = 'run-button';
      runSpan.innerHTML = 'Run';
      runSpan.onclick = function(e) {
        enqueueSuite(suite);
        //toggleItem(suite, true);
      }
      suiteLi.appendChild(runSpan);
      suite.runSpan = runSpan;

      var label = document.createElement('LABEL');
      label.innerHTML = '<input type="checkbox"' + (suite.parallel ? ' checked' : '') +' value="1"> Run in parallel?';
      suiteLi.appendChild(label);

      var testsList = document.createElement('UL');
      testsList.className = 'tests-list';

      for (var name in suite.tests) {
        (function(n) {
          var testLi = document.createElement('LI');
          
          var span = document.createElement('SPAN');
          span.className = 'name';
          span.innerHTML = n;
          span.onclick = function(e) {
            toggleItem(suite.tests[n]);
          }
          testLi.appendChild(span);

          var code = document.createElement('CODE');
          code.className = 'test-func';
          code.innerHTML = suite.tests[n].func;
          testLi.appendChild(code);

          suite.tests[n].el = testLi;
          suite.tests[n].nameEl = span;

          testsList.appendChild(testLi);
        })(name);
      }

      suiteLi.appendChild(testsList);
    }

    suite.el = suiteLi;

    return suiteLi;
  }

  function toggleItem(item, open) {
    var el = item.el;

    if (typeof open == 'undefined') {
      if (el.className.indexOf('open') < 0) {
        open = true;
      }
      else {
        open = false;
      }
    }

    removeClass(el, 'open');

    if (open) {
      el.className += ' open';
    }
  }

  function enqueueSuite(suite) {
    if (suite.el.className.indexOf('compile-error') < 0 && suite.el.className.indexOf('queued') < 0 && suite.el.className.indexOf('running') < 0) {
      var input = suite.el.getElementsByTagName('input')[0];
      suite.parallel = input.checked;
      socket.send(JSON.stringify({cmd: 'enqueueSuite', index: suite.index, parallel: input.checked}));
      suiteQueued(suite);
    }
  }
  function suiteQueued(suite) {
    clearSuiteResults(suite);

    suite.el.className += ' queued';
    // don't set the inner text till we get the confirmation from the server
    suite.runSpan.innerHTML = 'Queued';

    var input = suite.el.getElementsByTagName('input')[0];
    input.checked = suite.parallel;
    input.disabled = true;
  }

  function updateFavicon(status) {
    var head = document.getElementsByTagName('head')[0]
      , links = head.getElementsByTagName('link')
      , link
      ;

    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('rel') == 'icon') {
        link = links[i];
        break;
      }
    }

    if (link) {
      head.removeChild(link);
      link = document.createElement('LINK');
      link.rel = 'icon';
      link.href = status + '.png';
      head.appendChild(link);
    }
  }

  function cancel() {
    socket.send(JSON.stringify({cmd: 'cancel', index: curSuite.index}));
  }

  function removeClass(el, classes) {
    if (classes.constructor != Array) {
      classes = [classes];
    }

    var r = '(^|\\s)('+classes.join('|')+')(\\s|$)';
    el.className = el.className.replace(new RegExp(r), '$1$3').trim();
  }
})();
