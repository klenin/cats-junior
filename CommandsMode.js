define('CommandsMode', ['jQuery', 
	'jQueryUI', 
	'jQueryInherit',
	'Spin',
	'Misc',
	'Accordion',
	'ShowMessages',
	'Misc',
	'Exceptions'], function(){
	var ShowMessages = require('ShowMessages');
	var Exceptions = require('Exceptions');

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
		
		executeOneStep: function(cntNumToExecute, args){
			if (cntNumToExecute > 0 && !this.isFinished()) {
				if (this.problem.needToHighlightCommand(this)) {
					this.highlightOn();
				}
				this.problem.oneStep(this.name, 1, args); 
				this.problem.recalculatePenalty(this);
				this.problem.checkLimit();
				this.problem.setLastExecutedCommand(this);
			}
		},

		exec: function(cntNumToExecute, args) {
			this.executeOneStep(cntNumToExecute, args);	
			this.finished = true;
		
			return cntNumToExecute - 1;
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
		
		generateVisualCommand: function(tree, node) {
			var self = this;
			
			if (!self.problem.isCommandSupported(self.name)) {
				throw 'Команда ' + self.name + ' запрещена в данной задаче';
			}
			
			tree.create(node, 
				'after', 
				{
					'data': self.problem.getCommandName(self.name),
				},
				function(newNode){
					self.onGenerateDomObjectCallback(tree, newNode);
				},
				true
			);

		},
		
		onGenerateDomObjectCallback: function(tree, newNode) {
			this.__self.onCreateJsTreeItem(tree, newNode, this.name, this.problem, true);
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

			if (argumentValues && argumentValues.length) {
				if (argumentValues.length != this.arguments.length) {
					throw new Exceptions.IncorrectCommandFormat('Количество переданных аргументов не соответсвует ожидаемому');
				}

				for (var i = 0; i < this.arguments.length; ++i) {
					this.arguments[i].setValue(argumentValues[i]);
				}
			}

			this.initializeArgumentDomObject();
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
			return argumentValues
		},
		
		exec: function(cntNumToExecute, args) {
			this.__base(cntNumToExecute, this.prepareArgumentsListForExecution(args));
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
		}
	},
	{
		onCreateJsTreeItem: function(tree, node, type, problem, doNotNeedToUpdate) {
			this.__base(tree, node, type, problem, doNotNeedToUpdate);

			var command = problem.getCommands()[type];
			var parameters = command.getArguments();
			var prev = $(node).children(':last-child');
			for (var i = 0; i < parameters.length; ++i) {
				var parameter = parameters[i].clone();
				prev = parameter.generateDomObject(
					$(prev), 
					function(p) {
						return function() {
							p.updated();
						}
					}(problem),
					problem);
			}

			if (!doNotNeedToUpdate) {
				problem.updated();
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
		},
		
		executeOneStep: function(cntNumToExecute, argumentsList) {
			this.__base(cntNumToExecute, argumentsList);
			this.counter.decreaseValue();
			--cntNumToExecute;
		},
		
		exec: function(cntNumToExecute, args) {
			var argumentsList = this.prepareArgumentsListForExecution(args);
			while (cntNumToExecute > 0 && !this.isFinished()) {
				cntNumToExecute = this.executeOneStep(cntNumToExecute, argumentsList);
			}
			return cntNumToExecute;
		},
		
		getClass: function() {
			return 'CommandWithCounter';
		},
		
		isFinished: function() {
			return this.counter.getValue() <= 0;
		},
		
		isStarted: function() {
			return this.counter.getValue() > 0;
		}
	});

	var ForStmt = $.inherit(CommandWithCounter, {
		__constructor: function(body, cntNumToExecute, parent, node, problem) {
			parameters = [new CommandArgumentSpin(1, undefined, true)];
			this.__base(undefined, parameters, [cntNumToExecute], parent, node, problem);
			this.body = body;
		},
		
		setBody: function() {
			this.body = body;
		},
		
		createClone: function () {
			return new ForStmt(this.body, this.arguments[0].getExpression(), this.parent, this.node, this.problem);
		},
		
		executeOneStep: function(cntNumToExecute, argumentsList) {
			if (!this.body.isFinished()) {
			}
		},
		
		exec: function(cntNumToExecute, args) {
		
		},
		
		getClass: function() {
			return 'ForStmt';
		},
		
		setDefault: function() {
			
		},
		
		isFinished: function() {
			//return this.counter.getValue() <= 0 || 
		},
		
		isStarted: function() {
			//this.counter.getValue() > 0 || this.counter.getValue() == 0 && this.body.isStarted();
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

	var CondStmt = $.inherit(Command, {
		__constructor: function(condName, args, condProperties, parent, id, problem) {
		
		},
		
		createClone: function () {
		
		},
		
		exec: function(cntNumToExecute, args) {
		
		},
		
		getClass: function() {
			return 'CondStmt';
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

	var IfStmt = $.inherit(CondStmt, {
		__constructor: function(testName, args, firstBlock, secondBlock, conditionProperties, parent, id, problem) {
		
		},
		
		createClone: function () {
		
		},
		
		exec: function(cntNumToExecute, args) {
		
		},
		
		getClass: function() {
			return 'CondStmt';
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

	var WhileStmt = $.inherit(CondStmt, {
		__constructor: function(testName, args, body, conditionProperties, parent, id, problem) {
		
		},
		
		createClone: function () {
		
		},
		
		exec: function(cntNumToExecute, args) {
		
		},
		
		getClass: function() {
			return 'CondStmt';
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
				(this.commandsIndex == this.commands.length - 1 && this.commands[this.commandsIndex].isFinished());
		},
		
		isStarted: function() {
			return this.commandIndex > 0 || this.commands[this.commandsIndex].isStarted();
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
		
		generateVisualCommand: function(tree, node) {
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].generateVisualCommand(tree, node ? node : 0);
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

