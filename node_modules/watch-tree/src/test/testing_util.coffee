
{exec} = require 'child_process'
sys = require 'sys'


exports.check_exec_options = check_exec_options = (cmd, options, callback) ->
  exec cmd, options, (e, stdout, stderr) ->
    throw e if e
    callback() if callback


exports.check_exec = check_exec = (cmd, callback) ->
  exec cmd, (e, stdout, stderr) ->
    throw e if e
    callback() if callback


exports.listsContainSameElements = listsContainSameElements = (t, arr1, arr2) ->
  d1 = {}
  d2 = {}
  for x in arr1
    d1[x] = true
  for x in arr2
    d2[x] = true
  t.deepEqual d1, d2


exports.EventBuffer = class EventBuffer
  
  constructor: () ->
    @stack = []
    @callback = null
  
  wait: (callback) ->
    if @stack.length > 0
      event = @stack.pop()
      callback event
    else
      if @callback
        throw new Error "Only store one callback"
      @callback = callback
  
  expect: (t, args...) ->
    sys.debug "Expecting #{args[0]}..."
    @wait (event) ->
      for x, i in args[...-1]
        t.equal event[i], x
      args[-1...][0](event)
  
  event: (event) ->
    if @callback
      callback = @callback
      @callback = null
      callback event
    else
      @stack.push event


