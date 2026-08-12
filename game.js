const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const BRICK_COLS = 8;
const BRICK_ROWS = 5;
const BRICK_W = 90;
const BRICK_H = 24;
const BRICK_GAP = 5;
const BRICK_MARGIN_LEFT = 25;
const BRICK_MARGIN_TOP = 40;
const ROW_COLORS = [ 'red', 'yellow', 'green', 'cyan', 'magenta' ];

function createBricks() {
  const bricks = [];
  for ( let row = 0; row < BRICK_ROWS; row++ ) {
    for ( let col = 0; col < BRICK_COLS; col++ ) {
      bricks.push( {
        x: BRICK_MARGIN_LEFT + col * ( BRICK_W + BRICK_GAP ),
        y: BRICK_MARGIN_TOP + row * ( BRICK_H + BRICK_GAP ),
        w: BRICK_W,
        h: BRICK_H,
        color: ROW_COLORS[ row ],
        alive: true,
      } );
    }
  }
  return bricks;
}

function createInitialState() {
  return {
    screen: 'playing', // 'playing' | 'won' | 'lost'
    score: 0,
    lives: 3,
    ballAttached: true,

    paddle: { x: 320, y: 560, w: 162, h: 14, speed: 8 },

    ball: { x: 401, y: 546, r: 8, vx: 0, vy: 0, speed: 5.6 },

    bricks: createBricks(),
  };
}

let state = createInitialState();

const keys = { left: false, right: false };

window.addEventListener( 'keydown', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = true;
  if ( e.key === 'ArrowRight' ) keys.right = true;
} );

window.addEventListener( 'keyup', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = false;
  if ( e.key === 'ArrowRight' ) keys.right = false;
} );

function update() {
  const paddle = state.paddle;
  if ( keys.left ) paddle.x -= paddle.speed;
  if ( keys.right ) paddle.x += paddle.speed;
  paddle.x = Math.max( 0, Math.min( canvas.width - paddle.w, paddle.x ) );
}

function loop() {
  update();
  draw();
  requestAnimationFrame( loop );
}

function draw() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  for ( const brick of state.bricks ) {
    if ( !brick.alive ) continue;
    drawSprite( ctx, `block_${ brick.color }`, brick.x, brick.y, brick.w, brick.h );
  }

  drawSprite( ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h );
  drawSprite( ctx, 'ball', state.ball.x - state.ball.r, state.ball.y - state.ball.r, state.ball.r * 2, state.ball.r * 2 );
}

loadSpritesheet( loop );
