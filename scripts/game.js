var car;
var cursors;
var map;
var mapLayers = {};
var checkpoints = [];
var currentCheckpoint = 0;
var laps = 1;
var currentLap = 1;
var labels = {};
var timer;
var raceTime = 0;
var font = "LDFComicSans";
var background;
var introImage;
var currentSpeed = 0;
var maxSpeed = 300;

var GameState = {
  preload: function() {
    // W tej metodzie ładujemy wszystkie potrzebne assety
    game.load.image('car', 'assets/images/cars/car1_green.png');
    game.load.image('tiles', 'assets/images/tiles.png');
    game.load.tilemap('map', 'maps/mapa.json', null, Phaser.Tilemap.TILED_JSON);
		game.load.image('intro', 'assets/images/intro.png');
		game.load.image('background', 'assets/images/bg.png');
  },

  create: function() {
    // Metoda create uruchamia się zaraz po uruchomieniu stanu,
    // możemy w niej zdefiniować zmienne, które będziemy w trakcie gry wykorzystywać
    game.physics.startSystem(Phaser.Physics.ARCADE);
		cursors = game.input.keyboard.createCursorKeys();
    this.createMap();
		this.createIntro();

		this.createCar();
		//this.finish();
  },

	createIntro() {
		game.paused = true;
		background = game.add.sprite(0,0,'background');
		background.fixedToCamera = true;

		introImage = game.add.sprite(0,0,'intro');
		introImage.fixedToCamera = true;

		labels.intro = game.add.text(game.width/2, 655,
			"Press UP to start!",
			{font: "24px "+font, fill: "#fff"}
		);
		labels.intro.anchor.setTo(0.5);

		cursors.up.onDown.add(this.start, this);
	},

	start() {
		game.paused = false;
		introImage.kill();
		labels.intro.kill();
		background.visible = false;

		this.createLabels();

		timer = game.time.events.loop(10, this.timerFormat);
		cursors.up.onDown.remove(this.start, this);
	},

  createMap() {
    map = game.add.tilemap('map');
    map.addTilesetImage('tiles');
    mapLayers.grass = map.createLayer('Grass');
    mapLayers.road = map.createLayer('Road');
    mapLayers.collisions = map.createLayer('Collisions');

    mapLayers.road.resizeWorld();
    map.setCollisionBetween(0, 25, true, mapLayers.collisions);
    mapLayers.collisions.debug = true;

    this.parseCheckpoints(mapLayers.road.layer.properties);
  },

  parseCheckpoints(positions) {
    //for(var i=0; i < laps; i++){
    for (var tile in positions) {
      var pos = positions[tile].split(',');
      checkpoints.push({
        x: pos[0],
        y: pos[1]
      });
    }
    //}

  },

  createCar() {
    car = game.add.sprite(200, 200, 'car');
    game.physics.enable(car);
    car.anchor.setTo(0.4, 0.5);
    car.body.collideWorldBounds = true;
    game.camera.follow(car);
    car.position.x = 200;
    car.position.y = 140;
    car.angle = 180;

    car.body.setSize(10, 10, 10, 5);
		car.body.maxAngular = 200;
  },

  createLabels() {
    labels.checkpoints = game.add.text(20, 20,
      "Checkpoints: " + currentCheckpoint + "/" + checkpoints.length, {
        font: '24px '+font,
        fill: '#ffffff'
      }
    );
    labels.checkpoints.fixedToCamera = true;

    labels.laps = game.add.text(game.width - 200, 20,
      "Laps: " + currentLap + "/" + laps, {
        font: '24px '+font,
        fill: '#ffffff'
      }
    );
    labels.laps.fixedToCamera = true;
    labels.laps.anchor.x = 1;

		labels.timer = game.add.text(game.width/2, 20,
			"Time: 00:00:00", {
			font: '24px '+font,
			fill: '#ffffff'}
		);
		labels.timer.fixedToCamera = true;
		labels.timer.setTextBounds(-90, 0, 180, 100);
  },

	timerFormat() {
		raceTime++;
		var date = new Date(null);
		date.setSeconds(raceTime);
		labels.timer.setText("Time: "+date.toISOString().substr(11, 8));
	},

  update: function() {
    // Główna pętla gry
    // Metoda uruchamiana jest z bardzo dużą częstotliwością (~60 fps)
    this.controlCar();
    game.physics.arcade.collide(car, mapLayers.collisions);

    var currentTile = map.getTile(
      mapLayers.road.getTileX(car.body.x),
      mapLayers.road.getTileY(car.body.y), 'Road'
    );

    if (currentTile == null) {
      if (car.body.velocity.x !== 0 || car.body.velocity.y !== 0) {
				currentSpeed = 100;
        game.camera.shake(0.001, 100);
      }
    }

    this.checIfTileisCheckpoint(
      mapLayers.road.getTileX(car.body.x),
      mapLayers.road.getTileY(car.body.y)
    );
  },

  checIfTileisCheckpoint(x, y) {
    //console.log(x+":"+y+" | " + checkpoints[currentCheckpoint].x+":"+checkpoints[currentCheckpoint].y);
    if (currentCheckpoint == checkpoints.length) return;
    if (x == checkpoints[currentCheckpoint].x && y == checkpoints[currentCheckpoint].y) {
      console.log("Checkpoint!");
      this.nextCheckpoint();
    }
  },

  nextCheckpoint() {
    currentCheckpoint++;

    if (currentCheckpoint === checkpoints.length) {
      currentCheckpoint = 0;
      this.nextLap();
    }

    labels.checkpoints.setText("Checkpoints: " + currentCheckpoint + "/" + checkpoints.length);
  },

  nextLap() {
    currentLap++;

    if (currentLap > laps) {
      this.finish();
    } else {
      labels.laps.setText("Laps: " + currentLap + "/" + laps);
    }
  },

  finish() {
    labels.finish = game.add.text(game.width / 2, 300,
      "FINISH!", {
        font: '44px LDFComicSans',
        fill: '#ffffff'
      }
    );
    labels.finish.fixedToCamera = true;
		labels.finish.anchor.x = 0.5;
    labels.finish.setShadow(0, 0, 'rgba(0,0,0,0.5)', 15);

		labels.score = game.add.text(game.width / 2, 400,
      labels.timer.text, {
        font: '24px '+font,
        fill: '#ffffff'
      }
		);
		labels.score.anchor.x = 0.5;
		labels.score.setShadow(0, 0, 'rgba(0,0,0,0.5)', 15);

    labels.checkpoints.visible = false;
    labels.laps.visible = false;
		labels.timer.visible = false;
		game.time.events.remove(timer);

    game.paused = true;
  },

  controlCar() {
    car.body.velocity.x = 0;
    car.body.velocity.y = 0;

		//skręcanie
		console.log(car.body.velocity);
		if(currentSpeed != 0)
		if(cursors.left.isDown)
		{
			car.body.angularAcceleration = -1000;
		} else if( cursors.right.isDown )
		{
			car.body.angularAcceleration = 1000;
		} else
		{
			car.body.angularAcceleration = 0;
			car.body.angularVelocity = 0;
		}

		if( cursors.up.isDown )
		{
			if(currentSpeed <= maxSpeed)
				currentSpeed += 5;
		} else {
			if(currentSpeed > 0)
				currentSpeed -= 5;
		}

		if( cursors.down.isDown )
		{
			if(currentSpeed >= -maxSpeed/2)
				currentSpeed -= 5;
		} else {
			if(currentSpeed < 0)
				currentSpeed += 5;
		}

		car.body.velocity.copyFrom(game.physics.arcade.accelerationFromRotation(
				car.rotation,
				currentSpeed,
				car.body.accelerationFromRotation
			)
		);
  },

  render: function() {
    // Metoda uruchamiana po metodzie update
    //game.debug.spriteInfo(car, 32, 32);
    //game.debug.text('Velocity: ' + car.body.velocity, 32, 128);
    //game.debug.body(car);

		game.debug.text("angularVelocity: "+ car.body.angularVelocity, 32, 148);
		game.debug.text("angularAcceleration: "+ car.body.angularAcceleration, 32, 168);
		game.debug.text("Velocity: "+ car.body.velocity, 32, 208);
		game.debug.text("currentSpeed: "+ currentSpeed, 32, 228);
  }
};
