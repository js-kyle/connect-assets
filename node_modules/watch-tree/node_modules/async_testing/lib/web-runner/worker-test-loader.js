
onmessage = function(message) {
  var path = message.data;

  var suite = require(path);
  var msg = {};

  for (var testName in suite) {
    msg[testName] = { func: ''+suite[testName] };
  }
  postMessage(msg);
}
