define('CommandsMode', ['jQuery', 
	'jQueryUI', 
	'jQueryInherit',
	'Spin',
	'Misc',
	'InterfaceJSTree',
	'Accordion',
	'ExecutionUnitWrapper',
	'ShowMessages',
	'Misc'], function(){
	var ExecutionUnitWrapperModule = require('ExecutionUnitWrapper');
	var InterfaceJSTree = require('InterfaceJSTree');
	var ShowMessages = require('ShowMessages');

	var Command = $.inherit({
		__constructor : function(name, args, argumentsValues, parent, id, problem) {
	        this.name = name;
			this.arguments = [];

			this.initArguments = args.clone();

			for (var i = 0; i < args.length; ++i) {
				this.arguments.push(args[i].copy());
			}
			this.initArgumentsValues = argumentsValues.clone();
			//var cnt = undefined;
			this.counterIndex = undefined;
			for (var i = 0 ; i < args.length; ++i) {
				if (args[i].isCounter) {
					if (this.counterIndex != undefined) {
						throw 'Command can\'t have several counters!!!';
					}
					this.counterIndex = i;
				}
				this.arguments[i].setValue(argumentsValues[i]);
				this.getSpinAt(i).mySpin('setTotal', argumentsValues[i]);
			}
			this.hasCounter = this.counterIndex != undefined;		
			this.curCnt = 0;
			this.parent = parent;
			this.id = id;
			this.problem = problem;

			this.finished = false;
			var func = this.getFunction();
			if (func) {
				this.spinAccess('setArguments', func.getArguments());
			}
			this.timestamp = new Date().getTime();
		},

		createClone: function() {
			var argumentValues = [];
			for (var i = 0; i < this.arguments.length; ++i) {
				argumentValues.push(this.arguments[i].value);
			}
			var clone = new Command(this.name, this.arguments, argumentValues, this.parent, this.id, this.problem);
			return clone;
		},

		eq: function(cmd, compareCnt){ // fix
			var result = cmd.getClass() == 'command' && cmd.id == this.id && cmd.name == this.name;
			result = result && (cmd.arguments.length == this.arguments.length);
			for (var i = 0; result && i < this.arguments.length; ++i) {
				result = result && (this.arguments[i].isCounter == cmd.arguments[i].isCounter);
				if (this.arguments[i].isCounter && cmd.arguments[i].isCounter && compareCnt) { //check it!!!
					result = result && (this.arguments[i].value >= cmd.arguments[i].value && 
						this.arguments[i].currentValue >= cmd.arguments[i].currentValue);
				}
				else {
					result = result && (this.arguments[i].value == cmd.arguments[i].value && 
						this.arguments[i].currentValue == cmd.arguments[i].currentValue/* || !this.finished*/);
				}
			}

			return result;
		},

		getSpin: function() {
			return $('#' + this.id).children('spin');
		},

		getSpinAt: function(index) {
			return $('#' + this.id).children('spin:eq(' + index + ')');
		},

		spinAccess: function(method, arg) {
			for (var i = 0; i < this.arguments.length; ++i) {
				this.getSpinAt(i).mySpin(method, arg);
			}
		},

		setArguments: function(args) {
			for (var i = 0; i < this.arguments.length; ++i) {
				/*if (arguments) {
					//if (arguments[i] == undefined)
					this.arguments.setCurrentValue(arguments[i]);
				}*/
				this.getSpinAt(i).mySpin('setArgumentValues', args);
				if (!checkNumber(this.arguments[i].value) && !isInt(this.arguments[i].value) && args && args[this.arguments[i].value]) {
					this.arguments[i].setCurrentValue(args[this.arguments[i].value]);
				}
			}
		},
		
		exec: function(cnt, inputArgs) {
			if (this.finished) {
				return cnt;
			}
			var commandCounter = undefined;
			if (this.curCnt == 0) {
				this.setArguments(inputArgs);
				this.spinAccess('startExecution');
			}

			if (!this.hasCounter) {
				commandCounter = 1;
			}
			else if (this.hasCounter) {
				var val = this.arguments[this.counterIndex].value;
				if (!isInt(val)) {
					commandCounter = parseInt(inputArgs[val]);
				}
				else {
					commandCounter = parseInt(val);
				}
				
				if (!isInt(commandCounter) || commandCounter < 0) {
					throw 'Invalid counter!!';
				}
			}

			var args = [];
			for (var i = 0; i < this.arguments.length; ++i) {
				args.push(this.arguments[i].currentValue);
			}
			
			var t = Math.min(cnt, Math.abs(this.curCnt - commandCounter));
			var i;
			for (i = 0; i < t && !(this.problem.stopped || this.problem.paused || this.problem.executionUnit.isDead()); ++i) {
				this.problem.oneStep(this.name, /*this.counterIndex != undefined ? args[this.counterIndex] : undefined*/1, args); //check it!!!
				//eval(this.name + '();');
				if ($.inArray(this.id, this.problem.usedCommands) == -1){
					++this.problem.divIndex;
					this.problem.usedCommands.push(this.id);
					if (this.problem.commandsFine){
						this.problem.executionUnit.changePoints(-this.problem.commandsFine);
						var mes = new ShowMessages.MessageCommandFine(this.problem.step, this.problem.executionUnit.getPoints());
					}
				}
				this.problem.checkLimit();
				++this.curCnt;
				//if ((this.problem.speed || commandCounter == this.curCnt) && this.hasCounter) {
					this.getSpinAt(this.counterIndex).mySpin('decreaseValue');
				//}
			}

			this.finished = this.curCnt >= commandCounter;
			if (this.curCnt == commandCounter) {
				this.curCnt = 0;
				commandCounter = this.initCnt;
			}
			if ( i == t - 1 || t == 0 ) {
				this.spinAccess('stopExecution');
				commandCounter = this.initCnt;
			}		

			this.problem.lastExecutedCmd = this;
			return cnt - i;
		},
		
		getClass: function(){
			return 'command'
		},
		
		setDefault: function() {
			this.curCnt = 0;
			var numId = $('#' + this.id).prop('numId');
			//this.hideCounters();
			//this.getSpin().mySpin('stopExecution'); //???
			this.spinAccess('hideBtn');
			this.finished = false;
			if (isCmdHighlighted(this.id))
				changeCmdHighlight(this.id);
		},
		
		isFinished: function() {
			return this.finished;
		},
		
		showCounters: function() {
			this.spinAccess('showBtn');
		},
		
		hideCounters: function() { //
			for (var i = 0; i < this.arguments.length; ++i) {
				if (this.arguments.type == 'int') {
					if (i == this.counterIndex) {
						if (!this.finished) {
							this.getSpinAt(i).mySpin('hideBtn', this.arguments[i].currentValue - this.curCnt);
						} 
						else {
							this.getSpin(i).mySpin('hideBtn', 0);
						}
					}
					else {
						this.getSpin(i).mySpin('hideBtn', this.arguments[i].currentValue);
					}
				}
			}
		},
		
		started: function() {
			return this.curCnt > 0;
		},
		
		copyDiff: function(cmd, compareCnt){ //
			if (this.eq(cmd, compareCnt)) {
				if (this.hasCounter && cmd.hasCounter && this.counterIndex == cmd.counterIndex) {
					if (this.counterIndex != undefined) {
						this.arguments[this.counterIndex].value = cmd.arguments[cmd.counterIndex].value;
						this.arguments[this.counterIndex].currentValue = cmd.arguments[cmd.counterIndex].currentValue;
					}
				}
				this.id = cmd.id;
				return this;
			}
			return  cmd;
		},
		
		makeUnfinished: function(){
			return;
		},
		
		highlightOff: function() {
			if (isCmdHighlighted(this.id))
				changeCmdHighlight(this.id);
		},
		
		highlightOn: function(){
			if (!isCmdHighlighted(this.id))
				changeCmdHighlight(this.id);
		},
		
		convertToCode: function(tabsNum) {
			var str = generateTabs(tabsNum) + this.name + '(';
			for (var i = 0; i < this.arguments.length; ++i) {
				if (i > 0) {
					str += ', ';
				}
				str += this.arguments[i].value;
			}
			str += ')\n';
			return str;
		},
		
		generateCommand: function(tree, node) {
			var self = this;
			
			if (!self.problem.isCommandSupported(self.name)) {
				throw 'Unsupported command!1';
			}
			
			++self.problem.loadedCnt;
			tree.create(node, InterfaceJSTree.isBlock(tree._get_type(node)) ? "last" : "after", 
				{'data': self.problem.getCommandName(self.name)}, function(newNode){
					InterfaceJSTree.onCreateItem(tree, 
						newNode, 
						$('#' + self.name + self.problem.tabIndex).attr('rel'), 
						self.problem,
						undefined,
						undefined, 
						undefined, 
						true);
					self.id = $(newNode).attr('id');
					var func = self.getFunction();
					if (func) {
						self.spinAccess('setArguments', func.getArguments());
					}
					for (var i = 0; i < self.arguments.length; ++i) {
							if (isInt(self.arguments[i].value)) {
								self.getSpinAt(i).mySpin('setTotal', self.arguments[i].value);
							}
							else {
								if (!checkName(self.arguments[i].value)) {
									throw 'Invalid argument!!!';
								}
								var func = self.getFunction();
								if (!func) {
									throw 'Unknown argument!'
								}
								self.getSpinAt(i).mySpin('setTotalWithArgument', self.arguments[i].value);
							}
					}
					--self.problem.loadedCnt;
				}, true); 
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
		},

		checkIntegrity: function(parent) {
			if (this.parent.timestamp !== parent.timestamp) {
				throw this.name + ' ' + this.parent.timestamp + '!==' + parent.timestamp;
			}
		}
	});

	var ForStmt = $.inherit({
		__constructor : function(body, cnt, parent, id, problem) {
			this.executing = false;//
			this.isStarted = false; //should be changed to one or two properties.
			this.setBody(body);
			this.parent = parent;	
			this.id = id;
			this.cnt = cnt;
			this.initCnt = cnt;
			this.curCnt = 0;
			this.problem = problem;
			this.finished = false;
			var func = this.getFunction();
			if (func) {
				this.getSpin().mySpin('setArguments', func.getArguments());
			}
			this.name = 'for';
			this.timestamp = new Date().getTime();
		},

		createClone: function() {
			var body = this.body.createClone();
			var clone = new ForStmt(body, this.cnt, this.parent, this.id, this.problem);
			return clone;
		},

		setBody: function(body) {
			this.body = body;
			if (this.body) {
				this.body.parent = this;
			}
		},

		getSpin: function() {
			return $('#' + this.id).children('spin');
		},
		
		isFinished: function(){
			return this.finished;
		},

		eq: function(block, compareCnt){
			return (block.getClass() == 'for' && block.id == this.id && 
				(compareCnt ? block.cnt >= this.curCnt : block.cnt == this.cnt));
		},
		
		exec: function(cnt, args)
		{
			if (this.curCnt == 0) {
				this.getSpin().mySpin('setArgumentValues', args);
				this.getSpin().mySpin('startExecution');

				var val = this.getSpin().mySpin('getTotalValue');
				if (!isInt(val)) {
					this.cnt = parseInt(args[val]);
				}
				else {
					this.cnt = parseInt(val);
				}
				
				if (!isInt(this.cnt) || this.cnt < 0) {
					throw 'Invalid counter!!';
				}
			}
			
			while (cnt && !this.isFinished() && !(this.problem.stopped || this.problem.paused || this.problem.executionUnit.isDead()))
			{
				this.isStarted = true;
				if (!this.executing)
				{
					cnt -= 1;
					var numId = $('#' + this.id).prop('numId');
				
					if (!cnt || this.problem.speed)
					{
						if (this.problem.speed)
						{
							if (this.problem.prevCmd)
								this.problem.prevCmd.highlightOff();
							this.problem.prevCmd = this;
						}
						$('#' + this.id + '>spin').css('background-color', '#1CB2B3');
						$('#' + this.id + '>a').css('background-color', '#1CB2B3');

					}
					this.problem.lastExecutedCmd = this;
					if (this.curCnt + 1 > this.cnt)
					{
						++this.curCnt;
						return cnt;
					}
					this.executing = true;
					this.body.setDefault();
				}
				cnt = this.body.exec(cnt);
				if (this.body.isFinished())
				{
					this.executing = false;
					++this.curCnt;
					if (this.problem.speed || this.cnt == this.curCnt) {
						this.getSpin().mySpin('decreaseValue');
					}	
				}
			}

			this.finished = this.curCnt >= this.cnt;
			if (this.curCnt == this.cnt) {
				this.curCnt = 0;
				this.cnt = this.initCnt;
			}
			if ( this.finished ) {
				this.getSpin().mySpin('stopExecution');
				this.cnt = this.initCnt;
			}		
			return cnt;
		},
		
		getClass: function(){
			return 'for';
		},
		
		setDefault: function(){
			this.executing = false;
			this.isStarted = false;
			this.curCnt = 0;
			this.getSpin().mySpin('hideBtn');
			this.cnt = this.initCnt;
			//this.hideCounters();
			this.body.setDefault();
			this.highlightOff();
		},
		
		showCounters: function() {
			this.getSpin().mySpin('showBtn');
			this.body.showCounters();
		},
		
		hideCounters: function() {
			if (!this.finished) {
				this.getSpin().mySpin('hideBtn', this.cnt - this.curCnt);
			} 
			else {
				this.getSpin().mySpin('hideBtn', 0);
			}
			this.body.hideCounters();
		},
		
		started: function() {
			return this.isStarted;
		},
		
		copyDiff: function(block, compareCnt){
			if (block.getClass() != 'for') {
				return block;
			}
			this.cnt = block.cnt; //?
			this.initCnt = block.initCnt;
			this.id = block.id;
			this.body.copyDiff(block.body);
			return this;
		},
		
		makeUnfinished: function() {
			if (this.isFinished()) {
				this.curCnt = Math.max(this.cnt - 1, 0);
				this.executing = true;
				this.body.makeUnfinished();
			}
		},
		
		highlightOff: function() {
			$('#' + this.id + '> span').css('background-color', '');
			$('#' + this.id + '> a').css('background-color', '');
			this.body.highlightOff();
		},
		
		highlightOn: function() {
			$('#' + this.id + '> span').css('background-color', '#1CB2B3');
			$('#' + this.id + '> a').css('background-color', '#1CB2B3');
		},
		
		convertToCode: function(tabsNum) {
			var curCnt = this.problem.curCounter;
			var str = generateTabs(tabsNum) + 'for ' + this.problem.counters[curCnt]['name'] + 
				(this.problem.counters[curCnt]['cnt'] ? this.problem.counters[curCnt]['cnt'] : '') + ' in range(' + this.initCnt + '):\n';
			++this.problem.counters[curCnt]['cnt'];
			this.problem.curCounter = (this.problem.curCounter + 1) % 3;
			str += this.body.convertToCode(tabsNum + 1);
			--this.problem.counters[curCnt]['cnt'];
			this.problem.curCounter = curCnt;
			return str;
		},
		
		generateCommand: function(tree, node){
			var self = this;
			
			if (!self.problem.isCommandSupported(self.name)) {
				throw 'Unsupported command!2';
			}

			++self.problem.loadedCnt;
			tree.create(node, InterfaceJSTree.isBlock(tree._get_type(node)) ? "last" : "after", 
				{'data': self.problem.getCommandName(self.getClass())}, function(newNode){
					InterfaceJSTree.onCreateItem(tree, 
						newNode, 
						$('#for0').attr('rel'), 
						self.problem,
						undefined,
						undefined, 
						undefined, 
						true);
					var numId = $(newNode).prop('numId');
					self.id = $(newNode).attr('id');
					self.getSpin().mySpin('setTotal', self.cnt);
					self.body.generateCommand(tree, $(newNode));
					--self.problem.loadedCnt;
				}, true); 
		},
		
		updateFunctonNames: function(funcId, oldName, newName) {
			this.body.updateFunctonNames(funcId, oldName, newName);
		},
		
		removeFunctionCall: function(funcId) {
			this.body.removeFunctionCall(funcId);
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
				this.getSpin().mySpin('setArguments', args);
			}
			this.body.updateArguments(funcId, args);
		},
		
		funcCallUpdated: function() {
			this.body.funcCallUpdated();
		},

		checkIntegrity: function(parent) {
			if (this.parent.timestamp !== parent.timestamp) {
				throw this.name + ' ' + this.parent.timestamp + '!==' + parent.timestamp;
			}
			this.body.checkIntegrity(this);
		}
	});

	var CondStmt = $.inherit({
		__constructor : function(testName, args, conditionProperties, parent, id, problem) {
			this.args = args.clone();
			this.testName = testName;
			this.parent = parent;	
			this.id = id;
			this.problem = problem;
			this.conditionProperties = conditionProperties;
			this.generateArguments();
			this.timestamp = new Date().getTime();
		},
		
		eq: function(block){
			return block.getClass() == this.getClass() && 
				this.testName == block.testName && this.args.compare(block.args);
		},
		
		copyDiff: function(block, compareCnt){
			//this.test = block.test; //?
			this.testName = block.testName;
			this.args = block.args.clone();
			this.id = block.id;
			this.conditionProperties = block.conditionProperties;
			this.generateArguments();
		},
		
		highlightOff: function(){
			//$('#' + this.id + '>select').css('background-color', '');
			$('#' + this.id + '>a').css('background-color', '');
			//$('#' + this.id + '>ins').css('background-color', '#eeeeee');
		},
		
		highlightOn: function(){
			//$('#' + this.id + '>select').css('background-color', '#1CB2B3');
			$('#' + this.id + '>a').css('background-color', '#1CB2B3');
			//$('#' + this.id + '>ins').css('background-color', '#1CB2B3');
		},
		
		convertToCode: function(tabsNum) {
			//var str = generateTabs(tabsNum) + 'if ';
			str = '';

			var conditionArguments = this.conditionProperties.args;

			if (this.testName != this.conditionProperties.name || conditionArguments.length  + 1 != this.args.length) {
				throw 'Invalid condition name or arguments list';
			}
			
			if (this.args[0] == 'not')
				str += 'not ';
			str += this.testName + '(';
					
			var funcDef = this.getFunction();
			var funcArguments = funcDef ? funcDef.getArguments() : [];

			for (var i = 0; i < conditionArguments.length; ++i) {
				if (this.args[i + 1] === undefined) {
					throw 'Invalid arguments list'
				}
				var value = conditionArguments[i].findValue(this.args[i + 1]);

				if (value != undefined) {
					str += (i > 0 ? ', ' : '');
					if (checkNumber(value)) {
						str += value;
					} 
					else if (checkName(value)) {
						str += '"' + value + '"';
					}
					else {
						str += "u'" + value + "'";
					}
				}
				else {
					str += (i > 0 ? ', ' : '');
					var k = 0;
					for (k = 0; k < funcArguments.length; ++k) {
						if (this.args[i + 1] == funcArguments[k]) {
							break;
						}
					}

					if (k == funcArguments.length) {
						throw 'Invalid argument';
					}
					str += this.args[i + 1];
				}
			}
	 
			str += '):\n';
			return str;
		},
		
		highlightWrongNames: function() {
			return;
		},
		
		constructTestFunc: function(args) {
			var conditionArguments = this.conditionProperties.args;

			if (this.testName != this.conditionProperties.name) {
				throw 'Invalid condition name';
			}
		
			this.test = function(prop, a){
				return function() {
					return prop.jsFunc(a);
				}
			}(this.conditionProperties, args);

		},
		/*substitute function arguments values for arguments in condition*/
		convertArguments: function(inputArgs) {
			var conditionArguments = this.conditionProperties.args;

			var funcDef = this.getFunction();
			var funcArguments = funcDef ? funcDef.getArguments() : [];

			var args = [];
			args[0] = this.args[0];

			for (var i = 0; i < conditionArguments.length; ++i) {
				var value = conditionArguments[i].findValue(this.args[i + 1]);
				if (value != undefined) {
					args.push(value);
					continue;
				}
				var k = 0
				for (k = 0; k < funcArguments.length; ++k) {
					if (this.args[i + 1] == funcArguments[k]) {
						if (inputArgs[funcArguments[k]] != undefined) {
							var valueForArgument = conditionArguments[i].findValue(inputArgs[funcArguments[k]]);
							if (valueForArgument != undefined) {
								args.push(valueForArgument)
								break;
							}
						}
					}
				}
				if (k == funcArguments.length) {
					throw 'Invalid argument';
				}
			}

			return args;
		},
		
		checkArguments: function() {
			//if (this.args[2] != 0 && this.args[2] != 1)
			//	throw 'Invalid argument ' + this.args[2];
		},
		
		getFunction: function() { 
			return this.parent ? this.parent.getFunction() : undefined;
		},
		
		/*add function arguments as possible values of arguments in condition*/
		generateArguments: function(args) {
			var conditionArguments = this.conditionProperties.args;
			if (!args) {
				var funcDef = this.getFunction();
				if (funcDef) {
					args = funcDef.getArguments();
				}
			}
			if (args) {
				for (var i = 0; i < conditionArguments.length; ++i) {
					conditionArguments[i].addArguments($('#' + this.id).children('.testFunctionArgument:eq(' + i + ')'), args, true);
					conditionArguments[i].setValue($('#' + this.id).children('.testFunctionArgument:eq(' + i + ')'), this.args[i + 1]);
				}
			}
		}
	});

	var IfStmt = $.inherit(CondStmt, {
		__constructor : function(testName, args, firstBlock, secondBlock, conditionProperties, parent, id, problem) {
			this.__base(testName, args, conditionProperties, parent, id, problem);
	        this.curBlock = undefined;
			this.blocks = [firstBlock, secondBlock];
			this.setBlocks(firstBlock, secondBlock);
			this.name = secondBlock ? 'ifelse' : 'if';
		},

		createClone: function() {
			var firstBlock = this.blocks[0].createClone();
			var scndBlock = undefined;
			if (this.blocks[1]) {
				scndBlock = this.blocks[1].createClone();
			}
			var clone = new IfStmt(this.testName, this.args, firstBlock, scndBlock, this.conditionProperties, this.parent, this.id, this.problem);
			return clone;
		},

		setBlocks: function(block1, block2) {
			this.blocks[0] = block1;
			this.blocks[1] = block2;

			if (this.blocks[0]) {
				this.blocks[0].parent = this;
			}

			if (this.blocks[1]) {
				this.blocks[1].parent = this;
			}
		},
		
		isFinished: function(){
			return this.curBlock != undefined && (!this.blocks[this.curBlock] || this.blocks[this.curBlock].isFinished());
		},
		
		eq: function(block){
		
			return this.__base(block) &&
				((this.curBlock == undefined && block.curBlock == undefined) ||
				(this.curBlock != undefined && block.curBlock != undefined && 
				this.blocks[this.curBlock].eq(block.blocks[this.curBlock])));
		},
		
		exec: function(cnt, args) {
			if (this.curBlock == undefined && cnt)
			{		
				this.constructTestFunc(this.convertArguments(args));
				this.curBlock = this.test() ? 0 : 1;
				cnt -= 1;
				if (!cnt || this.problem.speed)
				{
					if (this.problem.speed)
					{
						if (this.problem.prevCmd)
							this.problem.prevCmd.highlightOff();
						this.problem.prevCmd = this;
					}
					this.highlightOn();
				}
				this.problem.lastExecutedCmd = this;
				if (!this.blocks[this.curBlock])
					return cnt;
			}
			return this.blocks[this.curBlock].exec(cnt, args);
		},
		
		getClass: function(){
			return 'if';
		},
		
		setDefault: function(){
			this.blocks[0].setDefault();
			if (this.blocks[1])
				this.blocks[1].setDefault();
			this.curBlock = undefined;
			this.highlightOff();
			var conditionArguments = this.conditionProperties.args;
			$('#' + this.id).children('select:eq(0)').val(this.args[0]);
			for (var i = 0; i < conditionArguments.length; ++i) {
				conditionArguments[i].setValue($('#' + this.id).children('.testFunctionArgument:eq(' + i + ')'), this.args[i + 1]);
			}	
		},
		
		showCounters: function() {
			this.blocks[0].showCounters();
			if (this.blocks[1])
				this.blocks[1].showCounters();
		},
		
		hideCounters: function() {
			this.blocks[0].hideCounters();
			if (this.blocks[1])
				this.blocks[1].hideCounters();
		},
		
		started: function() {
			return this.curBlock != undefined;
		},
		
		copyDiff: function(block, compareCnt){
			if (block.getClass() != this.getClass())
			{
				return block;
			}
			this.__base(block, compareCnt);
			this.blocks[0] = this.blocks[0].copyDiff(block.blocks[0], compareCnt);
			if (!this.blocks[1] || !block.blocks[1])
				this.blocks[1] = block.blocks[1];
			else if (block.blocks[1])
				this.blocks[1].copyDiff(block.blocks[1], compareCnt);
			return this;
		},
		
		makeUnfinished: function(){
			if (this.isFinished())
			{
				if (this.blocks[this.curBlock])
					this.blocks[this.curBlock].makeUnfinished();
				else
					this.curBlock = undefined;
			}
		},
		
		highlightOff: function(){
			this.__base();
			this.blocks[0].highlightOff();
			if (this.blocks[1])
				this.blocks[1].highlightOff();
		},
		
		convertToCode: function(tabsNum) {
			var str = generateTabs(tabsNum) + 'if ';
			str += this.__base(tabsNum);		 
			str += this.blocks[0].convertToCode(tabsNum + 1);
			if (this.blocks[1])
			{
				str += generateTabs(tabsNum) + 'else:\n';
				str += this.blocks[1].convertToCode(tabsNum + 1);
			}
			return str;
		},
		
		generateCommand: function(tree, node){
			var self = this;

			if (!self.problem.isCommandSupported(self.name)) {
				throw 'Unsupported command!3';
			}
			
			self.loaded = false;
			++self.problem.loadedCnt;
			tree.create(node, InterfaceJSTree.isBlock(tree._get_type(node)) ? "last" : "after", 
				{'data': self.problem.getCommandName(self.getClass())}, function(newNode){
					InterfaceJSTree.onCreateItem(tree, 
						newNode, 
						self.blocks[1] ? $('#ifelse0').attr('rel') : $('#if0').attr('rel'), 
						self.problem, 
						undefined, 
						self.conditionProperties, 
						self.args,
						true);
					var numId = $(newNode).prop('numId');
					self.id = $(newNode).attr('id');
					self.generateArguments();
					self.blocks[0].generateCommand(tree, $(newNode));
					if (self.blocks[1])
					{
						var next = InterfaceJSTree.getNextNode(tree, $(newNode));
						if (next)
						{
							self.blocks[1].generateCommand(tree, next);
						}
					}
					--self.problem.loadedCnt;
				}, true); 
		},
		
		getFunction: function() { 
			return this.parent ? this.parent.getFunction() : undefined;
		},
		
		updateArguments: function(funcId, args) {
			var funcDef = this.getFunction();
			if (funcDef && funcDef.funcId == funcId) {
				this.generateArguments(args); 
			}
			this.blocks[0].updateArguments(funcId, args);
			if (this.blocks[1]) {
				this.blocks[1].updateArguments(funcId, args);
			}
		},
		
		funcCallUpdated: function() {
			this.blocks[0].funcCallUpdated();
			if (this.blocks[1]) {
				this.blocks[1].funcCallUpdated();
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

		checkIntegrity: function(parent) {
			if (this.parent.timestamp !== parent.timestamp) {
				throw this.name + ' ' + this.parent.timestamp + '!=='  + parent.timestamp;
			}
			
			this.blocks[0].checkIntegrity(this);

			if (this.blocks[1]) {
				this.blocks[1].checkIntegrity(this);
			}
		}
	});

	var WhileStmt = $.inherit(CondStmt, {
		__constructor : function(testName, args, body, conditionProperties, parent, id, problem) {
	        this.finished = false;//
			this.executing = false;//
			this.isStarted = false; //should be changed to one or two properties.
			this.args = args.clone();
			this.testName = testName;
			this.setBody(body);
			this.parent = parent;	
			this.id = id;
			this.problem = problem;
			this.conditionProperties = conditionProperties;
			this.name = 'while';
			this.timestamp = new Date().getTime();
		},

		createClone: function() {
			var body = this.body.createClone();
			var clone = new IfStmt(this.testName, this.args, body, this.conditionProperties, this.parent, this.id, this.problem);
			return clone;
		},

		setBody: function(body) {
			this.body = body;
			if (this.body) {
				this.body.parent = this;
			}
		},
		
		isFinished: function(){
			return this.finished;
		},
		
		eq: function(block){
			return this.__base(block) && this.body.eq(block.body);
		},
		
		exec: function(cnt, args) {
			while (cnt && !this.finished && !(this.problem.stopped || this.problem.paused || this.problem.executionUnit.isDead()))
			{
				this.isStarted = true;
				if (!this.executing)
				{
					this.constructTestFunc(this.convertArguments(args));
					cnt -= 1;
					if (!cnt || this.problem.speed)
					{
						if (this.problem.speed)
						{
							if (this.problem.prevCmd)
								this.problem.prevCmd.highlightOff();
							this.problem.prevCmd = this;
						}
						this.highlightOn();
					}
					this.problem.lastExecutedCmd = this;
					if (!this.test())
					{
						this.finished = true;
						return cnt;
					}
					this.executing = true;
					this.body.setDefault();
				}
				cnt = this.body.exec(cnt, args);
				if (this.body.isFinished())
				{
					this.executing = false;
				}
			}
			return cnt;
		},
		
		getClass: function(){
			return 'while';
		},
		
		setDefault: function(){
			this.finished = false;
			this.executing = false;
			this.isStarted = false;
			this.body.setDefault();
			this.highlightOff();
			var conditionArguments = this.conditionProperties.args;
			$('#' + this.id).children('select:eq(0)').val(this.args[0]);
			for (var i = 0; i < conditionArguments.length; ++i) {
				conditionArguments[i].setValue($('#' + this.id).children('.testFunctionArgument:eq(' + i + ')'), this.args[i + 1]);
			}	
		},
		
		showCounters: function() {
			this.body.showCounters();
		},
		
		hideCounters: function() {
			this.body.hideCounters();
		},
		
		started: function() {
			return this.isStarted;
		},
		
		copyDiff: function(block, compareCnt){
			if (block.getClass() != this.getClass())
			{
				return block;
			}
			this.__base(block, compareCnt);
			this.body.copyDiff(block.body);
			return this;
		},
		
		makeUnfinished: function(){
			if (this.isFinished())
			{
				this.finished = false;
				this.executing = true;
				this.body.makeUnfinished();
			}
		},
		
		highlightOff: function(){
			this.__base();
			this.body.highlightOff();
		},
		
		convertToCode: function(tabsNum) {
			var str = generateTabs(tabsNum) + 'while ';
			str += this.__base(tabsNum);		 
			return str + this.body.convertToCode(tabsNum + 1);
		},
		
		generateCommand: function(tree, node){
			var self = this;

			if (!self.problem.isCommandSupported(self.name)) {
				throw 'Unsupported command!4';
			}
			
			++self.problem.loadedCnt;
			tree.create(node, InterfaceJSTree.isBlock(tree._get_type(node)) ? "last" : "after", 
				{'data': self.problem.getCommandName(self.getClass())}, function(newNode){
					InterfaceJSTree.onCreateItem(tree, 
						newNode, 
						$('#while0').attr('rel'),
						self.problem,
						undefined, 
						self.conditionProperties, 
						self.args, 
						true);
					var numId = $(newNode).prop('numId');
					self.id = $(newNode).attr('id');
					self.body.generateCommand(tree, $(newNode));
					--self.problem.loadedCnt;
				}, true); 
		},
		
		getFunction: function() { 
			return this.parent ? this.parent.getFunction() : undefined;
		},
		
		updateArguments: function(funcId, args) {
			var funcDef = this.getFunction();
			if (funcDef && funcDef.funcId == funcId) {
				this.generateArguments(args); 
			}
			this.body.updateArguments(funcId, args);
		},
		
		funcCallUpdated: function() {
			this.body.funcCallUpdated();
		},
		
		updateFunctonNames: function(funcId, oldName, newName) {
			this.body.updateFunctonNames(funcId, oldName, newName);
		},
		
		removeFunctionCall: function(funcId) {
			this.body.removeFunctionCall(funcId);
		},

		checkIntegrity: function(parent) {
			if (this.parent.timestamp !== parent.timestamp) {
				throw this.name + ' ' + this.parent.timestamp + '!==' + parent.timestamp;
			}
			this.body.checkIntegrity(this);
		}
	});


	var Block = $.inherit({
		__constructor : function(commands, parent, problem) {
	        this.curCmd = 0;
			this.commands = commands;
			this.parent = parent;
			this.problem = problem;
			this.timestamp = new Date().getTime();
			this.prevCmd = -1;
		},
		
		createClone: function() {
			var commands = [];

			for (var i = 0; i < this.commands.length; ++i) {
				commands.push(this.commands[i].createClone());
			}

			var clone = new Block(commands, this.parent, this.problem);
			return clone;
		},

		insertCommand : function(command, pos) {
		    this.commands.splice(pos, command);
		},
		
		pushCommand: function(command){
			this.commands.push(command);
		},
		
		isFinished: function(){
			return this.commands.length == this.curCmd;
		},
		
		eq: function(block){
			if (block.getClass() != 'block')
				return false;
			var f = true;
			for (var i = 0; i < Math.min(this.commands.length, this.curCmd + 1) && f; ++i) //rewrite!
			{
				if (i >= block.commands.length)
					return false;
				var f1 = this.commands[i].eq(block.commands[i], block.commands[i].getClass() == 'command' && 
					i == Math.min(this.commands.length - 1, this.curCmd));
				f = f && f1;
			}
			return f;
		},
		
		exec: function(cnt, args) {
			var cmd = undefined;
			while(cnt && this.commands.length > this.curCmd && !(this.problem.stopped || this.problem.paused || this.problem.executionUnit.isDead()))
			{
				cmd = this.commands[this.curCmd];
				cnt = cmd.exec(cnt, args, this.prevCmd == this.curCmd);
				this.prevCmd = this.curCmd;
				if (cmd.isFinished())
					++this.curCmd;
			}
			if (cmd && cmd.getClass() == 'command' && (this.problem.speed || !cnt)) 
			{
				if (this.problem.speed)
				{
					if (this.problem.prevCmd && this.problem.prevCmd.id != cmd.id)
						this.problem.prevCmd.highlightOff()
					this.problem.prevCmd = cmd;
					if (!isCmdHighlighted(cmd.id))
					{
						changeCmdHighlight(cmd.id);
					}
				}
				if (!cnt)
					cmd.hideCounters();
			}
			return cnt;
		},
		
		getClass: function(){
			return 'block';
		},
		
		setDefault: function(){
			for (var i = 0; i < this.commands.length; ++i)
				this.commands[i].setDefault();
			this.curCmd = 0;
			this.prevCmd = -1;
		},
		
		showCounters: function() {
			var i = 0;
			for (; i < this.commands.length; ++i)
			{
				this.commands[i].showCounters(); 
			}
		},
		
		hideCounters: function() {
			for (var i = 0; i < this.commands.length; ++i)
				this.commands[i].hideCounters(); 
		},
		
		started: function() {
			return this.curCmd > 0 || (this.commands.length && this.commands[0].started());
		},
		
		copyDiff: function(block, compareCnt){
			if (block.getClass() != 'block') {
				return block;
			}
			for (var i = 0; i < Math.min(this.commands.length, block.commands.length); ++i) {
				this.commands[i] = this.commands[i].copyDiff(block.commands[i], /*this.isFinished() &&*/ i == this.commands.length - 1 && compareCnt);
				this.commands[i].parent = this;
			}
			if (this.commands.length < block.commands.length) {
				for (var i = this.commands.length; i < block.commands.length; ++i) {
					this.pushCommand(block.commands[i]);
					this.commands[i].parent = this;
				}
			}
			else if (this.commands.length > block.commands.length) {
				this.commands.splice(block.commands.length, this.commands.length - block.commands.length);
			}
			return this;
		},
		
		makeUnfinished: function(){
			if (this.isFinished())
			{
				this.curCmd = Math.max(this.commands.length - 1, 0);
				if (this.commands.length)
					this.commands[this.curCmd].makeUnfinished();
			}
		},
		
		highlightOff: function(){
			for (var i = 0; i < this.commands.length; ++i)
				this.commands[i].highlightOff();
		},
		
		highlightOn: function(){
			return;
		},
		
		convertToCode: function(tabsNum) {
			str = '';
			for (var i = 0; i < this.commands.length; ++i){
				str += this.commands[i].convertToCode(tabsNum);
			}
			return str;
		},
		
		generateCommand: function(tree, node){
			for (var i = 0; i < this.commands.length; ++i)
			{
				this.commands[i].generateCommand(tree, node ? node : 0);
			}
		},
		
		updateFunctonNames: function(funcId, oldName, newName){
			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].updateFunctonNames(funcId, oldName, newName);
			}
		},
		
		removeFunctionCall: function(funcId){
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
		},

		checkIntegrity: function(parent) {
			if (this.parent && this.parent.timestamp !== parent.timestamp) {
				throw 'Block ' + this.parent.timestamp + '!==' + parent.timestamp;
			}

			for (var i = 0; i < this.commands.length; ++i) {
				this.commands[i].checkIntegrity(this);
			}
		}
	});

	var FuncDef = $.inherit({
		__constructor : function(name, argumentsList, body, parent, id, funcId, problem) {
			this.name = name;
			this.setBody(body);
			this.argumentsList = argumentsList.clone();
			this.parent = parent;
			this.problem = problem;
			this.finished = false;
			this.id = id;
			if (!this.problem.functions[this.name]) {
				this.problem.functions[this.name] = [];
			}
			this.problem.functions[this.name][this.argumentsList.length] = this; //cheat!!! needs to be reworked
			this.funcId = funcId;
			this.problem.functionsWithId[this.funcId] = this;
			this.timestamp = new Date().getTime();
		},

		createClone: function() {
			var body = this.body.createClone();
			var clone = new FuncDef(this.name, this.argumentsList, body, this.parent, this.id, this.funcId, this.problem);
			return clone;
		},

		setBody: function(body) {
			this.body = body;
			if (this.body) {
				this.body.parent = this;
			}
		},
		
		isFinished: function(){
			return this.finished;
		},
		
		eq: function(func) {
			if (func.getClass() != 'functionDef')
				return false;
			return func.name == this.name && this.body.eq(func.body); //???
		},
		
		exec: function(cnt) {
			//return this.body.exec(cnt);
			this.finished = true;
			return cnt;
		},
		
		getClass: function(){
			return 'functionDef';
		},
		
		setDefault: function(){
			this.finished = false;
			this.body.setDefault();
		},
		
		showCounters: function() {
			this.body.showCounters();
			return;
		},
		
		hideCounters: function() {
			this.body.hideCounters();
			return;
		},
		
		started: function() {
			return this.finished;
		},
		
		copyDiff: function(func, compareCnt) {
			if (func.getClass() != 'functionDef'){
				return func;
			}
			this.argumentsList = func.argumentsList.clone();
			this.name = func.name;
			this.body.copyDiff(func.body, compareCnt);
			return this;
		},
		
		makeUnfinished: function(){
			this.body.makeUnfinished();
		},
		
		highlightOff: function(){
			this.body.highlightOff();
		},
		
		highlightOn: function(){
			return;
		},
		
		convertToCode: function(tabsNum) {
			str = generateTabs(tabsNum) + 'def ' + this.name + '(';
			for (var i = 0; i < this.argumentsList.length; ++i) {
				if (i != 0) {
					str += ', ';
				}
				str += this.argumentsList[i];
			}
			str += '):\n';
			if ( this.body.commands.length )
				str += this.body.convertToCode(tabsNum + 1);
			else
				str += generateTabs(tabsNum + 1) + 'pass\n';
			return str;
		},
		
		generateCommand: function(tree, node){
			var self = this;

			if (!self.problem.isCommandSupported('funcdef')) {
				throw 'Unsupported command!5';
			}
			
			++self.problem.loadedCnt;
			var c = ++cmdId;
			$('#accordion' + this.problem.tabIndex).myAccordion('push', this.name, this.argumentsList, this.funcId);
			$('#funcDef-' + c).bind('loaded.jstree', function(){		
				self.body.generateCommand(jQuery.jstree._reference('funcDef-' +  c));
				--self.problem.loadedCnt;
				++cmdId;
				self.problem.updated();
			});
			InterfaceJSTree.createJsTreeForFunction('#funcDef-' + c, this.problem, true);
		},
		
		updateFunctonNames: function(funcId, oldName, newName){
			if (this.funcId == funcId) {
				this.name = newName;
				this.updateJstreeObject();
				this.body.updateFunctonNames(funcId, oldName, newName);
			}
		},
		
		updateJstreeObject: function(){
			$('#' + this.id).children('.func-header').text(this.name);
		},
		
		removeFunctionCall: function (funcId){
			this.body.removeFunctionCall(funcId);
		},
		
		highlightWrongNames: function() {
			if (!checkName(this.name)) {
				$('#' + this.id).children('span:eq(1)').addClass('wrongName');
			}
			else {
				$('#' + this.id).children('span:eq(1)').removeClass('wrongName');
			}
		},
		
		getArguments: function() {
			return this.argumentsList;
		},
		
		getFunction: function() { 
			return this;
		},
		
		updateArguments: function(funcId, args) {
			if (this.funcId == funcId) {
				this.argumentsList = args.clone();
			}
			//this.updateJstreeObject();
			this.body.updateArguments(funcId, args);
		},
		
		funcCallUpdated: function() {
			this.body.funcCallUpdated();
		},


		checkIntegrity: function(parent) {
			if (this.parent.timestamp !== parent.timestamp) {
				throw this.name + ' ' + this.parent.timestamp + '!==' + parent.timestamp;
			}
			this.body.checkIntegrity(this);
		}
	});

	var FuncCall = $.inherit({
		__constructor : function(name, argumentsValues, parent, id, problem) {
			this.name = name;
			this.parent = parent;
			this.problem = problem;
			this.executing = false;
			this.id = id;
			this.argumentsValues = argumentsValues.clone();
			this.timestamp = new Date().getTime();
			this.funcDef = undefined;
		},
		
		createClone: function() {
			var clone = new FuncCall(this.name, this.argumentsValues, this.parent, this.id, this.problem);
			return clone;
		},

		isFinished: function(){
			return this.funcDef == undefined || this.funcDef.isFinished();
			/*funcDef = this.getFuncDef();
			return funcDef ? funcDef.body.isFinished() : false;*/
		},
		
		getFuncDef: function() {
			try {
				return this.problem.functions[this.name][this.argumentsValues.length];
			}
			catch(err) {
				return undefined;
			}
		},
		
		operateFuncDef: function(func) {
			var funcDef = this.getFuncDef();
			if (funcDef) {
				funcDef[func]();
			}
		},
		
		eq: function(func) {
			return (func.getClass() == 'functionCall') && this.name == func.name && 
				this.argumentsValues.length == func.argumentsValues.length;
		},
		
		exec: function(cnt, a) {
			if (this.funcDef && this.funcDef.isFinished()) {
				this.funcDef = undefined;
			}

			if (!this.funcDef) {
				this.funcDef = this.getFuncDef().createClone();
			}

			var funcDef = this.funcDef;

			if (!funcDef) {
				throw "Undefined function " + this.name;
			}
			if (!this.executing)
			{
				this.setArguments(funcDef.getArguments(), this.argumentsValues);
				cnt -= 1; //check it!!!
				var numId = $('#' + this.id).prop('numId');
				if (!cnt || this.problem.speed)
				{
					if (this.problem.speed)
					{
						if (this.problem.prevCmd)
							this.problem.prevCmd.highlightOff();
						this.problem.prevCmd = this;
					}
					$('#' + this.id + '>a').css('background-color', '#1CB2B3');
				}
				this.problem.lastExecutedCmd = this;
				this.executing = true;

				if (funcDef) {
					funcDef.body.setDefault();
				}
			}
			if (funcDef) {
				cnt = funcDef.body.exec(cnt, this.arguments);
				if (funcDef.body.isFinished()) {
					this.executing = false;
					this.funcDef = undefined;
				}
			}
			return cnt;
		},
		
		getClass: function(){
			return 'functionCall';
		},
		
		setDefault: function(){
			$('#' + this.id + '>span').css('background-color', '#FFFFFF');
			this.executing = false;
			this.funcDef = undefined;
			/*funcDef = this.getFuncDef();
			if (funcDef) {
				funcDef.body.setDefault();	
			}*/
		},
		
		showCounters: function() {
			/*funcDef = this.getFuncDef();
			if (funcDef) {
				funcDef.body.showCounters();	
			}	*/
		},
		
		hideCounters: function() {
			/*funcDef = this.getFuncDef();
			if (funcDef) {
				funcDef.body.hideCounters();
			}*/
		},
		
		started: function() {
			return this.executing;
		},
		
		copyDiff: function(func, compareCnt) {
			if (func.getClass() != 'functionCall'){
				return func;
			}
			this.name = func.name;
			//this.funcName = func
			this.argumentsValues = func.argumentsValues.clone();
			this.id = func.id;
			return this;
		},
		
		makeUnfinished: function(){
			funcDef = this.getFuncDef();
			if (funcDef) {
				funcDef.body.makeUnfinished();	
			}
		},
		
		highlightOff: function(){
			$('#' + this.id + '>a').css('background-color', '');
		},
		
		highlightOn: function(){
			$('#' + this.id + '>a').css('background-color', '#1CB2B3');
		},
		
		convertToCode: function(tabsNum) {
			var str = generateTabs(tabsNum) + this.name + '(';
			for (var i = 0; i < this.argumentsValues.length; ++i) {
				if (i != 0) {
					str += ', ';
				}
				if (checkNumber(this.argumentsValues[i]) || checkName(this.argumentsValues[i])) {
					str += this.argumentsValues[i];
				}
				else {
					str += "u'" + this.argumentsValues[i] + "'";
				}
			}
			str += ')\n';
			return str;
		},
		
		generateCommand: function(tree, node){
			var self = this;

			++self.problem.loadedCnt;
			tree.create(node, InterfaceJSTree.isBlock(tree._get_type(node)) ? "last" : "after", 
				{'data': self.name}, function(newNode){
					InterfaceJSTree.onCreateItem(tree, 
						newNode, 
						'funccall', 
						self.problem, 
						self.funcId, 
						undefined,  
						self.argumentsValues,
						true);  //$('#func0')?!
					var numId = $(newNode).prop('numId');
					self.id = 'funccall' + numId;
					for (var i = 0; i < self.argumentsValues.length; ++i) {
						$(newNode).children('input:eq(' + i + ')').val(self.argumentsValues[i]);
					}
					$(newNode).attr('funcId', this.funcId);
					--self.problem.loadedCnt;
				}, true); 	
		},
		
		updateFunctonNames: function(funcId, funcName, newName) {
			var funcDef = this.getFuncDef();
			if (funcDef.funcId == funcId) {
				this.name = newName;
				//this.funcName = newName;
				this.updateJstreeObject(undefined, funcDef);
			}
		},
		
		updateJstreeObject: function(args, funcDef){
			$('#' + this.id).children('a').html('<ins class="jstree-icon"> </ins>' + this.name);
			var inputs = $('#' + this.id).children('.argCallInput');
			args = args ? args : (funcDef ? funcDef.getArguments() : this.getFuncDef().getArguments());
			if (inputs.length > args.length) {
				$(inputs).filter(':gt(' + (args.length - 1) + ')').remove();
			}
			else {
				for (var i = inputs.length; i < args.length; ++i) {
					$('#' + this.id)
						.append('<input class="argCallInput"/>')
						.bind('change', function(problem){
							return function() {
								problem.updated();
							}
						}(this.problem));
				}
			}
			
		},
		
		removeFunctionCall: function (funcId){
			var funcDef = this.getFuncDef();
			if (funcDef == undefined || funcDef.funcId == funcId) {
				$('#' + this.id).remove();
			}
		},
		
		highlightWrongNames: function() {
			if (!this.problem.functions[this.name] || !checkName(this.name)) {
				$('#' + this.id).children('a').addClass('wrongName');
			}
			else {
				$('#' + this.id).children('a').removeClass('wrongName');
			}
		},
		
		setArguments: function(argumentsList, argumentsValues) {
			var i = 0;
			this.arguments = {};
			
			for (i = 0; i < Math.min(argumentsList.length, argumentsValues.length); ++i) {
				this.arguments[argumentsList[i]] = argumentsValues[i];
			}

			if (i != argumentsList.length) {
				throw "Invalid arguments list ";
				return false;
			}

			return true;
		},
		
		getFunction: function() { 
			return this.parent ? this.parent.getFunction() : undefined;
		},
		
		updateArguments: function(funcId, args) {
			var funcDef = this.getFuncDef();
			if (funcDef && funcDef.funcId == funcId) {
				this.updateJstreeObject(args);
			}
			//this.body.updateArguments(funcId, arguments);
		},
		
		funcCallUpdated: function() {
			//TODO:
		},

		checkIntegrity: function(parent) {
			if (this.parent.timestamp !== parent.timestamp) {
				throw this.name + ' ' + this.parent.timestamp + '!==' + parent.timestamp;
			}
		}
	});

	
	return {
		Command: Command,
		ForStmt: ForStmt,
		IfStmt: IfStmt,
		WhileStmt: WhileStmt,
		Block: Block, 
		FuncDef: FuncDef,
		FuncCall: FuncCall,
	}
});

