from random import *
setCanvasSize(640, 360, JAVASCRIPT)
background(0, 0, 0)
#noStroke()
while True:
    r = randint(100, 200)
    g = randint(0, 20)
    b = randint(100, 200)
    x = randint(0, width)
    y = randint(0, height)
    size = randint(5, 30)
    fill(r, g, b, 0.7)
    circle(x, y, size)
    sleep(0.05)
