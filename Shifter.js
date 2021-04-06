define('Shifter', ['jQuery', 'jQueryUI', 'jQueryInherit', 'ExecutionUnitCommands', 'ShowMessages', 'Declaration', 'Exceptions'], function(){
	var ShowMessages = require('ShowMessages');
	var ExecutionUnitCommands = require('ExecutionUnitCommands');
	var Exceptions = require('Exceptions');
	var IncorrectInput = Exceptions.IncorrectInput;
	var InternalError = Exceptions.InternalError;

	var Message = ShowMessages.Message;
	
	var Pyramid = $.inherit({
		
		__constructor: function(rings, index, div){
			this.rings = rings;
			this.initRings = rings;
			this.div = div;
			this.index = index;
			
			this.init(); 
		},
		
		init: function() {
			
			let td = $('<td class="base" align="center"></td>');

			for (let j = 0; j < 8; j++) td.append('<tr style = "height:21px"; width = "100%"></tr>');
			
			let ring_size = 30 * this.rings;
			 for (let i = 5; i > (5 - this.rings); i--){
				td.children("tr").eq(i).append('<div style="height:20px; width:' + String(ring_size) + 'px; background-color:red; border:red solid 0.1px; border-radius:75px"</div>');
				ring_size -= 15;
			};   
						
			$('#FieldPyr').append(td);
			
			
		},
		
		setDefault: function(dontDraw) {
				this.rings = this.initRings;
			},
			
		draw: function(x) {
	
			let sup_str1 = $('#FieldPyr').find("td").eq(x).find("div").eq(0).css('width');
			let sup_str2 = $('#FieldPyr').find("td").eq(this.index).find("div").eq(0).css('width');
			
			let sup_bool = false;
			
			if (String(sup_str1).length < String(sup_str2).length) sup_bool = true;
			else if ((sup_str1 < sup_str2) && (String(sup_str1).length == String(sup_str2).length)) sup_bool = true;
			
			if (sup_bool || (!($('#FieldPyr').find("td").eq(this.index).find("div").length))){
				 
			$('#FieldPyr').find("td").eq(this.index).find("tr").eq(6 - this.rings).append($('#FieldPyr').find("td").eq(x).find("div").eq(0));
			
			} else throw new IncorrectInput('Кольцо на ' + String(x + 1) + ' пирамидке больше,\nчем колько на ' + String(this.index + 1) + ' пирамидке');
			
			},
			
		
		shiftTo: function(delta) {
			this.rings--;
		},

		shiftFrom: function(delta) {
			this.rings++;
		},
		
		
	});
	function shift(x, y) {
			curProblem.oneStep('shift', undefined, [x, y]);
		}
	

		
	
	function compareRings(args){
		
		if (args.length != 4 || !checkNumber(args[1]) || !checkNumber(args[3])) {
			throw new IncorrectInput('Некорректный список аргументов');
		}
		
		var first = args[1] - 1;
		var comparator = args[2];
		var second = args[3] - 1;
		var result = false;

		switch(comparator) {
			case '<':
				result = curProblem.executionUnit.getExecutionUnit().isLessPyramid(first, second);
				break;
			case '>':
				result = curProblem.executionUnit.getExecutionUnit().isGreaterPyramid(first, second);
				break;
			}

			if (args[0] == 'not')
				result = !result;

			return result;
		} 

	function compareRingsHandler(first, comparator, second){
		
		if (!checkNumber(first) || !checkNumber(second)) {
			throw new IncorrectInput('Некорректный аргумент');
		}
		
		first -= 1;
		comparator = comparator.v;
		second -= 1;

		switch(comparator) {
			case '<':
				return curProblem.executionUnit.getExecutionUnit().isLessPyramid(first, second);
			case '>':
				return curProblem.executionUnit.getExecutionUnit().isGreaterPyramid(first, second);
		}

		return false;
	} 
		
	var MessageWon = $.inherit(Message, {
		__constructor: function(step, points) {
			this.__base(['Шаг ', step + 1, ': Вы выполнили задание!\nКоличество очков: ', points, '\n' ]);
		}
	});
	
	return {
		Shifter: $.inherit({
			__constructor: function(problem, problemData, div) {
				this.data = {};
				$.extend(true, this.data, problemData.data);
				this.div = div;
				$(this.div).empty();
				this.problem = problem;
				this.constructCommands();
				this.pyramids = [];
				this.init();
			},
			
			constructCommands: function() {
					this.commands = {};
					
					let argP = [ 
					new ExecutionUnitCommands.CommandArgumentSpin(1, 3),
					new ExecutionUnitCommands.CommandArgumentSpin(1, 3)
				];
					
					this.commands['shift'] = new ExecutionUnitCommands.ExecutionUnitCommand('shift', shift,argP);

					var pyramidsList = [];
					for (var i = 0; i < this.data.pyramids.length; ++i) {
						pyramidsList.push([i + 1, i + 1]);
					}

					this.testFunction = [
					
					{
						'name': 'compareRings',
						'title': 'Cравнение:',
						'args': [
							new ExecutionUnitCommands.CommandArgumentSelect(pyramidsList),
							new ExecutionUnitCommands.CommandArgumentSelect([['<', '<'], ['>', '>']]),
							new ExecutionUnitCommands.CommandArgumentSelect(pyramidsList),
						]  ,
						'jsFunc': compareRings,
						'handlerFunc': compareRingsHandler,  
					}]
				},
				
				init: function() {
					
					let table = $('<table id = "TableShift" style = "width:100%; height: 170px"></table>').appendTo(this.div);
					let tr = $('<tr id="FieldPyr" style = "height: 170px"></tr>').appendTo(table);
					
					for (var i = 0; i < this.data.pyramids.length; ++i)	this.pyramids.push(new Pyramid(this.data.pyramids[i].rings, i, this.div));
					
					this.points = this.data.startPoints;
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
					
					for (var i = 0; i < this.pyramids.length; ++i) {
						this.pyramids[i].setDefault();
					};
					$('#TableShift').remove();
					this.init();

					this.points = this.data.startPoints;
				},

		
				
				
				executeCommand: function(command, args) {
					if (this.data.commands.indexOf(command) === -1) {
						throw new IncorrectInput('Команда ' + command + ' не поддерживается');
					}

					switch (command) {
						case 'shift':
							this.shift(args);
							break;
						default:
							throw new IncorrectInput('Команда ' + command + ' не поддерживается');
					}

					if (this.data.stepsFine){
						this.points -= this.data.stepsFine;
						var mes = new ShowMessages.MessageStepFine(this.problem.step, this.points);
					}
				},

				executionFinished: function(){
					if (this.isSolved()) {
						this.points += this.data.pointsWon;
						var mes = new MessageWon(this.problem.step, this.points);
					}
				},

				shift: function(args) {
					var x = args[0] - 1;
					var y = args[1] - 1;
					if (!checkNumber(x) || !checkNumber(y)) {
						throw new IncorrectInput('Некорректный аргумент');
					}
					if (!this.pyramids[x]) {
						throw new IncorrectInput('Нет пирамидки с номером "' + args[0] + '"');
					}
					if (!this.pyramids[y]) {
						throw new IncorrectInput('Нет пирамидки с номером "' + args[1] + '"');
					}
					
					
					if ((!($('#FieldPyr').find("td").eq(this.pyramids[x].index).find("div").length))) {
						throw new IncorrectInput('На пирамидке "' + args[0] + '" нет колец');
					}
					
					this.pyramids[x].shiftTo();
					this.pyramids[y].shiftFrom();
					this.pyramids[y].draw(x);
				},
				
				isSolved: function() {
					for (var i = 0; i < this.data.finishState.length; ++i) {
						var pyramid = this.data.finishState[i].pyramid;
						if (this.pyramids[pyramid].rings != this.data.finishState[i].rings) {
							return false;
						}
					}
					return true;
				},
				
				isLessPyramid: function(first,second) {
					return $('#FieldPyr').find("td").eq(this.pyramids[first].index).find("div").eq(0).css('width') < $('#FieldPyr').find("td").eq(this.pyramids[second].index).find("div").eq(0).css('width')
				},
				
				isGreaterPyramid: function(first,second) {
					return $('#FieldPyr').find("td").eq(this.pyramids[first].index).find("div").eq(0).css('width') > $('#FieldPyr').find("td").eq(this.pyramids[second].index).find("div").eq(0).css('width')
				},
				
				isGameOver: function() {
					return this.dead;
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
				
				onTabSelect: function() {
					return;
				}
		},
		
		{
			cmdClassToName: {
				'shift': 'Переместить'
				},

				cssFileName: "styles/shifter.css",

				jsTreeTypes: [
				['shift', 'images/shift.png']
				]
		})
	};
	
});