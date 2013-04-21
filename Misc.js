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

/*function outf(text)
	{
		text = text.replace(/</g, '&lt;');
		$('#cons' + getCurProblem()).append(text);
	}

	function getCurBlock()
	{
		var problem = getCurProblem();
		if(!finalcode[problem]){
			return;
		}
		var scope = finalcode[problem].compiled.scopes[$scope[problem]].scopename;
		return eval('$loc[' + problem + '].' + scope + '.stack[$loc[' + problem + '].' + scope + '.stack.length - 1].blk');
	}

	function getScope()
	{
		var problem = getCurProblem();
		if(!finalcode[problem]){
			return;
		}
		return finalcode[problem].compiled.scopes[$scope[problem]];
	}

	function calculateExpression(expression)
	{
		if (expression._astname == 'Name')
		{
			var result = undefined;
			var problem = getCurProblem();
			if(!finalcode[problem]){
				return;
			}
			if ($scope[problem] != undefined && $loc[problem] != undefined)
			{
				var scope = finalcode[problem].compiled.scopes[$scope[problem]].scopename;
				var t_scope = $scope[problem], 
					t_scopename = $scopename[problem], 
					t_scopestack = $scopestack[problem];
				var name = expression.id.v;
				//find name 
				while(eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].loc." + name) == undefined
					&& eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].parentStack") != undefined)
				{
					t_scope = eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].parent");
					var nm = t_scopename;
					t_scopename = eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].parentName");
					t_scopestack = eval("$loc[" + problem + "]." + nm + ".stack[" + t_scopestack + "].parentStack");
				}
				result = eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].loc." + name) !== undefined ?
							eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].loc." + name):
							Sk.misceval.loadname(name, $gbl[problem], 1);
			}
			return result;
		}
		if (expression._astname == 'Num')
			return expression.n;
		if (expression._astname == 'BinOp')
		{
			var a = calculateExpression(expression.left);
			var b = calculateExpression(expression.right);
			return Sk.abstr.boNumPromote_[expression.op.prototype._astname](a, b);
		}
		if (expression._astname == 'UnaryOp')
		{
			var v = calculateExpression(expression.operand);
			var op = expression.op.prototype._astname;
		    if (op === "USub") return -v;
	        if (op === "UAdd") return v;
	        if (op === "Invert") return ~v;
		}

	}

	function calculateValue(source)
	{
		var filename = '<stdin>.py'
		var cst = Sk.parse(filename, source);
	    var ast = Sk.astFromParse(cst, filename);
		var st = Sk.symboltable(ast, filename);
		if (!(ast.body && ast.body.length == 1))
			return 'Invalid expression';
	    var expr = ast.body[0];
		if (expr._astname != 'Expr')
			return 'Invalid expression';
		return calculateExpression(expr.value);
	}

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
}*/

function isInt(n) {
   return typeof n === 'number' && parseFloat(n) == parseInt(n, 10) && !isNaN(n);
} // 6 characters

function showHideCode()
{
	if ($('#showHide').prop('checked'))
		$('#codeRes1').hide();
	else
		$('#codeRes1').show();
}

function testChanged()
{
	codeareas[getCurProblem()].setValue(tests[$('#selectTest :selected').val()]);
}

function getCurProblem()
{
	return $('#tabs').tabs('option', 'selected') - 1;
}

function checkName(name) {
	var re = /^[a-z_]+[a-z_0-9]*$/i;
	return re.test(name);
}

function checkNumber(number) {
	var re = /^[0-9]+[0-9]*$/i;
	return re.test(number);
}

function changeCmdHighlight(elem){
	if (!elem)
		return false;
	elem = $('#' + elem);
	if (elem.hasClass('highlighted')){
		elem.removeClass('highlighted');
	}
	else {
		elem.addClass('highlighted');
	}
		
	return true;
}

function isCmdHighlighted(elem) {
	if (!elem)
		return false;
	return $('#' + elem).hasClass('highlighted')
}
