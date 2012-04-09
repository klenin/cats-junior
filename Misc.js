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


