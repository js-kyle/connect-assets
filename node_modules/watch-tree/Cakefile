
fs = require 'fs'
{exec} = require 'child_process'


task 'test', 'run tests', () ->
  async_testing = require 'async_testing'
  async_testing.run('lib/test/tests.js', [])


task 'build', 'src/ --> lib/', () ->
  # .coffee --> .js
  exec 'coffee -co lib src', (err, stdout, stderr) ->
    if err
      console.log stdout
      console.log stderr
      throw new Error "Error while compiling .coffee to .js"

