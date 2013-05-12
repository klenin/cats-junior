define('CommandsMode', ['jQuery', 
	'jQueryUI', 
	'jQueryInherit',
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
			
			if (!self.problem.isCommandSupported(self.getName()) && self.getClass() != 'funccall') {
				throw 'Команда ' + self.getName() + ' запрещена в данной задаче';
			}
			
			self.problem.newCommandGenerationStarted();
			tree.create(node, 
				position ? position : 'after', 
				{
					'data': self.problem.getCommandName(self.getName()),
				},
				function(newNode){
					self.onGenerateDomObjectCallback(tree, newNode);
					self.problem.newCommandGenerated();
				},
				true
			);

		},
		
		onGenerateDomObjectCallback: function(tree, newNode) {
			this.__self.onCreateJsTreeItem(tree, newNode, this.getName(), this.problem, true, undefined, this.arguments);
			this.node = newNode;
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
		
		initializeArgumentDomObject: function() {
			for (var i = 0; i < this.arguments.length; ++i) {
				this.arguments[i].initializeArgumentDomObject(this.node, i);
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
			for (var i = 0; i < this.arguments.length; ++i) {
				this.arguments[i].addArguments(args, true);
			}
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
						throw new IncorrectCommandFormat('Command can\'t have several counters');
					}
					this.counter = this.arguments[i];
				}
			}
			this.started = false;
		},
		
		createClone: function() {
			return new CommandWithCounter(this.name, this.arguments, this.createArgumentsClone(), this.parent, this.node, this.problem);
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
			return this.counter.getCounterValue() <= 0;
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
			return this.counter.getCounterValue() <= 0;
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
			this.body.generateVisualCommand(tree, node, 'last');
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
			this.__base(undefined, parameters, args, parent, node, problem);
			this.blocks = [];
			this.blocks[0] = firstBlock;
			if (secondBlock) {
				this.blocks[1] = secondBlock;
			}
			this.blockToExecute = undefined;
			this.setArgumentPossibleValues();
			this.updateConditionArguments();
		},
		
		createClone: function (className) {
			var firstBlock = this.blocks[0].createClone();
			var secondBlock = undefined;
			if (this.blocks[1]) {
				secondBlock = this.blocks[1].createClone();
			}
			var args = [];
			for (var i = 0; i < this.arguments.length; ++i) {
				args.push(this.arguments[i].getExpression())
			}
			return new className(this.conditionName, args, firstBlock, secondBlock, this.parent, this.node, this.problem);
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

		executeOneStep: function(cntNumToExecute, args) {
			if (!this.isFinished()){
				if (!this.isStarted()) {
					var testResult = this.testCondition(args);
					this.blockToExecute = testResult ? 0 : 1;
					--cntNumToExecute;
					this.blocks[0].setDefault();
					this.updateInterface('START_EXECUTION');
					if (this.problem.needToHighlightCommand(this)) {
						this.highlightOn();
					}
				}
				if (cntNumToExecute > 0 && this.blocks[this.blockToExecute]) {
					cntNumToExecute = this.blocks[this.blockToExecute].exec(cntNumToExecute, args);
					if (this.blocks[this.blockToExecute].isFinished()) {
						this.onBlockExecution();
					}
				}
			}
			return cntNumToExecute;
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
			$(this.node).children('.testFunctionArgument').first().off('change').on('change', function(p){
				return function() {
					var condName = $(this).children('option:selected').val();
					$(this).parent().children('.testFunctionArgument:gt(1)').remove();
					CondStmt.generateArgumentsDom($(this).parent(), 
						p.getConditionProperties(condName).args, 
						p, 
						false, 
						$(this).parent().children('.testFunctionArgument').last());
					p.updated();
				};
			}(this.problem));
			/*$(this.node).children('.testFunctionArgument').remove();
			this.__self.generateArgumentsDom($(this.node), this.arguments, this.problem, true);*/
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
			this.blocks[0].generateVisualCommand(tree, node, 'last');
			if (this.blocks[1]) {
				this.blocks[1].generateVisualCommand(tree, $(node).next(), 'last');
			}
			$(this.arguments[0].domObject).change();
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
			
		createClone: function() {
			return this.__base(IfStmt);
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
		__constructor: function(condName, args, body, parent, node, problem) {
			this.__base(condName, args, body, undefined, parent, node, problem);
		},
		
		createClone: function() {
			return this.__base(WhileStmt);
		},

		getClass: function() {
			return 'while';
		},

		getOperatorName: function() {
			return 'while'
		},

		isFinished: function() {
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

		exec: function(cntNumToExecute, args) {
			while (cntNumToExecute && this.commandIndex < this.commands.length) {
				cntNumToExecute = this.commands[this.commandIndex].exec(cntNumToExecute, args);
				if (this.commands[this.commandIndex].isFinished() || this.commands[this.commandIndex].getClass() == 'funcdef') {
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
		}
	});

	var FuncDef = $.inherit(Block, {
		__constructor: function(name, argumentsList, commands, parent, node, problem) {
			this.__base(commands, parent, problem);
			this.node = node;
			this.name = name;
			this.argumentsList = argumentsList.clone();
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

		executeBody: function(cntNumToExecute, args) {
			this.exec(cntNumToExecute, args, true);
		},

		exec: function(cntNumToExecute, args, needToExecuteBody) {
			if (needToExecuteBody) {
				return this.__base(cntNumToExecute, args);
			}
			return cntNumToExecute;
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
		
		generateVisualCommand: function(tree, node, position) {
			var self = this;

			if (!self.problem.isCommandSupported(this.getClass())) {
				throw 'Объявление функций не поддерживается';
			}

			self.problem.newCommandGenerationStarted();
			var c = ++cmdId;
			$('#accordion' + this.problem.tabIndex).myAccordion('push', this.name, this.argumentsList, $(this.node).prop('funcId'));
			this.node = $('#funcDef-' + c);
			$('#funcDef-' + c).bind('loaded.jstree', function(){	
				for (var i = 0; i < self.commands.length; ++i) {
					self.commands[i].generateVisualCommand(jQuery.jstree._reference('funcDef-' + c), node ? node : 0, position)
				}
				self.problem.newCommandGenerated();
				++cmdId;
				self.problem.updated();
			});
			require('InterfaceJSTree').createJsTreeForFunction('#funcDef-' + c, this.problem, true); // Circular Dependency!! But I don't know how we can avoid it :-(
		},

		getArguments: function() {
			return this.argumentsList;
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

		executeOneStep: function(cntNumToExecute, args){
			if (cntNumToExecute > 0 && !this.isFinished()) {
				if (!this.isStarted()) {
					this.updateInterface('START_COMMAND_EXECUTION');
					if (this.problem.needToHighlightCommand(this)) {
						this.highlightOn();
					}
					this.funcDef = this.getFuncDef().createClone();
					--cntNumToExecute;
					this.problem.setLastExecutedCommand(this);
				}
				if (cntNumToExecute > 0) {
					var funcDefArguments = this.funcDef.getArguments();
					var argsCopy = args ? args.clone() : undefined;
					args = args ? args : {};
					for (var i = 0; i < this.arguments.length; ++i) {
						args[funcDefArguments[i]] = this.arguments[i].getValue(argsCopy);
					}
					cntNumToExecute = this.funcDef.executeBody(cntNumToExecute, args);
				}
			}
			return Math.max(0, cntNumToExecute);
		},

		exec: function(cntNumToExecute, args) {
			cntNumToExecute = this.executeOneStep(cntNumToExecute, args);	
			if (this.funcDef.isFinished()) {
				this.funcDef = undefined;
				this.finished = true;
			}
			return cntNumToExecute;
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

		updateFunctonNames: function(funcId, oldName, newName) {
			if (this.getFuncId() ==  funcId) {
				this.name = newName;
				this.updateJstreeObject(undefined, funcDef);
			}
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

		onGenerateDomObjectCallback: function(tree, newNode) {
			this.__self.onCreateJsTreeItem(tree, newNode, 'funccall', this.problem, true);
			this.node = newNode;
			tree.rename_node(newNode, this.name);
		},

		removeFunctionCall: function(funcId) {
			if (!this.getFuncDef() || this.getFuncId() == funcId) {
				$(this.node).remove();
			}
		},
		
		highlightWrongNames: function() {
			if (!this.problem.functions[this.name] || !this.problem.functions[this.name][this.arguments.length]|| !checkName(this.name)) {
				$(this.node).children('a').addClass('wrongName');
			}
			else {
				$(this.node).children('a').removeClass('wrongName');
			}
		},
		
		updateArguments: function(funcId, args) {
			if (this.getFuncId() == funcId) {
				this.updateJstreeObject(args);
			}
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

