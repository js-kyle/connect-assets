
fs = require 'fs'
_ = require 'underscore'

watch_tree = require './../watch-tree'
{check_exec_options,check_exec,EventBuffer,listsContainSameElements} = require './testing_util'

cwd = process.cwd()
tmp = "#{cwd}/lib/test/temp"

console.log tmp

# mtime resolution can be as coarse as one second!
delay = (callback) ->
  setTimeout callback, 1200


testWatch = (t, options) ->

  # Clean up
  check_exec "mkdir -p #{tmp}", () ->
    check_exec "touch #{tmp}/temp", () ->
      check_exec_options "rm *", {cwd: tmp}, () ->

        # Preexisting files
        check_exec "touch #{tmp}/X", () ->
          check_exec "touch #{tmp}/Y", () ->

            # Start watching
            if options
              w = watch_tree.watchTree tmp, options
            else
              w = watch_tree.watchTree tmp
            eb = new EventBuffer
            _.forEach watch_tree.EVENTS, (k) ->
              w.on k, (x) -> eb.event [k, x]
            eb.expect t, 'filePreexisted', (ev) ->
              eb.expect t, 'filePreexisted', (ev2) ->
                listsContainSameElements t, [ev[1], ev2[1]], ["#{tmp}/X", "#{tmp}/Y"]
                eb.expect t, 'allPreexistingFilesReported', () ->

                  # Create Z
                  delay () -> check_exec "touch #{tmp}/Z"
                  eb.expect t, 'fileCreated', "#{tmp}/Z", () ->

                    # Mofify Y
                    delay () -> check_exec "date >> #{tmp}/Y"
                    eb.expect t, 'fileModified', "#{tmp}/Y", () ->

                      # Remove X
                      check_exec "rm #{tmp}/X"
                      eb.expect t, 'fileDeleted', "#{tmp}/X", () ->

                        # Create X again
                        check_exec "touch #{tmp}/X"
                        eb.expect t, 'fileCreated', "#{tmp}/X", () ->

                          # Woot!
                          w.end()
                          t.finish()


module.exports =

  undefined: (t) ->
    testWatch t

  empty: (t) ->
    testWatch t, {}

  match: (t) ->
    testWatch t, {match: '.*'}

  ignore: (t) ->
    testWatch t, {ignore: 'vMk8F6eB'}

  sample_rate: (t) ->
    testWatch t, {'sample-rate': 1}

