var Vessel = $.inherit({
	__constructor: function(color, capacity, initFilled, isEndless, div) {
		this.color = color;
		this.capacity = capacity;
		this.initFilled = initFilled;
		this.filled = initFilled;
		this.isEndless = isEndless;
		this.div = div;
		this.init();
	},

	getCell: function(row) {
		return $(this.div).children('table').children('tbody').children('tr').children('td:eq(' + row + ')');
	},

	init: function() {
		$(this.div).append('<table style="border-color: ' + this.color + '; border-style: solid"></table>');
		for (var i = 0; i < this.capacity; ++i) {
			$(this.div).children('table').append('<tr><td></td></tr>');
			this.getCell(i).css({'width': '50px', 'height': '10px'});
			if (i >= this.capacity - this.initFilled) {
				this.getCell(i).css({'background-color': this.color});
			}
		}
	},

	setDefault: function(dontDraw) {
		this.filled = this.initFilled;
	},

	draw: function() {
		for (var i = 0; i < $(this.div).children('table').children('tbody').children('tr').length; ++i) {
			var color = i < this.capacity - this.filled ? '#FFFFFF' : this.color;
			this.getCell(i).css({'background-color': color});
		}
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
	}
});

var Pourer = $.inherit({
	__constructor: function(problem, problemData, div) {
		this.data = {};
		$.extend(true, this.data, problemData.data);
		this.div = div;
		$(this.div).empty();
		this.problem = problem;
		$('<div>all data will be here</div>').appendTo($(this.div));
		this.constructCommands();
		this.vessels = [];
		this.init();
	},

	constructCommands: function() {
		this.commands = {};
		var args = [
			new ExecutionUnitCommandArgument('src', 'int', false, 1, this.data.vessels.length - 1),
			new ExecutionUnitCommandArgument('dst', 'int', false, 1, this.data.vessels.length - 1)];
		this.commands['pour'] = new ExecutionUnitCommand('pour', pour, args);
		this.commands['pourOut'] = new ExecutionUnitCommand('pourOut', pourOut, 
			[new ExecutionUnitCommandArgument('vessel', 'int', false, 1, this.data.vessels.length - 1)]);
		this.commands['fill'] = new ExecutionUnitCommand('fill', fill, 
			[new ExecutionUnitCommandArgument('vessel', 'int', false, 1, this.data.vessels.length - 1)]);

		var vesselsList = [];
		for (var i = 0; i < this.data.vessels.length; ++i) {
			vesselsList.push([i, i + 1]);
		}

		this.testFunction = {
			'name': 'compare',
			'args': [
				vesselsList,
				[['<', '<'], ['>', '>'], ['<=', '<='], ['>=', '>='], ['==', '=='], ['!=', '!=']],
				vesselsList
			],
			'jsFunc': compare,
			'handlerFunc': compare_handler,
		}
	},

	init: function() {
		$(this.div).append('<table><tr></tr></table>');
		this.row = $(this.div).children('table').children('tbody').children('tr');
		for (var i = 0; i < this.data.vessels.length; ++i) {
			var cell = $('<td valign="bottom"></td>').appendTo($(this.row));
			this.vessels.push(new Vessel(this.data.vessels[i].color, 
				this.data.vessels[i].capacity, 
				this.data.vessels[i].initFilled, 
				this.data.vessels[i].isEndless,
				cell)
			);			
		}
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
							onCreateItem(this, newNode, $('#' + dclass + problem.tabIndex).attr('rel'), problem);
						}, dclass != 'funcdef'); 
					problem.updated();
				}
			}(divclass, this.__self.cmdClassToName[divclass], this.problem));
		}
	},

	getCommandName: function(command) {
		return this.__self.cmdClassToName[command];
	},

	setDefault: function(dontDraw) {
		for (var i = 0; i < this.vessels.length; ++i) {
			this.vessels[i].setDefault();
		}

		if (!dontDraw) {
			this.draw();
		}
	},

	draw: function() {
		for (var i = 0; i < this.vessels.length; ++i) {
			this.vessels[i].draw();
		}
	},

	isDead: function() {
		return false; // can user loose?
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

		this.draw();
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

			if (this.problem.speed) {
				this.vessels[src].draw();
				this.vessels[dest].draw();
			}
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
		//
	},

	getPoints: function() {
		//
	},

	isCommandSupported: function(command) {
		return this.data.commands.indexOf(command) !== -1
	},

	getConditionProperties: function() {
		return this.testFunction;
	},

	getCommands: function() {
		return this.commands;
	},

	getCssFileName: function() {
		return this.__self.cssFileName;
	},

	isLess: function(first, second) {
		return this.vessels[first] < this.vessels[second];
	},

	isEqual: function(first, second) {
		return this.vessels[first] == this.vessels[second];
	},

	isFinished: function() {
		var finished = true;
		for (var i = 0; i < this.data.finishState.length; ++i) {
			var vessel = this.data.finishState[i].vessel;
			finished = finished && (this.vessels[vessel].filled == this.data.finishState[i].filled);
		}
		return finished;
	}
},
{
	cmdClassToName: {
		'pour': 'Перелить',
		'pourOut': 'Вылить',
		'fill': 'Заполнить'
	},

	cssFileName: "styles/pourer.css"
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
	if (args.length != 3) {
		throw 'Invalid arguments list!!';
	}

	var first = args[0];
	var comparator = args[1];
	var second = args[2];

	switch(comparator) {
		case '<':
			return curProblem.getExecutionUnit().isLess(first, second);
		case '>':
			return curProblem.getExecutionUnit().isLess(second, first);
		case '<=':
			return curProblem.getExecutionUnit().isLess(first, second) || curProblem.getExecutionUnit().isEqual(first, second);
		case '>=':
			return curProblem.getExecutionUnit().isLess(second, first) || curProblem.getExecutionUnit().isEqual(first, second);
		case '==':
			return curProblem.getExecutionUnit().isEqual(first, second);
		case '!=':
			return !curProblem.getExecutionUnit().isEqual(first, second);			
	}

	return false;
}

function compare_handler(first, comparator, second){
	switch(comparator) {
		case '<':
			return curProblem.getExecutionUnit().isLess(first, second);
		case '>':
			return curProblem.getExecutionUnit().isLess(second, first);
		case '<=':
			return curProblem.getExecutionUnit().isLess(first, second) || curProblem.getExecutionUnit().isEqual(first, second);
		case '>=':
			return curProblem.getExecutionUnit().isLess(second, first) || curProblem.getExecutionUnit().isEqual(first, second);
		case '==':
			return curProblem.getExecutionUnit().isEqual(first, second);
		case '!=':
			return !curProblem.getExecutionUnit().isEqual(first, second);			
	}

	return false;
}

