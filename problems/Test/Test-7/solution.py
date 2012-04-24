while not objectPosition("wall", "inFrontOf"):
  while not objectPosition("wall", "inFrontOf"):
    forward(1)
  if objectPosition("wall", "atTheLeft"):
    right(1)
  else:
    left(1)
