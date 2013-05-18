define('ExecutionUnitWrapper', ['jQuery', 
	'jQueryUI', 
	'jQueryInherit',
	'Pourer',
	'ArrowInLabyrinth'], function(){
	var ArrowInLabyrinthModule = require('ArrowInLabyrinth');
	var PourerModule = require('Pourer');

	var ArrowInLabyrinth = ArrowInLabyrinthModule.ArrowInLabyrinth;
	var Pourer = PourerModule.Pourer;
	
	var Exceptions = require('Exceptions');
	var IncorrectInput = Exceptions.IncorrectInput;
	var InternalError = Exceptions.InternalError;

	var executionUnits = {
		'ArrowInLabyrinth': ArrowInLabyrinth,
		'Pourer': Pourer
	};

	return {
		ExecutionUnitWrapper: $.inherit({
			__constructor: function(problem, problemData, container, executionUnitName) {
				this.executionUnit = new executionUnits[executionUnitName](problem, problemData, container);
				this.checkExecutionUnit();
			},

			checkExecutionUnit: function() {
				if (!this.executionUnit) {
					throw new InternalError('Execution unit is undefined');
				}
			},

			getCommandsToBeGenerated: function() {
				this.checkExecutionUnit();
				var commands = [];
				for (className in this.executionUnit.getCommandNames()) {
					if (!(this.executionUnit.getAllowedCommands() && this.executionUnit.getAllowedCommands().indexOf(className) == -1)) {
						commands.push({
							'commandClass': className,
							'commandName': this.executionUnit.getCommandName(className)
						});
					}
				}
				return commands;
			},

			getCommandName: function(command) {
				this.checkExecutionUnit();
				return this.executionUnit.getCommandName(command);
			},

			setDefault: function(dontDraw) {
				this.checkExecutionUnit();
				this.executionUnit.setDefault(dontDraw);
			},

			draw: function() {
				this.checkExecutionUnit();
				this.executionUnit.draw();	
			},

			isGameOver: function() {
				this.checkExecutionUnit();
				return this.executionUnit.isGameOver();	
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
				
				var conditionProperties = this.executionUnit.getConditionProperties();
				if (!name) {
					return conditionProperties;
				}
				for (var i = 0; i < conditionProperties.length; ++i) {
					if (conditionProperties[i].name == name) {
						return conditionProperties[i];
					}
				}
				return undefined;
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
			},

			onTabSelected: function(problemId) {
				this.checkExecutionUnit();
				this.executionUnit.onTabSelected(problemId);
			},

			getState: function() {
				this.checkExecutionUnit();
				this.executionUnit.getState();
			},

			executionFinished: function() {
				this.checkExecutionUnit();
				this.executionUnit.executionFinished();
			}
		})
	};
});
