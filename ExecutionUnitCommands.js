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

var TestFunctionArgument = $.inherit({
	__constructor : function() {
	}
});


var TestFunctionArgumentConst = $.inherit(TestFunctionArgument, {
	__constructor : function(values) {
		this.values = values.clone();
	},

	generateDomObject: function(container, callback, value) {
		select = $('<select class="testFunctionArgument"></select>').appendTo(container);
		for (var i = 0; i < this.values.length; ++i) {
			$(select).append('<option value="' + this.values[i][0] + '">' + this.values[i][1] + '</option><br>');
		}
	
		$(select).change(callback);
		if (value) {
			$(select).val(value);
		}
	},

	findValue: function(value) {
		for (var i = 0; i < this.values.length; ++i) {
			if (this.values[i][0] == value || this.values[i][1] == value) {
				return this.values[i][0];
			}
		}

		return undefined;
	},

	addArguments: function(select, arguments, clear) {
		if (clear) {
			$(select).children(':gt(' + (this.values.length - 1) + ')').remove();
		}

		for (var i = 0; arguments && i < arguments.length; ++i) {
			$(select).append('<option value="' + arguments[i] + '">' + arguments[i] + '</option><br>');
		}
	},

	setValue: function(select, value) {
		$(select).val(value);
	},

	getDomObjectValue: function(select) {
		return $(select).children('option:selected').val();
	}
});

var TestFunctionArgumentInt = $.inherit(TestFunctionArgument, {
		__constructor : function(container, minValue, maxValue) {
		this.__base(container);

		this.minValue = minValue;
		this.maxValue = maxValue;
	}
});

var TestFunctionArgumentString = $.inherit(TestFunctionArgument, {
		__constructor : function(name, type, isCounter, minValue, maxValue) {
		this.name = name;
		this.type = type;
		this.isCounter = isCounter;
		this.minValue = minValue;
		this.maxValue = maxValue;
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
