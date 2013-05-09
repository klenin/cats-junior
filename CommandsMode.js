define('CommandsMode', ['jQuery', 
	'jQueryUI', 
	'jQueryInherit',
	'Spin',
	'Misc',
	'Accordion',
	'ShowMessages',
	'Misc',
	'Exceptions',
	'ExecutionUnitCommands'], function(){
	var ShowMessages = require('ShowMessages');
	var Exceptions = require('Exceptions');
	var ExecutionUnitCommands = require('ExecutionUnitCommands');

	var CommandBase = $.inherit({
		__constructor: function(name, parent, node, problem) {
			this.name = name;
			this.parent = parent;
			this.node = node;
			this.problem = problem;
			this.finished = false;
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

		prepareArgumentsForExecution: function() {
			return;
		},

		executeOneStep: function(cntNumToExecute, args){
			if (cntNumToExecute > 0 && !this.isFinished()) {
				if (!this.isStarted()) {
					this.updateInterface('START_COMMAND_EXECUTION');
				}
				if (this.problem.needToHighlightCommand(this)) {
					this.highlightOn();
				}
				this.problem.oneStep(this.name, 1, this.prepareArgumentsListForExecution(args)); 
				this.problem.recalculatePenalty(this);
				this.problem.checkLimit();
				this.problem.setLastExecutedCommand(this);
			}
			return Math.max(0, cntNumToExecute - 1);
		},

		exec: function(cntNumToExecute, args) {
			cntNumToExecute = this.executeOneStep(cntNumToExecute, args);	
			this.finished = true;
		
			return cntNumToExecute;
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
		
		isFinished: function() {
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
				case 'START_COMMAND_EXECUTION':
					break;
				case 'STOP_COMMAND_EXECUTION':
					break;
			}
		},
		
		hideHighlighting: function() {
			$(this.node).addClass('hiddenHighlighting');
		},

		highlightOff: function() {
			$(this.node).removeClass('hiddenHighlighting');
			$(this.node).removeClass('highlighted');
		},
		
		highlightOn: function(){
			$(this.node).removeClass('hiddenHighlighting');
			$(this.node).addClass('highlighted');
		},
		
		generatePythonCode: function(tabsNum) {
			return generateTabs(tabsNum) + this.name + '()\n';
		},
		
		generateVisualCommand: function(tree, node, position) {
			var self = this;
			
			if (!self.problem.isCommandSupported(self.getName())) {
				throw 'Команда ' + self.getName() + ' запрещена в данной задаче';
			}
			
			tree.create(node, 
				position ? position : 'after', 
				{
					'data': self.problem.getCommandName(self.getName()),
				},
				function(newNode){
					self.onGenerateDomObjectCallback(tree, newNode);
				},
				true
			);

		},
		
		onGenerateDomObjectCallback: function(tree, newNode) {
			this.__self.onCreateJsTreeItem(tree, newNode, this.getName(), this.problem, true);
			this.node = newNode;
			this.problem.newCommandGenerated();
		},

		setArguments: function(args) {
			return;
		},
		
		updateFunctonNames: function(funcId, oldName, newName) {
			return;
		},
		
		removeFunctionCall: function(funcId) {
			return;
		},
		
		highlightWrongNames: function() {
			return;
		},
		
		getFunction: function() { 
			return this.parent ? this.parent.getFunction() : undefined;
		},
		
		updateArguments: function(funcId, args) {
			return;
		},
		
		funcCallUpdated: function() {
			return;
		},

		getArguments: function() {
			return;
		},

		checkIntegrity: function(parent) {
			if (this.parent.timestamp !== parent.timestamp) {
				throw this.getName() + ' ' + this.parent.timestamp + '!==' + parent.timestamp;
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
			}

			this.initializeArgumentDomObject();

			if (argumentValues && argumentValues.length) {
				if (argumentValues.length != this.arguments.length) {
					throw new Exceptions.IncorrectCommandFormat('Количество переданных аргументов не соответсвует ожидаемому');
				}

				for (var i = 0; i < this.arguments.length; ++i) {
					this.arguments[i].setValue(argumentValues[i]);
				}
			}
		},
		
		initializeArgumentDomObject: function() {
			for (var i = 0; i < this.arguments.length; ++i) {
				this.arguments[i].initializeArgumentDomObject(this.node, i);
			}
		},

		createClone: function () {
			var argumentValues = [];
			for (var i = 0; i < this.arguments.length; ++i){
				argumentValues.push(this.arguments[i].getExpression());
			}
			return new Command(this.name, this.arguments, argumentValues, this.parent, this.node, this.problem);
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
				this.arguments[i].updateInterface(newState);
			}
		},
	
		generatePythonCode: function(tabsNum) {
			var	str = generateTabs(tabsNum) + this.name + '(';
			for (var i = 0; i < this.arguments.length; ++i) {
				if (i > 0) {
					str += ', ';
				}
				str += this.arguments[i].getExpression();
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
			throw 'isn\'t implemented yet!!!';
		},
		
		updateArguments: function(funcId, args) {
			var func = this.getFunction();
			if (func && func.funcId == funcId) {
				for (var i = 0; i < this.arguments.length; ++i) {
					this.arguments[i].addArguments(args, true);
				}
			}
			return;
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

		onCreateJsTreeItem: function(tree, node, type, problem, doNotNeedToUpdate) {
			this.__base(tree, node, type, problem, doNotNeedToUpdate);

			var command = this.constructCommand(type, problem);
			if (command) {
				var parameters = command.getArguments();
				this.generateArgumentsDom(node, parameters, problem);
			}
			
			if (!doNotNeedToUpdate) {
				problem.updated();
			}
		},

		generateArgumentsDom: function(node, parameters, problem, doNotCloneArguments) {
			var prev = $(node).children('a');
			for (var i = 0; i < parameters.length; ++i) {
				var parameter = doNotCloneArguments ? parameters[i] : parameters[i].clone();
				prev = parameter.generateDomObject(
					$(prev), 
					function(p) {
						return function() {
							p.updated();
						}
					}(problem),
					problem, 
					doNotCloneArguments ? parameter.getExpression() : undefined);
			}
		}
	});

	var CommandWithCounter = $.inherit(Command, {
		__constructor: function(name, parameters, argumentValues, parent, node, problem) {
			this.__base(name, parameters, argumentValues, parent, node, problem);
			this.counter = undefined;
			for (var i = 0; i < this.arguments.length; ++i) {
				if (this.arguments[i].isCounter) {
					if (this.counter != undefined) {
						throw new IncorrectCommandFormat('Command can\'t have several counters');
					}
					this.counter = this.arguments[i];
				}
			}
			this.started = false;
		},
		
		executeOneStep: function(cntNumToExecute, args) {
			var prevCnt = cntNumToExecute;
			cntNumToExecute = this.__base(cntNumToExecute, args);
			if (prevCnt > cntNumToExecute) {
				this.started = true;
			}
			this.counter.decreaseValue();
			return Math.max(0, cntNumToExecute);
		},
		
		exec: function(cntNumToExecute, args) {
			while (cntNumToExecute > 0 && !this.isFinished()) {
				cntNumToExecute = this.executeOneStep(cntNumToExecute, args);
			}
			return cntNumToExecute;
		},
		
		setDefault: function() {
			this.__base();
			this.started = false;
		},

		getClass: function() {
			return 'CommandWithCounter';
		},
		
		isFinished: function() {
			return this.counter.getValue() <= 0;
		},
		
		isStarted: function() {
			return this.started;
		}
	});

	var ForStmt = $.inherit(CommandWithCounter, {
		__constructor: function(body, cntNumToExecute, parent, node, problem) {
			parameters = [new ExecutionUnitCommands.CommandArgumentSpinCounter(1, undefined)];
			this.__base(undefined, parameters, [cntNumToExecute], parent, node, problem);
			this.body = body;
		},
		
		setBody: function(body) {
			this.body = body;
		},
		
		createClone: function () {
			var body = this.body.createClone();
			return new ForStmt(body, this.arguments[0].getExpression(), this.parent, this.node, this.problem);
		},
		
		executeOneStep: function(cntNumToExecute, args) {
			if (!this.isFinished()) {
				if (!this.isStarted() || this.body.isFinished()) {
					if (!this.isStarted()) {
						this.updateInterface('START_COMMAND_EXECUTION');
					}
					else {
						this.body.setDefault();
						this.updateInterface('START_EXECUTION');
					}
					--cntNumToExecute;
					this.started = true;
					if (this.problem.needToHighlightCommand(this)) {
						this.highlightOn();
					}
				}
				
				if (cntNumToExecute > 0) {
					cntNumToExecute = this.body.exec(cntNumToExecute, args);
					if (this.body.isFinished()) {
						this.counter.decreaseValue();
						//this.body.setDefault();
					}
				}
			}
			return cntNumToExecute;
		},

		getClass: function() {
			return 'for';
		},
		
		setDefault: function() {
			this.__base();
			this.body.setDefault();
			this.started = false;
		},
		
		isFinished: function() {
			return this.counter.getValue() <= 0;
		},
		
		isStarted: function() {
			return this.started;
		},
		
		updateInterface: function(newState) {
			this.__base(newState);
			this.body.updateInterface(newState)
		},
		
		hideHighlighting: function() {
			$(this.node).addClass('hiddenHighlighting');
			this.body.hideHighlighting();
		},
		
		highlightOff: function() {
			$(this.node).removeClass('hiddenHighlighting');
			$(this.node).removeClass('highlighted');
			this.body.highlightOff();
		},
		
		highlightOn: function() {
			$(this.node).removeClass('hiddenHighlighting');
			$(this.node).addClass('highlighted');
			this.body.hideHighlighting();
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
		
		onGenerateDomObjectCallback: function(tree, node) {
			this.__base(tree, node);
			this.body.generateVisualCommand(tree, node, 'inside');
		},
	
		setArguments: function(args) {
			
		},
		
		updateFunctonNames: function(funcId, oldName, newName) {
			return this.body.updateFunctonNames(funcId, oldName, newName)
		},
		
		removeFunctionCall: function(funcId) {
			return this.body.removeFunctionCall(funcId)
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
			parameters.push(new ExecutionUnitCommands.CommandArgumentSelect([['', ''], ['not', 'не']]));
			for (var i = 0; i < this.conditionProperties.args.length; ++i) {
				parameters.push(this.conditionProperties.args[i].clone());
			}
			this.__base(undefined, parameters, [condName].concat(args), parent, node, problem);
			this.blocks = [];
			this.blocks[0] = firstBlock;
			if (secondBlock) {
				this.blocks[1] = secondBlock;
			}
			this.blockToExecute = undefined;
			this.setArgumentPossibleValues();
			this.updateConditionArguments();
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

		isStarted: function() {
			return this.blockToExecute =! undefined;
		},
		
		hideHighlighting: function() {
			$(this.node).addClass('hiddenHighlighting');
			this.blocks[0].hideHighlighting();
			if (this.blocks[1]) {
				this.blocks[1].hideHighlighting();
			}
		},
		
		highlightOff: function() {
			$(this.node).removeClass('hiddenHighlighting');
			$(this.node).removeClass('highlighted');
			this.blocks[0].highlightOff();
			if (this.blocks[1]) {
				this.blocks[1].highlightOff();
			}
		},
		
		highlightOn: function() {
			$(this.node).removeClass('hiddenHighlighting');
			$(this.node).addClass('highlighted');
			this.blocks[0].hideHighlighting();
			if (this.blocks[1]) {
				this.blocks[1].hideHighlighting();
			}
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
				throw 'Invalid function\'s name or number of arguments';
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
		
		updateConditionArguments: function() {
			$(this.node).children('.testFunctionArgument').remove();
			this.__self.generateArgumentsDom($(this.node), this.arguments, this.problem, true);
		},

		setArgumentPossibleValues: function(args) {
			if (!args) {
				var funcDef = this.getFunction();
				if (funcDef) {
					args = funcDef.getArguments();
				}
			}
			if (args) {
				for (var i = 2; i < this.arguments.length; ++i) {
					this.arguments[i].addArguments(args, true);
				}
			}
		},

		updateFunctonNames: function(funcId, oldName, newName) {
			this.blocks[0].updateFunctonNames(funcId, oldName, newName);
			if (this.blocks[1]) {
				this.blocks[1].updateFunctonNames(funcId, oldName, newName);
			}
		},
		
		removeFunctionCall: function(funcId) {
			this.blocks[0].removeFunctionCall(funcId);
			if (this.blocks[1]) {
				this.blocks[1].removeFunctionCall(funcId);
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
			this.blocks[0].generateVisualCommand(tree, node, 'inside');
			if (this.blocks[1]) {
				this.blocks[1].generateVisualCommand(tree, $(node).next(), 'inside');
			}
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
			args.push(new ExecutionUnitCommands.CommandArgumentSelect([['', ''], ['not', 'не']]));
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
			var firstBlock = this.blocks[0].createClone();
			var secondBlock = undefined;
			if (this.blocks[1]) {
				secondBlock = this.blocks[1].createClone();
			}
			var args = [];
			for (var i = 0; i < this.arguments.length; ++i) {
				args.push(this.arguments[i].getExpression())
			}
			return new IfStmt(this.condName, args, firstBlock, secondBlock, this.parent, this.node, this.problem);
		},
		
		executeOneStep: function(cntNumToExecute, args) {
			if (!this.isFinished()){
				if (!this.isStarted()) {
					var testResult = this.testCondition(args);
					this.blockToExecute = testResult ? 0 : 1;
					--cntNumToExecute;
					this.updateInterface('START_COMMAND_EXECUTION');
					if (this.problem.needToHighlightCommand(this)) {
						this.highlightOn();
					}
				}
				if (cntNumToExecute > 0 && this.blocks[this.blockToExecute]) {
					cntNumToExecute = this.blocks[this.blockToExecute].exec(cntNumToExecute, args);
				}
			}
			return cntNumToExecute;
		},
		
		getClass: function() {
			return this.blocks[1] ? 'ifelse' : 'if';
		},
		
		getOperatorName: function() {
			return 'if'
		},

		isFinished: function() {
			return this.isStarted() && (this.blocks[this.blockToExecute] == undefined || this.blocks[this.blockToExecute].isFinished());
		}
	},
	{
		onCreateJsTreeItem: function(tree, node, type, problem, doNotNeedToUpdate) {
			this.__base(tree, node, type, problem, type == 'ifelse');
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
		__constructor: function(testName, args, body, conditionProperties, parent, id, problem) {
		
		},
		
		createClone: function () {
		
		},
		
		exec: function(cntNumToExecute, args) {
		
		},
		
		getClass: function() {
			return 'while';
		},

		getOperatorName: function() {
			return 'while'
		},

		setDefault: function() {
			
		},
		
		isFinished: function() {
		
		},
		
		updateInterface: function(newState) {
		
		},
		
		hideHighlighting: function() {
		
		},
		
		highlightOff: function() {
		
		},
		
		highlightOn: function() {
		
		},
		
		generatePythonCode: function() {
		
		},
		
		generateVisualCommand: function() {
		
		},
		
		setArguments: function(args) {
			
		},
		
		updateFunctonNames: function(funcId, oldName, newName) {
			return;
		},
		
		removeFunctionCall: function(funcId) {
			return;
		},
		
		highlightWrongNames: function() {
			return;
		},
		
		getFunction: function() { 
			return this.parent ? this.parent.getFunction() : undefined;
		},
		
		updateArguments: function(funcId, args) {
			var func = this.getFunction();
			if (func && func.funcId == funcId) {
				this.spinAccess('setArguments', args);
			}
			return;
		},
		
		funcCallUpdated: function() {
			return;
		},

		getArguments: function() {
			return this.arguments;
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
		
		createClone: function () {
			var commands = [];
			for (var i = 0; i < this.commands.length; ++i) {
				commands.push(this.commands[i].createClone());
			}
			return new Block(commands, this.parent, this.problem);
		},
		
		insertCommand : function(command, pos) {
			this.commands.splice(pos, command);
		},

		pushCommand: function(command){
			this.commands.push(command);
		},

		exec: function(cntNumToExecute, args) {
			while (cntNumToExecute && this.commandIndex < this.commands.length) {
				cntNumToExecute = this.commands[this.commandIndex].exec(cntNumToExecute, args);
				if (this.commands[this.commandIndex].isFinished()) {
					++this.commandIndex;
				}
			}
			return cntNumToExecute;
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
		
		isFinished: function() {
			return (this.commandIndex >= this.commands.length) || 
				(this.commandIndex == this.commands.length - 1 && this.commands[this.commandIndex].isFinished());
		},
		
		isStarted: function() {
			return this.commandIndex > 0 || this.commands[this.commandIndex].isStarted();
		},

		updateInterface: function(newState) {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].updateInterface(newState);
			}
		},
		
		hideHighlighting: function() {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].hideHighlighting();
			}
		},
		
		highlightOff: function() {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].highlightOff();
			}
		},
		
		highlightOn: function() {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].highlightOn();
			}
		},
		
		generatePythonCode: function(tabsNum) {
			str = '';
			for (var i = 0; i < this.commands.length; ++i) {
				str += this.commands[i].generatePythonCode(tabsNum);
			}
			return str;
		},
		
		generateVisualCommand: function(tree, node, position) {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].generateVisualCommand(tree, node ? node : 0, position);
			}
		},
		
		setArguments: function(args) {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].setArguments(args);
			}
		},
		
		updateFunctonNames: function(funcId, oldName, newName) {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].updateFunctonNames(funcId, oldName, newName);
			}
		},
		
		removeFunctionCall: function(funcId) {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].removeFunctionCall(funcId);
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
		
		updateArguments: function(funcId, args) {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].updateArguments(funcId, args);
			}
		},
		
		funcCallUpdated: function() {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].funcCallUpdated();
			}
		}
	});

	var FuncDef = $.inherit(Block, {
		__constructor: function(name, argumentsList, commands, parent, id, funcId, problem) {
		
		},
		
		createClone: function () {
		
		},
		
		exec: function(cntNumToExecute, args) {
		
		},
		
		getClass: function() {
			return 'FuncDef';
		},
		
		setDefault: function() {
			
		},
		
		isFinished: function() {
		
		},
		
		updateInterface: function(newState) {
		
		},
		
		hideHighlighting: function() {
		
		},
		
		highlightOff: function() {
		
		},
		
		highlightOn: function() {
		
		},
		
		generatePythonCode: function() {
		
		},
		
		generateVisualCommand: function() {
		
		},
		
		setArguments: function(args) {
			
		},
		
		updateFunctonNames: function(funcId, oldName, newName) {
			return;
		},
		
		removeFunctionCall: function(funcId) {
			return;
		},
		
		highlightWrongNames: function() {
			return;
		},
		
		getFunction: function() { 
			return this.parent ? this.parent.getFunction() : undefined;
		},
		
		updateArguments: function(funcId, args) {
			var func = this.getFunction();
			if (func && func.funcId == funcId) {
				this.spinAccess('setArguments', args);
			}
			return;
		},
		
		funcCallUpdated: function() {
			return;
		},

		getArguments: function() {
			return this.arguments;
		}
	});

	var FuncCall = $.inherit(Command, {
		__constructor: function(name, args, parent, id, problem) {
		
		},
		
		createClone: function () {
		
		},
		
		exec: function(cntNumToExecute, args) {
		
		},
		
		getClass: function() {
			return 'FuncCall';
		},
		
		setDefault: function() {
			
		},
		
		isFinished: function() {
		
		},
		
		updateInterface: function(newState) {
		
		},
		
		hideHighlighting: function() {
		
		},
		
		highlightOff: function() {
		
		},
		
		highlightOn: function() {
		
		},
		
		generatePythonCode: function() {
		
		},
		
		generateVisualCommand: function() {
		
		},
		
		setArguments: function(args) {
			
		},
		
		updateFunctonNames: function(funcId, oldName, newName) {
			return;
		},
		
		removeFunctionCall: function(funcId) {
			return;
		},
		
		highlightWrongNames: function() {
			return;
		},
		
		getFunction: function() { 
			return this.parent ? this.parent.getFunction() : undefined;
		},
		
		updateArguments: function(funcId, args) {
			var func = this.getFunction();
			if (func && func.funcId == funcId) {
				this.spinAccess('setArguments', args);
			}
			return;
		},
		
		funcCallUpdated: function() {
			return;
		},

		getArguments: function() {
			return this.arguments;
		}
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

