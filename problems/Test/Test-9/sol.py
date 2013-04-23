def goToTheLeft():
  right(1)
  moveForward()
  left(1)
  moveForward()
def goToTheRight():
  right(1)
  moveForward()
  right(1)
  moveForward()
def moveForward():
  if not objectPosition("wall", "inFrontOf"):
    if not objectPosition("box", "inFrontOf"):
      if not objectPosition("border", "inFrontOf"):
        forward(1)
        moveForward()
def moveToBox():
  if not objectPosition("box", "atTheLeft"):
    if not objectPosition("box", "atTheRight"):
      forward(1)
      moveToBox()
def returnFromTheChild():
  if not objectPosition("box", "behind"):
    left(2)
  moveForward()
  if objectPosition("wall", "atTheLeft"):
    right(1)
    moveToBox()
    left(1)
  else:
    left(1)
    moveToBox()
    right(1)
def solve():
  goToTheLeft()
  if objectPosition("box", "inFrontOf"):
    solve()
  returnFromTheChild()
  goToTheRight()
  if objectPosition("box", "inFrontOf"):
    solve()
  returnFromTheChild()
forward(1)
solve()
