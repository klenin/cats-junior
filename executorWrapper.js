var executionUnits = {
	'arrowInLabyrinth': ArrowInLabyrinth
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

	getExecutor: function() {
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
});
