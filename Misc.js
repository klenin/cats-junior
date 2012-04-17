Array.prototype.compare = function(testArr) {
    if (this.length != testArr.length) return false;
    for (var i = 0; i < testArr.length; i++) {
        if (this[i].compare) { 
            if (!this[i].compare(testArr[i])) return false;
        }
        if (this[i] !== testArr[i]) return false;
    }
    return true;
}

Array.prototype.clone = function() {
  var newObj = [];
  for (i in this) {
    if (i == 'clone') continue;
    newObj[i] = this[i]
  } 
  return newObj;
};

function generateTabs(tabsNum)
{
	var str = '';
	for (var i = 0; i < tabsNum; ++i)
		str += '\t';
	return str;
}

var builtinFunctionsDict = [
	['wallAtTheLeft', 'Стена слева', wallAtTheLeft], 
	['wallAtTheRight', 'Стена справа', wallAtTheRight],
	['wallInFrontOf', 'Стена спереди', wallInFrontOf],
	['prizeAtTheLeft', 'Приз слева', prizeAtTheLeft],
	['prizeAtTheRight', 'Приз справа', prizeAtTheRight],
	['prizeInFrontOf', 'Приз спереди', prizeInFrontOf],
	['monsterAtTheLeft', 'Монстр слева', monsterAtTheLeft],
	['monsterAtTheRight', 'Монстр справа', monsterAtTheRight],
	['monsterInFrontOf', 'Монстр спереди', monsterInFrontOf],
	['boxAtTheLeft', 'Ящик слева', boxAtTheLeft],
	['boxAtTheRight', 'Ящик справа', boxAtTheRight],
	['boxInFrontOf', 'Ящик спереди', boxInFrontOf],
	['lockAtTheLeft', 'Замок слева', lockAtTheLeft],
	['lockAtTheRight', 'Замок справа', lockAtTheRight],
	['lockInFrontOf', 'Замок спереди', lockInFrontOf],
	['keyAtTheLeft', 'Ключ слева',  keyAtTheLeft],
	['keyAtTheRight', 'Ключ справа', keyAtTheRight],
	['keyInFrontOf', 'Ключ спереди', keyInFrontOf]
];

var selectObjects = [
	['wall', 'Стена'],
	['prize', 'Приз'],
	['monster', 'Монстр'],
	['box', 'Ящик'],
	['lock', 'Замок'],
	['key', 'Ключ']
];

var selectConditions = [
	['is', ''],
	['isNot', 'не']
];

var selectDirections = [
	['atTheLeft', 'слева'],
	['atTheRight', 'справа'],
	['inFrontOf', 'спереди']
];

var builtinFunctions = [
	{
		'name': 'truly',
		'args': [
			{
				'type': 'Str',
				'dict': selectObjects
			}, 
			{
				'type': 'Str',
				'dict': selectDirections
			}
		],
		'jsFunc': truly,
		'handlerFunc': truly_handler,
		'dict': selectObjects,
	}
];

function wallAtTheLeft(){
	return curProblem.wallAtTheLeft();
}

function wallAtTheRight(){
	return curProblem.wallAtTheRight();
}

function wallInFrontOf(){
	return curProblem.wallInFrontOf();
}

function prizeAtTheLeft(){
	return curProblem.prizeAtTheLeft();
}

function prizeAtTheRight(){
	return curProblem.prizeAtTheRight();
}

function prizeInFrontOf(){
	return curProblem.prizeInFrontOf();
}

function monsterAtTheLeft(){
	return curProblem.monsterAtTheLeft();
}

function monsterAtTheRight(){
	return curProblem.monsterAtTheRight();
}

function monsterInFrontOf(){
	return curProblem.monsterInFrontOf();
}

function boxAtTheLeft(){
	return curProblem.boxAtTheLeft();
}

function boxAtTheRight(){
	return curProblem.boxAtTheRight();
}

function boxInFrontOf(){
	return curProblem.boxInFrontOf();
}

function lockAtTheLeft(){
	return curProblem.lockAtTheLeft();
}

function lockAtTheRight(){
	return curProblem.lockAtTheRight();
}

function lockInFrontOf(){
	return curProblem.lockInFrontOf();
}

function keyAtTheLeft(){
	return curProblem.keyAtTheLeft();
}

function keyAtTheRight(){
	return curProblem.keyAtTheRight();
}

function keyInFrontOf(){
	return curProblem.keyInFrontOf();
}

function truly(object, condition, direction){
	var result = true;
	var dir = '';
	switch(direction){
		case 'atTheLeft': 
			dir = 'left';
			break;
		case 'atTheRight':
			dir = 'right';
			break;
		case 'inFrontOf':
			dir = 'forward';
			break;
		default:
			return false; //should we throw exception?
	}
	var cell = curProblem.getFieldElem(dir);
	switch(object){
		case 'wall':
			result = cell.isWall;
			break;
		case 'prize':
			result = cell.findCell(Prize) != undefined;
			break;
		case 'box':
			result = cell.findCell(Box) != undefined;
			break;
		case 'monster':
			result = cell.findCell(Monster) != undefined;
			break;
		case 'lock':
			result = cell.findCell(Lock) != undefined;
			break;
		case 'key':
			result = cell.findCell(Key) != undefined;
			break;
		default:
			return false;
	}
	if (condition == 'isNot')
		result = !result;
	return result;
}

function truly_handler(object, direction){
	var result = true;
	var dir = '';
	switch(direction.v){
		case 'atTheLeft': 
			dir = 'left';
			break;
		case 'atTheRight':
			dir = 'right';
			break;
		case 'inFrontOf':
			dir = 'forward';
			break;
		default:
			return false; //should we throw exception?
	}
	var cell = curProblem.getFieldElem(dir);
	switch(object.v){
		case 'wall':
			result = cell.isWall;
			break;
		case 'prize':
			result = cell.findCell(Prize) != undefined;
			break;
		case 'box':
			result = cell.findCell(Box) != undefined;
			break;
		case 'monster':
			result = cell.findCell(Monster) != undefined;
			break;
		case 'lock':
			result = cell.findCell(Lock) != undefined;
			break;
		case 'key':
			result = cell.findCell(Key) != undefined;
			break;
		default:
			return false;
	}
	return result;
}

function tryNextStep_(){
	var problem = problems.length + 1;
	if (getCurBlock() >= 0){
		if (nextline[problem] != undefined)
			codeareas[problem].setLineClass(nextline[problem], null);
		var e = 1;
		while (getCurBlock() >= 0 && (e || $expr[problem]))
		{
			$expr[problem] = 0;
			e = getScope().blocks[getCurBlock()].expr;
			try
			{
				eval(finalcode[problem].code);
			}catch(e)
			{
				$('#cons' + problem).append('\n' + e + '\n');
				return 0;

			}
		}
		if (getCurBlock() >= 0)
		{
			var b = getCurBlock();
			while(getScope().blocks[b].funcdef)
				++b;
			nextline[problem] = getScope().blocks[b].lineno;		
		}
			
		if (nextline[problem] != undefined)
		{
			codeareas[problem].setLineClass(nextline[problem], 'cm-curline');
			if (codeareas[problem].lineInfo(nextline[problem]).markerText)
			{
				//curProblem.playing = false;
				return 1;
			}
		}
		if (getCurBlock() < 0)
		{
			if (nextline[problem] != undefined)
				codeareas[problem].setLineClass(nextline[problem], null);
			$('#cons' + problem).append('\nfinished\n');
			return 0;
		} 
	}
	else
	{
		if (nextline[problem] != undefined)
			codeareas[problem].setLineClass(nextline[problem], null);
		$('#cons' + problem).append('\nfinished\n');
		return 0;
	}
	return 1;
}