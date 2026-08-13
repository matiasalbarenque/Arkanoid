const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const ballBounceSound = new Audio( 'assets/sounds/ball-bounce.mp3' );
const breakSound = new Audio( 'assets/sounds/break-sound.mp3' );
const boostSound = new Audio( 'assets/sounds/boost.mp3' );

function playSound( audio ) {
  audio.currentTime = 0;
  audio.play();
}

const boostImg = new Image();
boostImg.loaded = false;
boostImg.onload = () => { boostImg.loaded = true; };
boostImg.src = 'assets/icons/star.png';

const BOOST_CHECK_INTERVAL = 5000;
const BOOST_SPAWN_CHANCE = 0.1;
const BOOST_FALL_SPEED = 2;
const BOOST_ROTATION_SPEED = Math.PI; // rad/s (~180°/s)
const BOOST_SIZE = 24;
const PADDLE_BOOST_STEP = 0.2; // +20% del ancho base por catch
const PADDLE_BOOST_MAX = 2; // tope: 2x ancho base
const BOOST_DURATION = 10000;

const BRICK_COLS = 11;
const BRICK_ROWS = 5;
const BRICK_W = 63.6;
const BRICK_H = 21.6;
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

    paddle: { x: 320, y: 560, w: 81, h: 14, speed: 8, baseW: 81, boostExpiresAt: null },

    ball: { x: 401, y: 546, r: 8, vx: 0, vy: 0, speed: 4.48, baseSpeed: 4.48 },

    bricks: createBricks(),

    explosions: [],

    fallingBoosts: [],
  };
}

let state = createInitialState();

const keys = { left: false, right: false };

window.addEventListener( 'keydown', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = true;
  if ( e.key === 'ArrowRight' ) keys.right = true;

  if ( state.ballAttached && state.screen === 'playing' ) {
    state.ballAttached = false;
    state.ball.vx = 0;
    state.ball.vy = -state.ball.speed;
  }
} );

window.addEventListener( 'keyup', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = false;
  if ( e.key === 'ArrowRight' ) keys.right = false;
} );

function update() {
  if ( state.screen !== 'playing' ) return;

  const paddle = state.paddle;
  if ( keys.left ) paddle.x -= paddle.speed;
  if ( keys.right ) paddle.x += paddle.speed;
  paddle.x = Math.max( 0, Math.min( canvas.width - paddle.w, paddle.x ) );

  if ( state.ballAttached ) {
    state.ball.x = paddle.x + paddle.w / 2;
    state.ball.y = paddle.y - state.ball.r;
  } else {
    moveBall();
  }

  updateExplosions();
  updateBoostSpawn();
  updateFallingBoosts();
}

function updateFallingBoosts() {
  const paddle = state.paddle;

  for ( let i = state.fallingBoosts.length - 1; i >= 0; i-- ) {
    const boost = state.fallingBoosts[ i ];
    boost.y += BOOST_FALL_SPEED;
    boost.rotation += BOOST_ROTATION_SPEED / 60;

    if ( boost.y > canvas.height ) {
      state.fallingBoosts.splice( i, 1 );
      continue;
    }

    const overlaps = boost.x < paddle.x + paddle.w && boost.x + boost.w > paddle.x &&
      boost.y < paddle.y + paddle.h && boost.y + boost.h > paddle.y;

    if ( overlaps ) {
      applyPaddleBoost();
      playSound( boostSound );
      state.fallingBoosts.splice( i, 1 );
    }
  }
}

function applyPaddleBoost() {
  const paddle = state.paddle;
  const ball = state.ball;

  paddle.w = Math.min( paddle.baseW * PADDLE_BOOST_MAX, paddle.w + paddle.baseW * PADDLE_BOOST_STEP );
  ball.speed = ball.speed * 1.10;
  paddle.boostExpiresAt = performance.now() + BOOST_DURATION;
}

let lastBoostCheckAt = performance.now();

function updateBoostSpawn() {
  const now = performance.now();
  if ( now - lastBoostCheckAt < BOOST_CHECK_INTERVAL ) return;
  lastBoostCheckAt = now;

  if ( Math.random() < BOOST_SPAWN_CHANCE ) {
    state.fallingBoosts.push( {
      x: Math.random() * ( canvas.width - BOOST_SIZE ),
      y: 0,
      w: BOOST_SIZE,
      h: BOOST_SIZE,
      rotation: 0,
    } );
    console.log( 'boost spawned' );
  }
}

const EXPLOSION_FRAME_DURATION = 150;

function updateExplosions() {
  const now = performance.now();

  for ( let i = state.explosions.length - 1; i >= 0; i-- ) {
    const explosion = state.explosions[ i ];

    if ( now - explosion.frameStartedAt >= EXPLOSION_FRAME_DURATION ) {
      explosion.frameIndex += 1;
      explosion.frameStartedAt = now;

      if ( explosion.frameIndex > 3 ) {
        state.explosions.splice( i, 1 );
      }
    }
  }
}

function moveBall() {
  const ball = state.ball;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if ( ball.x - ball.r <= 0 ) {
    ball.x = ball.r;
    ball.vx = -ball.vx;
    playSound( ballBounceSound );
  } else if ( ball.x + ball.r >= canvas.width ) {
    ball.x = canvas.width - ball.r;
    ball.vx = -ball.vx;
    playSound( ballBounceSound );
  }

  if ( ball.y - ball.r <= 0 ) {
    ball.y = ball.r;
    ball.vy = -ball.vy;
    playSound( ballBounceSound );
  }

  checkPaddleCollision();
  checkBrickCollision();

  if ( ball.y + ball.r >= canvas.height ) {
    loseLife();
  }
}

function loseLife() {
  playSound( breakSound );
  state.lives -= 1;

  state.paddle.x = 320;
  state.paddle.y = 560;

  state.ball.x = 401;
  state.ball.y = 546;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ballAttached = true;

  if ( state.lives === 0 ) {
    state.screen = 'lost';
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
  playSound( ballBounceSound );
}

function checkBrickCollision() {
  const ball = state.ball;

  for ( const brick of state.bricks ) {
    if ( !brick.alive ) continue;

    const closestX = Math.max( brick.x, Math.min( ball.x, brick.x + brick.w ) );
    const closestY = Math.max( brick.y, Math.min( ball.y, brick.y + brick.h ) );
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;

    if ( dx * dx + dy * dy > ball.r * ball.r ) continue;

    brick.alive = false;
    playSound( breakSound );
    state.score += 10;
    console.log( 'score:', state.score );

    state.explosions.push( {
      x: brick.x,
      y: brick.y,
      w: brick.w,
      h: brick.h,
      color: brick.color,
      frameIndex: 0,
      frameStartedAt: performance.now(),
      startedAt: performance.now(),
    } );

    if ( state.bricks.every( ( b ) => !b.alive ) ) {
      state.screen = 'won';
    }

    const overlapX = ball.r - Math.abs( dx );
    const overlapY = ball.r - Math.abs( dy );

    if ( overlapX < overlapY ) {
      ball.vx = -ball.vx;
    } else {
      ball.vy = -ball.vy;
    }

    break;
  }
}

const restartButton = { x: 300, y: 340, w: 200, h: 50 };

function draw() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  for ( const brick of state.bricks ) {
    if ( !brick.alive ) continue;
    drawSprite( ctx, `block_${ brick.color }`, brick.x, brick.y, brick.w, brick.h );
  }

  drawExplosions();

  drawSprite( ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h );
  drawSprite( ctx, 'ball', state.ball.x - state.ball.r, state.ball.y - state.ball.r, state.ball.r * 2, state.ball.r * 2 );

  drawHud();

  if ( state.screen === 'won' ) drawOverlay( '¡Ganaste!' );
  if ( state.screen === 'lost' ) drawOverlay( 'Perdiste' );
}

const EXPLOSION_SCALE = 1.4; // escala final, 1.0 = tamaño del bloque
const EXPLOSION_GROW_DURATION = 500; // ms que tarda en crecer de 1.0 a EXPLOSION_SCALE

function drawExplosions() {
  const now = performance.now();

  for ( const explosion of state.explosions ) {
    const frame = EXPLOSION_FRAMES[ explosion.color ][ explosion.frameIndex ];

    const t = Math.min( 1, ( now - explosion.startedAt ) / EXPLOSION_GROW_DURATION );
    const eased = 1 - ( 1 - t ) * ( 1 - t );
    const scale = 1 + ( EXPLOSION_SCALE - 1 ) * eased;

    const w = explosion.w * scale;
    const h = explosion.h * scale;
    const x = explosion.x + ( explosion.w - w ) / 2;
    const y = explosion.y + ( explosion.h - h ) / 2;
    drawFrame( ctx, frame, x, y, w, h );
  }
}

function drawHud() {
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textBaseline = 'top';
  const livesLabel = `Vidas: ${ state.lives }`;
  const livesX = 10;
  ctx.fillText( livesLabel, livesX, 10 );

  const iconSize = 14;
  const iconGap = 4;
  const iconsX = livesX + ctx.measureText( livesLabel ).width + 10;
  for ( let i = 0; i < state.lives; i++ ) {
    drawSprite( ctx, 'ball', iconsX + i * ( iconSize + iconGap ), 11, iconSize, iconSize );
  }

  const scoreLabel = `Puntaje: ${ state.score }`;
  ctx.fillText( scoreLabel, canvas.width - ctx.measureText( scoreLabel ).width - 10, 10 );
}

function drawOverlay( title ) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText( title, canvas.width / 2, 250 );

  ctx.fillStyle = '#444';
  ctx.fillRect( restartButton.x, restartButton.y, restartButton.w, restartButton.h );
  ctx.strokeStyle = '#fff';
  ctx.strokeRect( restartButton.x, restartButton.y, restartButton.w, restartButton.h );

  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText( 'Reiniciar', canvas.width / 2, restartButton.y + restartButton.h / 2 );

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}

canvas.addEventListener( 'click', ( e ) => {
  if ( state.screen === 'playing' ) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const inside = clickX >= restartButton.x && clickX <= restartButton.x + restartButton.w &&
    clickY >= restartButton.y && clickY <= restartButton.y + restartButton.h;

  if ( inside ) {
    state = createInitialState();
  }
} );

loadSpritesheet( loop );
