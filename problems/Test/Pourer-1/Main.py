import os
import sys
import json
import codecs
import inspect

class MyException(Exception):
	def __init__(self, value):
		self.value = value
		
	def __str__(self):
		return repr(self.value)
	
class Vessel:
	def __init__(self, capacity, initFilled, isEndless):
		self.capacity = capacity
		self.initFilled = initFilled
		self.isEndless = isEndless
		self.filled = initFilled
		
	def pourTo(delta):
		if not self.isEndless:
			self.filled -= delta

	def pourFrom(delta):
		self.filled += delta

	def pourOut():
		if self.isEndless:
			raise MyException('Can\'t pour out endless vessel!!!')
		self.filled = 0;

	def fill():
		self.filled = self.capacity

class Pourer:
	def __init__(self, **kwargs):
		vessels = kwargs.get('vessels')
		self.vessels = []
		for vessel in vessels:
			self.vessels.push_back(Vessel(vessel.capacity, vessel.initFilled, vessel.isEndless))

		self.dLife = kwargs.get('dLife', 0)
		self.life = kwargs.get('startLife', 0)
		self.pnts = kwargs.get('startPoints', 0)
		self.maxStep = kwargs.get('maxStep', 10000)
		self.maxCmdNum = kwargs.get('maxCmdNum', 10000)
		self.commandsFine = kwargs.get('commandsFine', 0)
		self.stepsFine = kwargs.get('stepsFine', 0)

		self.steps = 0
		self.cmdNum = 0

		self.sol = kwargs.get('sol', '')

		self.dead = False

		self.usedFunc ={'pour':[], 'pourOut':[], 'fill':[]}

	def pour(self, src, dest):
		try:
			if (src == dest):
				return
			
			if (self.vessels[src].filled == 0 || self.vessels[dest].capacity == self.vessels[dest].filled):
				return

			delta = min(self.vessels[dest].capacity - self.vessels[dest].filled, self.vessels[src].filled)
			self.vessels[src].pourTo(delta)
			self.vessels[dest].pourFrom(delta)
		except:
			raise MyException('Invalid command, pour!')
			
	def pourOut(self, vessel):
		try:
			self.vessels[vessel].pourOut();
		except:
			raise MyException('Invalid command, pourOut!')

	def fill(self, vessel):
		try:
			self.vessels[vessel].fill();
		except:
			raise MyException('Invalid command, fill!')

	def isLess(vessel, value):
		return self.vessels[vessel].filled < value;

	def isEqual(vessel, value):
		return self.vessels[vessel].filled == value;

	def isGreater(vessel, value):
		return self.vessels[vessel].filled > value;

	def isLessVessel(first, second):
		return self.vessels[first].filled < self.vessels[second].filled;

	def isEqualVessel(first, second):
		return self.vessels[first].filled == self.vessels[second].filled;

	def isGreaterVessel(first, second):
		return self.vessels[first].filled > self.vessels[second].filled;

	def isFinished():
		var finished = true;
		for (var i = 0; i < self.data.finishState.length; ++i) {
			var vessel = self.data.finishState[i].vessel;
			finished = finished && (self.vessels[vessel].filled == self.data.finishState[i].filled);
		}
		return finished;
		
global curState

def pour(src, dst):
	curState.pour(src - 1, dst - 1)

def pourOut(vessel):
	curState.pourOut(vessel)

def fill(vessel):
	curState.fill(vessel)

def compare(vessel, comparator, value):
	vessel -= 1
	comparator = comparator

	if comparator == '<':
		return curState.isLess(vessel, value)
	elif comparator == '>':
		return curState.isGreater(vessel, value)
	elif comparator == '<=':
		return curState.isLess(vessel, value) or curState.isEqual(vessel, value)
	elif comparator == '>=':
		return curState.isGreater(vessel, value) or curState.isEqual(vessel, value)
	elif comparator == '==':
		return curState.isEqual(vessel, value)
	elif comparator == '!=':
		return not curState.isEqual(vessel, value)
	else:
		raise MyException('Invalid comparator')

def checkFilled(first, comparator, second)
	first -= 1
	second -= 1
	
	if comparator == '<':
		return curState.isLessVessel(vessel, value)
	elif comparator == '>':
		return curState.isGreaterVessel(vessel, value)
	elif comparator == '<=':
		return curState.isLessVessel(vessel, value) or curState.isEqualVessel(vessel, value)
	elif comparator == '>=':
		return curState.isGreaterVessel(vessel, value) or curState.isEqualVessel(vessel, value)
	elif comparator == '==':
		return curState.isEqualVessel(vessel, value)
	elif comparator == '!=':
		return not curState.isEqualVessel(vessel, value)
	else:
		raise MyException('Invalid comparator')


def solve():
	try:
		f = open('problem.json', 'r')
		s = f.read()
		problem = json.loads(s)
		f.close()
		if not 'vessels' in problem:
			raise MyException('Vessels are undefined')

		global curState
		curState = State(**problem)				
		sol = codecs.open('output.txt', 'r', 'utf-8').read()
		oldstdout = sys.stdout
		sys.stdout = open(os.devnull, 'w')
		exec(sol, {'pour': pour, 'pourOut': pourOut, 'fill': fill, 'compare': compare, 'checkFilled': checkFilled})
		sys.stdout = oldstdout
	except:
		sys.stdout = oldstdout
	print(curState.pnts - curState.stepsFine * curState.steps - curState.commandsFine * curState.cmdNum)
				
if __name__ == '__main__':
	sys.exit(solve())

