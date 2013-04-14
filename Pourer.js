define('Pourer', 
	function(require){
		var ExecutionUnitCommands = require('ExecutionUnitCommands');
		var ShowMessages = require('ShowMessages');
		var Message = ShowMessages.Message;
		var CylinderModule = require('Cylinder');
		var Declaration = require('Declaration');

		var Vessel = $.inherit({
			__constructor: function(capacity, initFilled, isEndless, div, maxCapacity) {
				this.capacity = capacity;
				this.initFilled = initFilled;
				this.filled = initFilled;
				this.isEndless = isEndless;
				this.div = div;
				this.maxCapacity = maxCapacity;
				this.init();
			},

			getCell: function(row) {
				return $(this.vesselBg);
			},

			init: function() {
				/*var vesselHeight = (241 * (this.capacity / this.maxCapacity));
				var circleHeight = (34 * (this.capacity / this.maxCapacity));
				var bottomHeight = (14 * (this.capacity / this.maxCapacity));
				
				this.vesselDiv = $('<div style="background: url(\'images/vessel_bg.png\') no-repeat; background-size: 84px ' + vesselHeight
					 + 'px; width: 84px; height: ' + vesselHeight + 'px; position: absolute;"></div>').appendTo($(this.div));

				this.vesselBg = $('<div style = "background: url(\'images/water_bg.png\'); width: 95%; position: relative; z-index: 2"></div>').appendTo($(this.vesselDiv));
				this.circle = $('<div style = "background: url(\'images/circle.png\') no-repeat; background-size: 84px ' + circleHeight
					 + 'px; width: 95%; height: ' + circleHeight + 'px; position: absolute; z-index: 4"></div>').appendTo($(this.div));
				this.bottom = $('<div style = "background: url(\'images/bottom.png\') no-repeat; background-size: 84px ' + bottomHeight
					 + 'px; width: 95%; height: ' + bottomHeight + 'px; position: absolute; z-index: 3"></div>').appendTo($(this.div));

				$(this.vesselBg).css({'height': ((this.initFilled / this.maxCapacity) * 100) + '%'});*/

				this.title = $('<div style="position: absolute;"></div>').appendTo(this.div);

				this.vesselDiv = $('<div style="float:left;border:0px solid black; width:150px; height:400px; position: absolute"></div>').appendTo($('body'));

				var self = this;

				$(this.vesselDiv).svg({
					onLoad: function (svg) { 
						self.svg = svg;
						/*makeCylinder(svg, {
							inner: 300 * (self.initFilled + 0.0)/ self.maxCapacity, 
							outer: 300 * (self.capacity + 0.0) / self.maxCapacity, 
							red:0.5, 
							green:1.0, 
							blue:1.0
						});
						$(self.vesselDiv).hide();*/
					}
				});
				/*
				$(this.vesselDiv).cylinder({
					  colors: {
					    container: {
					      fill: '#e5e5e5',
					      stroke: '#dcdada'
					    },
					    fluid: {
					      fill: '#0051A6',
					      stroke: '#003974'
					    }
					  },
					  value: (this.initFilled + 0.0) / this.maxCapacity
					});*/
			},

			setDefault: function(dontDraw) {
				this.filled = this.initFilled;
			},

			draw: function() {
				$(this.vesselDiv).css({'top': $(this.div).position().top});
				$(this.vesselDiv).show();

				makeCylinder(this.svg, {
					inner: 300 * (this.filled + 0.0)/ this.maxCapacity, 
					outer: 300 * (this.capacity + 0.0) / this.maxCapacity, 
					red:0.5, 
					green:1.0, 
					blue:1.0
				});

				/*if (!this.cylinder) {
					this.cylinder = new Cylinder(this.svg, );
				}
				else {
					this.cylinder.update(300 * (this.filled + 0.0)/ this.maxCapacity);
				}
				/*if (this.filled == 0) {
					$(this.bottom).hide();
					$(this.circle).hide();
				}
				else {
					$(this.bottom).show();
					$(this.bottom).css({'top': $(this.vesselDiv).position().top + $(this.vesselDiv).height() - $(this.bottom).height(),
						'left': $(this.vesselDiv).position().left})
				}
				
				if (this.filled < this.capacity) {
					$(this.vesselBg).css({'height': (this.filled / this.capacity) * $(this.vesselDiv).height() - $(this.bottom).height() + 'px', 'top': $(this.vesselDiv).height() * (1 - (this.filled / this.capacity))});		
					if (this.filled != 0) {
						$(this.circle).show();
					}
					$(this.circle).css({'top': Math.min(
						$(this.vesselBg).position().top + $(this.vesselDiv).position().top - $(this.circle).height() / 2, 
						$(this.bottom).position().top - $(this.circle).height() / 2), 
						'left': $(this.vesselDiv).position().left});
				}
				else {
					$(this.circle).show();
					$(this.bottom).show();
					$(this.vesselBg).css({'height': $(this.vesselDiv).height() - $(this.bottom).height() - $(this.circle).height() / 2 + 'px', 'top': $(this.circle).height() / 2 + 'px'});	
					$(this.circle).css({'top': $(this.vesselDiv).position().top, 'left': $(this.vesselDiv).position().left});
				}*/

				$(this.title).css({'top': $(this.vesselDiv).position().top + $(this.vesselDiv).height() + 15,
					'left': $(this.vesselDiv).position().left});
				$(this.title).html(this.filled + '/' + this.capacity);
				//$(this.vesselDiv).cylinder('value', (this.filled + 0.0) / this.maxCapacity);
				
			},

			pourTo: function(delta) { //we pour from this vessel to another
				if (!this.isEndless) {
					this.filled -= delta;
				}
			},

			pourFrom: function(delta) {//we fill current vessel
				this.filled += delta;
			},

			pourOut: function() {
				if (this.isEndless) {
					throw 'Can\'t pour out endless vessel!!!';
				}
				this.filled = 0;
			},

			fill: function() {
				this.filled = this.capacity;
			},

			getBottom: function() {
				return this.getTop() + $(this.vesselDiv).height();
			},

			getTop: function() {
				return $(this.vesselDiv).position().top;
			},

			setBottom: function(bottom) {
				$(this.vesselDiv).css('top', bottom - $(this.vesselDiv).height());
			},
			
			setLeft: function(left) {
				$(this.vesselDiv).css('left', left);
			},

			getDivLeft: function() {
				return $(this.div).position().left;
			},

			getWidth: function() {
				return $(this.vesselDiv).width(); 
			},

			hide: function() {
				$(this.vesselDiv).hide();
			},

			show: function() {
				this.draw();
			}
		});

		function pour(src, dst) {
			curProblem.oneStep('pour', undefined, [src, dst]);
		}

		function pourOut(vessel) {
			curProblem.oneStep('pourOut', undefined, [vessel]);
		}

		function fill(vessel) {
			curProblem.oneStep('fill', undefined, [vessel]);
		}

		function compare(args){
			if (args.length != 4) {
				throw 'Invalid arguments list!!';
			}

			var vessel = args[1] - 1;
			var comparator = args[2];
			var value = args[3];
			var result = false;

			switch(comparator) {
				case '<':
					result = curProblem.executionUnit.getExecutionUnit().isLess(vessel, value);
					break;
				case '>':
					result = curProblem.executionUnit.getExecutionUnit().isGreater(vessel, value);
					break;
				case '<=':
					result = curProblem.executionUnit.getExecutionUnit().isLess(vessel, value) || curProblem.getExecutionUnit().isEqual(vessel, value);
					break;
				case '>=':
					result = curProblem.executionUnit.getExecutionUnit().isGreater(vessel, value) || curProblem.getExecutionUnit().isEqual(vessel, value);
					break;
				case '==':
					result = curProblem.executionUnit.getExecutionUnit().isEqual(vessel, value);
					break;
				case '!=':
					result = !curProblem.executionUnit.getExecutionUnit().isEqual(vessel, value);			
					break;
			}

			if (args[0] == 'not')
				result = !result;

			return result;
		}

		function compare_handler(vessel, comparator, value){
			vessel -= 1;
			comparator = comparator.v;

			switch(comparator) {
				case '<':
					return curProblem.executionUnit.getExecutionUnit().isLess(vessel, value);
				case '>':
					return curProblem.executionUnit.getExecutionUnit().isGreater(vessel, value);
				case '<=':
					return curProblem.executionUnit.getExecutionUnit().isLess(vessel, value) || 
						curProblem.getExecutionUnit().isEqual(vessel, value);
				case '>=':
					return curProblem.executionUnit.getExecutionUnit().isGreater(vessel, value) || 
						curProblem.getExecutionUnit().isEqual(vessel, value);
				case '==':
					return curProblem.executionUnit.getExecutionUnit().isEqual(vessel, value);
				case '!=':
					return !curProblem.executionUnit.getExecutionUnit().isEqual(vessel, value);			
			}

			return false;
		}

		function checkFilled(args){
			if (args.length != 4) {
				throw 'Invalid arguments list!!';
			}

			var first = args[1] - 1;
			var comparator = args[2];
			var second = args[3] - 1;
			var result = false;

			switch(comparator) {
				case '<':
					result = curProblem.executionUnit.getExecutionUnit().isLessVessel(first, second);
					break;
				case '>':
					result = curProblem.executionUnit.getExecutionUnit().isGreaterVessel(first, second);
					break;
				case '<=':
					result = curProblem.executionUnit.getExecutionUnit().isLessVessel(first, second) || 
						curProblem.getExecutionUnit().isEqualVessel(first, second);
					break;
				case '>=':
					result = curProblem.executionUnit.getExecutionUnit().isGreaterVessel(first, second) || 
						curProblem.getExecutionUnit().isEqualVessel(first, second);
					break;
				case '==':
					result = curProblem.executionUnit.getExecutionUnit().isEqualVessel(first, second);
					break;
				case '!=':
					result = !curProblem.executionUnit.getExecutionUnit().isEqualVessel(first, second);			
					break;
			}

			if (args[0] == 'not')
				result = !result;

			return result;
		}

		function checkFilledHandler(first, comparator, second){
			first -= 1;
			comparator = comparator.v;
			second -= 1;

			switch(comparator) {
				case '<':
					return curProblem.executionUnit.getExecutionUnit().isLessVessel(first, second);
				case '>':
					return curProblem.executionUnit.getExecutionUnit().isGreaterVessel(first, second);
				case '<=':
					return curProblem.executionUnit.getExecutionUnit().isLessVessel(first, second) || 
						curProblem.getExecutionUnit().isEqualVessel(first, second);
				case '>=':
					return curProblem.executionUnit.getExecutionUnit().isGreaterVessel(first, second) || 
						curProblem.getExecutionUnit().isEqualVessel(first, second);
				case '==':
					return curProblem.executionUnit.getExecutionUnit().isEqualVessel(first, second);
				case '!=':
					return !curProblem.executionUnit.getExecutionUnit().isEqualVessel(first, second);			
			}

			return false;
		}

		var MessageWon = $.inherit(Message, {
			__constructor: function(step, points) {
				this.__base(['Шаг ', step + 1, ': Вы выполнили задание! Количество очков: ', points, '\n' ]);
			}
		});
		
		return {
			Pourer: $.inherit({
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
						new ExecutionUnitCommands.ExecutionUnitCommandArgument('src', 'int', false, 1, this.data.vessels.length),
						new ExecutionUnitCommands.ExecutionUnitCommandArgument('dst', 'int', false, 1, this.data.vessels.length)];
					this.commands['pour'] = new ExecutionUnitCommands.ExecutionUnitCommand('pour', pour, args);
					this.commands['pourOut'] = new ExecutionUnitCommands.ExecutionUnitCommand('pourOut', pourOut, 
						[new ExecutionUnitCommands.ExecutionUnitCommandArgument('vessel', 'int', false, 1, this.data.vessels.length)]);
					this.commands['fill'] = new ExecutionUnitCommands.ExecutionUnitCommand('fill', fill, 
						[new ExecutionUnitCommands.ExecutionUnitCommandArgument('vessel', 'int', false, 1, this.data.vessels.length)]);

					var vesselsList = [];
					for (var i = 0; i < this.data.vessels.length; ++i) {
						vesselsList.push([i + 1, i + 1]);
					}

					this.testFunction = [
					{
						'name': 'compare',
						'args': [
							new ExecutionUnitCommands.TestFunctionArgumentConst(vesselsList),
							new ExecutionUnitCommands.TestFunctionArgumentConst([['<', '<'], ['>', '>'], ['<=', '<='], ['>=', '>='], ['==', '=='], ['!=', '!=']]),
							new ExecutionUnitCommands.TestFunctionArgumentInt(0, undefined)
						],
						'jsFunc': compare,
						'handlerFunc': compare_handler,
					},
					{
						'name': 'checkFilled',
						'args': [
							new ExecutionUnitCommands.TestFunctionArgumentConst(vesselsList),
							new ExecutionUnitCommands.TestFunctionArgumentConst([['<', '<'], ['>', '>'], ['<=', '<='], ['>=', '>='], ['==', '=='], ['!=', '!=']]),
							new ExecutionUnitCommands.TestFunctionArgumentConst(vesselsList),
						],
						'jsFunc': checkFilled,
						'handlerFunc': checkFilledHandler,
					}]
				},

				init: function() {
					$(this.div).append('<table><tr></tr></table>');
					this.row = $(this.div).children('table').children('tbody').children('tr');

					var maxCapacity = 0; 

					for (var i = 0; i < this.data.vessels.length; ++i) {
						maxCapacity = Math.max(this.data.vessels[i].capacity, maxCapacity);
					}
					
					for (var i = 0; i < this.data.vessels.length; ++i) {
						var cell = $('<td valign="bottom"></td>').appendTo($(this.row));
						this.vessels.push(new Vessel(this.data.vessels[i].capacity, 
							this.data.vessels[i].initFilled, 
							this.data.vessels[i].isEndless,
							cell,
							maxCapacity )
						);			
					}

					this.life = this.data.startLife;
					this.points = this.data.startPoints;
					this.dead = false;
				},

				generateCommands: function(div) {
					for (var i = 0; i < this.data.commands.length; ++i) {
						if (!this.__self.cmdClassToName[this.data.commands[i]]) {
							throw 'Unknown command!!!';
						}
						var divclass = this.data.commands[i];
						var j = this.problem.tabIndex;
						$(div).append('<td>' + 
										'<div id="' + divclass + j + '" class="' + divclass + '  jstree-draggable" type = "' + 
											divclass + '" rel = "' + divclass + '" title = "' + this.__self.cmdClassToName[divclass] + '">' + 
										'</div>' + 
									'</td>');

						$('#' + divclass + j).bind('dblclick', function(dclass, dname, problem){
							return function() {
								if ($(this).prop('ifLi')) {
									return;
								}
								$("#jstree-container" + problem.tabIndex).jstree("create", false,  "last", 
										{'data': (dclass == 'funcdef') ? ('func_' + problem.numOfFunctions) : dname}, function(newNode){
										InterfaceJSTree.onCreateItem(this, newNode, $('#' + dclass + problem.tabIndex).attr('rel'), problem);
									}, dclass != 'funcdef'); 
								problem.updated();
							}
						}(divclass, this.__self.cmdClassToName[divclass], this.problem));
					}
				},

				onTabSelect: function() {
					this.draw();
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
					var maxBottom = 0;
					for (var i = 0; i < this.vessels.length; ++i){
						maxBottom = Math.max(maxBottom, this.vessels[i].getBottom());
					}
					
					for (var i = 0; i < this.vessels.length; ++i) {
						this.vessels[i].setLeft(this.vessels[i].getDivLeft() + i * this.vessels[i].getWidth());
						this.vessels[i].setBottom(maxBottom);
						this.vessels[i].draw();
					}
				},

				isDead: function() {
					return this.dead; // can user loose?
				},

				executeCommand: function(command, args) {
					if (this.data.commands.indexOf(command) === -1) {
						throw 'Invalid command';
					}

					switch (command) {
						case 'pour':
							this.pour(args);
							break;
						case 'pourOut': 
							this.pourOut(args);
							break;
						case 'fill':
							this.fill(args);
							break;
						default:
							throw 'Invalid command!!!';
					}

					if (this.data.stepsFine){
						this.points -= this.data.stepsFine;
						var mes = new ShowMessages.MessageStepFine(this.problem.step, this.points);
					}

					this.draw();
					if (this.isFinished()) {
						this.points += this.data.pointsWon;
						var mes = new MessageWon(this.problem.step, this.points);
					}
				},

				pour: function(args) {
					var src = args[0] - 1;
					var dest = args[1] - 1;

					try {
						if (src == dest) { //is it an error?
							return;
						}
						
						if (this.vessels[src].filled == 0 || this.vessels[dest].capacity == this.vessels[dest].filled) {
							return;
						}

						var delta = Math.min(this.vessels[dest].capacity - this.vessels[dest].filled, this.vessels[src].filled);
						this.vessels[src].pourTo(delta);
						this.vessels[dest].pourFrom(delta);

						/*if (this.problem.speed) {
							this.vessels[src].draw();
							this.vessels[dest].draw();
						}*/
					}
					catch (err) {
						throw 'Invalid command!';
					}
				},

				pourOut: function(args) {
					var vessel = args[0] - 1;
					try {
						this.vessels[vessel].pourOut();
					}
					catch (err) {
						throw 'Invalid command!';
					}
					
				},

				fill: function(args) {
					var vessel = args[0] - 1;
					try {
						this.vessels[vessel].fill();
					}
					catch (err) {
						throw 'Invalid command!';
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
					if (name == undefined) {
						return this.testFunction;
					}

					for (var i = 0; i < this.testFunction.length; ++i) {
						if (this.testFunction[i].name == name) {
							return this.testFunction[i];
						}
					}

					return undefined;
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
				
				isFinished: function() {
					var finished = true;
					for (var i = 0; i < this.data.finishState.length; ++i) {
						var vessel = this.data.finishState[i].vessel;
						finished = finished && (this.vessels[vessel].filled == this.data.finishState[i].filled);
					}
					return finished;
				},

				onTabSelected: function(problemId) {
					if (problemId != this.problem.tabIndex) {
						this.hide();
					}
					else {
						this.show();
					}
				},

				hide: function() {
					for (var i = 0; i < this.vessels.length; ++i) {
						this.vessels[i].hide();
					}
				},

				show: function() {
					for (var i = 0; i < this.vessels.length; ++i) {
						this.vessels[i].show();
					}
				},
				
				getState: function() {
					var result = {};
					result.vessels = [];

					for (var i = 0; i < this.vessels.length; ++i){
						results.push(this.vessels[i].filled);
					}
					result.isFinished = this.isFinished();
					result.points = this.points;

					return result;
				}
			},
			{
				cmdClassToName: {
					'pour': 'Перелить',
					'pourOut': 'Вылить',
					'fill': 'Заполнить'
				},

				cssFileName: "styles/pourer.css",

				jsTreeTypes: [
					['pour', 'images/pour_small.png'],
					['pourOut', 'images/pourOut_small.png'],
					['fill', 'images/fill_small.png']
				]
			})
	};
});
