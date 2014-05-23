define('CommandsMode', ['jQuery',
	'jQueryUI',
	'jQueryInherit',
	'Misc',
	'ShowMessages',
	'Exceptions',
	'ExecutionUnitCommands'], function(){
	var ShowMessages = require('ShowMessages');
	var Exceptions = require('Exceptions');
	var ExecutionUnitCommands = require('ExecutionUnitCommands');
	var IncorrectInput = Exceptions.IncorrectInput;
	var InternalError = Exceptions.InternalError;

	var CommandBase = $.inherit({
		__constructor: function(name, parent, node, problem) {
			this.name = name;
			this.parent = parent;
			this.node = node;
			this.problem = problem;
			this.finished = false;
			this.timestamp = new Date().getTime();
		},

		createClone: function () {
			return new CommandBase(this.name, this.parent, this.node, this.problem);
		},

		getId: function() {
			return $(this.node).attr('id');
		},

		prepareArgumentsListForExecution: function(args) {
			return [];
		},

		executeOneStep: function(cmdNumToExecute, args){
			if (!this.problem.needToContinueExecution()) {
				return cmdNumToExecute;
			}
			if (cmdNumToExecute > 0 && !this.isFinished(args)) {
				if (!this.isStarted()) {
					this.updateInterface('START_EXECUTION');
				}
				if (this.problem.needToHighlightCommand(this)) {
					this.highlightOn();
				}
				this.problem.oneStep(this.name, 1, this.prepareArgumentsListForExecution(args));
				this.problem.recalculatePenalty(this);
				this.problem.checkLimit();
				this.problem.setLastExecutedCommand(this);
			}
			return Math.max(0, cmdNumToExecute - 1);
		},

		exec: function(cmdNumToExecute, args) {
			cmdNumToExecute = this.executeOneStep(cmdNumToExecute, args);
			this.finished = true;

			return cmdNumToExecute;
		},

		getClass: function() {
			return 'CommandBase';
		},

		getName: function() {
			return this.name ? this.name : this.getClass();
		},

		setDefault: function() {
			this.finished = false;
			this.highlightOff();
		},

		isFinished: function(args) {
			return this.finished;
		},

		isStarted: function() {
			return this.finished;
		},

		updateInterface: function(newState) {
			switch (newState) {
				case 'START_EXECUTION':
					break;
				case 'FINISH_EXECUTION':
					break;
			}
		},

		highlightOff: function() {
			if (!this.node)
				return
			var svg = this.node.getSvgRoot();
			if (!svg)
				return
			this.problem.Blockly.removeClass_(svg, "blocklyCurrentCommand");
		},

		highlightOn: function(){
			if (!this.node)
				return
			var svg = this.node.getSvgRoot();
			if (!svg)
				return
			this.problem.Blockly.addClass_(svg, "blocklyCurrentCommand");
		},

		generatePythonCode: function(tabsNum) {
			return generateTabs(tabsNum) + this.name + '()\n';
		},

		initBlock_: function(typeName, connection) {
			var Blockly = this.problem.Blockly
			var block = this.node = Blockly.Block.obtain(Blockly.mainWorkspace, typeName);
            block.initSvg();
            block.render();
            if (connection && block.previousConnection) {
            	connection.connect(block.previousConnection);
            }
            return block
		},

		generateVisualCommand: function(connection) {
			if (!this.problem.isCommandSupported(this.getName())) {
				throw new IncorrectInput('Команда ' + this.getName() + ' отсутствует в данной задаче');
			}

			var block = this.initBlock_(this.getName(), connection);
			block.rebuildArgumentFields_(block.input_, this.arguments, 0);
            return block
		},

		onGenerateDomObjectCallback: function(tree, newNode) {
			this.__self.onCreateJsTreeItem(tree, newNode, this.getName(), this.problem, true, undefined, this.arguments);
			this.node = newNode;
		},

		setArguments: function(args) {
			return;
		},


		highlightWrongNames: function() {
			return;
		},

		getFunction: function() {
			return this.parent ? this.parent.getFunction() : undefined;
		},

		getArguments: function() {
			return;
		},

		checkIntegrity: function(parent) {
			if (this.parent.timestamp !== parent.timestamp) {
				throw new InternalError(this.getName() + ' ' + this.parent.timestamp + '!==' + parent.timestamp);
			}
		}
	},
	{
		onCreateJsTreeItem: function(tree, node, type, problem, doNotNeedToUpdate) {
			tree.set_type(type, node);
			$(node).addClass(type);

			$(node).prop({
				'id': type + ++cmdId,
				'numId': cmdId,
				'ifLi': 1, //is it needed?
				'type': type
			});
		}
	});

	var Command = $.inherit(CommandBase, {
		__constructor: function(name, parameters, argumentValues, parent, node, problem) {
			//parameters is an array with the description of command parameters got from executive unit
			//argumentValues -- array of corresponding values
			this.__base(name, parent, node, problem);

			this.arguments = [];

			for (var i = 0; i < parameters.length; ++i) {
				this.arguments.push(parameters[i].clone());
				this.arguments[i].problem = problem;// W/A, needs to be reworked
			}

			this.initializeArgumentDomObject();

			if (argumentValues && argumentValues.length) {
				if (argumentValues.length != this.arguments.length) {
					throw new IncorrectInput('Количество переданных аргументов не соответсвует ожидаемому');
				}

				for (var i = 0; i < this.arguments.length; ++i) {
					if (argumentValues[i] != undefined) {
						this.arguments[i].setValue(argumentValues[i]);
					}
				}
			}
			var funcDef = this.getFunction();
			if (funcDef) {
				this.setArguments(funcDef.getArguments());
			}

		},

		executeOneStep: function(cmdNumToExecute, args) {
			this.setArgumentValues(args);
			return this.__base(cmdNumToExecute, args);
		},

		initializeArgumentDomObject: function() {
			for (var i = 0; i < this.arguments.length; ++i) {
				this.arguments[i].initializeArgumentDomObject(this.node, i);
			}
		},

		setArgumentValues: function(args) {
			for (var i = 0; i < this.arguments.length; ++i) {
				this.arguments[i].setArgumentValues(args);
			}
		},

		createArgumentsClone: function() {
			var argumentValues = [];
			for (var i = 0; i < this.arguments.length; ++i){
				argumentValues.push(this.arguments[i].getExpression());
			}
			return argumentValues;
		},

		createClone: function () {
			return new Command(this.name, this.arguments, this.createArgumentsClone(), this.parent, this.node, this.problem);
		},

		prepareArgumentsListForExecution: function(args) {
			var argumentValues = [];
			for (var i = 0; i < this.arguments.length; ++i) {
				argumentValues.push(this.arguments[i].getValue(args));
			}
			return argumentValues;
		},

		getClass: function() {
			return 'Command';
		},

		setDefault: function() {
			this.__base();
			for (var i = 0; i < this.arguments.length; ++i) {
				this.arguments[i].setDefault();
			}
		},

		updateInterface: function(newState) {
			for (var i = 0; i < this.arguments.length; ++i) {
				var blocklyField = this.node.getArgField(i)
				this.arguments[i].updateInterface(newState, blocklyField);
			}
		},

		generatePythonCode: function(tabsNum) {
			var	str = generateTabs(tabsNum) + this.name + '(';
			for (var i = 0; i < this.arguments.length; ++i) {
				if (i > 0) {
					str += ', ';
				}
				var arg = this.arguments[i].findValue(this.arguments[i].getExpression());
				if (!arg) {
					arg = this.arguments[i].getExpression();
				}
				str += arg;
			}
			str += ')\n';
			return str;
		},

		updateArgumentValueInDomObject: function() {
			for (var i = 0; i < this.arguments.length; ++i){
				this.arguments[i].updateValueInDomObject();
			}
		},

		onGenerateDomObjectCallback: function(tree, node) {
			this.__base(tree, node);
			this.initializeArgumentDomObject();
			this.updateArgumentValueInDomObject();
		},

		setArguments: function(args) {
			for (var i = 0; i < this.arguments.length; ++i) {
				this.arguments[i].addArguments(args, true);
			}
		},

		getArguments: function() {
			return this.arguments;
		},

		getNewNodePosition: function() {
			return 'after';
		}
	},
	{
		constructCommand: function(type, problem) {
			return problem.getCommands()[type];
		},

		onCreateJsTreeItem: function(tree, node, type, problem, doNotNeedToUpdate, args, parameters) {
			this.__base(tree, node, type, problem, doNotNeedToUpdate);

			var doNotCloneArguments = true;
			if (!parameters) {
				var command = this.constructCommand(type, problem);
				if (command) {
					parameters = command.getArguments();
				}
				else if (args) {
					parameters = [];
					for (var i = 0; i < args.length; ++i) {
						parameters.push(new ExecutionUnitCommands.CommandArgumentInput());
					}
				}
				doNotCloneArguments = false;
			}
			this.generateArgumentsDom(node, parameters, problem, doNotCloneArguments);
			if (!doNotNeedToUpdate) {
				problem.updated();
			}
		},

		generateArgumentsDom: function(node, parameters, problem, doNotCloneArguments, prev, values) {
			var prev = prev ? prev : $(node).children('a');
			for (var i = 0; i < parameters.length; ++i) {
				var parameter = doNotCloneArguments ? parameters[i] : parameters[i].clone();
				prev = this.generateArgumentDom(parameter, prev, problem, doNotCloneArguments, values ? values[i] : undefined);
			}
		},

		generateArgumentDom: function(parameter, prev, problem, doNotCloneArguments, value) {
			return parameter.generateDomObject(
				$(prev),
				function(p) {
					return function() {
						p.updated();
					}
				}(problem),
				problem,
				value != undefined ? value : doNotCloneArguments ? parameter.getExpression() : undefined);
		}
	});

	var CommandWithCounter = $.inherit(Command, {
		__constructor: function(name, parameters, argumentValues, parent, node, problem) {
			this.__base(name, parameters, argumentValues, parent, node, problem);
			this.counter = undefined;
			for (var i = 0; i < this.arguments.length; ++i) {
				if (this.arguments[i].isCounter) {
					if (this.counter != undefined) {
						throw new IncorrectInput('У команды не может быть несколько счетчиков');
					}
					this.counter = this.arguments[i];
				}
			}
			this.started = false;
		},

		createClone: function() {
			return new CommandWithCounter(this.name, this.arguments, this.createArgumentsClone(), this.parent, this.node, this.problem);
		},

		executeOneStep: function(cmdNumToExecute, args) {
			var prevCnt = cmdNumToExecute;
			cmdNumToExecute = this.__base(cmdNumToExecute, args);
			if (prevCnt > cmdNumToExecute) {
				this.started = true;
			}
			this.counter.decreaseValue();
			return Math.max(0, cmdNumToExecute);
		},

		exec: function(cmdNumToExecute, args) {
			while (cmdNumToExecute > 0 && !this.isFinished(args)) { //we need to check the correctness of the counter expression
				cmdNumToExecute = this.executeOneStep(cmdNumToExecute, args);
			}
			return cmdNumToExecute;
		},

		setDefault: function() {
			this.__base();
			this.started = false;
		},

		getClass: function() {
			return 'CommandWithCounter';
		},

		isFinished: function(args) {
			var counterValue = this.counter.getCounterValue(args);
			if (counterValue == undefined) {
				throw new IncorrectInput('Некорректный счетчик');
			}
			return counterValue <= 0;
		},

		isStarted: function() {
			return this.started;
		}
	});

	var ForStmt = $.inherit(CommandWithCounter, {
		__constructor: function(body, cmdNumToExecute, parent, node, problem) {
			var parameters = [new ExecutionUnitCommands.CommandArgumentSpinCounter(1, undefined)];
			this.__base(undefined, parameters, [cmdNumToExecute], parent, node, problem);
			this.body = body;
		},

		setBody: function(body) {
			this.body = body;
		},

		createClone: function () {
			var body = this.body.createClone();
			return new ForStmt(body, this.arguments[0].getExpression(), this.parent, this.node, this.problem);
		},

		executeOneStep: function(cmdNumToExecute, args) {
			if (!this.problem.needToContinueExecution()) {
				return cmdNumToExecute;
			}
			if (!this.isFinished(args)) {
				if (!this.isStarted() || this.body.isFinished(args)) {
					if (this.isStarted()) {
						this.body.setDefault();
						if (this.body.isFinished(args)) { //WA for the case of empty body
							this.counter.decreaseValue();
						}
					}
					this.setArgumentValues(args);
					this.updateInterface('START_EXECUTION');
					--cmdNumToExecute;
					this.started = true;
					if (this.problem.needToHighlightCommand(this)) {
						this.highlightOn();
					}
				}

				if (cmdNumToExecute > 0) {
					cmdNumToExecute = this.body.exec(cmdNumToExecute, args);
					if (this.body.isFinished(args)) {
						this.counter.decreaseValue();
						//this.body.setDefault();
					}
				}
			}
			return cmdNumToExecute;
		},

		getClass: function() {
			return 'for';
		},

		setDefault: function() {
			this.__base();
			this.body.setDefault();
			this.started = false;
		},

		updateInterface: function(newState) {
			this.__base(newState);
			var blocklyField = this.node.getArgField(0)
			this.body.updateInterface(newState, blocklyField)
		},

		generatePythonCode: function(tabsNum) {
			var curCnt = this.problem.curCounter;
			var str = generateTabs(tabsNum) + 'for ' + this.problem.counters[curCnt]['name'] +
				(this.problem.counters[curCnt]['cnt'] ?
				this.problem.counters[curCnt]['cnt'] :
				'') + ' in range(' + this.counter.getExpression() + '):\n';
			++this.problem.counters[curCnt]['cnt'];
			this.problem.curCounter = (this.problem.curCounter + 1) % 3;
			str += this.body.generatePythonCode(tabsNum + 1);
			--this.problem.counters[curCnt]['cnt'];
			this.problem.curCounter = curCnt;
			return str;
		},

		generateVisualCommand: function(connection) {
			if (!this.problem.isCommandSupported(this.getClass())) {
				throw new IncorrectInput('Команда ' + this.getClass() + ' отсутствует в данной задаче');
			}

			var block = this.initBlock_(this.getClass(), connection);
			block.rebuildArgumentFields_(block.input_, this.arguments, 0);
			this.body.generateVisualCommand(block.getInput('DO').connection);
            return block
		},

		onGenerateDomObjectCallback: function(tree, node) {
			this.__base(tree, node);
			this.body.generateVisualCommand(tree, node, 'last');
		},

		setArguments: function(args) {
			this.__base(args);
			if (this.body) {
				this.body.setArguments(args);
			}
		},

		highlightWrongNames: function() {
			return this.body.highlightWrongNames();
		}
	},
	{
		constructCommand: function(type, problem) {
			var args = [
				new ExecutionUnitCommands.CommandArgumentSpinCounter(1, undefined)];
			return new ExecutionUnitCommands.ExecutionUnitCommand('for', undefined, args);
		}
	});

	var CondStmt = $.inherit(Command, {
		__constructor: function(condName, args, firstBlock, secondBlock, parent, node, problem) {
			var parameters = [];
			var conditionNames = [];
			var conditionProperties = problem.getConditionProperties();
			for (var i = 0; i < conditionProperties.length; ++i){
				conditionNames.push([conditionProperties[i].name, conditionProperties[i].title]);
			}
			this.conditionName = condName;
			for (var i = 0; i < conditionProperties.length; ++i) {
				if (conditionProperties[i].name == this.conditionName) {
					this.conditionProperties = conditionProperties[i];
					break;
				}
			}
			parameters.push(new ExecutionUnitCommands.CommandArgumentSelect(conditionNames));
			parameters.push(new ExecutionUnitCommands.CommandArgumentSelect([['', 'да'], ['not', 'нет']]));
			for (var i = 0; i < this.conditionProperties.args.length; ++i) {
				parameters.push(this.conditionProperties.args[i].clone());
			}
			this.__base(undefined, parameters, args, parent, node, problem);
			this.blocks = [];
			this.blocks[0] = firstBlock;
			if (secondBlock) {
				this.blocks[1] = secondBlock;
			}
			this.blockToExecute = undefined;
			this.setArgumentPossibleValues(undefined, args);
			this.updateConditionArguments();
		},

		prepareForCloneCreation: function() {
			var dict = {};
			dict['firstBlock'] = this.blocks[0].createClone();
			dict['secondBlock'] = undefined;
			if (this.blocks[1]) {
				dict['secondBlock'] = this.blocks[1].createClone();
			}
			dict['args'] = [];
			for (var i = 0; i < this.arguments.length; ++i) {
				dict['args'].push(this.arguments[i].getExpression())
			}
			return dict;
		},

		setBlocks: function(firstBlock, secondBlock) {
			this.blocks[0] = firstBlock;
			if (secondBlock) {
				this.blocks[1] = secondBlock;
			}
		},

		setDefault: function() {
			this.__base();
			this.blockToExecute = undefined;
			this.blocks[0].setDefault();
			if (this.blocks[1]) {
				this.blocks[1].setDefault();
			}
		},

		onBlockExecution: function() {
			return;
		},

		executeOneStep: function(cmdNumToExecute, args) {
			if (!this.problem.needToContinueExecution()) {
				return cmdNumToExecute;
			}
			if (!this.isFinished(args)){
				if (!this.isStarted()) {
					var testResult = this.testCondition(args);
					this.blockToExecute = testResult ? 0 : 1;
					--cmdNumToExecute;
					this.blocks[0].setDefault();
					if (this.blocks[1]) {
						this.blocks[1].setDefault();
					}
					this.setArgumentValues(args);
					this.updateInterface('START_EXECUTION');
					if (this.problem.needToHighlightCommand(this)) {
						this.highlightOn();
					}
				}
				if (cmdNumToExecute > 0 && this.blocks[this.blockToExecute]) {
					cmdNumToExecute = this.blocks[this.blockToExecute].exec(cmdNumToExecute, args);
					if (this.blocks[this.blockToExecute].isFinished(args)) {
						this.onBlockExecution();
					}
				}
			}
			return cmdNumToExecute;
		},

		setArguments: function(args) {
			for (var i = 2; i < this.arguments.length; ++i) {
				this.arguments[i].setArgumentValues(args);
			}
			if (this.blocks) {
				for (var i = 0; i < this.blocks.length; ++i) {
					if (this.blocks[i]) {
						this.blocks[i].setArguments(args);
					}
				}
			}
		},

		isStarted: function() {
			return this.blockToExecute =! undefined;
		},

		updateInterface: function(newState) {
			this.__base(newState);
			this.blocks[0].updateInterface(newState);
			if (this.blocks[1]) {
				this.blocks[1].updateInterface(newState);
			}
		},

		testCondition: function(args) {
			var conditionArguments = [];
			for (var i = 1; i < this.arguments.length; ++i) {
				conditionArguments.push(this.arguments[i].getValue(args));
			}
			return this.conditionProperties.jsFunc(conditionArguments);
		},

		getClass: function() {
			return 'CondStmt';
		},

		isStarted: function() {
			return this.blockToExecute != undefined;
		},

		generatePythonCode: function(tabsNum) {
			str = generateTabs(tabsNum)  + this.getOperatorName() + ' ';
			if (this.conditionName != this.conditionProperties.name || this.arguments.length - 2 != this.conditionProperties.args.length) {
				throw new IncorrectInput('Некорректное имя функции или количество аргументов');
			}
			if (this.arguments[1].getExpression() == 'not') {
				str += 'not ';
			}
			str += this.conditionName + '(';
			for (var i = 2; i < this.arguments.length; ++i) {
				if (i > 2) {
					str += ', ';
				}
				var arg = this.arguments[i].findValue(this.arguments[i].getExpression());
				if (!arg) {
					arg = this.arguments[i].getExpression();
				}

				str += arg;
			}
			str += '):\n';
			str += this.blocks[0].generatePythonCode(tabsNum + 1);
			if (this.blocks[1]) {
				str += generateTabs(tabsNum)  + 'else:\n';
				str += this.blocks[1].generatePythonCode(tabsNum + 1);
			}
			return str;
		},


		generateVisualCommand: function(connection) {
			if (!this.problem.isCommandSupported(this.getClass())) {
				throw new IncorrectInput('Комманда ' + this.name + ' не поддерживается');
			}

			var block = this.initBlock_(this.getClass(), connection);
			block.rebuildArgumentFields_(block.inputCondition_, this.arguments, 0);

			if (this.blocks[0]) {
				var input = block.getInput('DO');
				this.blocks[0].generateVisualCommand(input.connection);
			}
			if (this.blocks[1]) {
				var input = block.getInput('ELSE');
				this.blocks[1].generateVisualCommand(input.connection);
			}
			return block
		},

		updateConditionArguments: function() {
			this.getConditionTypeSelect().off('change').on('change', function(p, self){
				return function() {
					var condName = $(this).children('option:selected').val();
					if (condName != self.conditionName) {
						$(self.node).children('.testFunctionArgument:gt(1)').remove();
						CondStmt.generateArgumentsDom($(self.node),
							p.getConditionProperties(condName).args,
							p,
							false,
							$(self.node).children('.testFunctionArgument').last());
						p.updated();
					}
				};
			}(this.problem, this));
			/*$(this.node).children('.testFunctionArgument').remove();
			this.__self.generateArgumentsDom($(this.node), this.arguments, this.problem, true);*/
		},

		setArgumentPossibleValues: function(args, values) {
			if (!args) {
				var funcDef = this.getFunction();
				if (funcDef) {
					args = funcDef.getArguments();
				}
			}
			if (args) {
				for (var i = 2; i < this.arguments.length; ++i) {
					this.arguments[i].addArguments(args, true);
					if (values && values[i]) {
						this.arguments[i].setValue(values[i]);
					}
				}
			}
		},

		highlightWrongNames: function() {
			this.blocks[0].highlightWrongNames();
			if (this.blocks[1]) {
				this.blocks[1].highlightWrongNames();
			}
		},

		onGenerateDomObjectCallback: function(tree, node) {
			this.__base(tree, node);
			this.blocks[0].generateVisualCommand(tree, node, 'last');
			if (this.blocks[1]) {
				this.blocks[1].generateVisualCommand(tree, $(node).next(), 'last');
			}
			$(this.arguments[0].domObject).change();
		},

		getConditionTypeSelect: function() {
			return $(this.node).children('.testFunctionArgument').children('select').first();
		}
	},
	{
		constructArguments: function(problem) {
			var conditionProperties = problem.getConditionProperties();
			var conditionPropertyNames = [];
			for (var i = 0; i < conditionProperties.length; ++i) {
				conditionPropertyNames.push([conditionProperties[i].name, conditionProperties[i].title]);
			}
			var args = [
				new ExecutionUnitCommands.CommandArgumentSelect(conditionPropertyNames)];
			args.push(new ExecutionUnitCommands.CommandArgumentSelect([['', 'да'], ['not', 'нет']]));
			var conditionProperty = conditionProperties[0];
			for (var i = 0; i < conditionProperty.args.length; ++i) {
				args.push(conditionProperty.args[i].clone());
			}
			return args;
		}
	});

	var IfStmt = $.inherit(CondStmt, {
		__constructor: function(condName, args, firstBlock, secondBlock, parent, node, problem) {
			this.__base(condName, args, firstBlock, secondBlock, parent, node, problem);
		},

		createClone: function () {
			var dict = this.prepareForCloneCreation();
			return new IfStmt(this.conditionName, dict['args'], dict['firstBlock'], dict['secondBlock'], this.parent, this.node, this.problem);
		},

		getClass: function() {
			return this.blocks[1] ? 'ifelse' : 'if';
		},

		getOperatorName: function() {
			return 'if'
		},

		isFinished: function(args) {
			return this.isStarted() && (this.blocks[this.blockToExecute] == undefined || this.blocks[this.blockToExecute].isFinished(args));
		}
	},
	{
		onCreateJsTreeItem: function(tree, node, type, problem, doNotNeedToUpdate, args, parameters) {
			this.__base(tree, node, type, problem, type == 'ifelse', args, parameters);
			if (type == 'ifelse') {
				tree.rename_node(node, 'Если');
				tree.create($(node), "after", false,
					function(elseNode){
						tree.set_type('else', elseNode);
						tree.rename_node(elseNode, 'Иначе');
						$(elseNode).prop({
							'numId': cmdId,
							'ifLi': 1,
							'type': 'else',
							'id': 'else' + cmdId
						});
						$(elseNode).addClass('else');
					},
					true);
			}
			if (!doNotNeedToUpdate) {
				problem.updated();
			}
		},

		constructCommand: function(type, problem) {
			return new ExecutionUnitCommands.ExecutionUnitCommand('if', undefined, this.constructArguments(problem));
		}
	});

	var WhileStmt = $.inherit(CondStmt, {
		__constructor: function(condName, args, body, parent, node, problem) {
			this.__base(condName, args, body, undefined, parent, node, problem);
		},

		createClone: function () {
			var dict = this.prepareForCloneCreation();
			return new WhileStmt(this.conditionName, dict['args'], dict['firstBlock'], this.parent, this.node, this.problem);
		},


		getClass: function() {
			return 'while';
		},

		getOperatorName: function() {
			return 'while'
		},

		isFinished: function(args) {
			return this.isStarted() && this.blocks[this.blockToExecute] == undefined;
		},

		onBlockExecution: function() {
			this.blockToExecute = undefined;
		}
	},
	{
		constructCommand: function(type, problem) {
			return new ExecutionUnitCommands.ExecutionUnitCommand('while', undefined, this.constructArguments(problem));
		}
	});

	var  Block = $.inherit(CommandBase, {
		__constructor: function(commands, parent, problem) {
			this.__base(undefined, parent, undefined, problem)
			this.commands = commands;
			this.commandIndex = 0;
		},

		createCommandsClone: function() {
			var commands = [];
			for (var i = 0; i < this.commands.length; ++i) {
				commands.push(this.commands[i].createClone());
			}
			return commands;
		},

		createClone: function () {
			return new Block(this.createCommandsClone(), this.parent, this.problem);
		},

		insertCommand : function(command, pos) {
			this.commands.splice(pos, command);
		},

		pushCommand: function(command){
			this.commands.push(command);
		},

		exec: function(cmdNumToExecute, args) {
			while (cmdNumToExecute && this.commandIndex < this.commands.length) {
				cmdNumToExecute = this.commands[this.commandIndex].exec(cmdNumToExecute, args);
				if (this.commands[this.commandIndex].getClass() == 'funcdef' || this.commands[this.commandIndex].isFinished(args)) {
					++this.commandIndex;
				}
			}
			return cmdNumToExecute;
		},

		getClass: function() {
			return 'Block';
		},

		setDefault: function() {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].setDefault();
			}
			this.commandIndex = 0;
		},

		isFinished: function(args) {
			return (this.commandIndex >= this.commands.length) ||
				(this.commandIndex == this.commands.length - 1 && this.commands[this.commandIndex].isFinished(args));
		},

		isStarted: function() {
			return this.commandIndex > 0 || this.commands[this.commandIndex].isStarted();
		},

		updateInterface: function(newState) {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].updateInterface(newState);
			}
		},

		generatePythonCode: function(tabsNum) {
			str = '';
			if (!this.commands.length && this.needToGeneratePassStmt()) {
				str += generateTabs(tabsNum + 1) + 'pass\n';
			}
			for (var i = 0; i < this.commands.length; ++i) {
				str += this.commands[i].generatePythonCode(tabsNum);
			}
			return str;
		},

		generateVisualCommand: function(connection) {
			var nextConnection = connection ? connection :
			    this.problem.mainBlock.getInput('DO').connection;
			for (var i = 0, cmd; cmd = this.commands[i]; ++i) {
				var newBlock = cmd.generateVisualCommand(nextConnection);
				if (cmd.getClass() != 'funcdef')
					nextConnection = newBlock.nextConnection;
			}
		},

		setArguments: function(args) {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].setArguments(args);
			}
		},

		highlightWrongNames: function() {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].highlightWrongNames();
			}
		},

		getFunction: function() {
			return this.parent ? this.parent.getFunction() : undefined;
		},

		setArgumentValues: function(args) {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].setArgumentValues(args);
			}
		},

		needToGeneratePassStmt: function() { //this function will be called in Block.generatePythonCode to decide whether
		//we should generate pass statement when block is empty or not
		//we shouldn't generate only if the parent is Block (we're in main body)
			return this.parent && this.parent.getClass() != 'Block';
		}
	});

	var FuncDef = $.inherit(Block, {
		__constructor: function(name, argumentsList, commands, parent, node, problem) {
			this.__base(commands, parent, problem);
			this.node = node;
			this.name = name;
			this.argumentsList = argumentsList.clone();
			this.body = new Block(commands, this, problem);
		},

		createClone: function () {
			return new FuncDef(this.name, this.argumentsList, this.createCommandsClone(), this.parent, this.node, this.problem);
		},

		getClass: function() {
			return 'funcdef';
		},

		getFuncId: function() {
			return $(this.node).attr('funcId');
		},

		getFunction: function() {
			return this;
		},

		setCommands: function(commands) {
			this.commands = commands;
		},

		executeBody: function(cmdNumToExecute, args) {
			return this.exec(cmdNumToExecute, args, true);
		},

		exec: function(cmdNumToExecute, args, needToExecuteBody) {
			if (needToExecuteBody) {
				return this.__base(cmdNumToExecute, args);
			}
			return cmdNumToExecute;
		},

		generatePythonCode: function(tabsNum) {
			str = generateTabs(tabsNum) + 'def ' + this.name + '(';
			for (var i = 0; i < this.argumentsList.length; ++i) {
				if (i > 0) {
					str += ', ';
				}
				str += this.argumentsList[i];
			}
			str += '):\n';
			str += this.__base(tabsNum + 1);
			return str;
		},

		generateVisualCommand: function(connection) {
			if (!this.problem.isCommandSupported(this.getClass())) {
				throw new IncorrectInput('Объявление функций не поддерживается');
			}

			var block = this.initBlock_(this.getClass(), connection);
			block.setFieldValue(this.name, 'NAME');

            var xmlMutation = document.createElement('mutation');
            for (var i = 0, argName; argName = this.argumentsList[i]; ++i) {
                var xmlArg = document.createElement('arg');
                xmlArg.setAttribute('name', argName);
                xmlMutation.appendChild(xmlArg);
            }
            block.domToMutation(xmlMutation)

			this.body.generateVisualCommand(block.getInput('DO').connection);
			// no return for funcdef
		},

		getArguments: function() {
			return this.argumentsList;
		},

		needToGeneratePassStmt: function() { //this function will be called in Block.generatePythonCode to parent field to decide whether
		//we should generate pass statement when block is empty or not
		//we shouldn't generate only if the parent is Block (we're in main body)
			return true;
		}
	});

	var FuncCall = $.inherit(Command, {
		__constructor: function(name, argumentValues, parent, node, problem) {
			var parameters = [];
			for (var i = 0; i < argumentValues.length; ++i) {
				parameters.push(new ExecutionUnitCommands.CommandArgumentInput());
			}
			this.__base(name, parameters, argumentValues, parent, node, problem);
			this.funcDef = undefined;
		},

		createClone: function () {
			return new FuncCall(this.name, this.createArgumentsClone(), this.parent, this.node, this.problem)
		},

		getFuncDef: function() {
			try {
				return this.problem.functions[this.name][this.arguments.length];
			}
			catch(err) {
				return undefined;
			}
		},

		isStarted: function() {
			return this.funcDef != undefined;
		},

		setDefault: function() {
			this.__base();
			this.funcDef = undefined;
		},

		generateArgValues: function(args) {
			var funcDefArguments = this.getFuncDef().getArguments();
			var argsCopy = args ? $.extend(true, {}, args) : undefined;
			args = args ? args : {};
			for (var i = 0; i < this.arguments.length; ++i) {
				args[funcDefArguments[i]] = this.arguments[i].getValue(argsCopy);
			}
			return args;
		},

		executeOneStep: function(cmdNumToExecute, args){
			if (!this.problem.needToContinueExecution()) {
				return cmdNumToExecute;
			}
			if (cmdNumToExecute > 0 && !this.isFinished(args)) {
				if (!this.isStarted()) {
					this.updateInterface('START_EXECUTION');
					if (this.problem.needToHighlightCommand(this)) {
						this.highlightOn();
					}
					this.funcDef = this.getFuncDef().createClone();
					--cmdNumToExecute;
					this.problem.setLastExecutedCommand(this);
				}
				if (cmdNumToExecute > 0) {
					cmdNumToExecute = this.funcDef.executeBody(cmdNumToExecute, this.generateArgValues(args));
				}
			}
			return Math.max(0, cmdNumToExecute);
		},

		exec: function(cmdNumToExecute, args) {
			cmdNumToExecute = this.executeOneStep(cmdNumToExecute, this.generateArgValues(args));
			if (this.funcDef.isFinished(this.generateArgValues(args))) {
				this.funcDef = undefined;
				this.finished = true;
			}
			return cmdNumToExecute;
		},

		getClass: function() {
			return 'funccall';
		},

		getFuncId: function(){
			var funcDef = this.getFuncDef();
			if (funcDef) {
				return funcDef.getFuncId();
			}
			this.highlightWrongNames();
		},

		updateJstreeObject: function(args, funcDef){
			$(this.node).children('a').html('<ins class="jstree-icon"> </ins>' + this.name);
			args = args ? args : (funcDef ? funcDef.getArguments() : this.getFuncDef().getArguments());
			if (this.arguments.length > args.length) {
				$(this.node).children('.testFunctionArgument').filter(':gt(' + (args.length - 1) + ')').remove();
				$(this.node).children('.testFunctionArgument').filter(':eq(' + (args.length) + ')').remove();
			}
			else {
				var prev = $(this.node).children('.testFunctionArgument').last();
				if (!prev.length) {
					prev = $(this.node).children('a');
				}
				for (var i = this.arguments.length; i < args.length; ++i) {
					var arg = new ExecutionUnitCommands.CommandArgumentInput();
					this.arguments.push(arg);
					prev = this.__self.generateArgumentDom(arg, prev, this.problem, true, '');
				}
			}
		},

		generateVisualCommand: function(connection) {
			if (!this.name in this.problem.functions) {
				throw new IncorrectInput('Для функции' + this.name + ' нет объявления.');
			}

			var funcDef = this.getFuncDef();
			var block = this.initBlock_(this.getClass(), connection);
			block.setFieldValue(this.name, 'NAME');

            var xmlMutation = document.createElement('mutation');
            xmlMutation.setAttribute('name', this.name)
            for (var i = 0, argName; argName = funcDef.argumentsList[i]; ++i) {
                var xmlArg = document.createElement('arg');
                xmlArg.setAttribute('name', argName);
                xmlMutation.appendChild(xmlArg);
            }
            block.domToMutation(xmlMutation);

            block.setProcedureParameters(funcDef.argumentsList);
            for (var i = 0, argName; argName = funcDef.argumentsList[i]; ++i) {
				block.setFieldValue(this.arguments[i].value.toString(), argName);
            }
            return block
		},

		highlightWrongNames: function() {
			if (!this.problem.functions[this.name] || !this.problem.functions[this.name][this.arguments.length]|| !checkName(this.name)) {
				$(this.node).children('a').addClass('wrongName');
			}
			else {
				$(this.node).children('a').removeClass('wrongName');
			}
		},
	});

	return {
		CommandBase: CommandBase,
		Command: Command,
		CommandWithCounter: CommandWithCounter,
		ForStmt: ForStmt,
		IfStmt: IfStmt,
		WhileStmt: WhileStmt,
		Block: Block,
		FuncDef: FuncDef,
		FuncCall: FuncCall
	}
});

