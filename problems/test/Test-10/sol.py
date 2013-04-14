def go():
  if not isCompleted():
    moveForward()
    if objectPosition("wall", "atTheLeft"):
      right(1)
    else:
      left(1)
    go()
def moveForward():
  if not objectPosition("wall", "inFrontOf"):
    forward(1)
    if objectPosition("wall", "atTheRight"):
      if objectPosition("wall", "atTheLeft"):
        moveForward()
      else:
        if objectPosition("wall", "inFrontOf"):
          moveForward()
        else:
          if objectPosition("wall", "behind"):
            moveForward()
    else:
      moveForward()
go()
