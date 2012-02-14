process.env.NODE_ENV = 'production'
request = require 'request'

app = require('connect').createServer()
assets = require('../lib/assets.js')
app.use assets servePath: 'http://mycdn.com'
app.listen 3593

exports['servePath prepended to script paths on production'] = (test) ->
  jsTag = "<script src='http://mycdn.com/js/dependent-057747a1cbabcbd2279e4f358bc4723f.js'></script>"
  test.equals js('dependent'), jsTag
  test.done()

exports['If options.servePath exists, other script URLs are still allowed'] = (test) ->
  jsTag = "<script src='//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.1.7/underscore-min.js'></script>"
  test.equals js('//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.1.7/underscore-min.js'), jsTag
  test.done()

exports['servePath prepended to css paths on production'] = (test) ->
  cssTag = "<link rel='stylesheet' href='http://mycdn.com/css/style-666055206709fc94e56e1a59caa615dd.css'>"
  test.equals css('style'), cssTag
  test.done()

exports['If options.servePath exists, other css URLs are still allowed'] = (test) ->
  cssTag = "<link rel='stylesheet' href='//some.cdn.com/my_style.css'>"
  test.equals css('//some.cdn.com/my_style.css'), cssTag
  test.done()

exports['servePath prepended to img paths on production'] = (test) ->
  imgTag = "http://mycdn.com/img/foobar-d41d8cd98f00b204e9800998ecf8427e.png"
  test.equals img('foobar.png'), imgTag
  test.done()

exports['If options.servePath exists, other img URLs are still allowed'] = (test) ->
  imgTag = "//some.cdn.com/foobar.png"
  test.equals img('//some.cdn.com/foobar.png'), imgTag
  test.done()

exports['Still serves files locally'] = (test) ->
  request 'http://localhost:3593/js/dependent-057747a1cbabcbd2279e4f358bc4723f.js', (err, res, body) ->
    throw err if err
    test.equals res.headers['content-type'], 'application/javascript'
    test.done()
    app.close()

exports['servePath not prepended to script paths on development'] = (test) ->
  process.env.NODE_ENV = 'development'
  app = require('connect').createServer()
  assets = require('../lib/assets.js')
  app.use assets servePath: 'http://mycdn.com'

  jsTag = "<script src='/js/js-dependency.js'></script>"
  test.equals js('js-dependency'), jsTag
  test.done()
