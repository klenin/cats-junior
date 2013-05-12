define('Problems', ['jQuery',
	'jQueryInherit',
	'ModesConvertion',
	'ExecutionUnitWrapper',
	'CommandsMode',
	'InterfaceJSTree',
	'ModesConvertion',
	'CodeMode',
	'ShowMessages',
	'Declaration',
	'ExecutionUnitCommands'],

function() {
	var ExecutionUnitWrapperModule = require('ExecutionUnitWrapper');
	var InterfaceJSTree = require('InterfaceJSTree');
	var CommandsMode = require('CommandsMode');
	var ModesConvertion = require('ModesConvertion');
	var CodeMode = require('CodeMode');
	var ShowMessages = require('ShowMessages');
	var ExecutionUnitCommands = require('ExecutionUnitCommands');

	var Problem = $.inherit({
		__constructor: function(problem, tabIndex) {
			$.extend(true, this, problem, problem.data);
			this.cmdIndex = 0;
			this.divIndex = 0;
			this.step = 0;
			this.divName = '';
			this.speed = 1000;
			this.paused = false;
			this.stopped = false;
			this.playing = false;
			this.cmdListEnded = false;
			this.cmdList = new CommandsMode.Block([], undefined, this);
			this.executedCommandsNum = 0;
			this.lastExecutedCmd = undefined;
			this.prevCmd = undefined;
			this.tabIndex = tabIndex;
			if (this.maxCmdNum) this.maxStep = 0;
			//this.map = jQuery.extend(true, [], this.defaultLabirint);
			this.curCounter = 0;
			this.counters = [{
				'name': 'i',
				'cnt': 0
			}, {
				'name': 'j',
				'cnt': 0
			}, {
				'name': 'k',
				'cnt': 0
			}];
			this.playedLines = [];
			this.usedCommands = [];
			this.commandsFine = this.commandsFine ? this.commandsFine : 0;
			this.stepsFine = this.stepsFine ? this.stepsFine : 0;
			this.functions = {};
			this.functionsWithId = [];
			this.numOfFunctions = 0;
		},

		initExecutor: function(data) {
			this.executionUnit = new ExecutionUnitWrapperModule.ExecutionUnitWrapper(this, data, $('#tdField' + this.tabIndex).children('div'),
			data.data.executionUnitName ? data.data.executionUnitName : 'ArrowInLabyrinth');
		},

		onTabSelect: function(data) {
			this.executionUnit.onTabSelect();
		},

		generateCommands: function() {
			//this.executionUnit.addTypesInTree(jQuery.jstree._reference('#jstree-container' + this.tabIndex))

			var tr = $('#ulCommands' + this.tabIndex).children('table').children('tbody').children('tr');
			for (var i = 0; i < classes.length; ++i) {
				if (classes[i] === 'block') {
					continue;
				}

				if (this.controlCommands) {
					if (this.controlCommands.indexOf(classes[i]) === -1) { //this control command isn't accepted in this problem
						continue;
					}
				}

				var divclass = classes[i];
				$(tr).append('<td>' +
					'<div id="' + divclass + this.tabIndex + '" class="' + divclass + '  jstree-draggable" type = "' + divclass + '" rel = "' + divclass + '" title = "' + cmdClassToName[divclass] + '">' +
					'</div>' +
					'</td>');

				var self = this;

				$('#' + divclass + this.tabIndex).bind('dblclick', function(dclass, dname, problem) {
					return function() {
						if ($(this).prop('ifLi')) {
							return;
						}
						$("#jstree-container" + problem.tabIndex).jstree("create", false, "last", {
							'data': (dclass == 'funcdef') ? ('func_' + problem.numOfFunctions) : dname
						}, function(newNode) {
							InterfaceJSTree.onCreateItem(this, newNode, $('#' + dclass + problem.tabIndex).attr('rel'), problem);
						}, dclass != 'funcdef');
						problem.updated();
					}
				}(divclass, cmdClassToName[divclass], self));
			}

			this.executionUnit.generateCommands(tr);
		},

		getCommandName: function(command) {
			var name = cmdClassToName[command];
			if (!name) {
				name = this.executionUnit.getCommandName(command);
			}
			return name;
		},

		isCommandSupported: function(command) {
			var name = cmdClassToName[command];
			if (!name) {
				return this.executionUnit.isCommandSupported(command);
			}
			return !this.controlCommands || this.controlCommands.indexOf(command) !== -1;
		},

		setDefault: function(f) {
			for (var i = 0; i < btns.length; ++i)
			$('#btn_' + btns[i] + this.tabIndex).button('enable');
			//$('#jstree-container' + this.tabIndex).sortable('enable');
			/*this.map = jQuery.extend(true, [], this.defaultLabirint);
			 */

			this.executionUnit.setDefault(f);
			this.paused = false;
			this.stopped = false;
			this.playing = false;
			this.cmdListEnded = false;
			this.cmdIndex = 0;
			this.divIndex = 0;
			this.step = 0;
			this.divName = this.cmdList.length ? this.cmdList[0].name : "";
			this.prevCmd = undefined;
			this.lastExecutedCmd = undefined;
			this.executedCommandsNum = 0;
			this.curCounter = 0;
			this.counters = [{
				'name': 'i',
				'cnt': 0
			}, {
				'name': 'j',
				'cnt': 0
			}, {
				'name': 'k',
				'cnt': 0
			}]
			this.playedLines = [];
			this.usedCommands = [];
			this.hideFocus();
			this.cmdHighlightOff();
			if (!f) {
				this.changeProgressBar();
			}
			$("#cons" + this.tabIndex).empty();
			this.cmdList.setDefault();

			this.enableButtons();

			var problem = this.tabIndex;
			finalcode[problem] = undefined;
			$scope[problem] = undefined,
			$gbl[problem] = undefined,
			$loc[problem] = $gbl[problem];
			nextline[problem] = undefined;
			for (var i = 0; i < codeareas[problem].lineCount(); ++i)
			codeareas[problem].setLineClass(i, null);
			this.updateWatchList();
		},

		hideFocus: function() {
			for (var k = 0; k < btns.length; ++k) {
				$('#btn_' + btns[k] + this.tabIndex).removeClass('ui-state-focus').removeClass('ui-state-hover');
			}
		},

		cmdHighlightOff: function() {
			if (this.cmdList) {
				this.cmdList.highlightOff();
			}
		},

		changeProgressBar: function() {
			if (this.maxCmdNum) {
				$('#curStep' + this.tabIndex).text(this.divIndex);
				$('#progressBar' + this.tabIndex).progressbar('option', 'value', this.divIndex / this.maxCmdNum * 100);
				//if (this.divIndex == this.maxCmdNum)
				//	this.stopped = true;
			} else if (this.maxStep) {
				$('#curStep' + this.tabIndex).text(this.step);
				$('#progressBar' + this.tabIndex).progressbar('option', 'value', this.step / this.maxStep * 100);
				//if (this.step == this.maxStep)
				//	this.stopped = true;
			}
		},

		enableButtons: function() {
			//$('#jstree-container' + this.tabIndex).sortable('enable');
			for (var i = 0; i < btnsPlay.length; ++i)
			$('#btn_' + btnsPlay[i] + this.tabIndex).removeAttr('disabled');
			$('#tabs').tabs("option", "disabled", []);
			$('#divcontainer' + this.tabIndex).unblock();
			$('#resizable' + this.tabIndex).unblock();
		},

		disableButtons: function() {
			//$('#jstree-container' + this.tabIndex).sortable('disable');
			for (var i = 0; i < btnsPlay.length; ++i)
			$('#btn_' + btnsPlay[i] + this.tabIndex).prop('disabled', true);
			var disabled = [];
			for (var i = 0; i < $('#tabs').tabs('length'); ++i) {
				if (i != this.tabIndex + 1) disabled.push(i);
			}
			$('#tabs').tabs("option", "disabled", disabled);
			$('#divcontainer' + this.tabIndex).block({
				message: null,
				fadeIn: 0,
				overlayCSS: { 
					backgroundColor: '#ffffff',
					opacity: 0,
					cursor: 'default'
				}
			});

			/*$('#resizable' + this.tabIndex).block({
				message: null,
				fadeIn: 0,
				overlayCSS: { 
					backgroundColor: '#ffffff',
					opacity: 0,
					cursor: 'default'
				}
			});*/
		},

		updateWatchList: function() {
			var problem = this.tabIndex;
			for (var p in watchList[problem]) {
				var res = calculateValue(watchList[problem][p]);
				$('#calcVal_' + problem + '_' + p).html(res == undefined ? 'undefined' : res);
			}
		},

		tryNextStep: function(dontHiglight) {
			var problem = this.tabIndex;
			if (!finalcode[problem]) {
				return undefined;
			}
			if (CodeMode.getCurBlock() >= 0) {
				if (nextline[problem] != undefined && !dontHiglight) codeareas[problem].setLineClass(nextline[problem], null);
				var e = 1;
				while (CodeMode.getCurBlock() >= 0 && (e || $expr[problem])) {
					$expr[problem] = 0;
					e = CodeMode.getScope().blocks[CodeMode.getCurBlock()].expr;
					try {
						eval(finalcode[problem].code);
						this.updateWatchList();
					} catch (e) {
						console.error(e);
						$('#cons' + problem).append('\n' + e + '\n');
						return 0;

					}
				}++this.executedCommandsNum;
				//this.executionUnit.draw();
				if (CodeMode.getCurBlock() >= 0) {
					var b = CodeMode.getCurBlock();
					while (CodeMode.getScope().blocks[b].funcdef)++b;
					nextline[problem] = CodeMode.getScope().blocks[b].lineno;
				}

				if (nextline[problem] != undefined) {
					if (!dontHiglight) codeareas[problem].setLineClass(nextline[problem], 'cm-curline');
					if (codeareas[problem].lineInfo(nextline[problem]).markerText) {
						this.paused = true;
						//curProblem.playing = false;
						return 1;
					}
				}
				if (CodeMode.getCurBlock() < 0) {
					if (nextline[problem] != undefined && !dontHiglight) codeareas[problem].setLineClass(nextline[problem], null);
					//$('#cons' + problem).append('\nfinished\n');
					this.executionUnit.cmdListFinished();
					this.playing = false;
					return 0;
				}
			} else {
				if (nextline[problem] != undefined) codeareas[problem].setLineClass(nextline[problem], null);
				//$('#cons' + problem).append('\nfinished\n');
			this.executionUnit.cmdListFinished();
				this.playing = false;
				return 0;
			}
			return 1;
		},

		divI: function() {
			return this.divIndex;
		},

		divN: function() {
			return this.divName;
		},

		list: function() {
			return this.cmdList;
		},

		setCounters_: function(el, j, dontReload) {
			while (j) {
				el = el.next();
				j--;
			}
			while (el.length > 0) {
				var numId = el.prop('numId');
				var val = $('#spin' + numId).prop('value');
				var newVal = dontReload ? $('#spinCnt' + numId).prop('cnt') : val;
				$('#spinCnt' + numId).prop('cnt', newVal);
				$('#spinCnt' + numId).prop('value', newVal + '/' + val);
				el = el.next();
			}
		},

		setCounters: function(j, dontReload) {
			this.setCounters_($('#jstree-container' + this.tabIndex).children(), j, dontReload);
		},

		checkIntegrity: function() {
			this.cmdList.checkIntegrity();
		},

		updated: function() {
			this.functions = {};
			this.functionsWithId = [];
			this.numOfFunctions = 0;
			var accordion = $('#accordion' + this.tabIndex);
			var newCmdList = new CommandsMode.Block([], undefined, this);
			for (var i = 0; i < accordion.children('.funccall').length; ++i) {
				var div = accordion.children('.funccall:eq(' + i + ')');
				var name = accordion.myAccordion('getFunctionName', div);
				var id = $(div).attr('id');
				var funcId = $(div).attr('funcId');
				var argumentsList = accordion.myAccordion('getArguments', div);
				var code = ModesConvertion.convert(div.children('.func-body').jstree('get_json', -1), newCmdList, this, name, div, argumentsList, funcId);
				newCmdList.pushCommand(code);
			}

			var code = ModesConvertion.convert($("#jstree-container" + this.tabIndex).jstree('get_json', -1), newCmdList, this, false);
			if (newCmdList) {
				newCmdList.pushCommand(code);
			} else {
				newCmdList = code;
			}
			this.changed = true;
			this.cmdList = newCmdList;
			this.setDefault();
			this.updateInterface('FINISH_EXECUTION');
			this.highlightWrongNames();
		},

		updateFunctonNames: function(funcId, oldName, newName) {
			//if (!this.functions[oldName]) {
			this.cmdList.updateFunctonNames(funcId, oldName, newName);
			//}
		},

		removeFunctionCall: function(funcId) {
			this.updated();
			//if (!this.functions[name]){
			this.cmdList.removeFunctionCall(funcId);
			//}
			this.highlightWrongNames();
		},

		updateArguments: function(funcId, args) {
			this.cmdList.updateArguments(funcId, args);
		},

		highlightWrongNames: function() {
			this.cmdList.highlightWrongNames();
		},

		funcCallUpdated: function() {
			this.cmdList.funcCallUpdated();
		},

		loop: function(cnt, i) {
			try {
				var continueExecution = 1;
				if (!this.playing || this.paused) return; // cheat
				if ($('#codeMode' + this.tabIndex).prop('checked')) {
					continueExecution = this.tryNextStep();
				} else {
					if (!this.cmdList.exec(1))++this.executedCommandsNum;
					this.changeProgressBar();
					if (this.cmdList.isFinished()) {
						this.playing = false;
						this.enableButtons();
						this.executionUnit.cmdListFinished();
						return;
					}
				}
				if (continueExecution) {
					this.nextStep(cnt - 1, ++i);
				}
			} catch (e) {
				console.error(e);
				$('#cons' + this.tabIndex).append(e);
			}
		},

		heroIsDead: function() {
			for (var i = 0; i < btns.length; ++i)
			$('#btn_' + btns[i] + this.tabIndex).button('disable');
			$('#btn_stop' + this.tabIndex).button('enable');
			//$('#jstree-container' + this.tabIndex).sortable('enable');
			if (!this.speed) this.notSpeed();
			this.playing = false;
			this.hideFocus();
		},

		nextCmd: function() {
			if (this.speed) this.changeProgressBar();
			return true;
		},

		notSpeed: function() { //check! looks like outdated
			this.speed = 100;
			this.setCounters(0, true);
			var lastCmd = (this.divI() >= this.list().length) ? $('#jstree-container' + this.tabIndex + ' > li:last').prop('id') : this.divN();
			if (!isCmdHighlighted(lastCmd)) lastCmd.highlightOn();
			this.executionUnit.draw();
			this.changeProgressBar();
		},

		nextStep: function(cnt, i) {
			if (this.executionUnit.isDead() || this.stopped) {
				if (this.executionUnit.isDead()) //check it!!!
				this.heroIsDead();
				if (this.stopped) {
					this.setDefault();
					this.cmdHighlightOff();
					this.updateInterface('FINISH_EXECUTION');
					this.setCounters();
					return;
				}
				this.playing = false;
				this.nextCmd();
				this.hideFocus();
				this.enableButtons();
				return;
			}
			if (cnt && !this.paused && this.playing) {
				setTimeout(function(problem) {
					return function() {
						problem.loop(cnt, i);
					}
				}(this), this.speed);
			} else {
				this.executionUnit.draw();
				this.changeProgressBar();
				this.enableButtons();
				//if (!this.playing && $('#codeMode' + this.tabIndex).prop('checked')) Interface.onFinishExecuting(getCurProblem());
			}
		},

		highlightLast: function() {
			if (this.lastExecutedCmd && !isCmdHighlighted(this.lastExecutedCmd.id)) {
				this.lastExecutedCmd.highlightOn()
			}
		},

		play: function(cnt) {
			try {
				if (!this.speed) {
					if ($('#codeMode' + this.tabIndex).prop('checked')) {
						for (var i = 0; i < cnt && i < maxStep && !this.paused && !this.stopped && this.tryNextStep(); ++i) {};
						if (i < cnt && i == maxStep && !this.paused) {
							$('#cons' + this.tabIndex).append('Превышено максимальное число шагов');
						}
					} else {
						var c = cnt == MAX_VALUE ? maxStep : cnt;
						var executed = this.cmdList.exec(c);
						this.executedCommandsNum += c - executed;
						if (cnt == MAX_VALUE && !executed && !this.paused) {
							$('#cons' + this.tabIndex).append('Превышено максимальное число шагов');
						}
						if (this.cmdList.isFinished()) this.playing = false;
					}
					this.changeProgressBar();
					this.executionUnit.draw();
					this.enableButtons();

					this.cmdList.highlightOff(); //inefficiency!!!!!!!!

					this.highlightLast();
				} else this.nextStep(cnt);
			} catch (e) {
				console.error(e);
				$('#cons' + this.tabIndex).append(e);
			}
		},

		oneStep: function(command, cnt, args) {
			if (cnt == undefined) {
				cnt = 1;
			}
			for (var i = 0; i < cnt && !this.stoped && !this.paused; ++i) {
				this.executionUnit.executeCommand(command, args);
				++this.step;
				if (this.maxStep && this.step == this.maxStep) continue;
				this.checkLimit();
			}

			if (nextline[this.tabIndex] != undefined && !this.playedLines[nextline[this.tabIndex]] && this.codeMode()) {
				++this.divIndex;
				if (this.commandsFine) {
					this.executionUnit.changePoints(-this.commandsFine);
					var mes = new ShowMessages.MessageCommandFine(this.step, this.executionUnit.getPoints());
				}
				this.playedLines[nextline[this.tabIndex]] = true;
			}

			this.checkLimit();
			//if (this.speed)
			{
				this.changeProgressBar();
			}

		},

		convertCommandsToCode: function() {
			this.curCounter = 0;
			this.counters = [{
				'name': 'i',
				'cnt': 0
			}, {
				'name': 'j',
				'cnt': 0
			}, {
				'name': 'k',
				'cnt': 0
			}]

			return this.cmdList.generatePythonCode(0);
		},

		die: function() {
			var mes = new ShowMessages.MessageDead();
			for (var i = 0; i < btnsPlay.length; ++i)
			$('#btn_' + btnsPlay[i] + this.tabIndex).button('disable');
			$('#btn_pause' + this.tabIndex).button('disable');
		},

		updateInterface: function(newState) {
			this.cmdList.updateInterface(newState);
		},

		getSubmitStr: function() {
			var result;
			if ($('#codeMode' + this.tabIndex).prop('checked')) {
				result = codeareas[this.tabIndex].getValue();
			} else {
				result = this.convertCommandsToCode();
			}
			if (atHome) {
				return 'source=' + result + '&problem_id=' + this.id + '&de_id=772264';
			} 
			return result;
		},

		exportCommands: function() {
			$('#export' + this.tabIndex).html(this.convertCommandsToCode());
			$('#export' + this.tabIndex).dialog('open');
			return false;
		},

		callPlay: function(s) {
			if (!this.checkLimit()) {
				return;
			}
			if (!this.playing || this.executionUnit.isDead()) {
				this.setDefault();
				this.setCounters();
				//this.updateInterface('START_EXECUTION');
			}
			//try {
				this.speed = s;
				if (!this.playing) {
					if (!$('#codeMode' + this.tabIndex).prop('checked')) {
						var str = this.convertCommandsToCode();
						codeareas[this.tabIndex].setValue(str);
					}
					this.prepareForExecuting(!this.speed);
					this.playing = true;
				}
				this.cmdHighlightOff();
				this.paused = false;
				this.stopped = false;
				this.disableButtons();
				//this.updateInterface('START_EXECUTION');

				this.lastExecutedCmd = undefined;
				setTimeout(function(problem) {
					return function() {
						problem.play(MAX_VALUE);
					}
				}(this), s);
			/*} catch (e) {
				//console.error(e);
				this.playing = false;
				if (e.tp$name == "ParseError" && e.args.v[0].v == "bad input on line") {
					$('#cons' + this.tabIndex).html('Ошибка компиляции на ' + (e.args.v[1].v - 1) + ' строке');
				}
				else {
					$('#cons' + this.tabIndex).html('Некорректный код');
				}
			}*/
		},

		prepareForExecuting: function(dontHighlight) {
			var problem = this.tabIndex;
			this.setDefault();
			this.playing = false;
			this.cmdHighlightOff();
			this.setCounters();
			this.compileCode()
			this.updateWatchList();
			if (!dontHighlight && nextline[problem] != undefined) {
				codeareas[problem].setLineClass(nextline[problem], 'cm-curline');
			}
		},

		prepareForConvertionFromCode: function() {
			this.functions = {};
		},

		compileCode: function() {
			try {
				var problem = this.tabIndex;
				var output = $('#cons' + this.tabIndex);
				var input = codeareas[problem].getValue();

				output.html('');

				CodeMode.compile(input, problem, this.executionUnit.getCommands(), this.executionUnit.getConditionProperties());

				this.changed = false;
			}
			catch (e) {
				this.updateWatchList();
				if (codeareas[problem].getValue().length) {
					throw e;
				}
			}

		},

		stop: function() {
			this.stopped = true;
			this.setDefault();
			this.cmdHighlightOff();
			this.updateInterface('FINISH_EXECUTION')
			this.setCounters();
			this.playing = false;
			this.enableButtons();
		},

		pause: function() {
			if (this.playing) this.paused = true;
			this.enableButtons();
		},

		codeMode: function() {
			return $('#codeMode' + this.tabIndex).prop('checked');
		},

		next: function() {
			if (!this.checkLimit()) {
				return;
			}
			if (this.codeMode()) {
				try {
					if (!this.playing) {
						this.prepareForExecuting();
						this.playing = true;
					} else {
						this.tryNextStep();
					}
				} catch (e) {
					console.error(e);
					this.playing = false;
					$('#cons' + this.tabIndex).append(e);
				}
			} else {
				try {
					var s = this.speed;
					this.speed = 1000;
					this.paused = false;
					this.updateInterface('START_EXECUTION');
					if (!this.playing || this.changed) {

						if (!this.playing) {
							this.setCounters();
							var needReturn = this.cmdList.isFinished();
							this.setDefault();	
							if (needReturn) return;		
						}
						codeareas[this.tabIndex].setValue(this.convertCommandsToCode());
						if (!this.playing) {
							this.prepareForExecuting();
							this.updateInterface('START_EXECUTION');
						} else {
							this.compileCode();
						}
						this.playing = true;

					}
					this.lastExecutedCmd = undefined;
					this.cmdHighlightOff();
					this.cmdList.exec(1);
					this.changeProgressBar();
					++this.executedCommandsNum;
					this.highlightLast();
					this.executionUnit.draw();
					if (this.cmdList.isFinished()) {
						this.playing = false;
						this.executionUnit.cmdListFinished();
					} 
					this.speed = s;
				} catch (e) {
					console.error(e);
					$('#cons' + this.tabIndex).append(e);
				}

			}
		},

		prev: function() {
			try {
				var t = this.executedCommandsNum;
				if (t <= 1) {
					this.setDefault();
					if ($('#codeMode' + this.tabIndex).prop('checked') && t == 1) {
						this.prepareForExecuting();
						return;
					}
					this.playing = false;
					this.updateInterface('FINISH_EXECUTION');
					this.setCounters();
					return;
				}++c;
				--t;
				this.setDefault(true);
				if ($('#codeMode' + this.tabIndex).prop('checked')) {
					this.prepareForExecuting();
				}
				this.disableButtons();
				this.updateInterface('START_EXECUTION');
				var s = this.speed;
				this.speed = 0;
				this.playing = true;
				this.play(t);
			} catch (e) {
				console.error(e);
				$('#cons' + this.tabIndex).append(e);
			}
		},

		checkLimit: function() {
			if (this.maxCmdNum && this.divIndex > this.maxCmdNum || this.maxStep && this.step == this.maxStep || this.step > MAX_STEP_VALUE) {
				var mes = this.maxCmdNum ? new ShowMessages.MessageCmdLimit() : new ShowMessages.MessageStepsLimit();
				this.executionUnit.gameOver();
				//this.stopped = true;
				this.heroIsDead();
				return false;
			}
			return true;
		},

		getAvaliableFunctionName: function() {
			var index = 0;
			while (this.functions['func' + index] != undefined) {
				++index;
			}
			return 'func' + index;
		},

		onTabSelected: function(problemId) {
			if (this.executionUnit) {
				this.executionUnit.onTabSelected(problemId);
			}
		},

		getState: function() {
			return this.executionUnit.getState();
		},
		
		needToContinueExecution: function() {
			return !(this.stopped || this.paused || this.executionUnit.isDead());
		},
		
		recalculatePenalty: function(command) {
			if (!this.usedCommands[command.getId()]){
				++this.divIndex;
				this.usedCommands[command.getId()] = true;
				if (this.commandsFine){
					this.executionUnit.changePoints(-this.commandsFine);
					var mes = new ShowMessages.MessageCommandFine(this.step, this.executionUnit.getPoints());
				}
			}
		},
		
		setLastExecutedCommand: function(command) {
			this.lastExecutedCmd = command;
		},
		
		newCommandGenerationStarted: function() {
			++this.loadedCnt;
		},
		
		newCommandGenerated: function() {
			--this.loadedCnt;
		},

		getCommands: function() {
			return this.executionUnit.getCommands();
		},

		needToHighlightCommand: function(command) {
			if (command != this.lastExecutedCmd) {
				if (this.lastExecutedCmd){
					this.lastExecutedCmd.highlightOff();
				}
				this.lastExecutedCmd = command;
				if (this.speed) {
					return true;
				}
			}
			return false;
		},

		getConditionProperties: function(condName) {
			return this.executionUnit.getConditionProperties(condName);
		}
	});

	return {
		Problem: Problem
	}
});