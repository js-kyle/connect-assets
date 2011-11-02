process.env.NODE_ENV = 'production'
request = require 'request'
async = require 'async'

app = require('connect').createServer()
assets = require('../lib/assets.js')
app.use assets buildDir: false  # disable saving built assets to file
app.listen 3592

exports['Stylus benchmark'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/button-78506f0018c9f2ac06b778971d372a23.css'>"
  expectedBody = '.button{-webkit-border-radius:5px;-moz-border-radius:5px;border-radius:5px}\n'

  startTime = new Date
  trials = for i in [1..100]
    (next) ->
      test.equals css('button'), cssTag
      request 'http://localhost:3592/css/button-78506f0018c9f2ac06b778971d372a23.css', (err, res, body) ->
        throw err if err
        test.equals body, expectedBody
      next()
  async.parallel trials, ->
    console.log "100 Stylus requests done in #{new Date - startTime}ms"
    test.done()

exports['Snockets benchmark'] = (test) ->
  jsTag = "<script src='/js/c-99464d3c14ea198ff7d8bc53a5bd63c6.js'></script>"
  expectedBody = '(function(){alert("I require nothing!")}).call(this),function(){}.call(this),function(){}.call(this)'

  startTime = new Date
  trials = for i in [1..100]
    (next) ->
      test.equals js('c'), jsTag
      request 'http://localhost:3592/js/c-99464d3c14ea198ff7d8bc53a5bd63c6.js', (err, res, body) ->
        throw err if err
        test.equals body, expectedBody
        next()
  async.parallel trials, ->
    console.log "100 Snockets requests done in #{new Date - startTime}ms"
    test.done()
    app.close()