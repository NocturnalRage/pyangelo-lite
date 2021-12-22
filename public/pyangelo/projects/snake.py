from sprite import *
from random import *

eatSound = loadSound("/pyangelo/samples/sounds/powerup.wav")
gameOverSound = loadSound("/pyangelo/samples/sounds/collision.wav")

setCanvasSize(600, 600, JAVASCRIPT)
background(20, 20, 20)
welcome = TextSprite("Snake!", width/2, 150, fontSize=72)
welcome.setColour(255, 255, 0)
welcome.center()
startText = TextSprite("Press SPACE to start!", width/2, 450, fontSize=36)
startText.setColour(0, 255, 0)
startText.center()
keysText = TextSprite("Use WASD keys to move", width/2, 500, fontSize=14)
keysText.setColour(0, 255, 0)
keysText.center()
gameOverText = TextSprite("Game Over!", width/2, 150, fontSize=72)
gameOverText.setColour(255, 255, 0)
gameOverText.center()
scoreText = TextSprite("Score: 0000", width/2, 375, fontSize=72)
scoreText.setColour(0, 255, 0)
scoreText.center()
startAgainText = TextSprite("Press ENTER to try again!", width/2, 475, fontSize=36)
startAgainText.setColour(0, 255, 0)
startAgainText.center()
pyangelo = Sprite("/pyangelo/samples/images/PyAngelo.png", width/2 - 48, height/2 - 64)

# Set up the screen
BLOCK_WIDTH = 20
BLOCK_HEIGHT = 20
blocksX = width/BLOCK_WIDTH
blocksY = height/BLOCK_HEIGHT

INTRO = 1
PLAY = 2
GAMEOVER = 3
playing = True

def resetGame():
    global score, direction, snake, food
    score = 0
    direction = [1, 0]
    snake = [[4,5], [3,5], [2,5]]
    food = [10,10]

resetGame()
gameState = INTRO

while playing:
    if gameState == INTRO:
        background(50, 50, 50)
        welcome.draw()
        pyangelo.draw()
        startText.draw()
        keysText.draw()
        if isKeyPressed(KEY_SPACE):
            gameState = PLAY
    elif gameState == PLAY:
        background(25, 25, 25)
        score += 1
        if isKeyPressed("KeyA"):
            direction = [-1, 0]
        elif isKeyPressed("KeyD"):
            direction = [1, 0]
        elif isKeyPressed("KeyW"):
            direction = [0, -1]
        elif isKeyPressed("KeyS"):
            direction = [0, 1]

        # draw food
        fill(255, 255, 0)
        rect(food[0] * BLOCK_WIDTH, food[1] * BLOCK_HEIGHT, BLOCK_WIDTH, BLOCK_HEIGHT)

        # Draw the snake
        fill(0, 255, 0)
        stroke(0, 0, 0)
        for n, body in enumerate(snake):
            rect(body[0] * BLOCK_WIDTH, body[1] * BLOCK_HEIGHT, BLOCK_WIDTH, BLOCK_HEIGHT)
        # Move the snake
        snake.insert(0, [ snake[0][0] + direction[0], snake[0][1] + direction[1] ])
        
        # snake eats food
        if snake[0] == food:
            playSound(eatSound)
            # grow snake
            score += 100
            # generate new food
            # can't be located in the snake
            food = [randint(0, blocksX - 1), randint(0, blocksY - 1)]
            while food in snake:
                food = [randint(0, blocksX - 1), randint(0, blocksY - 1)]
        else: # did not eat any food so we don't grow
            snake.pop()
        
        # snake dies if it touches the edge
        if snake[0][0] < 0 or snake[0][1] < 0 or snake[0][0] >= blocksX or snake[0][1] >= blocksY or snake[0] in snake[1:]: 
            gameState = GAMEOVER
            playSound(gameOverSound)
        # show score 
        stroke(0, 255, 0)
        noFill()
        rect(150, 30, width - 300, 30)
        fill(0, 255, 0)
        text("Score: "  + str(score), 275, 37, fontSize=15)
        sleep(0.1)
    elif gameState == GAMEOVER:
        background(50, 50, 50)
        gameOverText.draw()
        pyangelo.draw()
        scoreText.text = "Score: " + str(score)
        scoreText.draw()
        startAgainText.draw()
        if isKeyPressed(KEY_ENTER):
            gameState = PLAY
            resetGame()
        elif isKeyPressed(KEY_Q):
            playing = False
