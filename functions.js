var curCodeMirror;

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

function callScript(url, callback){
	if (atHome){
		$.ajax({
			async: false,
			url: 'script.php',
			data: 'url='+ url,
			dataType: 'json',
			success: function(data){
				//data = data.replace(new RegExp( "\t", "g" ), ' ');
				//var d = $.evalJSON(data);
				callback(data);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if(url.search('rank_table_content') == -1){
					alert('Ошибка подключения к серверу');
				}
				console.error(jqXHR, textStatus, errorThrown);
			}
		});
	} 
	else{
		$.ajax({
			async: false,
			dataType : 'json',
			url: url,
			success: callback,
			error: function(jqXHR, textStatus, errorThrown) {
				if(url.search('rank_table_content') == -1){
					alert('Ошибка подключения к серверу');
				}			
			}
		});
	}
}

function callSubmit_(serv, path, submitData, callback){
	$.ajax({  
		async: false,
		url: 'submit.pl',
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

function callSubmit(url, submitData, problem_id, callback){
        var formData = new FormData();
        formData.append('search', '');
        formData.append('rows', 20);
        formData.append('problem_id', problem_id);//
        formData.append('de_id',772264);
        formData.append('source_text', submitData);
        formData.append('submit', 'Send');
        if (atHome)
                return;
        $.ajax({
                async: false,
                url: url,
                type: 'POST',
                processData: false,
                contentType: false,
                data: formData,
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

function convert(commands, parent, problem, funcName, id, arguments, funcId){
	var block = new Block([], parent, problem);
	var func = undefined;
	if (funcName) {
		func = new FuncDef(funcName, arguments, [], parent, id, funcId, problem);
		block = new Block([], func, problem);
		func.body = block;
		if (!problem.functions[funcName]) {
			problem.functions[funcName] = [];
		}
		problem.functions[funcName][arguments.length] = func;
		problem.functionsWithId[funcId] = func;
		++problem.numOfFunctions;
	}
	for (var i = 0; i < commands.length; ++i){
		var type = commands[i].attr['rel'];
		var id = commands[i].attr['id'];
		if (type == 'block' && commands[i].children)		{
			block.pushCommand(convert(commands[i].children, block, problem));
		}
		else if (type == 'if' || type == 'ifelse' || type == 'while')		{
		
			var test3 = parseInt($('#' + id + ' option:selected')[0].value);
			var test1 = parseInt($('#' + id + ' option:selected')[1].value);
			var test2 = parseInt($('#' + id + ' option:selected')[2].value);
			var block1 = commands[i].children ? (convert(commands[i].children, block, problem)) : new Block([], block, problem);
			var block2 = undefined;
			if (type == 'ifelse'){
				if (commands[++i].children){
					block2 = convert(commands[i].children, block, problem);
				}
				else{
					block2 = new Block([], block, problem);
				}
			}
			block.pushCommand(type == 'while' ? 
				new WhileStmt('objectPosition', [test1, test2, test3], block1, block, id, problem) : 
				new IfStmt('objectPosition', [test1, test2, test3], block1, block2, block, id, problem));
		}
		else if (type == 'for')		{
			var cnt = parseInt($('#' + id + ' .cnt .cnt').val());
			var block1 =  commands[i].children ? (convert(commands[i].children, block, problem)) : new Block([], block, problem);
			block.pushCommand(new ForStmt(block1, cnt, block,  id, problem));
		}
		else if (type == 'funccall'){
			var arguments = [];
			for (var j = 0; j < $('#' + id).children('input').length; ++j) {
				arguments.push($('#' + id).children('input:eq(' + j + ')').val());
			}
			block.pushCommand(new FuncCall(commands[i].data ? commands[i].data : 
				$('#' + id).text().split(' ').join(''), arguments,  block, id, $('#' + id).attr('funcId'), problem));
		}
		else{
			var cmd = new Command(type, parseInt($('#' + id + ' input').val()),
				block, id, problem);
			block.pushCommand(cmd);
		}
	}
	return func ? func : block;
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
				case 'objectPosition':
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
		switch(commands[i]._astname) {
			case 'Expr':
				if (commands[i].value._astname != 'Call' || 
					commands[i].value.func._astname != 'Name')
					return undefined;
				switch(commands[i].value.func.id.v) {
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
						var arguments = [];
						for (var j = 0; j < commands[i].value.args.length; ++j) {
							var arg;
							switch(commands[i].value.args[j]._astname) {
								case 'Num':
									arg = commands[i].value.args[j].n;
									break;
								case 'Str':
									arg = commands[i].value.args[j].s.v;
									break;
							}
							arguments.push(arg);
						}
						var funcId = problem.functions[commands[i].value.func.id.v][arguments.length].funcId;
						block.pushCommand(new FuncCall(commands[i].value.func.id.v, arguments, block, undefined, funcId, problem));
						break;
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
				var body = convertTreeToCommands(commands[i].body, whileStmt, problem);
				if (!body)
					return undefined;
				whileStmt.body = body;
				block.pushCommand(whileStmt);
				break;
			case 'FunctionDef':
				var arguments = [];
				for (var j = 0; j < commands[i].args.args.length; ++j) {
					arguments.push(commands[i].args.args[j].id.v);
				}
				var funcDef = new FuncDef(commands[i].name.v, arguments, undefined, block, undefined, cmdId, problem);
				var body = convertTreeToCommands(commands[i].body, funcDef, problem);
				funcDef.body = body;
				block.pushCommand(funcDef);
				break;	
			case 'Pass':
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

function checkName(name) {
	var re =  /^[a-z_]+[a-z_0-9]*$/i;
	return re.test(name);
}

function checkNumber(number) {
	var re =  /^[0-9]+[0-9]*$/i;
	return re.test(number);
}
