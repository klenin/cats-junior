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

var selectConditions = [
	['is', ''],
	['isNot', 'не']
];

function tryNextStep_(){
	var problem = problems.length + 1;
	if(!finalcode[problem]){
		return;
	}
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
				console.error(e);
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
		//$gbl[problem]['my_function'] = my_function;
		//curProblem.updateWatchList();
	} catch (e) {
		console.error(e);
		alert(e);
	}
}