define('Problems', ['jQuery',
	'jQueryInherit',
	'ModesConversion',
	'ExecutionUnitWrapper',
	'CodeMode',
	'ShowMessages',
	'Declaration',
	'ExecutionUnitCommands'],

function() {
	var ExecutionUnitWrapperModule = require('ExecutionUnitWrapper');
	var ModesConversion = require('ModesConversion');
	var CodeMode = require('CodeMode');
	var ShowMessages = require('ShowMessages');
	var ExecutionUnitCommands = require('ExecutionUnitCommands');

	var Problem = $.inherit({
		__constructor: function(problem, tabIndex) {
			$.extend(true, this, problem, problem.data);
			this.divIndex = 0;
			this.step = 0;
			this.speed = 1000;
			this.paused = false;
			this.stopped = false;
			this.playing = false;
			this.executedCommandsNum = 0;
			this.lastExecutedCmd = undefined;
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
			this.setCurrentStage('IDLE');

			this.functions = {};
		},

		initExecutor: function(data) {
			this.executionUnit = new ExecutionUnitWrapperModule.ExecutionUnitWrapper(this, data, $('#tdField' + this.tabIndex).children('div'),
			data.data.executionUnitName ? data.data.executionUnitName : 'ArrowInLabyrinth');
		},

		onTabSelect: function(data) {
			this.executionUnit.onTabSelect();
		},

		generateCommand: function(className, commandName, container) {
			console.log('generateCommand is deprecated. TODO: remove');
		},

		generateCommands: function() {
			console.log('generateCommands is deprecated. TODO: remove');
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
			for (var i = 0; i < btns.length; ++i){
				$('#btn_' + btns[i] + this.tabIndex).button('enable');
			}
			//$('#jstree-container' + this.tabIndex).sortable('enable');
			/*this.map = jQuery.extend(true, [], this.defaultLabirint);
			 */

			this.paused = false;
			this.stopped = false;
			this.playing = false;
			this.divIndex = 0;
			this.step = 0;
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
			this.blocklyExecutor.restore();
			this.blocklyExecutor.setDefault();
			this.executionUnit.setDefault();

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
			this.setCurrentStage('IDLE');
		},

		setCurrentStage: function(stage) {
			this.stage = stage;
		},

		getCurrentStage: function() {
			return this.stage;
		},

		hideFocus: function() {
			for (var k = 0; k < btns.length; ++k) {
				$('#btn_' + btns[k] + this.tabIndex).removeClass('ui-state-focus').removeClass('ui-state-hover');
			}
		},

		cmdHighlightOff: function(removeSelection) {
			var Blockly = this.Blockly;
			if (!Blockly)
				return
			blocks = Blockly.mainWorkspace.getAllBlocks();
			for (var i = 0, block; block = blocks[i]; ++i) {
				if (block.svg_) {
					Blockly.removeClass_(block.svg_.svgGroup_, "blocklyCurrentCommand");
					if (removeSelection) {
						block.svg_.removeSelect();
					}
				}
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
				var res = CodeMode.calculateValue(watchList[problem][p]);
				$('#calcVal_' + problem + '_' + p).html(res == undefined ? 'undefined' : res);
			}
		},

		tryNextStep: function(dontHiglight) {
			var problem = this.tabIndex;
			if (!finalcode[problem]) {
				return undefined;
			}
			if (CodeMode.getCurBlock() >= 0) {
				if (nextline[problem] != undefined && !dontHiglight)
					codeareas[problem].setLineClass(nextline[problem], null);
				var e = 1;
				while (CodeMode.getCurBlock() >= 0 && (e || $expr[problem])) {
					$expr[problem] = 0;
					e = CodeMode.getScope().blocks[CodeMode.getCurBlock()].expr;
					try {
						eval(finalcode[problem].code);
						this.updateWatchList();
					} catch (e) {
						console.error(e.toString());
						console.log(e.stack);
						$('#cons' + problem).append('\n' + e + '\n');
						return 0;

					}
				}++this.executedCommandsNum;
				if (CodeMode.getCurBlock() >= 0) {
					var b = CodeMode.getCurBlock();
					while (CodeMode.getScope().blocks[b].funcdef)
						++b;
					nextline[problem] = CodeMode.getScope().blocks[b].lineno;
				}

				if (nextline[problem] != undefined) {
					if (!dontHiglight)
						codeareas[problem].setLineClass(nextline[problem], 'cm-curline');
					if (codeareas[problem].lineInfo(nextline[problem]).markerText) {
						this.paused = true;
						//curProblem.playing = false;
						return 1;
					}
				}
				if (CodeMode.getCurBlock() < 0) {
					if (nextline[problem] != undefined && !dontHiglight)
						codeareas[problem].setLineClass(nextline[problem], null);
					//$('#cons' + problem).append('\nfinished\n');
					this.executionUnit.executionFinished();
					this.playing = false;
					return 0;
				}
			} else {
				if (nextline[problem] != undefined)
					codeareas[problem].setLineClass(nextline[problem], null);
				//$('#cons' + problem).append('\nfinished\n');
				this.executionUnit.executionFinished();
				this.playing = false;
				return 0;
			}
			return 1;
		},

		divI: function() {
			return this.divIndex;
		},

		updated: function() {
			if (this.getCurrentStage() == 'CONVERSION_TO_COMMANDS') {
				return;
			}

			this.functions = {};
			this.changed = true;
			this.setDefault();
			this.updateInterface('FINISH_EXECUTION');
			this.highlightWrongNames();
		},

		highlightWrongNames: function() {
		},

		loop: function(cnt, i) {
			try {
				var continueExecution = 1;
				if (!this.playing || this.paused) return; // cheat
				if ($('#codeMode' + this.tabIndex).prop('checked')) {
					continueExecution = this.tryNextStep();
				} else {
					if (!this.blocklyExecutor.exec(1, {}))
						++this.executedCommandsNum;
					this.changeProgressBar();
					if (this.blocklyExecutor.finished) {
						this.playing = false;
						this.enableButtons();
						this.executionUnit.executionFinished();
						return;
					}
				}
				if (continueExecution) {
					this.nextStep(cnt - 1, ++i);
				}
			} catch (e) {
				console.error(e);
				$('#cons' + this.tabIndex).append(e.message ? e.message : e.toString());
				$('#cons' + this.tabIndex).append('\n')
			}
		},

		heroIsDead: function() {
			for (var i = 0; i < btns.length; ++i)
				$('#btn_' + btns[i] + this.tabIndex).button('disable');
			$('#btn_stop' + this.tabIndex).button('enable');
			this.playing = false;
			this.hideFocus();
		},

		nextCmd: function() {
			if (this.speed)
				this.changeProgressBar();
			return true;
		},

		nextStep: function(cnt, i) {
			if (this.executionUnit.isGameOver() || this.stopped) {
				if (this.executionUnit.isGameOver()) //check it!!!
					this.heroIsDead();
				if (this.stopped) {
					this.setDefault();
					this.cmdHighlightOff();
					this.updateInterface('FINISH_EXECUTION');
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
			}
		},

		highlightLast: function() {
			if (this.lastExecutedCmd && !isCmdHighlighted(this.lastExecutedCmd.id)) {
				this.lastExecutedCmd.highlightOn()
			}
		},

		play: function(cnt) {
			var maxStep = this.maxStep == 0 ? MAX_STEP_VALUE : this.maxStep;
			try {
				if (!this.speed) {
					if ($('#codeMode' + this.tabIndex).prop('checked')) {
						for (var i = 0; i < cnt && i < maxStep && !this.paused && !this.stopped && this.tryNextStep(); ++i) {};
						if (i < cnt && i == maxStep && !this.paused) {
							$('#cons' + this.tabIndex).append('Превышено максимальное число шагов\n');
						}
					} else {
						var c = cnt == MAX_VALUE ? maxStep : cnt;
						var executed = this.blocklyExecutor.exec(c, {});
						this.executedCommandsNum += c - executed;
						if (cnt == MAX_VALUE && !executed && !this.paused) {
							$('#cons' + this.tabIndex).append('Превышено максимальное число шагов\n');
						}
						if (this.blocklyExecutor.finished) this.playing = false;
					}
					this.changeProgressBar();
					this.executionUnit.draw();
					this.enableButtons();
					this.highlightLast();
				} else this.nextStep(cnt);
			} catch (e) {
				logError(e)
				$('#cons' + this.tabIndex).append(e.message ? e.message : e.toString());
				$('#cons' + this.tabIndex).append('\n');
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
			var Blockly = this.Blockly;
			return Blockly.Python.workspaceToCode(Blockly.mainWorkspace)
		},

		die: function() {
			var mes = new ShowMessages.MessageDead();
			for (var i = 0; i < btnsPlay.length; ++i)
			$('#btn_' + btnsPlay[i] + this.tabIndex).button('disable');
			$('#btn_pause' + this.tabIndex).button('disable');
		},

		updateInterface: function(newState) {
			this.setCurrentStage('CONVERSION_TO_COMMANDS')
			switch (newState) {
				case 'START_EXECUTION':
					this.xmlWorkspace_ = this.Blockly.Xml.workspaceToDom(
						this.Blockly.mainWorkspace);
					break;
				case 'FINISH_EXECUTION':
					if (!this.xmlWorkspace_)
						this.setCurrentStage('IDLE');
						return
					this.Blockly.Xml.domToWorkspace(this.Blockly.mainWorkspace, this.xmlWorkspace_);
					break;
			}
			this.setCurrentStage('IDLE')
		},

		getSubmitStr: function() {
			var result;
			if ($('#codeMode' + this.tabIndex).prop('checked')) {
				result = codeareas[this.tabIndex].getValue();
			} else {
				result = this.convertCommandsToCode();
			}
			return result;
		},

		callPlay: function(s) {
			if (!this.checkLimit()) {
				return;
			}
			if (!this.playing || this.executionUnit.isGameOver()) {
				this.setDefault();
				//this.updateInterface('START_EXECUTION');
			}
			try {
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
			} catch (e) {
				this.playing = false;
				if (e.getErrorLine) {
					$('#cons' + this.tabIndex).html('Ошибка компиляции на ' + e.getErrorLine() + ' строке\n');
				}
				else {
					$('#cons' + this.tabIndex).html('Некорректный код\n');
				}
			}
		},

		prepareForExecuting: function(dontHighlight) {
			var problem = this.tabIndex;
			this.setDefault();
			this.playing = false;
			this.cmdHighlightOff(true);
			this.compileCode()
			this.updateWatchList();
			if (!dontHighlight && nextline[problem] != undefined) {
				codeareas[problem].setLineClass(nextline[problem], 'cm-curline');
			}
		},

		prepareForConversionFromCode: function() {
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
					$('#cons' + this.tabIndex).append(e.message ? e.message : e.toString());
					$('#cons' + this.tabIndex).append('\n');
				}
			} else {
				try {
					var s = this.speed;
					this.speed = 1000;
					this.paused = false;
					if (!this.playing || this.changed) {
						if (!this.playing) {
							var needReturn = this.blocklyExecutor.finished;
							this.setDefault();
							if (needReturn) return;
						}
						var code = this.convertCommandsToCode()
						codeareas[this.tabIndex].setValue(code);
						if (!this.playing) {
							this.prepareForExecuting();
							this.updateInterface('START_EXECUTION');
						} else {
							this.compileCode();
						}
						this.playing = true;
					}
					this.updateInterface('START_EXECUTION');
					this.lastExecutedCmd = undefined;
					this.cmdHighlightOff();
					this.blocklyExecutor.exec(1, {});
					this.changeProgressBar();
					++this.executedCommandsNum;
					this.highlightLast();
					this.executionUnit.draw();
					if (this.blocklyExecutor.finished) {
						this.playing = false;
						this.executionUnit.executionFinished();
					}
					this.speed = s;
				} catch (e) {
					console.error(e);
					console.log(e.stack);
					$('#cons' + this.tabIndex).append(e.message ? e.message : e.toString());
					$('#cons' + this.tabIndex).append('\n');
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
				$('#cons' + this.tabIndex).append(e.message ? e.message : e.toString());
				$('#cons' + this.tabIndex).append('\n');
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

		getState: function() {
			return this.executionUnit.getState();
		},

		needToContinueExecution: function() {
			return !(this.stopped || this.paused || this.executionUnit.isGameOver());
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
		},

        bindUpdated: function() {
        	var problem = this;
        	// setTimeout(function(){
            this.bindData_ = problem.Blockly.bindEvent_(
            	problem.Blockly.mainWorkspace.getCanvas(), 'blocklyWorkspaceChange', problem, problem.updated);
	        // }, 1000);
        },

        unbindUpdated: function() {
            if (!this.bindData_)
                return
            this.Blockly.unbindEvent_(this.bindData_);
            delete this.bindData_;
        },

		resetWorkspace: function() {
			var mainWorkspace = this.Blockly.mainWorkspace;
			var xmlWorkspace = this.Blockly.Xml.workspaceToDom(mainWorkspace);
			mainWorkspace.clear();
			return xmlWorkspace;
		},

		restoreWorkspace: function(xmlWorkspace) {
			mainWorkspace = this.Blockly.mainWorkspace;
			this.Blockly.Xml.domToWorkspace(mainWorkspace, xmlWorkspace);
		}

	});

	var cmdClassToName = {
		'block': 'Block',
		'if': 'Если',
		'ifelse': 'Если...Иначе',
		'while': 'Пока',
		'for': 'Повтор',
		'funcdef': 'Функция'
	};
	var classes = ['block', 'if', 'ifelse', 'while', 'for', 'funcdef'];
	var btnsPlay = ['play', 'next', 'prev'];
	var MAX_VALUE = 999999999999999;
	var MAX_STEP_VALUE = 10000;

	return {
		Problem: Problem,
		classes: classes
	}
});
