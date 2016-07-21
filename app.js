var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();

var peerID = null;

app.use(express.static('./public'));

app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs');

app.get('/', function (req, res) {
    if (peerID !== null) {
      res.render('home', {
        peerID : peerID
      });
    } else {
      res.render('home');
    }
});

var srv = app.listen(3000, function() {
  console.log('Listening on '+3000);
});

app.get('/endpoint', function(req, res){
  console.log('peerID: ' + JSON.stringify(req.query.peerID));
  peerID = req.query.peerID;
  res.send(peerID);
});


app.use('/gameSI', require('peer').ExpressPeerServer(srv, {
  debug: true
}));