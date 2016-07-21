var peer = null;
var conn = null;
var peerId = null;

function initialize() {
  peer = new Peer('', {
    host: "localhost",
    port: 3000,
    path: '/gameSI',
    debug: 3
  });
  peer.on('open', function(id) {
    peerId = id;
  });
  peer.on('error', function(err) {
    alert(''+err);
  });
}

initialize();
if ($(".peerID").html().length === 0) {
  peer.on('open', function() {
    $.ajax({
      type: 'GET',
      data: {peerID: peerId},
      contentType: 'application/json',
      url: 'http://localhost:3000/endpoint',
      success: function(data) {
        console.log('success');
        console.log(data);
      }
    });
  });

  peer.on('connection', function(c) {
    if(conn) {
      c.close();
      return;
    }
    conn = c;
    conn.on('data', function(data) {
      console.log('Received', data);
    });
    conn.send('Hello!');
  });
} else {
  peer.on('open', function() {
    var destId = $(".peerID").html();
    conn = peer.connect(destId, {
      reliable: true
    });
    conn.on('open', function() {
      conn.on('data', function(data) {
      console.log('Received', data);
    });
    conn.send('Hello2!');
    });
  });
}