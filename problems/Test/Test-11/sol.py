def moveForward():
  if objectPosition("wall", "atTheLeft"):
    if objectPosition("wall", "atTheRight"):
      forward(1)
      moveForward()
def rotate():
  if not objectPosition("wall", "atTheLeft"):
    left(1)
  else:
    right(1)
def rotate1():
  if not objectPosition("wall", "atTheRight"):
    right(1)
  else:
    left(1)
for i in range(13):
  moveForward()
  if objectPosition("wall", "inFrontOf"):
    rotate()
    forward(1)
  else:
    rotate()
    forward(2)
    left(1)
    forward(1)
for i in range(17):
  moveForward()
  if objectPosition("wall", "inFrontOf"):
    rotate1()
    forward(1)
  else:
    rotate1()
    forward(2)
    right(1)
    forward(1)
