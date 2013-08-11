var connect = require("connect");
var connectAssets = require("../index");

var app = connect();
app.use(connectAssets({
  paths: [ "test/assets/js" ]
}));

app.use(function (req, res) {
  res.end(js("main"));
});

app.listen(3000);
