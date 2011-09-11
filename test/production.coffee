process.env.NODE_ENV = 'production'
request = require 'request'

app = require('connect').createServer()
assets = require('../lib/assets.js')
app.use assets()
app.listen 3589

exports['Stylus CSS is compressed'] = (test) ->
  test.expect 3

  request 'http://localhost:3589/css/style.css', (err, res, body) ->
    test.ok !err
    test.equals res.headers['content-type'], 'text/css'
    test.equals body, 'textarea,input{border:1px solid #eee}\n'
    test.done()

exports['Raw CSS is served directly'] = (test) ->
  test.expect 3

  request 'http://localhost:3589/css/normalize.css', (err, res, body) ->
    test.ok !err
    test.equals body, '/* Just act normal, dude. */'
    test.equals res.headers['content-type'], 'text/css'
    test.done()

exports['Far-future expires and MD5 hash strings are used for CSS'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/style-666055206709fc94e56e1a59caa615dd.css'>"
  test.equals css('style'), cssTag

  request 'http://localhost:3589/css/style-666055206709fc94e56e1a59caa615dd.css', (err, res, body) ->
    test.ok !err
    test.equals res.headers['content-type'], 'text/css'
    test.equals res.headers['expires'], assets.FAR_FUTURE_EXPIRES
    test.equals body, 'textarea,input{border:1px solid #eee}\n'
    test.done()

exports['Dependencies are concatenated'] = (test) ->
  js.concatenate = true
  jsTag = "<script src='/js/dependent.complete-057747a1cbabcbd2279e4f358bc4723f.js'></script>"
  test.equals js('dependent'), jsTag

  request 'http://localhost:3589/js/dependent.complete-057747a1cbabcbd2279e4f358bc4723f.js', (err, res, body) ->
    test.ok !err
    test.equals res.headers['content-type'], 'application/javascript'
    expectedBody = '''
    (function(){this.proclamation="Everyone is counting on me!"}).call(this),alert("HEY"),function(){}.call(this)
    '''
    test.equals body, expectedBody
    test.done()
    app.close()