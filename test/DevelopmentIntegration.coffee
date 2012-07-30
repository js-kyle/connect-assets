process.env.NODE_ENV = 'development'
request = require 'request'

app = require('connect').createServer()
assets = require('../lib/assets.js')
app.use assets()
app.listen 3588

exports['Raw JavaScript is served directly'] = (test) ->
  jsTag = "<script src='/js/js-dependency.js'></script>"
  test.equals js('js-dependency'), jsTag

  request 'http://localhost:3588/js/js-dependency.js', (err, res, body) ->
    throw err if err
    test.equals body, '// Admit it: You need me.'
    test.equals res.headers['content-type'], 'application/javascript'
    test.done()

exports['CoffeeScript is served as JavaScript'] = (test) ->
  jsTag = "<script src='/js/script.js'></script>"
  test.equals js('script'), jsTag

  request 'http://localhost:3588/js/script.js', (err, res, body) ->
    throw err if err
    test.equals res.headers['content-type'], 'application/javascript'
    expectedBody = '''
    (function() {
      console.log(\'Howdy\');
    }).call(this);\n
    '''
    test.equals body, expectedBody
    test.done()

exports['Raw CSS is served directly'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/normalize.css'>"
  test.equals css('normalize'), cssTag

  request 'http://localhost:3588/css/normalize.css', (err, res, body) ->
    throw err if err
    test.equals body, '/* Just act normal, dude. */'
    test.equals res.headers['content-type'], 'text/css'
    test.done()

exports['Images are served directly'] = (test) ->
  imgTag = "/img/foobar.png"
  test.equals img('foobar.png'), imgTag
  request 'http://localhost:3588/img/foobar.png', (err, res, body) ->
    throw err if err
    test.equals res.headers['content-type'], 'image/png'
    test.done()

exports['CSS images are resolved correctly'] = (test) ->
  css('background')
  request 'http://localhost:3588/img/foobar.png', (err, res, body) ->
    throw err if err
    test.equals res.statusCode, 200
    test.done()

exports['Stylus is served as CSS'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/style.css'>"
  test.equals css('style'), cssTag

  request 'http://localhost:3588/css/style.css', (err, res, body) ->
    throw err if err
    test.equals res.headers['content-type'], 'text/css'
    expectedBody = '''
    /* this comment should be visible in dev mode */
    textarea,
    input {
      border: 1px solid #eee;
    }\n
    '''
    test.equals body, expectedBody
    test.done()

exports['Stylus imports work as expected'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/button.css'>"
  test.equals css('button'), cssTag

  request 'http://localhost:3588/css/button.css', (err, res, body) ->
    throw err if err
    expectedBody = '''
    .button {
      -webkit-border-radius: 5px;
      -moz-border-radius: 5px;
      border-radius: 5px;
    }\n
    '''
    test.equals body, expectedBody
    test.done()
    
exports['Less is served as CSS'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/style-less.css'>"
  test.equals css('style-less'), cssTag
  
  request 'http://localhost:3588/css/style-less.css', (err, res, body) ->
    throw err if err
    expectedBody = '''
    textarea,
    input {
      border: 1px solid #eee;
    }\n
    '''
    test.equals body, expectedBody
    test.done()

exports['nib is supported when available'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/gradient.css'>"
  test.equals css('gradient'), cssTag

  request 'http://localhost:3588/css/gradient.css', (err, res, body) ->
    throw err if err
    expectedBody = '''
    .striped {
      background: -webkit-gradient(linear, left top, left bottom, color-stop(0, #ff0), color-stop(1, #00f));
      background: -webkit-linear-gradient(top, #ff0 0%, #00f 100%);
      background: -moz-linear-gradient(top, #ff0 0%, #00f 100%);
      background: linear-gradient(top, #ff0 0%, #00f 100%);
    }\n
    '''
    test.equals body, expectedBody
    test.done()

exports['Requests for directories are ignored'] = (test) ->
  request 'http://localhost:3588/', (err, res, body) ->
    throw err if err
    test.equals body, 'Cannot GET /'
    test.done()

exports['Requests for nonexistent compile targets are ignored'] = (test) ->
  request 'http://localhost:3588/404.css', (err, res, body) ->
    throw err if err
    test.equals body, 'Cannot GET /404.css'
    test.done()

exports['Requests for non-JS/CSS files are ignored'] = (test) ->
  request 'http://localhost:3588/foo.bar', (err, res, body) ->
    throw err if err
    test.equals body, 'Cannot GET /foo.bar'
    test.done()

exports['css helper function provides correct href'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/style.css'>"
  test.equals css('/css/style.css'), cssTag
  test.equals css('style.css'), cssTag
  test.equals css('style'), cssTag
  test.equals css(url = 'http://raw.github.com/necolas/normalize.css/master/normalize'), "<link rel='stylesheet' href='#{url}.css'>"
  test.equals css(url = '//raw.github.com/necolas/normalize.css/master/normalize.css'), "<link rel='stylesheet' href='#{url}'>"
  test.done()

exports['js helper function provides correct src'] = (test) ->
  jsTag = "<script src='/js/script.js'></script>"
  test.equals js('/js/script.js'), jsTag
  test.equals js('script.js'), jsTag
  test.equals js('script'), jsTag
  test.equals js(url = 'http://code.jquery.com/jquery-1.6.2'), "<script src='#{url}.js'></script>"
  test.equals js(url = '//code.jquery.com/jquery-1.6.2.js'), "<script src='#{url}'></script>"
  test.done()

exports['helper functions provides only paths when requested'] = (test) ->
  context = {}
  path_assets = assets helperContext: context, pathsOnly: true
  jsFiles = [
    '/js/js-dependency.js'
    '/js/coffee-dependency.js'
    '/js/more/annoying.1.2.3.js'
    '/js/dependent.js'
  ]
  test.deepEqual context.js('dependent'), jsFiles
  test.equals context.css('style'), '/css/style.css'
  test.done()

exports['Script files can `require` (in non-production mode)'] = (test) ->
  jsTags = """<script src='/js/js-dependency.js'></script>
  <script src='/js/coffee-dependency.js'></script>
  <script src='/js/more/annoying.1.2.3.js'></script>
  <script src='/js/dependent.js'></script>
  """
  test.equals js('dependent'), jsTags
  test.done()

exports['Script source files can contain nothing but directives'] = (test) ->
  js('dependent')
  request 'http://localhost:3588/js/dependent.js', (err, res, body) ->
    throw err if err
    test.equals body, '''
    (function() {

    }).call(this);\n
    '''
    test.done()

exports['Script files can `require_tree` a single folder'] = (test) ->
  jsTags = """<script src='/js/subdir/nested/hobbits.js'></script>
  <script src='/js/tree-dependent.js'></script>
  """
  test.equals js('tree-dependent'), jsTags
  test.done()

exports['.js files can `require_tree` their own folder'] = (test) ->
  jsTags = """<script src='/js/subdir/nested/hobbits.js'></script>
  <script src='/js/subdir/subdir-dependent.js'></script>
  """
  test.equals js('subdir/subdir-dependent'), jsTags
  test.done()

exports['.coffee files can `require_tree` their own folder'] = (test) ->
  jsTag = "<script src='/js/starbucks/mocha.js'></script>"
  test.equals js('starbucks/mocha'), jsTag
  test.done()

exports['`require` can be used on a file before `require_tree`'] = (test) ->
  jsTags = """<script src='/js/moon_units/austin/texas.js'></script>
  <script src='/js/moon_units/austin/powers.js'></script>
  <script src='/js/moon_units/alpha.js'></script>
  <script src='/js/moon_units/zappa.js'></script>
  <script src='/js/moon_units/evil.js'></script>
  <script src='/js/needs-evil.js'></script>
  """
  test.equals js('needs-evil'), jsTags
  test.done()

exports['Dependencies can be chained (in non-production mode)'] = (test) ->
  jsTags = """<script src='/js/js-dependency.js'></script>
  <script src='/js/coffee-dependency.js'></script>
  <script src='/js/more/annoying.1.2.3.js'></script>
  <script src='/js/dependent.js'></script>
  <script src='/js/chained-dependent.js'></script>
  """
  test.equals js('chained-dependent'), jsTags
  test.done()

exports['The same dependency will not be loaded twice'] = (test) ->
  jsTags = """<script src='/js/a.js'></script>
  <script src='/js/b.js'></script>
  <script src='/js/c.js'></script>
  """
  test.equals js('c'), jsTags
  test.done()

exports['An error is thrown if a script requires itself directly'] = (test) ->
  test.throws -> js('narcissist')
  test.done()

exports['An error is thrown if the dependency graph has cycles'] = (test) ->
  test.throws -> js('mindy')  # requires mork, which requires mindy...
  test.done()

exports['An error is thrown if there is a require_tree cycle'] = (test) ->
  test.throws -> js('addicts/codependent')
  test.done()
  app.close()
