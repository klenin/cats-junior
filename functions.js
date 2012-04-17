var curCodeMirror;

function outf(text)
{
	text = text.replace(/</g, '&lt;');
	$('#cons' + getCurProblem()).append(text);
}

function getCurBlock()
{
	var problem = getCurProblem();
	var scope = finalcode[problem].compiled.scopes[$scope[problem]].scopename;
	return eval('$loc[' + problem + '].' + scope + '.stack[$loc[' + problem + '].' + scope + '.stack.length - 1].blk');
}

function getScope()
{
	var problem = getCurProblem();
	return finalcode[problem].compiled.scopes[$scope[problem]];
}

function getCurProblem()
{
	return $('#tabs').tabs('option', 'selected') - 1;
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

function calculateExpression(expression)
{
	if (expression._astname == 'Name')
	{
		var result = undefined;
		var problem = getCurProblem();
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

function my_function()
{
	alert('yeah!!!');
}

function callScript(url, callback){
	if (atHome){
		$.ajax({
			async: false,
			dataType : 'json',
			url: 'script.php',
			data: 'url='+ url,
			success: function(data){callback(data);},
			error: function(jqXHR, textStatus, errorThrown) {
				alert(jqXHR, textStatus, errorThrown);
			}
		});
	} 
	else{
		$.ajax({
			async: false,
			dataType : 'json',
			url: url,
			success: callback
		});
	}
}

function callSubmit_(serv, path, submitData, callback){
	if (!atHome)
		return;
	$.ajax({  
		async: false,
		url: 'submit.php',
		type: 'POST',
		data: 'serv='+ serv + '&' + 'path=' + path + '&' + submitData,  
		success: function(data){
			callback(data);
		},
		error: function(data){
			alert(data);
		}
	});  
}

function callSubmit(url, submitData, path, serv, sep, l, callback){
	if (atHome)
		return;
	$.ajax({  
		async: false,
		url: url,
		type: 'POST',
		contentType: 'multipart/form-data',
		data: submitData,
		beforeSend: function(xhr){
			xhr.setRequestHeader('Host', serv);
			xhr.setRequestHeader('Connection', 'keep-alive');
			xhr.setRequestHeader('Referer', url);
			return true;
		},  
		success: callback,
		error: function(r, err1, err2){
			alert('Ошибка подключения к серверу');
		}  
	}); 
}

function changeCmdHighlight(elem){
	if (!elem)
		return false;
	var elem = $('#' + elem);
	if (elem.hasClass('highlighted'))
		elem.removeClass('highlighted');
	else
		elem.addClass('highlighted');
}

function isCmdHighlighted(elem){
	if (!elem)
		return false;
	return $('#' + elem).hasClass('highlighted')
}

function convert(commands, parent, problem)
{
	var block = new Block([], parent, problem);
	for (var i = 0; i < commands.length; ++i)
	{
		var type = commands[i].attr['rel'];
		var id = commands[i].attr['id'];
		if (type == 'block' && commands[i].children)
		{
			block.pushCommand(convert(commands[i].children, block, problem));
		}
		else if (type == 'if' || type == 'ifelse' || type == 'while')
		{
		
			var test1 = parseInt($('#' + id + ' option:selected')[0].value);
			var test3 = parseInt($('#' + id + ' option:selected')[1].value);
			var test2 = parseInt($('#' + id + ' option:selected')[2].value);
			var block1 = commands[i].children ? (convert(commands[i].children, block, problem)) : new Block([], block, problem);
			var block2 = undefined;
			if (type == 'ifelse' && commands[++i].children)
				block2 = convert(commands[i].children, block, problem);
			block.pushCommand(type == 'while' ? 
				new WhileStmt('truly', [test1, test2, test3], block1, block, id, problem) : 
				new IfStmt('truly', [test1, test2, test3], block1, block2, block, id, problem));
		}
		else if (type == 'for')
		{
			var cnt = parseInt($('#' + id + ' .cnt .cnt').val());
			var block1 =  commands[i].children ? (convert(commands[i].children, block, problem)) : new Block([], block, problem);
			block.pushCommand(new ForStmt(block1, cnt, block,  id, problem));
		}
		else
		{
			var cmd = new Command(type, parseInt($('#' + id + ' input').val()),
				block, id, problem);
			block.pushCommand(cmd);
		}
	}
	return block;
}

function convertCondition(expr){
	switch(expr._astname){
		case 'Call':
			if (expr.func._astname != 'Name' || !expr.args) //
				return undefined;
			var testName = '';
			var args = [];
			switch(expr.func.id.v)
			{
				case 'truly':
					testName = expr.func.id.v;
					if (expr.args.length != builtinFunctions[0]['args'].length)
						return undefined;
					for (var j = 0; j < expr.args.length; ++j){
						if (expr.args[j]._astname != builtinFunctions[0]['args'][j]['type'])
							return undefined;
						for (var k = 0; k <  builtinFunctions[0]['args'].length; ++k){
							for (var l = 0; l < builtinFunctions[0]['args'][k]['dict'].length; ++l){
								if (builtinFunctions[0]['args'][k]['dict'][l][0] == expr.args[j].s.v){
									args.push(l);
									break;
								}
							}
						}
					}
					break;
				default:
					return undefined;
			}
			args.push(0);
			return {'testName': testName, 'args': args}
		case 'UnaryOp':
			if (expr.op.prototype._astname != 'Not')
				return undefined;
			var dict = convertCondition(expr.operand);
			if (!dict)
				return undefined;
			dict['args'][2] = 1 - dict['args'][2];
			return dict;
	}
	return undefined;
}

function convertTreeToCommands(commands, parent, problem)
{
	var block = new Block([], parent, problem);
	for (var i = 0; i < commands.length; ++i)
	{
		switch(commands[i]._astname)
		{
			case 'Expr':
				if (commands[i].value._astname != 'Call' || 
					commands[i].value.func._astname != 'Name')
					return undefined;
				switch(commands[i].value.func.id.v)
				{
					case 'left':
					case 'right':
					case 'forward':
					case 'wait':
						if (!(!commands[i].value.args.length || commands[i].value.args.length == 1 && 
							commands[i].value.args[0]._astname == 'Num'))
							return undefined;
						block.pushCommand(new Command(commands[i].value.func.id.v, 
							commands[i].value.args.length ? commands[i].value.args[0].n : 1, block, undefined, problem));
						break;
					default:
						return undefined;
				}
				break;
			case 'For':
				//__constructor : function(body, cnt, parent, id)
				if (!commands[i].iter || commands[i].iter._astname != 'Call' ||  
					commands[i].iter.func._astname != 'Name' || commands[i].iter.func.id.v != 'range' ||
					commands[i].iter.args.length != 1 || commands[i].iter.args[0]._astname != 'Num') //
					return undefined;
				var cnt = commands[i].iter.args[0].n;
				var forStmt = new ForStmt(undefined, cnt, block, undefined, problem);
				var body = convertTreeToCommands(commands[i].body, forStmt, problem);
				if (!body)
					return undefined;
				forStmt.body = body;
				block.pushCommand(forStmt);
				break;
			case 'If':
				//__constructor : function(testName, args, firstBlock, secondBlock, parent, id, problem)
				var dict = convertCondition(commands[i].test);
				if (!dict)
					return undefined;
				var ifStmt = new IfStmt(dict['testName'], dict['args'], undefined, undefined, block, undefined, problem);			
				var body1 = convertTreeToCommands(commands[i].body, ifStmt, problem);
				var body2;
				if (commands[i].orelse.length)
					body2 = convertTreeToCommands(commands[i].orelse, ifStmt, problem);
				ifStmt.blocks[0] = body1;
				ifStmt.blocks[1] = body2;
				block.pushCommand(ifStmt);
				break;
			case 'While':
				//__constructor : function(testName, args, body, parent, id, problem)
				var dict = convertCondition(commands[i].test);
				if (!dict)
					return undefined;
				var whileStmt = new WhileStmt(dict['testName'], dict['args'], undefined, block, undefined, problem)
				var body = convertTreeToCommands(commands[i].body, ifStmt, problem);
				if (!body)
					return undefined;
				whileStmt.body = body;
				block.pushCommand(whileStmt);
				break;
			default: 
				return undefined;
		}
	}
	return block;
}


function getCurProblem()
{
	return $('#tabs').tabs('option', 'selected') - 1;
}

function forward(cnt)
{
	curProblem.oneStep('forward', cnt != undefined ? cnt : 1);
}

function left(cnt)
{
	curProblem.oneStep('left', cnt != undefined ? cnt : 1);
}

function right(cnt)
{
	curProblem.oneStep('right', cnt != undefined ? cnt : 1);
}

function wait(cnt)
{
	curProblem.oneStep('wait', cnt != undefined ? cnt : 1);
}

function getNextNode(tree, node)
{
	var parent = tree._get_parent(node);
	var next;
	var cur = node;
	while(1)
	{
		next = tree._get_next(cur, true);
		cur = next;
		var p1 = tree._get_parent(next);
		if (!next || p1 == -1 || p1.prop('id') == parent.prop('id'))
			break;
	}
	return next;
}
