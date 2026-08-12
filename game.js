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

  if ( !state.ballAttached ) moveBall();
}

function moveBall() {
  const ball = state.ball;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if ( ball.x - ball.r <= 0 ) {
    ball.x = ball.r;
    ball.vx = -ball.vx;
  } else if ( ball.x + ball.r >= canvas.width ) {
    ball.x = canvas.width - ball.r;
    ball.vx = -ball.vx;
  }

  if ( ball.y - ball.r <= 0 ) {
    ball.y = ball.r;
    ball.vy = -ball.vy;
  }

  checkPaddleCollision();

  if ( ball.y + ball.r >= canvas.height ) {
    ball.y = canvas.height - ball.r;
    ball.vx = 0;
    ball.vy = 0;
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame( loop );
}

const PADDLE_MAX_BOUNCE_ANGLE = Math.PI * ( 60 / 180 );

function checkPaddleCollision() {
  const ball = state.ball;
  const paddle = state.paddle;

  if ( ball.vy <= 0 ) return;
  if ( ball.y + ball.r < paddle.y ) return;
  if ( ball.y - ball.r > paddle.y + paddle.h ) return;
  if ( ball.x + ball.r < paddle.x ) return;
  if ( ball.x - ball.r > paddle.x + paddle.w ) return;

  const paddleCenter = paddle.x + paddle.w / 2;
  const relativeIntersect = ( ball.x - paddleCenter ) / ( paddle.w / 2 );
  const clamped = Math.max( -1, Math.min( 1, relativeIntersect ) );
  const angle = clamped * PADDLE_MAX_BOUNCE_ANGLE;

  ball.vx = ball.speed * Math.sin( angle );
  ball.vy = -ball.speed * Math.cos( angle );
  ball.y = paddle.y - ball.r;
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
