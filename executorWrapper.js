var ExecutorWrapper = $.inherit({
	__constructor: function(problem, problemData, div, executorName) {
		this.executor = undefined;
		switch(executorName) {
			case 'arrowInLabyrinth':
				this.executor = new ArrowInLabyrinth(problem, problemData, div);
				break;
			default: 
				console.error('Unknown executor name!!!')
		}
	},

	generateCommands: function(tr) {
		this.checkExecutor();
		this.executor.generateCommands(tr);
	},

	getCommandName: function(command) {
		this.checkExecutor();
		return this.executor.getCommandName(command);
	},

	checkExecutor: function() {
		if (!this.executor) {
			throw "Executor is undefined!!!";
		}
	},

	setDefault: function(dontDraw) {
		this.checkExecutor();
		this.executor.setDefault(dontDraw);
	},

	draw: function() {
		this.checkExecutor();
		this.executor.draw();	
	},

	isDead: function() {
		this.checkExecutor();
		return this.executor.isDead();	
	},

	executeCommand: function(command) {
		this.checkExecutor();
		this.executor.executeCommand(command);	
	},

	heroIsDead: function() {
		this.checkExecutor();
		this.executor.heroIsDead();
	},

	getPoints: function() {
		this.checkExecutor();
		return this.executor.getPoints();
	},

	getExecutor: function() {
		return this.executor;
	}
});
