while not objectPosition("prize", "inFrontOf"):
  while not objectPosition("box", "inFrontOf"):
    forward(1)
  if not objectPosition("wall", "atTheRight"):
    right(1)
    forward(1)
    left(1)
    forward(1)
    left(1)
    forward(1)
    right(1)
  else:
    if not objectPosition("wall", "atTheLeft"):
      left(1)
      forward(1)
      right(1)
      forward(1)
      right(1)
      forward(1)
      left(1)
    else:
      forward(1)
forward(1)
