process.env.NODE_ENV = 'development'
path = require 'path'
request = require 'request'

app = require('connect').createServer()
assets = require('../lib/assets.js')
app.use assets src: path.join(__dirname, 'assets')
app.listen 3590

# exports['Compiled stylesheets work from absolute options.src'] = (test) ->
#   cssTag = "<link rel='stylesheet' href='/css/button.css'>"
#   test.equals css('button'), cssTag
#   test.done()

#   request 'http://localhost:3588/css/button.css', (err, res, body) ->
#     throw err if err
#     expectedBody = '''
#     .button {
#       -webkit-border-radius: 5px;
#       -moz-border-radius: 5px;
#       border-radius: 5px;
#     }\n
#     '''
#     test.equals body, expectedBody
#     test.done()

exports['JS dependencies work from absolute options.src'] = (test) ->
  jsTags = """<script src='/js/subdir/nested/hobbits.js'></script>
  <script src='/js/tree-dependent.js'></script>
  """
  test.equals js('tree-dependent'), jsTags
  test.done()
  app.close()