define('ExecutionUnitCommands', ['jQuery', 'jQueryUI', 'jQueryInherit', 'Misc'], function(){
	var Exceptions = require('Exceptions');
	var IncorrectInput = Exceptions.IncorrectInput;
	var InternalError = Exceptions.InternalError;

	var CommandArgument = $.inherit({
		__constructor: function(expression, arguments, problem){
			this.domObject = undefined;
			this.arguments = arguments ? arguments.clone() : [];
			this.problem = problem;
		},

		initializeArgumentDomObject: function(command, index) {
			this.domObject = $(command).children('.testFunctionArgument:eq(' + index + ')');
		},

		updateValueInDomObject: function() {
			if (!this.domObject || this.expression == undefined) {
				throw new InternalError('updateValueInDomObject: Can\'t update values');
			}

			this.setValue(this.expression);
		},

		addArguments: function() {
			return;
		},

		findValue: function() {
			return;
		},

		updateInterface: function(newState){
			switch (newState) {
				case 'START_EXECUTION':
					$(this.domObject).attr('disabled', 'disabled');
					$(this.domObject).children().attr('disabled', 'disabled');
					break;
				case 'FINISH_EXECUTION':
					$(this.domObject).removeAttr('disabled');
					$(this.domObject).children().removeAttr('disabled');
					break;
			}
		},

		setDefault: function(){
			$(this.domObject).removeAttr('disabled');
			$(this.domObject).children().removeAttr('disabled');
		},

		getExpression: function() {
			return this.expression;
		},

		getDomObjectValue: function(object) {
			return undefined;
		},

		getArgumentValue: function(args, argName) {
			if (args != undefined && args[argName] != undefined) {
				return args[argName];
			}
			return this.problem.findArgValue(argName);
		}
	});
	
	var CommandArgumentSelect = $.inherit(CommandArgument, {
		__constructor : function(options, expression, arguments, problem) {
			this.options = options.clone();
			this.__base(expression, arguments, problem);
			this.expression = expression != undefined ? this.options[0][0] : expression;
		},
		
		clone: function() {
			return new CommandArgumentSelect(this.options, this.expression, this.arguments, this.problem);
		},

		generateDomObject: function(prev, callback, problem, value) {
			var container = $('<span class = "testFunctionArgument"></span>').insertAfter(prev);
			var select = $('<select class = "selectExpression"></select>').appendTo(container);

			for (var i = 0; i < this.options.length; ++i) {
				$(select).append('<option value="' + this.options[i][0] + '">' + this.options[i][1] + '</option><br>');
			}

			var valueInput = $('<input class = "selectValue"></input>').appendTo(container);
			$(valueInput).hide();
		
			this.callback = callback;
			this.problem = problem;

			this.domObject = container;
			this.updateCallbacks();

			if (this.arguments && this.arguments.length) {
				this.addArguments(this.arguments, true);
			}
			
			if (value) {
				this.setValue(value);
			}
			return this.domObject;
		},

		initializeArgumentDomObject: function(command, index) {
			this.__base(command, index);
			if (this.domObject.length) {
				this.expression = $(this.domObject).children('select').children('option:selected').val();
				this.updateCallbacks();
			}
		},

		updateCallbacks: function() {
			var self = this;
			$(this.domObject).children('select').off('change').on('change', function(){
				self.expression = $(this).children('select').children('option:selected').val();
				self.problem.updated();	
			});
		},

		updateInterface: function(newState){
			this.__base(newState);
			switch (newState) {
				case 'START_EXECUTION':
					$(this.domObject).children('select').hide();
					var value = this.getValue();
					for (var i = 0; i < this.options.length; ++i) {
						if (this.options[i][0] == value || this.options[i][1] == value) {
							value = this.options[i][1];
							break;
						}
					}
					$(this.domObject).children('input').val(value);
					$(this.domObject).children('input').show();
					break;
				case 'FINISH_EXECUTION':
					$(this.domObject).children('input').hide();
					$(this.domObject).children('select').show();
					break;
			}
		},

		findValue: function(value) {
			for (var i = 0; i < this.options.length; ++i) {
				if (this.options[i][0] == value || this.options[i][1] == value) {
					return '\"' + this.options[i][0] + '\"';
				}
			}

			return undefined;
		},

		addArguments: function(args, clear) {
			if (clear) {
				$(this.domObject).children('select').children(':gt(' + (this.options.length - 1) + ')').remove();
				this.arguments = [];
			}

			for (var i = 0; args && i < args.length; ++i) {
				$(this.domObject).children('select').append('<option value="' + args[i] + '">' + args[i] + '</option><br>');
				this.arguments.push(args[i]);
			}
		},

		setValue: function(value, afterDomCreation) {
			this.expression = value;
			$(this.domObject).children('select').val(value);
		},
	
		getValue: function(args) {
			var value = this.expression;
			var result = this.getArgumentValue(args, value);
			return result == undefined ? value : result;
		},

		getDomObjectValue: function(object) {
			return $(object).children('select').children('option:selected').val();
		}
	});
	
	var CommandArgumentSpin = $.inherit(CommandArgument, {
		__constructor : function(minValue, maxValue, expression, arguments, problem) {
			this.__base(undefined, arguments, problem);
			this.minValue = minValue;
			this.maxValue = maxValue;
			this.isCounter = false;
			this.expression = expression != undefined ? expression : minValue;
		},

		initializeArgumentDomObject: function(command, index) {
			this.__base(command, index);
			if (this.domObject.length) {
				this.expression = $(this.domObject).children('.spinExpression').val();
				this.updateCallbacks();
			}
		},

		clone: function() {
			return new CommandArgumentSpin(this.minValue, this.maxValue, this.expression, this.arguments, this.problem);
		},	

		generateDomObject: function(prev, callback, problem, value) {
			var spin = $('<spin class="testFunctionArgument"></spin>').insertAfter($(prev));
			this.domObject = spin;
			this.expression = value != undefined ? value : this.minValue;
			$(spin).append('<input class="spinExpression" value="' + this.expression + '" editable="false"></input>');
			$(spin).append('<input class="spinValue" value="' + this.expression + '" editable="false"></input>');
			$(spin).children('.spinValue').hide();
			$(spin).append('<img src="images/spin-button.png" style="position: relative; top: 4px">');
			this.problem = problem;
			this.updateCallbacks();
			return this.domObject;
		},

		updateCallbacks: function() {
			var self = this;
			$(this.domObject).children('img').off('click').on('click', function(e){
				var pos = e.pageY - $(this).offset().top;
				var vector = ($(this).height()/2 > pos ? 1 : -1);

				self.onSpinImgClick(vector);
			});

			$(this.domObject).children('.spinExpression').off('input').on('input', function() {
				var newValue = $(this).val();
				if (checkNumber(newValue)) {
					self.onUpdateTotal(parseInt($(this).val()));
				}
				else {
					self.onUpdateTotal($(this).val());
				}
			});
		},

		searchArgument: function(arg) {
			if (!this.arguments) {
				return undefined;
			}
			for (var i = 0; i < this.arguments.length; ++i) {
				if (arg == this.arguments[i]) {
					return i;
				}
			}
			return undefined;
		},

		calculateNewExpression: function(delta) {
			var newExpression = undefined;
			if (checkNumber(this.expression)) {
				newExpression = parseInt(this.expression) + parseInt(delta);
			}
			else {
				var argIndex = this.searchArgument(this.expression);
				if (argIndex == undefined) { //we didn't find expression in arguments list, do nothing
					return undefined;
				}
				else {
					newExpression = -argIndex + parseInt(delta);
				}
			}
			return newExpression;
		},

		onSpinImgClick: function(delta) {
			var newExpression = this.calculateNewExpression(delta);
			if (newExpression == undefined) {
				return;
			}

			return this.onUpdateTotal(newExpression);
		},

		onUpdateTotal: function(newExpression) {
			if (newExpression < this.minValue) {
				newExpression = this.arguments.length ? this.arguments[Math.min(this.minValue - newExpression, this.arguments.length) - 1] : this.minValue;
			}
			else if (newExpression > this.maxValue) {
				newExpression = this.maxValue;
			}
			this.setExpression(newExpression);
			this.problem.updated();
			return false;
		},

		findValue: function(value) {
			if(!checkNumber(value) || value < this.minValue || value > this.maxValue)
				return undefined;
			return value;
		},

		addArguments: function(args, clear) {
			this.arguments = args.clone();
		},

		setExpression: function(newExpression) {
			this.expression = newExpression;
			$(this.domObject).children('.spinExpression').val(this.expression);
		},

		setValue: function(value, afterDomCreation) {
			this.setExpression(value);
		},

		getExpressionValueByArgs: function(args) {
			var value = this.expression;
			var result = this.getArgumentValue(args, value);
			if (result == undefined) {
				result = value;
			}
			if (checkNumber(result)) {
				return parseInt(result);
			}
			return result;
		},

		getValue: function(args) {
			return this.getExpressionValueByArgs(args);
		},

		hideBtn: function(cnt) {
			$(this.domObject).children('img').hide();
			$(this.domObject).children('.spinExpression').hide();
			$(this.domObject).children('.spinValue').show().val(this.getValue());
		},

		showBtn: function() {
			$(this.domObject).children('img').show();
			$(this.domObject).children('.spinExpression').show();
			$(this.domObject).children('.spinValue').hide();
		},

		setDefault: function(){
			this.showBtn();
		},

		updateInterface: function(newState){
			this.__base(newState);
			switch (newState) {
				case 'START_EXECUTION':
					this.hideBtn();
					break;
				case 'FINISH_EXECUTION':
					this.showBtn();
					break;
			}
		},

		getDomObjectValue: function(object) {
			return $(object).children('.spinExpression').val();
		}
	});	

	var CommandArgumentSpinCounter = $.inherit(CommandArgumentSpin, {
			__constructor : function(minValue, maxValue, expression, arguments, problem)  {
			this.__base(minValue, maxValue, expression, arguments, problem);
			this.isCounter = true;
			this.value = undefined;
		},

		clone: function() {
			return new CommandArgumentSpinCounter(this.minValue, this.maxValue, this.expression, this.arguments, this.problem);
		},

		setDefault: function() {
			this.__base();
			this.value = undefined;
		},

		hideBtn: function(cnt) {
			this.__base();
			if (this.value == undefined) {
				this.value = this.getValue();
			}
			if (this.value != undefined) {
				$(this.domObject).children('.spinValue').val(this.value + '/' + this.getExpressionValueByArgs());
			}
			else {
				$(this.domObject).children('.spinValue').val(this.getExpressionValueByArgs());
			}
		},

		getValue: function(args) {
			var result = this.value;
			if (result == undefined) {
				result = this.__base(args);
			}
			if (!checkNumber(result)) {
				return undefined;
			}
			return parseInt(result);
		},

		getCounterValue: function(args) {
			if (this.value == undefined) {
				this.value = this.getValue(args);
			}
			return this.value;
		},

		decreaseValue: function() {
			if (this.value == undefined) {
				this.value = this.getValue();
			}

			if (!isInt(this.value) || this.value < 0) {
				throw new IncorrectInput('Некорректный счетчик');
			}

			--this.value;
			$(this.domObject).children('.spinValue').val(this.value + '/' + this.getExpressionValueByArgs());
		}
	});	

	var CommandArgumentInput = $.inherit(CommandArgument, {
		__constructor : function() {
			this.__base();
			this.value = undefined;
		},
		
		clone: function() {
			return new CommandArgumentInput();
		},

		generateDomObject: function(prev, callback, problem, value) {
			var container = $('<span class="testFunctionArgument"></span>').insertAfter(prev);
			var input = $('<input class = "inputExpression"></input>').appendTo(container);
			var inputValue = $('<input class = "inputValue"></input>').appendTo(container);
			$(inputValue).hide();

			this.domObject = container;
			
			if (value) {
				this.setValue(value);
			}
			$(container).children('.inputExpression').change(function() {
				callback();
			});
			
			return this.domObject;
		},

		setValue: function(value, afterDomCreation) {
			this.value = value;
			$(this.domObject).children('.inputExpression').val(value);
		},

		returnValue: function(value) {
			if (checkNumber(value)) {
				return parseInt(value);
			}

			return value;
		},

		findValue: function() {
			if (checkNumber(this.value) || checkName(this.value)) {
				return this.value;
			}
			return '\"' + this.value + '\"';
		},

		getExpression: function() {
			return this.returnValue(this.value);
		},
		
		getValue: function(args) {
			var value = $(this.domObject).children('.inputExpression').val();
			var result = this.getArgumentValue(args, value);

			if (result != undefined) {
				return result;
			}
			
			var argValue = this.getArgumentValue(value);
			if (argValue != undefined) {
				return argValue;
			}

			return this.returnValue(value);
		},
	
		updateInterface: function(newState){
			this.__base(newState);
			switch (newState) {
				case 'START_EXECUTION':
					$(this.domObject).children('.inputExpression').hide();
					var value = this.getValue();
					$(this.domObject).children('.inputValue').val(value);
					$(this.domObject).children('.inputValue').show();
					break;
				case 'FINISH_EXECUTION':
				$(this.domObject).children('.inputValue').hide();
					$(this.domObject).children('.inputExpression').show();
					break;
			}
		},

		getDomObjectValue: function(object) {
			return $(object).children('.inputExpression').val();
		}
	});

	var ExecutionUnitCommand = $.inherit({
		__constructor: function(name, handler, args) {
			this.name = name;
			this.handler = handler;
			this.arguments = args.clone();
			this.hasCounter = false;

			for (var i = 0; i < args.length; ++i) {
				if (args[i].isCounter) {
					this.hasCounter = true;
					break;
				}
			}
		},
		
		getArguments: function() {
			return this.arguments;
		}
	});

	return{
		CommandArgumentSelect: CommandArgumentSelect,
		CommandArgumentSpin: CommandArgumentSpin,
		CommandArgumentSpinCounter: CommandArgumentSpinCounter,
		CommandArgumentInput: CommandArgumentInput,
		ExecutionUnitCommand: ExecutionUnitCommand
	};
});