const config = {
  type: Phaser.AUTO,    //which rendere to user
  width: 800,  // canvas width in pixels
  height:600, //canvas height in pixels
  parent: "game-container", // ID of the Dom element  to add the canvas
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 490 },
      debug:false
    }
  },
  scene: {
    preload:preload,
    create: create,
    update: update
  }

};
// all of these are declared outside of the functions so that all of
// the functions they need are able to access them
// with they updated capablites that are defined in the functions

const game = new Phaser.Game(config);
let player;
let controls;
let cursors;

let showDebug = false;
let coins;
let score = 0;
let scoreText;

let gameOver = false;
let wonGame = false;
let winningCoin;

function preload(){

  this.load.image("tiles", "assets/tileImage/penguin_Runner_image_trans_part2.png");
  this.load.tilemapTiledJSON("map", "assets/tileset/tilemaps/ice_penguin_platform_level_1.json");
  //player related loading
  this.load.atlas("atlas","assets/atlas/penguinRunnerCharacter-0.png", "assets/atlas/penguinRunnerCharacter.json");
  //coins that will be used through out the game
  this.load.atlas("coins","assets/coins/coinSheet-0.png", "assets/coins/coinSheet.json");
}

function create(){
const map = this.make.tilemap({key: "map"});

//this section is to match the data in the tilemap with that in the json file
const tileset = map.addTilesetImage("PenguinTileset_1", "tiles");

//These are the layers of the tile map these layers are called dynamically.
const backgroundLayer = map.createDynamicLayer('background_Layer', tileset, 0, 0);
const objectLayer = map.createDynamicLayer('object_Layer', tileset, 0, 0);
const surfaceLayer = map.createDynamicLayer('surface_Layer', tileset, 0, 0);

//this part is to help with collision. since tilemaps where used.
objectLayer.setCollisionByProperty({collides: true});
surfaceLayer.setCollisionByProperty({collides: true});
this.physics.world.bounds.width = surfaceLayer.width;
this.physics.world.bounds.height = surfaceLayer.height;


//player related, this defines the player and his starting posistion.
const spawnPoint = map.findObject("objects", obj => obj.name === "spawn point");
      player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "atlas", "walk/penguin_walk01.png");
      player.setBounce(0.3);
      player.setCollideWorldBounds(true); // don't go out of the map

//this is the setup of the winning coin. for winning the game he gets and extra 50 points
const winningPoint = map.findObject("winObject", obj => obj.name === "winning point");
      winningCoin = this.physics.add.sprite(winningPoint.x, winningPoint.y, "coins", "Blue/blue_coin_hexagon_1.png");
      winningCoin.setCollideWorldBounds(true);

//this animation for movement of the Player
const anims = this.anims;

let frameNameWalk = anims.generateFrameNames("atlas", {
                    start: 1, end:4, zeroPad:2,
                    prefix: 'walk/penguin_walk', suffix: '.png'
                    });
let frameNamejump = anims.generateFrameNames("atlas", {
                    start: 1, end:3, zeroPad:2,
                    prefix: 'jump/penguin_jump', suffix: '.png'
                    });
let frameNameDie = anims.generateFrameNames("atlas", {
                    start: 1, end:4, zeroPad:2,
                    prefix: 'die/penguin_die', suffix: '.png'
                    });
let frameNameSlide = anims.generateFrameNames("atlas", {
                    start: 1, end:2, zeroPad:2,
                    prefix: 'slide/penguin_slide', suffix: '.png'
                    });
let frameNameStatic = anims.generateFrameNames("atlas",{
                    start:1, end:1, zeroPad:2,
                    prefix: 'walk/penguin_walk', suffix:".png"
                    });

anims.create({
  key:"walk",
  frames:frameNameWalk,
  frameRate: 10,
  repeat: -1
  });

anims.create({
    key: "jump",
    frames: frameNamejump,
    frameRate: 10,
    repeat: -1
  });

/*anims.create({
  key: "hurt",
  frames: frameNamehurt,
  frameRate: 0,
  repeat: 1
});*/

anims.create({
  key: "die",
  frames: frameNameDie,
  frameRate: 10,
  repeat: 0
  });

anims.create({
  Key: "slide",
  frames: frameNameSlide,
  frameRate: 10,
  repeat: -1
  });

anims.create({
  key: "static",
  frames: frameNameStatic,
  frameRate: 10,
  repeat: -1
  });

//this is for the animation of the coins

let frameNameGoldcoins = anims.generateFrameNames("coins", {
                        start:1, end:6, zeroPad:1,
                        prefix: "Gold/gold_coin_hexagon_", suffix:".png"
                        });

let frameNameBlueCoin = anims.generateFrameNames("coins",{
                        start:1, end:6, zeroPad:1,
                        prefix:"Blue/blue_coin_hexagon_", suffix:".png"
                        });

anims.create({
  key: "movingGoldcoin",
  frames: frameNameGoldcoins,
  frameRate: 10,
  repeat: -1
});

anims.create({
  key: "movingBlueCoin",
  frames: frameNameBlueCoin,
  frameRate: 10,
  repeat: -1
});

coins = this.physics.add.group({
    key: 'coins',
    repeat: 45,
    setXY: { x: 12, y: 0, stepX: 190 }
});


  coins.children.iterate(function (child) {

    //  Give each coin a slightly different bounce
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    child.setCollideWorldBounds(true);
});


anims.play("movingGoldcoin", coins.getChildren());

winningCoin.anims.play("movingBlueCoin", true);

//the camera is there for the player to see and view the platform and player movements
const camera = this.cameras.main;
camera.startFollow(player);
//this is for the camera not to move outside of the tilemap.
camera.setBounds(0,0, map.widthInPixels, map.heightInPixels);




//The score keeper
scoreText = this.add.text(70, 70, 'score: 0', { fontSize: '32px', fill: '#ffffff' }).setScrollFactor(0);

//this section deals with the collisions between the player, objects and the surfaces.
this.physics.add.collider(coins, surfaceLayer);
this.physics.add.collider(winningCoin, surfaceLayer);
this.physics.add.collider(player, surfaceLayer);
this.physics.add.overlap(player, coins, collectCoin, null, this);
this.physics.add.overlap(player, winningCoin, collectWinningCoin, null, this);
this.physics.add.collider(player, objectLayer, destroy, null, this);

//setting up camera to be able to follow the player where ever he goes,
//plus setting up the ability for the player to move with the use of arrows.

cursors = this.input.keyboard.createCursorKeys();

controls = new Phaser.Cameras.Controls.FixedKeyControl({
  camera: camera,
  left: cursors.left,
  right: cursors.right,
  up: cursors.up,
  down: cursors.down,
  speed: 0.5
});


}

//this function is setup to continuously check for changes in the game.
//This includes movement and also end of Game possibilities for this game
function update (time, delta){
  //condition to endGame when the player loses
  if (gameOver)
  {
      // Display word "Game Over" at center of the screen game
      let gameOverText = this.add.text( 300, 200, 'GAME OVER', { fontSize: '35px', fill: '#fff' }).setScrollFactor(0);

      // Set z-index just in case your text show behind the background.
      gameOverText.setDepth(1);
      return;
  }
//conditon to win the game when the player wins
  if (wonGame)
  {
    // Display word "Game Over" at center of the screen game
    let wonGameText = this.add.text( 300, 200, 'YOU WON!!!', { fontSize: '35px', fill: '#fff' }).setScrollFactor(0);

    // Set z-index just in case your text show behind the background.
    wonGameText.setDepth(1);
    return;
  }
  // Apply the controls to the camera each update tick of the game
  controls.update(delta);
  const momentum = 200;

  if (cursors.right.isDown) {

      player.setVelocityX(momentum);
      player.anims.play("walk", true);
      player.flipX= false; // flip the sprite to the left

  } else if (cursors.left.isDown) {

       player.setVelocityX(-momentum);
       player.anims.play("walk", true);
       player.flipX= true;

  }else {
    //stoping any previous movement from the last frame
       player.setVelocityX(0);
       player.anims.play("static", true);
    }
  //side note: fix the jumping element.
  if (cursors.up.isDown && player.body.onFloor()){

        player.setVelocityY(-400);
        player.anims.play("jump", true);

    }

}
//this function is set up to collect the gold coins
function collectCoin (player, coin){
    coin.disableBody(true, true);
    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);
}


// this function is set up for the player to winn the game.
function collectWinningCoin (player, winningCoin){
  //basically makes the coin invisible after collision.
    winningCoin.disableBody(true, true);
    //  Add and update the score
    // for winning the game he gets an extra 50 points
    score += 50;
    scoreText.setText('Score: ' + score);
    //this is setup to activate the winning condition. and end the game.
    this.physics.pause();
    wonGame = true;

}

//this functions is basically setup to "kill the player
// when he touches the objectLayer or th whitespikes"
function destroy (player, objectLayer)
{
    this.physics.pause();
    player.setTint(0x3D85C6);
    player.anims.play("die");
    gameOver = true;
}
