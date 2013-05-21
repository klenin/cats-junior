define('Exceptions', ['jQuery', 'jQueryInherit'], function(){
	var MyException = $.inherit(Error, {
		__constructor: function(name, message) {
			this.message = message;
			this.name = name ? name : 'MyException';
		},

		toString: function() {
			return 'Exception ' + this.name + ', message: ' + this.message;
		}
	});

	var IncorrectProblemData = $.inherit(MyException, {
		__constructor: function(message) {
			this.__base('IncorrectProblemData', message);
		}
	});

	var IncorrectInput = $.inherit(MyException, {
		__constructor: function(message) {
			this.__base('IncorrectInput', message);
		}
	});

	var InternalError = $.inherit({
		__constructor: function(message) {
			this.__base('InternalError', 'Something went wrong, please provide reproduce sequence and this message to the author. ' + message);
		}
	});

	return {
		IncorrectProblemData: IncorrectProblemData,
		IncorrectInput: IncorrectInput,
		InternalError: InternalError
	}
});