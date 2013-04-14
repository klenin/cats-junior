def moveForward():
  if not objectPosition("box", "inFrontOf"):
    if not objectPosition("wall", "inFrontOf"):
      if not objectPosition("border", "inFrontOf"):
        forward(1)
        moveForward()
def moveToBox():
  if not objectPosition("box", "atTheLeft"):
    if not objectPosition("box", "atTheRight"):
      forward(1)
      moveToBox()
def qGoLeft():
  right(1)
  moveForward()
  left(1)
  moveForward()
def qGoRight():
  right(1)
  moveForward()
  right(1)
  moveForward()
def returnFromChild():
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
def zSolve():
  qGoLeft()
  if objectPosition("box", "inFrontOf"):
    zSolve()
  returnFromChild()
  qGoRight()
  if objectPosition("box", "inFrontOf"):
    zSolve()
  returnFromChild()
forward(1)
zSolve()
