/*
Problem: 
	array with description of vessels:
	[{color, capacity}]
*/
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
	},

	constructCommands: function() {
		this.commands = [];
		var args = [
			new ExecutionUnitCommandArgument('src', int, false, 1, this.data.vessels.length - 1),
			new ExecutionUnitCommandArgument('dst', int, false, 1, this.data.vessels.length - 1)];
		var pourCmd = new ExecutionUnitCommand('pour', pour, args);
		this.commands.push(pourCmd);
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
		this.checkExecutionUnit();
		return this.executionUnit.getCommandName(command);
	},

	checkExecutionUnit: function() {
		if (!this.executionUnit) {
			throw "Executor is undefined!!!";
		}
	},

	setDefault: function(dontDraw) {
		this.checkExecutionUnit();
		this.executionUnit.setDefault(dontDraw);
	},

	draw: function() {
		this.checkExecutionUnit();
		this.executionUnit.draw();	
	},

	isDead: function() {
		this.checkExecutionUnit();
		return this.executionUnit.isDead();	
	},

	executeCommand: function(command) {
		this.checkExecutionUnit();
		this.executionUnit.executeCommand(command);	
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
		return this.executionUnit.getCommands();
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

	commands: [
		['pour', pour]
	],

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

