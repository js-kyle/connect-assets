fs            = require 'fs'
{print}       = require 'util'
{spawn, exec} = require 'child_process'
watchit       = require 'watchit'

build = (watch, callback) ->
  if typeof watch is 'function'
    callback = watch
    watch = false
  options = ['-c', '-o', 'lib', 'src']
  options.unshift '-w' if watch

  coffee = spawn './node_modules/.bin/coffee', options
  coffee.stdout.on 'data', (data) -> print data.toString()
  coffee.stderr.on 'data', (data) -> print data.toString()
  coffee.on 'exit', (status) -> callback?() if status is 0

task 'docs', 'Generate annotated source code with Docco', ->
  fs.readdir 'src', (err, contents) ->
    files = ("src/#{file}" for file in contents when /\.coffee$/.test file)
    docco = spawn './node_modules/.bin/docco', files
    docco.stdout.on 'data', (data) -> print data.toString()
    docco.stderr.on 'data', (data) -> print data.toString()
    docco.on 'exit', (status) -> callback?() if status is 0

task 'build', 'Compile CoffeeScript source files', ->
  build()

task 'watch', 'Recompile CoffeeScript source files when modified', ->
  build true

task 'test', 'Run the test suite', ->
  suite = null
  build false, ->
    nodeunit = require 'nodeunit'
    reporter = nodeunit.reporters.default

    do runTests = ->
      suite?.kill()
      suiteNames = [
        'DevelopmentIntegration'
        'ProductionIntegration'
        'AbsoluteIntegration'
        'RemoteIntegration'
        'CdnIntegration'
        'BenchmarkDynamic'
        'BenchmarkStatic'
      ]
      suiteIndex = 0
      codes = 0
      do runNextTestSuite = ->
        suiteName = suiteNames[suiteIndex]

        if suiteName
          suite = spawn "coffee", ["-e", "{reporters} = require 'nodeunit'; reporters.default.run ['#{suiteName}.coffee'], null, (err) -> process.exit(if err then 1 else 0)"], cwd: 'test'
          suite.stdout.on 'data', (data) -> print data.toString()
          suite.stderr.on 'data', (data) -> print data.toString()
          suite.on 'exit', (code) ->
            codes += code
            suiteIndex++
            runNextTestSuite()
        else
          process.exit codes