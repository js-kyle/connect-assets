

## watch-tree

...is yet another NodeJS FS-watching library. If it happens to suit your needs better than the others, enjoy!

The current implementation maintains a ring of paths (both files and dirs), and stats the next one every (<code>--sample-rate=</code>) ms.

More efficient implementations will be added eventually, including inotify (for Linux) and FSEvents (for Mac), with the appropriate one being compiled at (<code>npm install</code>)-time.

Your code won't notice the difference when that happens, but your battery life might.

## Installing
<pre>
npm install watch-tree
</pre>

## Command-line tool

### Usage
<pre>
watch-tree [[relative_]path]
    [--ignore=(...regex...)]
    [--match=(...regex...)]
    [--sample-rate=(...ms...)]
</pre>

### Example
<pre>
cd ~/repos/watch-tree; watch-tree '--ignore=/\.'
</pre>
stdout:
<pre>
...
["filePreexisted","/Users/a/repos/node-watch-tree/README.md","2011-01-14T18:34:56.000Z"]
["allPreexistingFilesReported"]
["fileModified","/Users/a/repos/node-watch-tree/README.md","2011-01-14T18:35:05.000Z"]
["fileCreated","/Users/a/repos/node-watch-tree/foo","2011-01-14T18:35:07.000Z"]
["fileDeleted","/Users/a/repos/node-watch-tree/foo"]
</pre>

## NodeJS

The watcher returned by <code>.watchTree</code> is a [NodeJS <code>EventEmitter</code>](http://nodejs.org/docs/v0.3.4/api/events.html) instance.

<pre>
watcher = require('watch-tree').watchTree(path, {'sample-rate': 5});
watcher.on('fileDeleted', function(path) {
    console.log("Quoth the walrus: Noooo, they're deleting mah " + path + "!");
});
</pre>


### Events

<table>
    <tr>
        <th>Event</th>
        <th>Callback Arguments</th>
    </tr>
    <tr>
        <td>filePreexisted</td>
        <td>path, stats</td>
    </tr>
    <tr>
        <td>allPreexistingFilesReported</td>
        <td></td>
    </tr>
    <tr>
        <td>fileCreated</td>
        <td>path, stats</td>
    </tr>
    <tr>
        <td>fileModified</td>
        <td>path, stats</td>
    </tr>
    <tr>
        <td>fileDeleted</td>
        <td>path</td>
    </tr>
</table>

...where <code>stats</code> is a [NodeJS fs.Stats](http://nodejs.org/docs/v0.3.4/api/fs.html#fs.stat) instance.

## Developing
<pre>
# Install
git clone https://github.com/tafa/node-watch-tree.git; cd node-watch-tree
npm link

# Develop
coffee -cwlo lib src

# Push
cake build &amp;&amp; cake test
</pre>
