var ExecutionUnitCommandArgument = $.inherit({
	__constructor : function(name, type, isCounter, minValue, maxValue) {
		this.name = name;
		this.type = type;
		this.isCounter = isCounter;
		this.minValue = minValue;
		this.maxvalue = maxValue;
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
	}
});


var ExecutionUnitCommand = $.inherit({
	__constructor : function(name, handler, args) {
		this.name = name;
		this.translation = translation;
		this.handler = handler;
		this.arguments = args.clone();
	}
});
