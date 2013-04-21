def func0(arg0, arg1):
  pour(arg0, arg1)
  pourOut(arg1)
def func1():
  if checkFilled(1, '>', 2):
    func0(1, 2)
    if compare(1, '!=', 0):
      func1()
  else:
    func0(2, 1)
    if compare(2, '!=', 0):
      func1()
func1()
