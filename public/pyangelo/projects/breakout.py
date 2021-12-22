from sprite import *
from random import *
import time

setCanvasSize(960, 540, JAVASCRIPT)

ORIG_PADDLE_WIDTH = 240
PADDLE_SPEED = 500
BALL_START_SPEED_Y = 300
hitPaddle = loadSound("/pyangelo/samples/sounds/blip.wav")
hitBrick = loadSound("/pyangelo/samples/sounds/hit.wav")
hitWall = loadSound("/pyangelo/samples/sounds/hit3.wav")
hitBottom = loadSound("/pyangelo/samples/sounds/collision.wav")

hiScore = 0

class Particle():
    def __init__(self, x, y, r, g, b):
        self.x = x
        self.y = y
        self.r = r
        self.g = g
        self.b = b
        self.dx = uniform(-1, 1)
        self.dy = uniform(-1, -1)
        self.accX = uniform(-0.2, 0.2)
        self.accY = uniform(-0.2, 0.2)
        self.radius = 2
        self.alpha = 1.0
    def update(self):
        self.x += self.dx
        self.y += self.dy
        self.dx += self.accX
        self.dy += self.accY
        self.alpha -= 0.02
    def draw(self):
        noStroke()
        fill(self.r, self.g, self.b, self.alpha)
        circle(self.x, self.y, self.radius)
BRICK_WIDTH = 60
BRICK_HEIGHT = 20
SPACING = 2
TOP = 100
class Brick(RectangleSprite):
    def __init__(self, row, col):
        self.col = col
        x = col * BRICK_WIDTH + SPACING
        y = row * BRICK_HEIGHT + SPACING + TOP
        if row < 2:
            r = 255
            g = 0
            b = 0
            self.score = 7
        elif row < 4:
            r = 255
            g = 165
            b = 0
            self.score = 5
        elif row < 6:
            r = 0
            g = 255
            b = 0
            self.score = 3
        elif row < 8:
            r = 255
            g = 255
            b = 0
            self.score = 1
        super().__init__(x, y, BRICK_WIDTH - SPACING * 2, BRICK_HEIGHT - SPACING * 2, r, g, b)
        self.visible = True

paddle = RectangleSprite(width/2 - ORIG_PADDLE_WIDTH/2, 510, ORIG_PADDLE_WIDTH, 20, 0, 0, 255)
ball = CircleSprite(width/2 - 5, 300, 10, 255, 255, 255)
ball.dx = uniform(-100, 100)
ball.dy = BALL_START_SPEED_Y

breakoutText = TextSprite("Breakout!", width/2, height/2, fontSize = 72)
breakoutText.center()
breakoutText.setColour(220, 220, 220)
startText = TextSprite("Press SPACE to start", width/2, height/2 + 100, fontSize = 24)
startText.center()
startText.setColour(0, 255, 0)
hiScoreText = TextSprite("Hi Score: 0", width/2, height/2 + 200, fontSize = 24)
hiScoreText.center()
hiScoreText.setColour(255, 255, 0)

gameOverText = TextSprite("Game Over!", width/2, height/2 + 100, fontSize = 72)
gameOverText.center()
gameOverText.setColour(220, 220, 220)
restartText = TextSprite("Press ENTER to restart", width/2, height/2 + 200, fontSize = 24)
restartText.center()
restartText.setColour(0, 255, 0)

while True:
    intro = True
    while intro:
        background(0, 0, 0)
        fill(220, 220, 220)
        breakoutText.draw()
        startText.draw()
        hiScoreText.draw()
        if isKeyPressed(KEY_SPACE):
            intro = False
        sleep(0.005)

    paddle.width = ORIG_PADDLE_WIDTH
    paddle.moveTo(width/2 - ORIG_PADDLE_WIDTH/2, 510)
    paddleNotChanged1 = True
    paddleNotChanged2 = True
    ball.moveTo(width/2 - 5, 300)
    ball.dx = uniform(-100, 100)
    ball.dy = BALL_START_SPEED_Y
    # Add bricks
    bricks = []
    for i in range(8):
        brickRow = []
        for j in range(int(width/BRICK_WIDTH)):
            brickRow.append(Brick(i, j))
        bricks.append(brickRow)
    # List for brick explosion
    particles = []
    score = 0
    
    lastFrameTime = time.time()
    playing = True
    while playing:
        currentTime = time.time()
        dt = currentTime - lastFrameTime
        lastFrameTime = currentTime

        background(0, 0, 0)
        stroke(0, 0, 0)
        fill(220, 220, 220)
        text("Score: " + str(score), width - 175, 20, fontSize = 30)
        if dt > 0:
            text("FPS: " + str(int(1/dt)), 0, 0)
        if paddleNotChanged1 and score >= 20:
            paddle.width = ORIG_PADDLE_WIDTH / 2
            paddle.x += paddle.width / 2
            paddleNotChanged1 = False
        elif paddleNotChanged2 and score >= 300:
            paddle.width = ORIG_PADDLE_WIDTH / 4
            paddleNotChanged2 = False
            paddle.x += paddle.width / 2
            
        for brickRow in bricks:
            for brick in brickRow:
                if brick.visible:
                    brick.draw()
                    if brick.overlaps(ball):
                        for i in range(30):
                            particles.append(Particle(brick.x + brick.width/2, brick.y + brick.height/2, brick.r, brick.g, brick.b))
                        playSound(hitBrick)
                        score += brick.score
                        brick.visible = False
                        if ball.dy >= 0 and ball.y > brick.y:
                            ball.dx *= -1
                        elif ball.dy < 0 and ball.y < brick.y + brick.height:
                            ball.dx *= -1
                        else:
                            ball.dy *= -1
                        break
        
        ball.draw()
        paddle.draw()
        
        ball.moveBy(ball.dx * dt, ball.dy * dt)
        
        if ball.x + ball.radius > width:
            playSound(hitWall)
            ball.x = width - ball.radius
            ball.dx *= -1
        if ball.x - ball.radius <= 0:
            playSound(hitWall)
            ball.x = ball.radius
            ball.dx *= -1
        if ball.y - ball.radius <= 0:
            playSound(hitWall)
            ball.y = ball.radius
            ball.dy *= -1
        if ball.y > height:
            playSound(hitBottom)
            playing = False
            
        if isKeyPressed(KEY_A):
            paddle.moveBy(-PADDLE_SPEED * dt, 0)
        if isKeyPressed(KEY_D):
            paddle.moveBy(PADDLE_SPEED * dt, 0)
        
        if paddle.overlaps(ball) and ball.y <= paddle.y:
            playSound(hitPaddle)
            ball.y = paddle.y - ball.radius
            ball.dy *= -1
            ball.dx += uniform(-150, 150)
            # Hit left third of paddle
            if ball.x < paddle.x + paddle.width/3 :
                ball.dx -= uniform(100, 180)
            # Hit right third of paddle
            elif ball.x > paddle.x + 2*paddle.width/3:
                ball.dx += uniform(100, 180)
                
        for i in range(len(particles) - 1, -1, -1):
            particles[i].draw()
            particles[i].update()
            if particles[i].alpha <= 0:
                del particles[i]
        
        sleep(0)
    
    gameOverText.draw()
    restartText.draw()
    if score > hiScore:
        hiScore = score
        hiScoreText.text = "Hi Score: " + str(hiScore)
    gameOver = True
    while gameOver:
        if isKeyPressed(KEY_ENTER):
            gameOver = False
