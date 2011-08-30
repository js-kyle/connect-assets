var http = require('http')
  , sys = require('sys')
  , path = require('path')
  , fs = require('fs')
  , async_testing = require('./async_testing')
  , Worker
  , io
  ;

var contenttypes =
  { '.html': 'text/html'
  , '.css': 'text/css'
  , '.js': 'application/javascript'
  }

exports.run = function(list, options, callback) {
  try {
    Worker = require('webworker').Worker
    io = require('socket.io')
  }
  catch(err) {
    if (err.message == 'Cannot find module \'socket.io\'') {
      console.log('Dependency socket.io is not installed. Install it with:');
      console.log('');
      console.log('    npm install socket.io');
    }
    else if (err.message == 'Cannot find module \'webworker\'') {
      console.log('Dependency webworker is not installed. Install it with:');
      console.log('');
      console.log('    npm install webworker');
    }
    console.log('');
    console.log('node-async-testing does not depend on it to run; it is only used');
    console.log('by the web runner. Thus it isn\'t listed as dependency through npm.');
    return;
  }

  options.parallel = options.parallel || false;

  try {
    options.port = parseInt(options.port);
    if (isNaN(options.port)) {
      throw '';
    }
  }
  catch(err) {
    options.port = 8765;
  }

  var suites
    , socket
    , status = { started: null, testsStarted: [], testsDone: [] }
    , queue = []
    , messageQueue = []
    , worker = null
    ;

  async_testing.expandFiles(list, options.suiteName, startServer);

  function startServer(loaded) {
    suites = loaded;

    for (var i = 0; i < suites.length; i++) {
      suites[i].parallel = options.parallel;
    }

    var dir = __dirname + '/web-runner/public';

    server = http.createServer(function(request, response){
      var filename = request.url;
      if (request.url == '/') {
        filename = '/index.html';
      }

      //console.log('request for '+filename);

      path.exists(dir+filename, function(exists) {
        if (exists) {
          response.writeHead(200, {'content-type': contenttypes[path.extname(filename)]});
          sys.pump(fs.createReadStream(dir+filename), response);
        }
        else {
          console.log('cannot find file: ' + filename);
          response.writeHead(404, {'content-type': 'text/plain'});
          response.write('Not Found: ' + filename);
          response.end();
        }
      });
    });

    loadFiles(suites, function() {
      server.listen(options.port);

      // socket.io, I choose you
      socket = io.listen(server, {log: function() {}});

      socket.on('connection', function(client) {
        // connected!!

        client.on('message', function(msg) {
          obj = JSON.parse(msg);

          if (obj.cmd in socketHandlers) {
            socketHandlers[obj.cmd](obj, client);
          }
          else {
            console.log('unknown socket.io message:');
            console.log(obj);
          }
        });

        client.send(JSON.stringify({cmd: 'suitesList', suites: suites}));

        // send the current state
        for (var i = 0; i < queue.length; i++) {
          client.send(JSON.stringify({cmd: 'queued', index: queue[i][0], parallel: queue[i][1]}));
        }
        if (status.started) {
          client.send(JSON.stringify({cmd: 'suiteStart', index: status.started.index}));

          for (var i = 0; i < status.testsStarted.length; i++) {
            client.send(JSON.stringify({cmd: 'testStart', name: status.testsStarted[i]}));
          }
          for (var i = 0; i < status.testsDone.length; i++) {
            client.send(JSON.stringify({cmd: 'testDone', result: status.testsDone[i]}));
          }
        }
      });

      console.log('Test runner started -- http://localhost:'+options.port+'/');

      suites.forEach(watchFile)
    });
  }

  function watchFile(suite) {
    fs.watchFile(suite.name, {interval: 500}, watchFunction)

    function watchFunction(o, n) {
      if (n.mtime.toString() === o.mtime.toString()) {
        return;
      }
      loadFiles(suite, fileLoaded);
    }

    function fileLoaded() {
      messageQueue.push(JSON.stringify({cmd: 'suitesList', suites: [suite]}));
      checkQueue();
    }
  }

  function checkQueue() {
    if (status.started) {
      // already running a test
      return;
    }

    var cmd = queue.shift();

    if (!cmd) {
      // no tests scheduled
      if (worker) {
        worker.terminate();
      }
      while (messageQueue.length > 0) {
        socket.broadcast(messageQueue.shift());
      }
      return;
    }

    status.started = suites[cmd[0]];
    status.started.parallel = cmd[1];

    var opts =
      { name: status.started.name
      , testName: options.testName
      , parallel: status.started.parallel
      , suite: status.started.path
      , dir: __dirname
      };

    if (!worker) {
      worker = new Worker(path.join(__dirname, 'web-runner/worker-test-runner.js'));
      worker.onmessage = function(message) {
        obj = message.data;

        if (obj.cmd in workerHandlers) {
          workerHandlers[obj.cmd](obj);
        }
        else {
          console.log('unknown worker message:');
          console.log(obj);
        }
      }
      worker.onexit = function(code) {
        worker = null;
        if (code !== 0) {
          // worker exited with an error
          workerHandlers.suiteError({cmd: 'suiteError'});
        }
      }
    }

    var msg = {cmd: 'suiteStart', index: status.started.index};
    socket.broadcast(JSON.stringify(msg));

    worker.postMessage(opts);
  }

  function loadFiles(files, cb) {
    if (files.constructor != Array) {
      files = [files];
    }

    var index = 0;
    processNextItem();

    function processNextItem() {
      if (index >= files.length) {
        return cb();
      }

      var i = index;

      w = new Worker(path.join(__dirname, 'web-runner/worker-test-loader.js'));
      w.onmessage = function(message) {
        obj = message.data;
        files[i].tests = obj;
        delete files[i].error;
        w.terminate();
      }
      w.onerror = function(err) {
        files[i].error = err;
        delete files[i].tests;
        w.terminate();
      }
      w.onexit = function(code, signal) {
        if (code !== 0) {
          // worker exited with an error
          files[i].error = { message: 'Cannot load file' };
          delete files[i].tests;
        }
        processNextItem();
      }
      w.postMessage(files[index].path);
      index++;
    }
  }

  function cleanupSuite() {
    status.started = null;
    status.testsStarted = [];
    status.testsDone = [];

    checkQueue();
  }

  var socketHandlers =
    { enqueueSuite: function(obj, client) {
        //TODO reload the suite from file (if applicable) here

        queue.push([obj.index, obj.parallel]);
        var msg = {cmd: 'queued', index: obj.index, parallel: obj.parallel};
        client.broadcast(JSON.stringify(msg));
        checkQueue();
      }
    , cancel: function(obj, client) {
        if (!status.started || obj.index != status.started.index) {
          // if there is nothing started then there is nothing to terminate
          // if the indeces don't match, we've already moved on
          return;
        }

        worker.terminate();
        socket.broadcast(JSON.stringify({cmd: 'cancelled'}));
        cleanupSuite();
      }
    }

  var workerHandlers =
    { suiteStart: function() {}
    , suiteDone: function(obj) {
        var results = obj.results;

        var msg = {cmd: 'suiteDone', numErrors: results.numErrors, numSuccesses: results.numSuccesses, numFailures: results.numFailures};
        socket.broadcast(JSON.stringify(msg));

        cleanupSuite();
      }
    , suiteError: function(obj) {
        socket.broadcast(JSON.stringify(obj));
        cleanupSuite();
      }
    , testStart: function(obj) {
        var name = obj.name;

        status.testsStarted.push(name);
        var msg = {cmd: 'testStart', name: name};
        socket.broadcast(JSON.stringify(msg));
      }
    , testDone: function(obj) {
        var result = obj.result;

        status.testsDone.push(result);

        var msg = {cmd: 'testDone', result: result};
        socket.broadcast(JSON.stringify(msg));
      }
    }
}

exports.flags = 
  [ { longFlag: 'port'
    , shortFlag: 'p'
    , description: 'which port to run the web server on'
    , varName: 'port'
    }
  ];
