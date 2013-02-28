var Vessel = $.inherit({
	__constructor: function(color, capacity, initFilled, div) {
		this.color = color;
		this.capacity = this.capacity;
		this.initFilled = initFilled;
		this.filled = this.initFilled;
		this.div = div;
		this.init();
	},

	getCell: function(row) {
		return $(this.div).children('table').children('tr').children('td:eq(' + row + ')');
	},

	init: function() {
		$(this.div).append('<table><table>');
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
		for (var i = 0; i < $(this.div).children('table').children('tr').length) {
			var color = i < this.capacity - this.filled ? '#FFFFFF' : this.color;
			this.getCell(i).css({'background-color': color});
		}
	}
});

var Pourer = $.inherit({
	__constructor: function(problem, problemData, div) {
		this.data = {};
		$.extend(true, this.data, problemData.data);
		this.div = div;
		$(this.div).empty();
		this.problem = problem;
		$('<div">all data will be here</div>')
			.appendTo(this.div);
		this.constructCommands();
		this.vessels = [];
		this.init();
	},

	constructCommands: function() {
		this.commands = [];
		var args = [
			new ExecutionUnitCommandArgument('src', 'int', false, 1, this.data.vessels.length - 1),
			new ExecutionUnitCommandArgument('dst', 'int', false, 1, this.data.vessels.length - 1)];
		var pourCmd = new ExecutionUnitCommand('pour', pour, args);
		this.commands.push(pourCmd);
	},

	init: function() {
		$(this.div).append('<table><tr></tr></table>');
		this.row = $(this.div).children('tr');
			.appendTo($(this.div));
		for (var i = 0; i < this.data.vessels.length) {
			var cell = $('<td></td>')
				.appendTo($(this.row));
			this.vessels.push(new Vessel(this.data.vessels[i].color, 
				this.data.vessels[i].capacity, 
				this.data.vessels[i].initFilled, 
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

	executeCommand: function(command, arguments) {
		if (this.data.commands.indexOf(command) === -1) {
			throw 'Invalid command';
		}
		this.oneStep(command, arguments);
	},

	oneStep: function() {
	},

	gameOver: function() {
		this.checkExecutionUnit();
		this.executionUnit.gameOver();
	},

	getPoints: function() {
		this.checkExecutionUnit();
		return this.exexecutionUnitecutor.getPoints();
	},

	getExecutionUnit: function() {
		return this.executionUnit;
	},

	isCommandSupported: function(command) {
		this.checkExecutionUnit();
		return this.executionUnit.isCommandSupported(command);
	},

	getConditionProperties: function() {
		this.checkExecutionUnit();
		return this.executionUnit.getConditionProperties();
	},

	getCommands: function() {
		this.checkExecutionUnit();
		return this.commands;
	},

	getCssFileName: function() {
		this.checkExecutionUnit();
		return this.executionUnit.getCssFileName();
	}
},
{
	cmdClassToName: {
		'pour': 'Перелить'
	},
	testFunction : {
		'name': 'compare',
		'args': [
			[],
			[['<', '<'], ['>', '>'], ['<=', '<='], ['>=', '>='], ['==', '=='], ['!=', '!=']],
			[]
		],
		'jsFunc': compare,
		'handlerFunc': compare_handler,
	},

	cssFileName: "styles/pourer.css"
});

