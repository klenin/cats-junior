define('Exceptions', ['jQuery', 'jQueryInherit'], function(){
	var MyException = $.inherit(Error, {
		__constructor: function(name, message) {
			this.message = message;
			this.name = name ? name : 'MyException';
		}
	});

	var IncorrectProblemDataException = $.inherit(MyException, {
		__constructor: function(message) {
			this.__base('IncorrectProblemDataException', message);
		}
	});

	var IncorrectCommandFormat = $.inherit(MyException, {
		__constructor: function(message) {
			this.__base('IncorrectCommandFormat');
		}

	});

	return {
		IncorrectProblemDataException: IncorrectProblemDataException,
		IncorrectCommandFormat: IncorrectCommandFormat
	}

});


