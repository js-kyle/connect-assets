var connect = require("connect");
var connectAssets = require("../lib/connect-assets");

var app = connect();
app.use(connectAssets({
  paths: [ "test/assets/js" ]
}));

app.use(function (req, res) {
  res.end(js("mains"));
});

app.listen(3000);
