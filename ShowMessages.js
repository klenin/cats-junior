define('ShowMessages', ['jQuery', 'jQueryUI', 'jQueryInherit', 'Declaration'], function(){
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
	return {
		Message: Message,

		MessageStepFine: $.inherit(Message, {
			__constructor: function(step, pnts) {
				this.__base(['Шаг ', step + 1, ': Штраф за шаг \n', 'Текущее количество очков: ', 
							pnts, '\n']);
			}
		}),

		MessageCommandFine: $.inherit(Message, {
			__constructor: function(step, pnts) {
				this.__base(['Шаг ', step + 1, ': Штраф за команду \n', 'Текущее количество очков: ', 
							pnts, '\n']);
			}
		}),

		MessageDead: $.inherit(Message, {
			__constructor: function() {
				this.__base(['Вас съели. Попробуйте снова \n']);
			}
		}),

		MessageStepsLimit: $.inherit(Message, {
			__constructor: function() {
				this.__base(['Превышен лимит затраченных шагов \n']);
			}
		}),

		MessageCmdLimit: $.inherit(Message, {
			__constructor: function() {
				this.__base(['Превышен лимит затраченных команд \n']);
			}
		})
	};
});
