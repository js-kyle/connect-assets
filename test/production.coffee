process.env.NODE_ENV = 'production'
request = require 'request'

app = require('connect').createServer()
assets = require('../lib/assets.js')
console.log assets.compilers.styl.compress
app.use assets()
app.listen 3589

exports['Stylus CSS is compressed (in production mode)'] = (test) ->
  test.expect 3

  request 'http://localhost:3589/css/style.css', (err, res, body) ->
    test.ok !err
    test.equals res.headers['content-type'], 'text/css'
    expectedBody = 'textarea,input{border:1px solid #eee}\n'
    test.equals body, expectedBody
    test.done()

exports['Dependencies are concatenated (in production mode)'] = (test) ->
  js.concatenate = true
  jsTag = "<script src='/js/dependent.complete.js'></script>"
  test.equals js('dependent'), jsTag

  request 'http://localhost:3589/js/dependent.complete.js', (err, res, body) ->
    test.ok !err
    test.equals res.headers['content-type'], 'application/javascript'
    expectedBody = '''
    (function(){this.proclamation="Everyone is counting on me!"}).call(this),alert("HEY"),function(){}.call(this)
    '''
    test.equals body, expectedBody
    test.done()
    app.close()