define('Painter', ['jQuery', 'jQueryUI', 'jQueryInherit', 'ExecutionUnitCommands', 'ShowMessages', 'Declaration', 'Exceptions'], function(){
	var ShowMessages = require('ShowMessages');
	var ExecutionUnitCommands = require('ExecutionUnitCommands');
	var Exceptions = require('Exceptions');
	var IncorrectInput = Exceptions.IncorrectInput;
	var InternalError = Exceptions.InternalError;

	var Message = ShowMessages.Message;

	const penUp = (mode) => { curProblem.oneStep('penUp', undefined, [mode]); }
	const penDown = (mode) => { curProblem.oneStep('penDown', undefined, [mode]); }
	const movePenTo = (newCoord) => { curProblem.oneStep('movePenTo', undefined, [newCoord]); }
	const vectorTo = (vector) => { curProblem.oneStep('vectorTo', undefined, [vector]); }

	/*
	var Cell = $.inherit({

	});
	*/

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
				const {CommandArgumentSpinCounter, ExecutionUnitCommand} = ExecutionUnitCommands;
				this.commands = {};

				let args = [ new CommandArgumentSpinCounter(1, undefined) ];

				this.commands['penUp'] = new ExecutionUnitCommand("penUp", penUp, args);
				this.commands['penDown'] = new ExecutionUnitCommand("penDown", penDown, args);
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

				this.pen = {
					x: this.start[0],
					y: this.start[1],
					mode: false
				}

				this.trace = [];
				
				this.fillGrid(this.width, this.height);

				this.map = $(this.table).children('tbody').children('tr').children('td');
				this.mapW = (this.width) * (this.blank + 1) - this.blank;
				this.mapH = (this.height) * (this.blank + 1) - this.blank;

				this.drawPen(this.pen);
				this.drawTraceLines(this.traceLines);
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

			drawPen: function(pen) {
				let x = pen.x;
				let y = pen.y;

				let mode = pen.mode ? "penDown" : "penUp"
				
				this.map[(y*this.mapW * (this.blank + 1)) + (x*this.blank + x)].id = mode;
				$(this.map[((y*this.mapW * (this.blank + 1)) + (x*this.blank + x))]).append(`<div class=${mode}></div>`);
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
							$(this.map[i]).addClass('highlightedCell'); 
						} else {
							$(this.map[i]).css('background-color', color);
						}
					}
				} else {
					for (let i = c1; i <= c2; i = i + this.mapW) {
						if (color === "highlight") {
							$(this.map[i]).addClass('highlightedCell');
						} else {
							$(this.map[i]).css('background-color', color);
						}
					}
				}
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
		})
	};
});
