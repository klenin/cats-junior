var Message = $.inherit({
	__constructor: function(params) {
		this.params = params;
		this.showMessage();
	},
	showMessage: function(){
		for (var i = 0; i < this.params.length; ++i)
			$('#cons' + curProblem.tabIndex).append(this.params[i]);
	}
});

var MessageStepFine = $.inherit(Message, {
	__constructor: function(step, pnts) {
		this.__base(['Шаг ', step + 1, ': Штраф за шаг \n', 'Текущее количество очков: ', 
					pnts, '\n']);
	}
});

var MessageCommandFine = $.inherit(Message, {
	__constructor: function(step, pnts) {
		this.__base(['Шаг ', step + 1, ': Штраф за команду \n', 'Текущее количество очков: ', 
					pnts, '\n']);
	}
});

var MessageDead = $.inherit(Message, {
	__constructor: function() {
		this.__base(['Вас съели. Попробуйте снова \n']);
	}
});

var MessageStepsLimit = $.inherit(Message, {
	__constructor: function() {
		this.__base(['Превышен лимит затраченных шагов \n']);
	}
});

var MessageCmdLimit = $.inherit(Message, {
	__constructor: function() {
		this.__base(['Превышен лимит затраченных команд \n']);
	}
});