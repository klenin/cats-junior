define('Painter', ['jQuery', 'jQueryUI', 'jQueryInherit', 'ExecutionUnitCommands', 'ShowMessages', 'Declaration', 'Exceptions'], function(){
	var ShowMessages = require('ShowMessages');
	var ExecutionUnitCommands = require('ExecutionUnitCommands');
	var Exceptions = require('Exceptions');
	var IncorrectInput = Exceptions.IncorrectInput;
	var InternalError = Exceptions.InternalError;

	var Message = ShowMessages.Message;

	/*
	var Cell = $.inherit({

	});
	*/

	function movePenTo(args) {
		curProblem.oneStep('movePenTo', undefined, [args[0], args[1], args[2]]);
	}
	function vectorTo(args) {
		curProblem.oneStep('vectorTo', undefined, [args[0], args[1]]);
	}
	
	return {
		Painter: $.inherit({
			__constructor: function(problem, problemData, div) {
				//console.log("NEW",problemData, "\n", problem, "\n", div);

				this.data = {},
				$.extend(true, this.data, problemData.data);

				this.div = div;
				$(this.div).empty();

				this.problem = problem;
				/*
				console.log("problem", this.problem);
				console.log("data", this.data);
				console.log("div", this.div);
				*/
				this.table = $('<table style="border-spacing: 0px; width: 100%; padding: 32px"></table>').appendTo(this.div);

				this.initPainter();
				this.constructCommands();
			},

			constructCommands: function() {
				const {CommandArgumentSpin, CommandArgumentSelect, ExecutionUnitCommand} = ExecutionUnitCommands;
				this.commands = {};

				let args = [ 
					new CommandArgumentSpin(0, this.data.width),
					new CommandArgumentSpin(0, this.data.height),
					new CommandArgumentSelect([['Пишет', true], ['Не пишет', false]])
				];

				this.commands['movePenTo'] = new ExecutionUnitCommand("movePenTo", movePenTo, args);
				this.commands['vectorTo'] = new ExecutionUnitCommand("vectorTo", vectorTo, args);
			},

			initPainter: function() {
				this.width = this.data.width;
				this.height = this.data.height;

				this.blank = this.data.blankSpace !== undefined ? this.data.blankSpace : 3;

				this.stepsFine = this.data.stepsFine;

				this.traceLines = this.data.lines;
				this.start = this.data.penStartPoint !== undefined ? this.data.penStartPoint : [0, 0];

				this.trace = [];
				
				this.fillGrid(this.width, this.height);

				this.map = $(this.table).children('tbody').children('tr').children('td');
				this.mapW = (this.width) * (this.blank + 1) - this.blank;
				this.mapH = (this.height) * (this.blank + 1) - this.blank;

				this.drawTraceLines(this.traceLines);

				let initPenCoord = this.getCoord(this.start[0], this.start[1]);

				this.pen = {
					coord: initPenCoord,
					mode: false
				};

				this.drawPen(this.pen.coord, this.pen.mode);
			},

			fillGrid: function(w, h) {
				$(this.table).empty();

				if (w > 10 || h > 10) {
					var point = $(`<td style="width: 8px; height: 8px" class="tdPoint"></td>`);
					var fill = $(`<td style="width: 8px; height: 8px" class="tdFiller"></td>`);
				} else {
					var point = $(`<td style="width: 16px; height: 16px" class="tdPoint"></td>`);
					var fill = $(`<td style="width: 16px; height: 16px" class="tdFiller"></td>`);
				}

				for (let i = 0; i < h; i++) {
					let row = $('<tr class="trMain"></tr>').appendTo(this.table);

					for (let j = 0; j < w; j++) {
						row.append(point.clone());

						if (j != w - 1) {
							for (let m = 0; m < this.blank; m++) {
								row.append(fill.clone());
							}
						}
					}

					if (i != h - 1) {
						for (let j = 0; j < this.blank; j++) {
							let row = $('<tr class="trFiller"></tr>').appendTo(this.table);
							
							for (let k = 0; k < (w*(this.blank + 1) - this.blank); k++) {
								row.append(fill.clone());
							}
						}
					}
				}
			},

			drawPen: function(coord, mode = this.pen.mode) {
				this.clearPen();

				this.pen.coord = coord;
				this.pen.mode = mode;

				mode = mode ? "penDown" : "penUp";

				this.map[coord].id = mode;
				$(this.map[coord]).append(`<div class=${mode}></div>`);
			},
			clearPen: function() {
				let coord = this.pen.coord;

				$(this.map[coord]).empty();
				$(this.map[coord]).attr('id', '');
			},

			drawTraceLines: function(l) {
				l.map(coord => {
					let x1y1 = this.getCoord(coord[0], coord[1]);
					let x2y2 = this.getCoord(coord[2], coord[3]);

					this.drawTrace(x1y1, x2y2, coord[0] - coord[2] != 0);
				});
			},

			drawTrace: function(c1, c2, vertical, color = "highlight") {
				let c0 = c1;
				c1 = Math.min(c1, c2);
				c2 = Math.max(c0, c2);

				if (vertical) {
					for (let i = c1; i <= c2; i++) {
						if (color === "highlight") {
							if (!$(this.map[i]).hasClass('tdPoint')) {
								$(this.map[i]).addClass('highlightedCell'); 
							}
						} else {
							$(this.map[i]).css('background-color', color);
						}
					}
				} else {
					for (let i = c1; i <= c2; i = i + this.mapW) {
						if (color === "highlight") {
							if (!$(this.map[i]).hasClass('tdPoint')) {
								$(this.map[i]).addClass('highlightedCell');
							}
						} else {
							$(this.map[i]).css('background-color', color);
						}
					}
				}

				color !== "highlight" ?  this.trace.push([c1,c2]) : null;
			},

			movePenTo: function([x, y, mode]) {
				let oldC = this.pen.coord;
				this.drawPen(this.getCoord(x, y), mode);

				let vertical = Math.abs(this.pen.coord - oldC) < this.mapW ? true : false;

				if (mode) {
					this.drawTrace(oldC, this.pen.coord, vertical,'green');
				}
			},
			vectorTo: function([x, y]) {
				let oldC = this.pen.coord;
				let newCoord = oldC + (x*this.blank+x) + ((y*this.blank+y)*this.mapW);

				this.drawPen(newCoord);

				let vertical = Math.abs(newCoord - oldC) < this.mapW ? true : false;
				
				if (this.pen.mode) {
					this.drawTrace(oldC, newCoord, vertical, 'green');
				}
			},

			executeCommand: function(command, args) {
				if (this.data.commands.indexOf(command) === -1) {
					throw new IncorrectInput('Команда ' + command + ' не поддерживается');
				}

				switch (command) {
					case 'movePenTo':
						this.movePenTo(args);
						break;
					case 'vectorTo':
						this.vectorTo(args);
						break;
					default:
						throw new IncorrectInput('No input with ' + command + ' name');
				}

				if (this.data.stepsFine) {
					this.points -= this.data.stepsFine;
					new ShowMessages.MessageStepFine(this.problem.step, this.points);
				}

				this.checkSolve();
			},

			executionFinished: function() {
				if (this.checkSolve()) {
					this.point += this.data.pointsWon;
					new MessageWon(this.problem.step, this.points);
				}
			},

			checkSolve: function() {
				let array = [...this.traceLines].map((item) => {
					return [this.getCoord(item[0], item[1]), this.getCoord(item[2], item[3])];
				});
				
				if (this.trace.length >= this.traceLines.length) {
					for (let i = 0; i < this.traceLines.length; i++) {
						if (this.trace.indexOf(array[i]) == -1) {
							return false;
						};
					}
				}

				return true;
			},

			updateSizes: function() {},
			getCoord: function(x, y) {
				return (x * this.blank + x) + (y * this.mapW * (this.blank + 1));
			},

			getCssFileName: function() { return this.__self.cssFileName },
			onTabSelect: function() {this.updateSizes()}
		},
		{
			cssFileName: 'styles/painter.css',

			cmdClassToName: {
				'movePenTo': 'Передвинуть ручку к координате',
				'vectorTo': 'Передвинуть ручку по вектору'
			}
		})
	};
});
