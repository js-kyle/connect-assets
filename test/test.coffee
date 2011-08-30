request = require 'request'

app = require('connect').createServer()
app.use require('../lib/assets.js')()
app.listen 3588

exports['CoffeeScript is served as JavaScript'] = (test) ->
  test.expect 2

  request 'http://localhost:3588/js/script.js', (err, res, body) ->
    test.ok !err
    expectedBody = '''
    (function() {
      console.log(\'Howdy\');
    }).call(this);\n
    '''
    test.equals body, expectedBody
    test.done()

exports['Raw JavaScript is served directly'] = (test) ->
  test.expect 2

  request 'http://localhost:3588/js/dependency.js', (err, res, body) ->
    test.ok !err
    test.equals body, '// Admit it: You need me.'
    test.done()

exports['Stylus is served as CSS'] = (test) ->
  test.expect 2

  request 'http://localhost:3588/css/style.css', (err, res, body) ->
    test.ok !err
    expectedBody = '''
    textarea,
    input {
      border: 1px solid #eee;
    }\n
    '''
    test.equals body, expectedBody
    test.done()

exports['Requests for directories are ignored'] = (test) ->
  test.expect 2

  request 'http://localhost:3588/', (err, res, body) ->
    test.ok !err
    test.equals body, 'Cannot GET /'
    test.done()

exports['Requests for nonexistent compile targets are ignored'] = (test) ->
  test.expect 2

  request 'http://localhost:3588/404.css', (err, res, body) ->
    test.ok !err
    test.equals body, 'Cannot GET /404.css'
    test.done()

exports['Requests for nonexistent raw files are ignored'] = (test) ->
  test.expect 2

  request 'http://localhost:3588/foo.bar', (err, res, body) ->
    test.ok !err
    test.equals body, 'Cannot GET /foo.bar'
    test.done()