for i in range(3):
  while not objectPosition("monster", "inFrontOf"):
    wait(1)
  wait(1)
  while not objectPosition("monster", "inFrontOf"):
    forward(1)
  if objectPosition("prize", "atTheLeft"):
    left(1)
    forward(1)
    right(1)
  else:
    right(1)
    forward(1)
    left(1)