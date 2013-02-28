var ExecutionUnitCommandArgument = $.inherit({
	__constructor : function(name, type, isCounter, minValue, maxValue) {
		this.name = name;
		this.type = type;
		this.isCounter = isCounter;
		this.minValue = minValue;
		this.maxValue = maxValue;
	},
	
	setValue: function(value) {
		this.value = value;
		this.currentValue = value;
	},

	setCurrentValue: function(value) {
		this.currentValue = value;
	},

	setDefault: function() {
		this.currentValue = this.value;
	},

	copy: function() {
		return new ExecutionUnitCommandArgument(this.name, this.type, this.isCounter, this.minValue, this.maxValue);
	}
	
});


var ExecutionUnitCommand = $.inherit({
	__constructor : function(name, handler, args) {
		this.name = name;
		this.handler = handler;
		this.arguments = args.clone();
	},
	
	getArguments: function() {
		return this.arguments;
	}
});
