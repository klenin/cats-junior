define('ExecutionUnitCommands', ['jQuery', 'jQueryUI', 'jQueryInherit', 'Misc'], function(){

	var CommandArgument = $.inherit({
		__constructor: function(){
			this.domObject = undefined;
			this.value = undefined;
		},

		initializeArgumentDomObject: function(command, index) {
			this.domObject = $(command).children('.testFunctionArgument:eq(' + index + ')');
		},

		updateValueInDomObject: function() {
			if (!this.domObject || this.expression == undefined) {
				throw 'Can\'t update values';
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
				case 'START_COMMAND_EXECUTION':
					$(this.domObject).attr('disabled', 'disabled');
					break;
				case 'FINISH_EXECUTION':
				case 'FINISH_COMMAND_EXECUTION':
					$(this.domObject).removeAttr('disabled');
					break;
			}
		},

		setDefault: function(){
			$(this.domObject).removeAttr('disabled');
		},
	});
	
	var CommandArgumentSelect = $.inherit(CommandArgument, {
		__constructor : function(options, expression, problem) {
			this.options = options.clone();
			this.__base();
			this.expression = expression != undefined ? this.options[0][0] : expression;
			this.problem = problem;
			this.arguments = [];
		},
		
		clone: function() {
			return new CommandArgumentSelect(this.options, this.expression, this.problem);
		},

		generateDomObject: function(prev, callback, problem, value) {
			var select = $('<select class="testFunctionArgument"></select>').insertAfter(prev);
			for (var i = 0; i < this.options.length; ++i) {
				$(select).append('<option value="' + this.options[i][0] + '">' + this.options[i][1] + '</option><br>');
			}
		
			this.callback = callback;
			this.problem = problem;

			this.updateCallbacks();
			if (value) {
				$(select).val(value);
			}

			this.domObject = select;
			return this.domObject;
		},

		initializeArgumentDomObject: function(command, index) {
			this.__base(command, index);
			if (this.domObject.length) {
				this.expression = $(this.domObject).children('option:selected').val();
				this.updateCallbacks();
			}
		},

		updateCallbacks: function() {
			var self = this;
			$(this.domObject).off('change').on('change', function(){
				self.expression = $(this).children('option:selected').val();
				self.problem.updated();	
			});
		},

		findValue: function(value) {
			this.checkIntegrity();
			for (var i = 0; i < this.options.length; ++i) {
				if (this.options[i][0] == value || this.options[i][1] == value) {
					return '\"' + this.options[i][0] + '\"';
				}
			}

			return undefined;
		},

		addArguments: function(args, clear) {
			if (!this.domObject) {
				throw 'Select isn\'t initialized';
			}	
			this.checkIntegrity();
			if (clear) {
				$(this.domObject).children(':gt(' + (this.options.length - 1) + ')').remove();
				this.arguments = [];
			}

			for (var i = 0; args && i < args.length; ++i) {
				$(this.domObject).append('<option value="' + args[i] + '">' + args[i] + '</option><br>');
				this.arguments.push(args[i]);
			}
		},

		checkIntegrity: function() {
			if ($(this.domObject).children('option:selected').val() != this.expression) {
				//throw 'Integrity error!';
			}
		},

		setValue: function(value, afterDomCreation) {
			if (!this.domObject) {
				throw 'Select isn\'t initialized';
			}	
			this.checkIntegrity();
			this.expression = value;
			$(this.domObject).val(value);
		},

		getExpression: function() {
			if (!this.domObject) {
				throw 'Select isn\'t initialized';
			}	
			this.checkIntegrity();
			return this.expression;
		},
		
		getValue: function(args) {
			if (!this.domObject) {
				throw 'Select isn\'t initialized';
			}	
			this.checkIntegrity();
			var value = this.expression;
			return (args == undefined || args[value] == undefined) ? value : args[value];
		},

		setDefault: function(){
			$(this.domObject).removeAttr('disabled');
		},
		
		getDomObjectValue: function(object) {
			return $(object).children('option:selected').val();
		}
	});
	
	var CommandArgumentSpin = $.inherit(CommandArgument, {
			__constructor : function(minValue, maxValue, expression, arguments, argumentValues, problem) {
			this.__base();
			this.minValue = minValue;
			this.maxValue = maxValue;
			this.isCounter = false;
			this.expression = expression != undefined ? expression : minValue;
			this.arguments = arguments ? arguments.clone() : [];
			this.argumentValues = argumentValues ? argumentValues : {};
			this.problem = problem;
		},

		initializeArgumentDomObject: function(command, index) {
			this.__base(command, index);
			if (this.domObject.length) {
				this.expression = $(this.domObject).children('.spinExpression').val();
				this.updateCallbacks();
			}
		},

		clone: function() {
			return new CommandArgumentSpin(this.minValue, this.maxValue, this.expression, this.arguments, this.argumentValues, this.problem);
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

			$(this.domObject).children('.spinExpression').off('click').on('change', function() {
				self.onUpdateTotal();
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
			if(!isInt(value)  && !isInt(parseInt(value)) || value < this.minValue || value > this.maxValue)
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
	
		getExpression: function() {
			return this.expression;
		},

		getExpressionValueByArgs: function(args) {
			var value = this.expression;
			var result = (args == undefined || args[value] == undefined) ? value : args[value];
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
			$(this.domObject).children('.spinValue').show().val(this.getValue(this.argumentValues));
		},

		showBtn: function() {
			$(this.domObject).children('img').show();
			$(this.domObject).children('.spinExpression').show();
			$(this.domObject).children('.spinValue').hide();
		},

		setDefault: function(){
			this.showBtn();
		},

		startExecution: function(current) {
			/*var currentValue = this.getValue(this.argumentValues);
			if (!isInt(currentValue) || currentValue < 0) {
				throw 'Некорректный счетчик';
			}*/

			this.hideBtn();
		},

		stopExecution: function() {
			this.showBtn();
		},

		updateInterface: function(newState){
			switch (newState) {
				case 'START_COMMAND_EXECUTION':
				case 'START_EXECUTION':
					this.startExecution();
					break;
				case 'STOP_COMMAND_EXECUTION':
				case 'FINISH_EXECUTION':
					this.stopExecution();
					break;
			}
		},

		getDomObjectValue: function(object) {
			return $(object).children('.spinExpression').val();
		},

		setArgumentValues: function(argumentValues) {
			this.argumentValues = $.extend(true, {}, argumentValues);
		}
	});	

	var CommandArgumentSpinCounter = $.inherit(CommandArgumentSpin, {
			__constructor : function(minValue, maxValue, expression, arguments, argumentValues, problem)  {
			this.__base(minValue, maxValue, expression, arguments, argumentValues, problem);
			this.isCounter = true;
			this.value = undefined;
		},

		clone: function() {
			return new CommandArgumentSpinCounter(this.minValue, this.maxValue, this.expression, this.arguments, this.argumentValues, this.problem);
		},

		setDefault: function() {
			this.__base();
			this.value = undefined;
		},

		hideBtn: function(cnt) {
			this.__base();
			if (this.value == undefined) {
				this.value = this.getValue(this.argumentValues);
			}
			$(this.domObject).children('.spinValue').val(this.value + '/' + this.getExpressionValueByArgs(this.argumentValues));
		},

		getValue: function(args) {
			return this.value != undefined ? this.value : this.__base(args);
		},

		getCounterValue: function() {
			return this.value;
		},

		decreaseValue: function() {
			if (this.value == undefined) {
				this.value = this.getValue(this.argumentValues);
			}

			if (!isInt(this.value) || this.value < 0) {
				throw 'Некорректный счетчик';
			}

			--this.value;
			$(this.domObject).children('.spinValue').val(this.value + '/' + this.getExpressionValueByArgs(this.argumentValues));
		}
	});	

	var CommandArgumentInput = $.inherit(CommandArgument, {
		__constructor : function() {
			this.__base();
		},
		
		clone: function() {
			return new CommandArgumentInput();
		},

		generateDomObject: function(prev, callback, problem, value) {
			var input = $('<input class="testFunctionArgument"></input>').insertAfter(prev);
		
			if (value) {
				$(input).val(value);
			}
			$(input).change(function() {
				callback();
			});

			this.domObject = input;
			return this.domObject;
		},

		setValue: function(value, afterDomCreation) {
			if (!this.domObject) {
				throw 'Input isn\'t initialized';
			}	
			this.value = value;
			$(this.domObject).val(value);
		},

		getExpression: function() {
			if (!this.domObject) {
				throw 'Input isn\'t initialized';
			}	
			var value = $(this.domObject).val();
			if (isInt(value)) {
				return parseInt(value);
			}
			return '\"' + value + '\"';
		},
		
		getValue: function(args) {
			if (!this.domObject) {
				throw 'Input isn\'t initialized';
			}	
			var value = $(this.domObject).val();
			if (args != undefined && args[value] != undefined) {
				return args[value];
			}
			if (checkNumber(value)) {
				return parseInt(value);
			}
			return '\"' + value + '\"';
		},
	
		getDomObjectValue: function(object) {
			return $(object).val();
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