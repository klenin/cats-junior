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

var MessageLabirinthOverrun = $.inherit(Message, {
	__constructor: function(step) {
		this.__base(['Шаг ', step + 1, ': Выход за границу лабиринта \n']);
	}
});

var MessageWall = $.inherit(Message, {
	__constructor: function(step) {
		this.__base(['Шаг ', step + 1, ': Уткнулись в стену \n']);
	}
});

var MessageCantMove = $.inherit(Message, {
	__constructor: function(step) {
		this.__base(['Шаг ', step + 1, ': Не можем пододвинуть \n']);
	}
});

var MessagePrizeFound = $.inherit(Message, {
	__constructor: function(step, name, pnts, all) {
		this.__base(['Шаг ', step + 1, ': Нашли бонус ', name, ' \n', 'Текущее количество очков: ', 
					pnts, '\n', all? 'Вы собрали все бонусы! \n' : '']);
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

var MessageInvalidDirectionFine = $.inherit(Message, {
	__constructor: function(step, pnts) {
		this.__base(['Шаг ', step + 1, ': Штраф за неправильное направление \n', 'Текущее количество очков: ', 
					pnts, '\n']);
	}
});

var MessageCellOpened = $.inherit(Message, {
	__constructor: function(step, x, y) {
		this.__base(['Шаг ', step + 1, ': Открыли ячейку с координатами ', x, ', ', y, '\n']);
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