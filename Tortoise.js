define('Tortoise',
	function(require){
		var ExecutionUnitCommands = require('ExecutionUnitCommands');
		var ShowMessages = require('ShowMessages');
		var Message = ShowMessages.Message;
		var CylinderModule = require('Cylinder');
		var Declaration = require('Declaration');

		var Exceptions = require('Exceptions');
		var IncorrectInput = Exceptions.IncorrectInput;
		var InternalError = Exceptions.InternalError;
		var singleStep = 10;
		
		var Vessel = $.inherit({
			__constructor: function(capacity, initFilled, div, maxCapacity, index) {
				this.capacity = capacity;
				this.initFilled = initFilled;
				this.filled = initFilled;
				this.div = div;
				this.maxCapacity = maxCapacity;
				this.init(index);
			},

			getCell: function(row) {
				return $(this.vesselBg);
			},

			init: function(index) {
				var table = $('<table></table>').appendTo(this.div);

				var con = $('<canvas>').appendTo(this.con);
				this.vesselDiv = $('<div></div>').appendTo(td);

				$(this.vesselDiv).cylinder({
					  height: 300 * (this.capacity + 0.0)/ this.maxCapacity,
					  value: (this.initFilled + 0.0) / this.maxCapacity
				});
			},

			setDefault: function(dontDraw) {
				this.filled = this.initFilled;
			},

			draw: function() {
				$(this.vesselDiv).cylinder('value', (this.filled + 0.0) / this.maxCapacity);
				$(this.state).html(this.filled + '/' + this.capacity);
			},
		});
		return {
			Tortoise: $.inherit({
				__constructor: function(problem, problemData, div) {
					this.data = {};
					$.extend(true, this.data, problemData.data);
					this.div = div;
					$(this.div).empty();
					this.problem = problem;
					this.constructCommands();
					this.vessels = [];
					this.init();
				},

				constructCommands: function() {
					this.commands = {};
					var args = [
						new ExecutionUnitCommands.CommandArgumentSpin(1, this.data.vessels.length, false),
						new ExecutionUnitCommands.CommandArgumentSpin(1, this.data.vessels.length, false),
						new ExecutionUnitCommands.CommandArgumentSpin(1, this.data.vessels.length, false)];
					this.commands['GoLineLeft'] = new ExecutionUnitCommands.ExecutionUnitCommand('GoLineLeft', GoLineLeft, args);
					this.commands['GoLineRight'] = new ExecutionUnitCommands.ExecutionUnitCommand('GoLineRight', GoLineRight, args);
					this.commands['GoLineUp'] = new ExecutionUnitCommands.ExecutionUnitCommand('GoLineUp', GoLineUp, args);
					this.commands['GoLineDown'] = new ExecutionUnitCommands.ExecutionUnitCommand('GoLineDown', GoLineDown, args);
					var vesselsList = [];
					for (var i = 0; i < this.data.vessels.length; ++i) {
						vesselsList.push([i + 1, i + 1]);
					}

				},

				init: function() {
					$(this.div).append('<canvas>');
					//this.row = $(this.div).children('canvas');

					var maxCapacity = 0;

					this.life = this.data.startLife;
					this.points = this.data.startPoints;
					this.dead = false;
				},

				getAllowedCommands: function() {
					return this.data.commands;
				},

				getCommandNames: function() {
					return this.__self.cmdClassToName;
				},

				getCommandName: function(command) {
					return this.__self.cmdClassToName[command];
				},

				setDefault: function(dontDraw) {
					for (var i = 0; i < this.vessels.length; ++i) {
						this.vessels[i].setDefault();
					}

					this.life = this.data.startLife;
					this.points = this.data.startPoints;
					this.dead = false;

					if (!dontDraw) {
						this.draw();
					}
				},

				draw: function() {
					for (var i = 0; i < this.vessels.length; ++i) {
						this.vessels[i].draw();
					}
				},

				isGameOver: function() {
					return this.dead; // can user loose?
				},

				executeCommand: function(command, args) {
					if (this.data.commands.indexOf(command) === -1) {
						throw new IncorrectInput('Команда ' + command + ' не поддерживается');
					}

					switch (command) {
						case 'GoLineLeft':
							this.GoLineLeft(args);
							break;
						case 'GoLineRight':
							this.GoLineRight(args);
							break;
						case 'GoLineUp':
							this.GoLineUp(args);
							break;
						case 'GoLineDown':
							this.GoLineUp(args);
							break;
						default:
							throw new IncorrectInput('Команда ' + command + ' не поддерживается');
					}

					if (this.data.stepsFine){
						this.points -= this.data.stepsFine;
						var mes = new ShowMessages.MessageStepFine(this.problem.step, this.points);
					}

					this.draw();
				},

				executionFinished: function(){
					if (this.isSolved()) {
						this.points += this.data.pointsWon;
						var mes = new MessageWon(this.problem.step, this.points);
					}
				},

				GoLineLeft: function(args) {
					var Xcords = args[0];
					var Ycords = args[1];
					var move = args[2];

					if (!checkNumber(move)) {
						throw new IncorrectInput('Некорректный аргумент');
					}
					else{
						for (i = Xcords;i < Xcords + move*singleStep; i = i + singleStep) {
							context.strokeRect(i, Ycords, singleStep, singleStep);
							context.fillRect(i, Ycords, singleStep, singleStep);
						} 
					}
				},

				GoLineRight: function(args) {
					var Xcords = args[0];
					var Ycords = args[1];
					var move = args[2];
					
					if (!checkNumber(move)) {
						throw new IncorrectInput('Некорректный аргумент');
					}
					else{
						for (i = Xcords;i > Xcords - move * singleStep; i = i-singleStep) {
							context.strokeRect(Ycords, i, singleStep, singleStep);
							context.fillRect(Ycords, i, singleStep, singleStep);
						}
						
					}
				},

				GoLineUp: function(args) {
					var Xcords = args[0];
					var Ycords = args[1];
					var move = args[2];
					
					if (!checkNumber(move)) {
						throw new IncorrectInput('Некорректный аргумент');
					}
					else{
							for (i = Ycords;i > Ycords ; i = i-singleStep) {
								context.strokeRect(Xcords, i, singleStep, singleStep);
								context.fillRect(Xcords, i, singleStep, singleStep);
							} 					
					}
				},
				
				GoLineDown: function(args) {
					var Xcords = args[0];
					var Ycords = args[1];
					var move = args[2];
					
					if (!checkNumber(move)) {
						throw new IncorrectInput('Некорректный аргумент');
					}
					else{
						for (i = Ycords;i < Ycords + move * singleStep; i = i+singleStep) {
							context.strokeRect(Xcords, i, singleStep, singleStep);
							context.fillRect(Xcords, i, singleStep, singleStep);
						}
					}
				},
			
				gameOver: function() {
					this.dead = true;
				},

				getPoints: function() {
					return this.points;
				},

				isCommandSupported: function(command) {
					return this.data.commands.indexOf(command) !== -1
				},

				getConditionProperties: function(name) {
					return this.testFunction;
				},

				getCommands: function() {
					return this.commands;
				},

				getCssFileName: function() {
					return this.__self.cssFileName;
				},

				isLess: function(vessel, value) {
					return this.vessels[vessel].filled < value;
				},

				isEqual: function(vessel, value) {
					return this.vessels[vessel].filled == value;
				},

				isGreater: function(vessel, value) {
					return this.vessels[vessel].filled > value;
				},

				isLessVessel: function(first, second) {
					return this.vessels[first].filled < this.vessels[second].filled;
				},

				isEqualVessel: function(first, second) {
					return this.vessels[first].filled == this.vessels[second].filled;
				},

				isGreaterVessel: function(first, second) {
					return this.vessels[first].filled > this.vessels[second].filled;
				},

				isSolved: function() {
					for (var i = 0; i < this.data.finishState.length; ++i) {
						var vessel = this.data.finishState[i].vessel;
						if (this.vessels[vessel].filled != this.data.finishState[i].filled) {
							return false;
						}
					}
					return true;
				},

				getState: function() {
					var result = {};
					result.vessels = [];

					for (var i = 0; i < this.vessels.length; ++i){
						results.push(this.vessels[i].filled);
					}
					result.isSolved = this.isSolved();
					result.points = this.points;

					return result;
				},

				onTabSelect: function() {
					return;
				}
			},
			{
				cmdClassToName: {
					'GoLineLeft': 'Влево',
					'GoLineRight': 'Вправо',
					'GoLineUp': 'Вверх',
					'GoLineDown': 'Вниз',
				},

				cssFileName: "styles/Tortoise.css",

			})
		};
	});
	