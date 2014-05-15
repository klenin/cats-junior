define('ModesConversion', ['jQuery', 'jQueryUI', 'CommandsMode', 'ExecutionUnitCommands'], function(){
	var CommandsMode = require('CommandsMode');
	var ExecutionUnitCommands = require('ExecutionUnitCommands');

	var Exceptions = require('Exceptions');
	var IncorrectInput = Exceptions.IncorrectInput;
	var InternalError = Exceptions.InternalError;

	function blocksToCommands(problem) {
		var Blockly = problem.Blockly;

		// Get blocks for function definitions.
		var blocks = Blockly.mainWorkspace.getTopBlocks();
		blocks = blocks.filter(function(block) {
			return block.type == "funcdef";
		})
		blocks.push(problem.mainBlock);

		var newCmdList = new CommandsMode.Block([], undefined, problem);
		for (var i=0, block; block=blocks[i]; ++i) {
		 	var cmd = block.toCommand();
			newCmdList.pushCommand(cmd);
		}
		return newCmdList;
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
							args.push(expr.args[j].n);
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
		var argValues = [];
		for (var i = 0; i < command.value.args.length; ++i) {
			switch(command.value.args[i]._astname) {
				case 'Num':
					argValues.push(command.value.args[i].n);
					break;
				case 'Name':
					argValues.push(command.value.args[i].id.v);
					break;
				case 'Str':
					argValues.push(command.value.args[i].s.v);
					break;
				default:
					throw new IncorrectInput('Неподдерживаемый тип аргумента');
			}
		}
		return argValues;
	}

	function convertTreeToCommands(commands, parent, problem) {
		var block = new CommandsMode.Block([], parent, problem);
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
							throw new IncorrectInput('Некорректная команда');
						}
						if (!(commands[i].value.args.length == execCommand.getArguments().length)) {
							throw new IncorrectInput('Неверное число аргументов');
						}

						block.pushCommand(new CommandsMode.Command(commands[i].value.func.id.v,
							execCommand.getArguments(),
							getArgumentValues(commands[i]),
							block, undefined, problem));
					}
					else {
						block.pushCommand(new CommandsMode.FuncCall(commands[i].value.func.id.v, getArgumentValues(commands[i]), block, undefined, problem));
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

					var forStmt = new CommandsMode.ForStmt(undefined, cnt, block, undefined, problem);
					var body = convertTreeToCommands(commands[i].body, forStmt, problem);
					if (!body)
						return undefined;
					forStmt.setBody(body);
					block.pushCommand(forStmt);
					break;
				case 'If':
					//__constructor : function(testName, args, firstBlock, secondBlock, parent, id, problem)
					var dict = convertCondition(commands[i].test);
					if (!dict)
						return undefined;
					var conditionProperties = problem.executionUnit.getConditionProperties(dict['testName']);
					if (!conditionProperties) {
						throw new IncorrectInput('Некорректное имя функции сравнения');
					}
					var ifStmt = new CommandsMode.IfStmt(dict['testName'], [dict['testName']].concat(dict['args']), undefined, undefined, block, undefined, problem);
					var body1 = convertTreeToCommands(commands[i].body, ifStmt, problem);
					var body2;
					if (commands[i].orelse.length)
						body2 = convertTreeToCommands(commands[i].orelse, ifStmt, problem);
					ifStmt.setBlocks(body1, body2);
					block.pushCommand(ifStmt);
					break;
				case 'While':
					//__constructor : function(testName, args, body, parent, id, problem)
					var dict = convertCondition(commands[i].test);
					if (!dict)
						return undefined;
					var conditionProperties = problem.executionUnit.getConditionProperties(dict['testName']);
					if (!conditionProperties) {
						throw new IncorrectInput('Некорректное имя функции сравнения');
					}
					var whileStmt = new CommandsMode.WhileStmt(dict['testName'], [dict['testName']].concat(dict['args']), undefined, block, undefined, problem)
					var body = convertTreeToCommands(commands[i].body, whileStmt, problem);
					if (!body)
						return undefined;
					whileStmt.setBlocks(body);
					block.pushCommand(whileStmt);
					break;
				case 'FunctionDef':
					var args = [];
					for (var j = 0; j < commands[i].args.args.length; ++j) {
						args.push(commands[i].args.args[j].id.v);
					}
					if (problem.functions[commands[i].name.v] == undefined) {
						problem.functions[commands[i].name.v] = [];
					}

					if (problem.functions[commands[i].name.v][args.length] != undefined) {
						throw new IncorrectInput('Несколько функций с одним и тем же именем не поддерживаются в визуальном режиме');
					}

					var funcDef = new CommandsMode.FuncDef(commands[i].name.v, args, undefined, block, undefined, problem);
					problem.functions[commands[i].name.v][args.length] = funcDef;
					var body = convertTreeToCommands(commands[i].body, funcDef, problem);
					funcDef.setCommands(body.commands);
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

	return {
		convertTreeToCommands: convertTreeToCommands,
		blocksToCommands: blocksToCommands,
	}
});

