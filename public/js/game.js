var peer = null;
var conn = null;
var peerId = null;
var wWidth = 800;
var wHeight = 600;
var bulletVelocity = 650;
var chaserVelocity = 300;
var sprite;
var bullet;
var bullets;
var bullets2;
var bulletTime = 0;
var bulletTime2 = 0;
var leftKey;
var rightKey;
var spaceKey;
var target;

function initialize() {
  peer = new Peer('', {
    host: location.hostname,
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

function preload() {
  game.load.image('background', 'assets/background.png');
  game.load.image('chaser', 'assets/chaser.png');
  game.load.image('target', 'assets/target.png');
  game.load.image('bullet', 'assets/bullet.png');
}

var Target = function (game, client) {
  Phaser.Sprite.call(this, game, 400, 275, 'target');
  game.add.existing(this);
  game.physics.enable(this, Phaser.Physics.ARCADE);
  this.client = client;
};

Target.prototype = Object.create(Phaser.Sprite.prototype);
Target.prototype.constructor = Target;
Target.prototype.update = function() {
  if (this.client === "local" && conn !== null) {
    var move = game.input.activePointer.position.x;
    this.body.x = move;
    conn.send({move: move});

    if (game.input.activePointer.leftButton.isDown) {
      conn.send({fire: true});
      fireBullet2(this);
    }
  }

  game.physics.arcade.overlap(bullets, this, hitSprite, null, game);
};

var Chaser = function (game, client) {
  Phaser.Sprite.call(this, game, 400, 550, 'chaser');
  game.add.existing(this);
  game.physics.enable(this, Phaser.Physics.ARCADE);
  this.client = client;
};

Chaser.prototype = Object.create(Phaser.Sprite.prototype);
Chaser.prototype.constructor = Chaser;
Chaser.prototype.update = function() {
  if (this.client === "local" && conn !== null) {
    var move = game.input.activePointer.position.x;
    this.body.x = move;
    conn.send({move: move});

    if (game.input.activePointer.leftButton.isDown) {
      conn.send({fire: true});
      fireBullet(this);
    }
  }

  game.physics.arcade.overlap(bullets2, this, hitSprite, null, game);
};

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  game.stage.backgroundColor = '#F7D358';

  background = game.add.tileSprite(0, 0, wWidth, wHeight, "background");

  bullets = game.add.group();

  bullets.enableBody = true;

  bullets.physicsBodyType = Phaser.Physics.ARCADE;

  bullets.createMultiple(1, 'bullet');
  bullets.callAll('events.onOutOfBounds.add', 'events.onOutOfBounds', resetBullet, this);
  bullets.setAll('checkWorldBounds', true);

  bullets2 = game.add.group();

  bullets2.enableBody = true;

  bullets2.physicsBodyType = Phaser.Physics.ARCADE;

  bullets2.createMultiple(1, 'bullet');
  bullets2.callAll('events.onOutOfBounds.add', 'events.onOutOfBounds', resetBullet, this);
  bullets2.setAll('checkWorldBounds', true);

  game.physics.arcade.enable([bullets2, bullets]);

  game.input.mouse.capture = true;
}

function fireBullet(chaser) {
  if (game.time.now > bulletTime) {
    bullet = bullets.getFirstExists(false);
    if (bullet) {
      bullet.reset(chaser.x + ((chaser.width - bullet.width)), chaser.y - 8);
      bullet.body.velocity.y = -bulletVelocity;
      bulletTime = game.time.now + 250;
    }
  }
}

function fireBullet2(target) {
  if (game.time.now > bulletTime2) {
    bullet2 = bullets2.getFirstExists(false);
    if (bullet2) {
      bullet2.reset(target.x + ((target.width - bullet2.width)), target.y  + 20);
      bullet2.body.velocity.y = bulletVelocity;
      bulletTime2 = game.time.now + 250;
    }
  }
}

function resetBullet(b) {
  b.kill();
}

function hitSprite(sprite1, sprite2) {
  sprite1.kill();
  sprite2.kill();
  $(".peerID").after("<h3>ganaste!</h3>");
  if (conn !== null) {
    conn.send({result: true});
  }
}

function createTarget(client) {
  var target = new Target(game, client);
  game.world.add(target);

  return target;
}

function createChaser(client) {
  var chaser = new Chaser(game, client);
  game.world.add(chaser);

  return chaser;
}

initialize();
var game = new Phaser.Game(wWidth, wHeight, Phaser.AUTO, 'phaser-example', {
  preload: preload,
  create: create
});

if ($(".peerID").html().length === 0) {
  peer.on('open', function() {
    $.ajax({
      type: 'GET',
      data: {peerID: peerId},
      contentType: 'application/json',
      url: '/endpoint',
      success: function(data) {
        console.log('success');
        console.log(data);
      }
    });
    var targetLocal = createTarget("local");
  });

  peer.on('connection', function(c) {
    var chaserRemote;
    if(conn) {
      c.close();
      return;
    }
    conn = c;
    conn.on('data', function(data) {
      if (data.sprite === "chaser") {
          chaserRemote = createChaser("remote");
          conn.send({sprite: "target"});
      }

      if (data.move) {
          chaserRemote.x = data.move;
      }
      if (data.fire) {
        fireBullet(chaserRemote);
      }
      if (data.result) {
        $(".peerID").after("<h3>perdiste!</h3>");
      }
    });
  });
} else {
  peer.on('open', function() {
    var destId = $(".peerID").html();
    conn = peer.connect(destId, {
      reliable: true
    });

    var chaserLocal = createChaser("local");

    conn.on('open', function() {
      var targetRemote;
      conn.on('data', function(data) {
        if (data.sprite === "target") {
          targetRemote = createTarget("remote");
        }

        if (data.move) {
          targetRemote.x = data.move;
        }
        if (data.fire) {
          fireBullet2(targetRemote);
        }
        if (data.result) {
          $(".peerID").after("<h3>perdiste!</h3>");
        }
      });

      conn.send({sprite: "chaser"});
    });
  });
}