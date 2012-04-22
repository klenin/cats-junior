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
		str += '  ';
	return str;
}

var selectObjects = [
	['wall', 'Стена'],
	['prize', 'Приз'],
	['monster', 'Монстр'],
	['box', 'Ящик'],
	['lock', 'Замок'],
	['key', 'Ключ'],
	['border', 'Граница']
];

var selectConditions = [
	['is', ''],
	['isNot', 'не']
];

var selectDirections = [
	['atTheLeft', 'слева'],
	['atTheRight', 'справа'],
	['inFrontOf', 'спереди'],
	['behind', 'сзади']
];

var builtinFunctions = [
	{
		'name': 'objectPosition',
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
		'jsFunc': objectPosition,
		'handlerFunc': objectPosition_handler,
		'dict': selectObjects,
	}
];

function objectPosition(object, condition, direction){
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
		case 'behind':
			dir = 'behind';
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
		case 'border':
			result = curProblem.labirintOverrun(cell.coord.x, cell.coord.y);
			break;
		default:
			return false;
	}
	if (condition == 'isNot')
		result = !result;
	return result;
}

function objectPosition_handler(object, direction){
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
		case 'behind':
			dir = 'behind';
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
		case 'border':
			result = curProblem.labirintOverrun(cell.coord.x, cell.coord.y);
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

function tryCode()
{
	var problem = problems.length + 1;
	var output = $('#cons' + problem);
	output.html('');
	Sk.configure({output:outf, 'problem': problem});
	var input = codeareas[problem].getValue();
	try {
		finalcode[problem] = Sk.importMainWithBody("<stdin>", false, input);
		$scope[problem] = 0,
		$gbl[problem] = {},
		$loc[problem] = $gbl[problem];
		for (var i = 0; i < finalcode[problem].compiled.scopes.length; ++i)
		{
			eval('$loc[' + problem + '].' + finalcode[problem].compiled.scopes[i].scopename + ' = {};');
			eval('$loc[' + problem + '].' + finalcode[problem].compiled.scopes[i].scopename + '.defaults = [];');
			eval('$loc[' + problem + '].' + finalcode[problem].compiled.scopes[i].scopename + '.stack = [];');
		}
		eval('$loc[' + problem + '].scope0.stack.push({"loc": {}, "param": {}, blk: 0});');
		nextline[problem] = getScope().firstlineno;
		codeareas[problem].setLineClass(nextline[problem], 'cm-curline');
		if (codeareas[problem].lineInfo(nextline[problem]).markerText)
		{
			curProblem.paused = true;
			curProblem.playing = false;
		}
		$scopename[problem] = finalcode[problem].compiled.scopes[0].scopename;
		$scopestack[problem] = 0;
		$('#codeRes1').html(finalcode[problem].code);
		$gbl[problem]['my_function'] = my_function;
		//curProblem.updateWatchList();
	} catch (e) {
		alert(e);
	}
}