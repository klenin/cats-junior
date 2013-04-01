var executionUnits = {
	'ArrowInLabyrinth': ArrowInLabyrinth,
	'Pourer': Pourer
};

var ExecutionUnitWrapper = $.inherit({
	__constructor: function(problem, problemData, div, executionUnitName) {
		this.executionUnit = new executionUnits[executionUnitName](problem, problemData, div);
		this.checkExecutionUnit();
	},

	generateCommands: function(div) {
		this.checkExecutionUnit();
		this.executionUnit.generateCommands(div);
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

	executeCommand: function(command, args) {
		this.checkExecutionUnit();
		this.executionUnit.executeCommand(command, args);	
	},

	gameOver: function() {
		this.checkExecutionUnit();
		this.executionUnit.gameOver();
	},

	getPoints: function() {
		this.checkExecutionUnit();
		return this.executionUnit.getPoints();
	},

	getExecutionUnit: function() {
		return this.executionUnit;
	},

	isCommandSupported: function(command) {
		this.checkExecutionUnit();
		return this.executionUnit.isCommandSupported(command);
	},

	getConditionProperties: function(name) {
		this.checkExecutionUnit();
		return this.executionUnit.getConditionProperties(name);
	},

	getCommands: function() {
		this.checkExecutionUnit();
		return this.executionUnit.getCommands();
	},

	getCssFileName: function() {
		this.checkExecutionUnit();
		return this.executionUnit.getCssFileName();
	},

	addTypesInTree: function(tree) {
		this.checkExecutionUnit();
		
		for (var i = 0; i < this.executionUnit.__self.jsTreeTypes.length; ++i) {
			tree.add_type(this.executionUnit.__self.jsTreeTypes[i][0], this.executionUnit.__self.jsTreeTypes[i][1]);
		}
	},

	onTabSelect: function() {
		this.checkExecutionUnit();
		return this.executionUnit.onTabSelect();
	},

	changePoints: function(delta) {
		this.checkExecutionUnit();
		this.executionUnit.points += delta;
	}
});
