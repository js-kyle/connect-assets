request = require 'request'

app = require('connect').createServer()
app.use require('../lib/assets.js')()
app.listen 3588

exports['CoffeeScript is served as JavaScript'] = (test) ->
  test.expect 3

  request 'http://localhost:3588/js/script.js', (err, res, body) ->
    test.ok !err
    test.equals res.headers['content-type'], 'application/javascript'
    expectedBody = '''
    (function() {
      console.log(\'Howdy\');
    }).call(this);\n
    '''
    test.equals body, expectedBody
    test.done()

exports['Raw JavaScript is served directly'] = (test) ->
  test.expect 3

  request 'http://localhost:3588/js/js-dependency.js', (err, res, body) ->
    test.ok !err
    test.equals body, '// Admit it: You need me.'
    test.equals res.headers['content-type'], 'application/javascript'
    test.done()

exports['Stylus is served as CSS'] = (test) ->
  test.expect 3

  request 'http://localhost:3588/css/style.css', (err, res, body) ->
    test.ok !err
    test.equals res.headers['content-type'], 'text/css'
    expectedBody = '''
    textarea,
    input {
      border: 1px solid #eee;
    }\n
    '''
    test.equals body, expectedBody
    test.done()

exports['Stylus imports work as expected'] = (test) ->
  test.expect 2

  request 'http://localhost:3588/css/button.css', (err, res, body) ->
    test.ok !err
    expectedBody = '''
    .button {
      -webkit-border-radius: 5px;
      -moz-border-radius: 5px;
      border-radius: 5px;
    }\n
    '''
    test.equals body, expectedBody
    test.done()

exports['nib is supported when available'] = (test) ->
  test.expect 2

  request 'http://localhost:3588/css/gradient.css', (err, res, body) ->
    test.ok !err
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

exports['css helper function provides correct href'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/style.css'>"
  test.equals css('/css/style.css'), cssTag
  test.equals css('style.css'), cssTag
  test.equals css('style'), cssTag
  test.equals css('../style'), "<link rel='stylesheet' href='/style.css'>"
  test.done()

exports['js helper function provides correct src'] = (test) ->
  jsTag = "<script src='/js/script.js'></script>"
  test.equals js('/js/script.js'), jsTag
  test.equals js('script.js'), jsTag
  test.equals js('script'), jsTag
  test.equals js('http://code.jquery.com/jquery-1.6.2'), "<script src='http://code.jquery.com/jquery-1.6.2.js'></script>"
  test.done()

exports['Script files can `require` (in non-production mode)'] = (test) ->
  js.concatenate = false
  jsTags = """<script src='/js/js-dependency.js'></script>
  <script src='/js/coffee-dependency.js'></script>
  <script src='/js/more/annoying.1.2.3.js'></script>
  <script src='/js/dependent.js'></script>
  """
  test.equals js('dependent'), jsTags
  test.done()

exports['Script files can `require_tree` a single folder'] = (test) ->
  js.concatenate = false
  jsTags = """<script src='/js/subdir/nested/hobbits.js'></script>
  <script src='/js/tree-dependent.js'></script>
  """
  test.equals js('tree-dependent'), jsTags
  test.done()

exports['.js files can `require_tree` their own folder'] = (test) ->
  js.concatenate = false
  jsTags = """<script src='/js/subdir/nested/hobbits.js'></script>
  <script src='/js/subdir/subdir-dependent.js'></script>
  """
  test.equals js('subdir/subdir-dependent'), jsTags
  test.done()

exports['.coffee files can `require_tree` their own folder'] = (test) ->
  js.concatenate = false
  jsTag = "<script src='/js/starbucks/mocha.js'></script>"
  test.equals js('starbucks/mocha'), jsTag
  test.done()

exports['`require` can be used on a file before `require_tree`'] = (test) ->
  js.concatenate = false
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
  js.concatenate = false
  jsTags = """<script src='/js/js-dependency.js'></script>
  <script src='/js/coffee-dependency.js'></script>
  <script src='/js/more/annoying.1.2.3.js'></script>
  <script src='/js/dependent.js'></script>
  <script src='/js/chained-dependent.js'></script>
  """
  test.equals js('chained-dependent'), jsTags
  test.done()

exports['The same dependency will not be loaded twice'] = (test) ->
  js.concatenate = false
  jsTags = """<script src='/js/a.js'></script>
  <script src='/js/b.js'></script>
  <script src='/js/c.js'></script>
  """
  test.equals js('c'), jsTags
  test.done()

exports['An error is thrown if a script requires itself directly'] = (test) ->
  js.concatenate = false
  test.throws -> js('narcissist')
  test.done()

exports['An error is thrown if the dependency graph has cycles'] = (test) ->
  js.concatenate = false
  test.throws -> js('mindy')  # requires mork, which requires mindy...
  test.done()

exports['An error is thrown if there is a require_tree cycle'] = (test) ->
  js.concatenate = false
  test.throws -> js('addicts/codependent')
  test.done()

exports['Dependencies are concatenated (in production mode)'] = (test) ->
  js.concatenate = true
  jsTag = "<script src='/js/dependent.complete.js'></script>"
  test.equals js('dependent'), jsTag

  request 'http://localhost:3588/js/dependent.complete.js', (err, res, body) ->
    test.ok !err
    test.equals res.headers['content-type'], 'application/javascript'
    expectedBody = '''
    (function(){this.proclamation="Everyone is counting on me!"}).call(this),alert("HEY"),function(){}.call(this)
    '''
    test.equals body, expectedBody
    test.done()