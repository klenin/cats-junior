function convert(commands, parent, problem, funcName, id, argumentsList, funcId){
	var block = new Block([], parent, problem);
	var func = undefined;
	if (funcName) {
		func = new FuncDef(funcName, argumentsList, [], parent, id, funcId, problem);
		block = new Block([], func, problem);
		func.body = block;
		if (!problem.functions[funcName]) {
			problem.functions[funcName] = [];
		}
		problem.functions[funcName][argumentsList.length] = func;
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
			var selects = $('#' + id).children('select');
			var args = [];
			for (var j = 0; j < selects.length; ++j) {
				args.push($('#' + id + ' option:selected')[j].value);
			}	

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
			var testName = problem.executionUnit.getConditionProperties().name;
			block.pushCommand(type == 'while' ? 
				new WhileStmt(testName, args, block1, block, id, problem) : 
				new IfStmt(testName, args, block1, block2, block, id, problem));
		}
		else if (type == 'for')		{
			var cnt = $('#' + id).children('spin').mySpin('getTotal');
			var block1 =  commands[i].children ? (convert(commands[i].children, block, problem)) : new Block([], block, problem);
			block.pushCommand(new ForStmt(block1, cnt, block,  id, problem));
		}
		else if (type == 'funccall'){
			var args = [];
			for (var j = 0; j < $('#' + id).children('input').length; ++j) {
				args.push($('#' + id).children('input:eq(' + j + ')').val());
			}
			block.pushCommand(new FuncCall(commands[i].data ? commands[i].data : 
				$('#' + id).text().split(' ').join(''), args,  block, id, $('#' + id).attr('funcId'), problem));
		}
		else{
			var argValues = [];
			for (var i = 0; i < $('#' + id).children('spin').length; ++i) {
				argValues.push($('#' + id).children('spin:eq(' + i + ')').mySpin('getTotalValue'));			
			}
			var cmd = new Command(type, 
				problem.executionUnit.getCommands()[type].arguments, 
				argValues,
				block, 
				id,
				problem);
			block.pushCommand(cmd);
		}
	}
	return func ? func : block;
}

function convertCondition(expr){
	switch (expr._astname) {
		case 'Call':
			if (expr.func._astname != 'Name' || !expr.args) //
				return undefined;
			var testName = '';
			var args = [];
			//switch(expr.func.id.v)
			//{
				//case 'objectPosition':
			testName = expr.func.id.v;
			args.push(0);
			for (var j = 0; j < expr.args.length; ++j) {
				switch (expr.args[j]._astname) {
					case 'Str':
						args.push(expr.args[j].s.v);
						break;
					case 'Num':
						args.push(expr.args[j].n.v);
						break;
					case 'Name':
						args.push(expr.args[j].id.v);
						break;
					default:
						args.push(undefined);
				}
			}

			/*if (expr.args.length != builtinFunctions[0]['args'].length) //reanme to testFunction!
				return undefined;*/
			/*for (var j = 0; j < expr.args.length; ++j) {
				/*if (expr.args[j]._astname != builtinFunctions[0]['args'][j]['type'])
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
					//break;
			//	default:
			//		return undefined;
			//}*/
			return {'testName': testName, 'args': args}
		case 'UnaryOp':
			if (expr.op.prototype._astname != 'Not')
				return undefined;
			var dict = convertCondition(expr.operand);
			if (!dict)
				return undefined;
			dict['args'][0] = dict['args'][0] == 'not' ? '' : 'not';
			return dict;
	}
	return undefined;
}

function getArgumentValues(command) {
	var argValues = undefined;
	for (var i = 0; i < commands.value.args.length; ++i) {
		switch(command.value.args[i]._astname) {
			case 'Num':
				argValues.push(command.value.args[i].n);
				break;
			case 'Name':
				argValues.push(command.value.args[i].id.v);
				break;
			case 'Str':
				argValues.push(command].value.args[i].s.v);
				break;
			default:
				throw 'Unsupported argument type!!!'
		}
	}	
	return argValues;
}

function convertTreeToCommands(commands, parent, problem) {
	var block = new Block([], parent, problem);
	var execCommands = problem.executionUnit.getCommands();
	for (var i = 0; i < commands.length; ++i)
	{
		switch(commands[i]._astname) {
			case 'Expr':
				if (commands[i].value._astname != 'Call' || 
					commands[i].value.func._astname != 'Name')
					return undefined;

				var j = 0;

				var execCommand = execCommands[commands[i].value.func.id.v];
				if (execCommand) {
					if (execCommand.name != commands[i].value.func.id.v) {
						throw 'Invalid input data!!';
					}
					if (!(commands[i].value.args.length == execCommand.arguments.length)) {
						throw 'Invalid arguments number!!!';
					}

					block.pushCommand(new Command(commands[i].value.func.id.v, 
						execCommand.arguments,
						getArgumentValues(commands[i]),
						block, undefined, problem));
				}
				else {
					var funcId = problem.functions[commands[i].value.func.id.v][getArgumentValues(commands[i]).length].funcId;
					block.pushCommand(new FuncCall(commands[i].value.func.id.v, getArgumentValues(commands[i]), block, undefined, funcId, problem));
				}
				break;
			case 'For':
				//__constructor : function(body, cnt, parent, id)
				if (!commands[i].iter || commands[i].iter._astname != 'Call' ||  
					commands[i].iter.func._astname != 'Name' || commands[i].iter.func.id.v != 'range' ||
					commands[i].iter.args.length != 1 || (commands[i].iter.args[0]._astname != 'Num' && commands[i].iter.args[0]._astname != 'Name')) //
					return undefined;
				var cnt = undefined;

				switch (commands[i].iter.args[0]._astname) {
					case 'Num':
						cnt = commands[i].iter.args[0].n;
						break;
					case 'Name':
						cnt = commands[i].iter.args[0].id.v;
						break;
				}
				
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
				var funcDef = new FuncDef(commands[i].name.v, arguments, undefined, block, undefined, ++cmdId, problem);
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

