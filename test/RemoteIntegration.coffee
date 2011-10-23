process.env.NODE_ENV = 'production'
request = require 'request'

app = require('connect').createServer()
assets = require('../lib/assets.js')
app.use assets src: 'http://mycdn.com'

exports['options.src can be a URL'] = (test) ->
  jsTag = "<script src='http://mycdn.com/js/jquery.min.js'></script>"
  test.equals js('jquery.min.js'), jsTag
  test.done()

exports['If options.src is a URL, other URLs are still allowed'] = (test) ->
  jsTag = "<script src='//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.1.7/underscore-min.js'></script>"
  test.equals js('//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.1.7/underscore-min.js'), jsTag
  test.done()