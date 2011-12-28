process.env.NODE_ENV = 'development'
path = require 'path'
request = require 'request'

app = require('connect').createServer()
assets = require('../lib/assets.js')
app.use assets src: path.join(__dirname, 'assets')
app.listen 3590

exports['Compiled stylesheets work from absolute options.src'] = (test) ->
  cssTag = "<link rel='stylesheet' href='/css/button.css'>"
  test.equals css('button'), cssTag

  request 'http://localhost:3590/css/button.css', (err, res, body) ->
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

exports['Single .js files work from absolute options.src'] = (test) ->
  test.equals js('js-dependency'), "<script src='/js/js-dependency.js'></script>"

  request 'http://localhost:3590/js/js-dependency.js', (err, res, body) ->
    throw err if err
    expectedBody = '// Admit it: You need me.'
    test.equals body, expectedBody
    test.done()

exports['Single .coffee files work from absolute options.src'] = (test) ->
  test.equals js('a'), "<script src='/js/a.js'></script>"

  request 'http://localhost:3590/js/a.js', (err, res, body) ->
    throw err if err
    expectedBody = '(function() {\n  alert(\'I require nothing!\');\n}).call(this);\n'
    test.equals body, expectedBody
    test.done()

exports['JS dependencies work from absolute options.src'] = (test) ->
  jsTags = """<script src='/js/subdir/nested/hobbits.js'></script>
  <script src='/js/tree-dependent.js'></script>
  """
  test.equals js('tree-dependent'), jsTags

  request 'http://localhost:3590/js/tree-dependent.js', (err, res, body) ->
    throw err if err
    expectedBody = '(function() {\n\n}).call(this);\n'
    test.equals body, expectedBody
    test.done()
    app.close()