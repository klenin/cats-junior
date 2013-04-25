def moveForward():
  if objectPosition("wall", "atTheLeft"):
    if objectPosition("wall", "atTheRight"):
      forward(1)
      moveForward()
def rotate():
  if objectPosition("wall", "atTheLeft"):
    right(1)
  else:
    left(1)
  forward(1)
def rotate1():
  if objectPosition("wall", "atTheRight"):
    left(1)
  else:
    right(1)
  forward(1)
def solve(arg0):
  for i in range(arg0):
    moveForward()
    rotate()
def solve1(arg0):
  for i in range(20):
    moveForward()
    rotate1()
solve(20)
solve1(20)
