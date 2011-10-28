process.env.NODE_ENV = 'production'
request = require 'request'

app = require('connect').createServer()
assets = require('../lib/assets.js')
app.use assets buildDir: false  # disable saving built assets to file
app.listen 3589

exports['Far-future expires and MD5 hash strings are used for CSS'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/style-666055206709fc94e56e1a59caa615dd.css'>"
  test.equals css('style'), cssTag
  test.equals assets.instance.buildFilenames['css/style.styl'], 'css/style-666055206709fc94e56e1a59caa615dd.css'

  request 'http://localhost:3589/css/style-666055206709fc94e56e1a59caa615dd.css', (err, res, body) ->
    throw err if err
    test.equals res.headers['content-type'], 'text/css'
    test.equals res.headers['expires'], 'Wed, 01 Feb 2034 12:34:56 GMT'
    test.equals body, 'textarea,input{border:1px solid #eee}\n'

    # test repeated requests
    test.equals css('style'), cssTag
    test.equals assets.instance.buildFilenames['css/style.styl'], 'css/style-666055206709fc94e56e1a59caa615dd.css'

    request 'http://localhost:3589/css/style-666055206709fc94e56e1a59caa615dd.css', (err, res, body) ->
      throw err if err
      test.equals res.headers['content-type'], 'text/css'
      test.equals res.headers['expires'], 'Wed, 01 Feb 2034 12:34:56 GMT'
      test.equals body, 'textarea,input{border:1px solid #eee}\n'
      test.done()

exports['JS dependencies are concatenated and minified'] = (test) ->
  jsTag = "<script src='/js/dependent-057747a1cbabcbd2279e4f358bc4723f.js'></script>"
  test.equals js('dependent'), jsTag
  test.equals assets.instance.buildFilenames['js/dependent.coffee'], 'js/dependent-057747a1cbabcbd2279e4f358bc4723f.js'

  request 'http://localhost:3589/js/dependent-057747a1cbabcbd2279e4f358bc4723f.js', (err, res, body) ->
    throw err if err
    test.equals res.headers['content-type'], 'application/javascript'
    expectedBody = '''
    (function(){this.proclamation="Everyone is counting on me!"}).call(this),alert("HEY"),function(){}.call(this)
    '''
    test.equals body, expectedBody

    # test repeated requests
    test.equals js('dependent'), jsTag
    test.equals assets.instance.buildFilenames['js/dependent.coffee'], 'js/dependent-057747a1cbabcbd2279e4f358bc4723f.js'

    request 'http://localhost:3589/js/dependent-057747a1cbabcbd2279e4f358bc4723f.js', (err, res, body) ->
      throw err if err
      test.equals res.headers['content-type'], 'application/javascript'
      expectedBody = '''
      (function(){this.proclamation="Everyone is counting on me!"}).call(this),alert("HEY"),function(){}.call(this)
      '''
      test.equals body, expectedBody
      test.done()
      app.close()