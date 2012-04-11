import sys
import json
import codecs

class MyException(Exception):
	def __init__(self, value):
		self.value = value
		
	def __str__(self):
		return repr(self.value)
	

class Coord:
	def __init__(self, x, y, dir = ''):
		self.x = x1
		self.y = y1
		self.dir = dir

translateDirs = {
            'U': 'up',
            'D': 'down', 
            'L': 'left',
            'R': 'right'
}

def nextDirect(direct, curDir):
	if direct == 'forward':
		if curDir == 'up':
			return Coord(0, -1, 'up')
		if curDir == 'down':
			return Coord(0, 1, 'down')
		if curDir == 'left':
			return Coord(-1, 0, 'left')
		if curDir == 'right':
			return Coord(1, 0, 'right')
		if curDir == 'wait':
			return Coord(0, 0, 'forward')
	if direct == 'left':
		if curDir == 'up':
			return Coord(0, 0, 'up')
		if curDir == 'down':
			return Coord(0, 0, 'right')
		if curDir == 'left':
			return Coord(0, 0, 'down')
		if curDir == 'right':
			return Coord(0, 0, 'up')
		if curDir == 'wait':
			return Coord(-1, 0, 'left')
	if direct == 'right':
		if curDir == 'up':
			return Coord(0, 0, 'right')
		if curDir == 'down':
			return Coord(0, 0, 'left')
		if curDir == 'left':
			return Coord(0, 0, 'up')
		if curDir == 'right':
			return Coord(0, 0, 'down')
		if curDir == 'wait':
			return Coord(1, 0, 'right')
	if direct == 'wait':
		if curDir == 'up':
			return Coord(0, 0, 'up')
		if curDir == 'down':
			return Coord(0, 0, 'down')
		if curDir == 'left':
			return Coord(0, 0, 'left')
		if curDir == 'right':
			return Coord(0, 0, 'right')
		if curDir == 'wait':
			return Coord(0, 0, 'wait')
	raise MyException('Invalid direction')


class Path:
	def __init__(self, dir, x, y, initCnt):
		self.dir = dir
		self.x = x
		self.y = y
		self.initCnt = initCnt
		self.cnt = 0

class Cell:
	def __init__(self, x = 0, y = 0, zIndex = 1, points = 0, dLife = 0):
		self.x = x
		self.y = y
		self.zIndex = zIndex
		self.points = points
		self.dLife = dLife

class Monster(Cell):
	def __init__(self, monster):
		Cell.__init__(self)
		try:
			self.path = []
			path = monster['path']
			self.x = path[0]['x']
			self.y = path[0]['y']
			self.zIndex = monster['zIndex'] if 'zIndex' in monster else 0
			self.points = 0
			self.dLife = 0
			self.looped = monster['looped']
			self.die = monster['die']
			for p in path:
				self.path.append(Path(p['dir'], p['x'], p['y'], p['initCnt']))
			self.index = 0
		except:
			raise MyException('Invalid format')
			
	def tryNextStep(self):
		dir = self.path[index].dir
		x1 = self.x
		y1 = self.y
		c = Coord(0, 0)
		if self.index == len(self.path) and path[index].cnt == path[index].initCnt:
			if not self.looped:
				return Coord(self.x, self.y)
			x1 = path[0].x
			x2 = path[0].y
			dir = path[0].dir
		elif path[index].cnt == path[index].initCnt:
			dir = path[index + 1].dir
		c = nextDirect('forward', translateDirs[dir])
		return Coord(x1 + c.x, y1 + c.y)

	def nextStep(self):
		c = Coord(0, 0)
		if self.index == len(path) - 1  and path[index].cnt== path[index].cnt:
			if not self.looped:
				return
			self.index = 0
			for p in self.path:
				p.cnt = 0
		elif path[index].cnt == path[index].initCnt:
			index += 1
		c = nextDirect('forward', translateDirs[path[index].dir])
		self.x += c.x
		self.y += c.y
		path[index].cnt += 1

class Lock(Cell):
	def __init__(self, x, y):
		try:
			Cell.__init__(self, x, y, 11, 0, 0)
			self.locked = False
		except:
			raise MyException('Invalid format')

class Key(Cell):
	def __init__(self, x, y, l):
		try:
			Cell.__init__(self, x, y, 1, 0, 0)
			locks = [Lock() for i in range(l)]
			self.found = False
		except:
			raise MyException('Invalid format')


class Box(Cell):
	def __init__(self, x, y, box):
		try:
			Cell.__init__(self, x, y, box['zIndex'] if 'zIndex' in box else 2, 
				box['points'] if 'points' in box else 0,
				box['dLife'] if 'dLife' in box else 0)
		except:
			raise MyException('Invalid format')

class Prize(Cell):
	def __init__(self, x, y, prize):
		try:
			Cell.__init__(self, x, y, prize['zIndex'] if 'zIndex' in prize else 2, 
				prize['points'] if 'points' in prize else 0,
				prize['dLife'] if 'dLife' in prize else 0)
			self.found = False
		except:
			raise MyException('Invalid format')
			
class FieldElem:
	def __init__(self, x, y, isWall):
		self.x = x
		self.y = y
		self.isWall = isWall
		self.cells = []

	def mayPush(cell):
		if self.isWall:
			return False
		for c in self.cells:
			if c.zIndex >= cell.zIndex:
				return False
		return True
curX = 0
curY = 0
dx = 0
dy = 0
curI = 1
arrowZIndex = 3

dLife = 0
startLife = 0
startPoints = 0
life = 0
pnts = 0
maxStep = 99999999
maxCmdNum = 99999999
steps = 0

map = []
specSymbols = []
keys = []
locks = []
movingElements = []
sol = []

dead = False

curMap = []
specSymbolsList = []
curDirect = ''

monsters = []
field = []

def swap(arr, i, j):
	t = arr[i]
	arr[i] = arr[j]
	arr[j] = t

def sort(arr):
	for i in range(len(arr), -1, -1):
		for j in range(i):
			if arr[j].zIndex < arr[j + 1].zIndex:
				swap(arr, j, j + 1)

def nextStep(i, direct):
	result = True
	try:
		c = nextDirect(direct, curDirect)
		dx = c.x
		dy = c.y
		curDirect = c.dir
		life += dLife
		c_x = curX + dx
		c_y = curY + dy
		changeCoord = True
		if not(c_x < 0 or c_x >= len(field[0]) or c_y < 0 or c_y >= len(field)):
			elem = field[c_y][c_x]
			if elem.isWall:
				changeCoord = False
			sort(elem.cells)
			for cell in elem.cells:
				if cell.x != c_x or cell.y != c_y:
					continue
				if isinstance(cell,  Lock) and cell.locked:
					changeCoord = False
					break
				if isinstance(cell, Monster):
					return False
				if isinstance(cell, Box):
					tx = c_x + dx
					ty = c_y + dy
					f = tx < 0 or tx >= len(field[0]) or ty < 0 or ty >= len(field)
					if not f:
						el1 = field[ty][tx]
						if el1.mayPush(cell):
							elem.cells.remove(cell)
							cell.x = tx
							cell.y = ty
							el1.cells.add(cell)
							pnts += cell.points
							life += cell.dLife
							continue
						else:
							changeCoord = false
					else:
						changeCoord = false
					if isinstance(cell, Prize) and not cell.found:
						cell.found = True
						pnts += cell.points
						life += cell.dLife
					if isinstance(cell, Key) and not cell.found:
						cell.found = True
						for lock in cell.locks:
							lock.locked = False
							lock.zIndex = 0
		else:
			changeCoord = False

		if changeCoord:
			curX = c_x
			curY = c_y
		for monster in monsters:
			c1 = monster.tryNextStep()
			if (field[c1.y][c1.x].mayPush(monster)):
				if c1.y == curY and c1.x == curX:
					return False
				field[monster.y][monster.x].cells.remove(monster)
				monster.nextStep()
				field[c1.y][c1.x].cells.append(monster);
					
		if life == 0 or steps + 1 > maxStep:
			return False
		steps += 1
	except:
		raise MyException('Something bad happened in nextStep')
						
def solve():
	try:
		f = open('problem.json', 'r')
		s = f.read()
		problem = json.loads(s)
		f.close()
		if 'startLife' in problem:
			life = problem['startLife']
		if 'dLife' in problem:
			dLife = problem['dLife']
		if 'maxCmdNum' in problem:
			maxCmdNum = problem['maxCmdNum']
		elif 'maxStep' in problem:
			maxStep = problem['maxStep']
		if 'startPoints' in problem:
			startPoints = problem['startPoints']
		pnts = startPoints
		if not 'map' in problem:
			raise MyException('Map is undefined')
		map = problem['map']
		if 'specSymbols' in problem:
			specSymbols = problem['specSymbols']
		if 'keys' in problem:
			keys = problem['keys']
			if not 'locks' in problem:
				raise MyException("Keys are defined, but locks cells aren't defined")
			locks = problem['locks']
			if len(keys) != len(locks):
				raise MyException("Keys and locks length aren't equal")
		if 'movingElements':
			movingElements = problem['movingElements']
		curMap = []
		field = []
		for i in range(len(map)):
			curMap.append([])
			field.append([])
			for j in range(len(map[i])):
				obj = Cell()
				curMap[i].append(map[i][j])
				field[i].append(FieldElem(i, j, curMap[i][j] == '#'))
				if curMap[i][j] == 'R' or curMap[i][j] == 'U' or curMap[i][j] == 'D' or curMap[i][j] == 'L':
					curY = i
					curX = j
					curDirect = translateDirs[curMap[i][j]]
				for k in range(len(specSymbols)):
					if curMap[i][j] == specSymbols[k]['symbol']:
						obj = Prize(j, i, specSymbols[k]) if specSymbols[k]['action'] == 'eat' else Box(j, i, specSymbols[k])
						field[i][j].cells.append(obj)
		monsters = []
		for k in range(len(movingElements)):
			obj = Monster(movingElements[k])
			field[obj.y][obj.x].cells.append(obj)
			monsters.append(obj)
		for k in range(len(keys)):
			key = Key(keys[k]['x'], keys[k]['y'], len(locks[k]))
			field[key.y][key.x].cells.append(key)
			for j in range(len(locks[k])):
				lock = Lock(locks[k][j]['x'], locks[k][j]['y'])
				key.locks[j] = lock
				field[lock.y][lock.x].cells.append(lock)
		sol = codecs.open('output.txt', 'r', 'utf-8').read().split('\n')
		print sol
	except MyException as e:
		print e
			
if __name__ == '__main__':
	sys.exit(solve())
