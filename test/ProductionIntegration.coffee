process.env.NODE_ENV = 'production'
request = require 'request'

app = require('connect').createServer()
assets = require('../lib/assets.js')
app.use assets buildDir: false  # disable saving built assets to file
app.listen 3589

extractCssHref = (cssLink) -> cssLink.replace('<link rel="stylesheet" href="', '').replace('" />', '')

exports['Far-future expires and MD5 hash strings are used for images'] = (test) ->
  imgTag = "/img/foobar-25c2e8559281a2cd7503300442862885.png"
  test.equals img('foobar.png'), imgTag
  request 'http://localhost:3589/img/foobar-25c2e8559281a2cd7503300442862885.png', (err, res, body) ->
    throw err if err
    test.equals res.headers['content-type'], 'image/png'
    test.equals res.headers['expires'], 'Wed, 01 Feb 2034 12:34:56 GMT'
    test.done()

exports['MD5 hash strings are used for images in CSS files'] = (test) ->
  relativeCssPath = extractCssHref css('background.css')
  request "http://localhost:3589#{relativeCssPath}", (err, res, body) ->
    throw err if err
    test.equals body, '.background { background-image: url(\'/img/foobar-25c2e8559281a2cd7503300442862885.png\'); }'
    test.done()

exports['MD5 hash strings are used for images with hashes in CSS files'] = (test) ->
  relativeCssPath = extractCssHref css('background-with-hash.css')
  request "http://localhost:3589#{relativeCssPath}", (err, res, body) ->
    throw err if err
    test.equals body, '.background { background-image: url(\'/img/foobar-25c2e8559281a2cd7503300442862885.png#a-hash\'); }'
    test.done()

exports['MD5 hash strings are used for images with query strings in CSS files'] = (test) ->
  relativeCssPath = extractCssHref css('background-with-query.css')
  request "http://localhost:3589#{relativeCssPath}", (err, res, body) ->
    throw err if err
    test.equals body, '.background { background-image: url(\'/img/foobar-25c2e8559281a2cd7503300442862885.png?a=query\'); }'
    test.done()

exports['MD5 hash strings are used for images with hashes and query srings in CSS files'] = (test) ->
  relativeCssPath = extractCssHref css('background-with-hash-and-query.css')
  request "http://localhost:3589#{relativeCssPath}", (err, res, body) ->
    throw err if err
    test.equals body, '.background { background-image: url(\'/img/foobar-25c2e8559281a2cd7503300442862885.png?a=query#a-hash\'); }'
    test.done()

exports['Far-future expires and MD5 hash strings are used for CSS'] = (test) ->
  cssTag = '<link rel="stylesheet" href="/css/style-666055206709fc94e56e1a59caa615dd.css" />'
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

exports['MD5 hash strings are used for images when asseturl is used in less'] = (test) ->
  relativeCssPath = extractCssHref css('background-less.css')
  request "http://localhost:3589#{relativeCssPath}", (err, res, body) ->
    throw err if err
    test.equals body, '.background{background-image:url(/img/foobar-25c2e8559281a2cd7503300442862885.png)}\n'
    test.done()

exports['MD5 hash strings are used for images when asseturl is used in stylus'] = (test) ->
  relativeCssPath = extractCssHref css('background-styl.css')
  request "http://localhost:3589#{relativeCssPath}", (err, res, body) ->
    throw err if err
    test.equals body, '.background{background-image:url(/img/foobar-25c2e8559281a2cd7503300442862885.png)}\n'
    test.done()

exports['JS dependencies are concatenated and minified'] = (test) ->
  jsTag = '<script src="/js/dependent-057747a1cbabcbd2279e4f358bc4723f.js"></script>'
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
