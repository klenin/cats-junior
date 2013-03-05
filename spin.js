(function($)
{
	var methods = 
	{
		//counter -- total 
		//value -- current
		//during execution we will see value/counter
		init: function(a, b, c) {
			return this.each(function(){
				var $this = $(this);

				var command = a;
				
				$this.data('command', command);
				$this.data('problem', c);
				$this.data('arguments', b.clone());
				$this.data('argumentValues', {});

				$this.data('total', 1);
				$this.data('totalVal', 1);
				$this.data('currentTotal', 1);
				$this.data('minimum', 1);

				$this.data('isBeingExecuted', false);

				$this.append(
					'<input class="spinCnt" value="1" editable="false"></input>' + 
					'<img src="images/spin-button.png">'
					);

				$this.children('img').bind('click', function(e){
					var pos = e.pageY - $(this).offset().top;
					var vector = ($(this).height()/2 > pos ? 1 : -1);

					$this.mySpin('onSpinImgClick', vector);
				});
			});
		},

		getSpinImg: function() {
			return $(this).children('img');
		},

		getTotal: function() {
			return $(this).data('total');
		},

		setTotal: function(total, v) {
			$(this).data('total', total);
			$(this).data('totalVal', v ? v : total);
			$(this).children('input').val($(this).data('totalVal'));
		},

		setTotalWithArgument: function(total) {
			var args = $(this).data('arguments');
			var i = 0;
			for (i = 0; i < args.length; ++i) {
				if (args[i] == total) {
					break;
				}
			}

			if (i == args.length) {
				throw 'Unknown argument!'
			}
			
			$(this).mySpin('setTotal', $(this).data('minimum') - i - 1, total);
		},

		getTotalValue: function() {
			return $(this).data('totalVal');
		},

		onSpinImgClick: function(delta) {
			var total = $(this).mySpin('getTotal');
			var newTotal = parseInt(total) + parseInt(delta);

			if (newTotal < $(this).data('minimum')) {
				if ($(this).data('arguments') && $(this).data('arguments').length) {
					if ($(this).data('minimum') - newTotal - 1 > $(this).data('arguments').length - 1) {
						newTotal -= parseInt(delta);
					}
					$(this).mySpin('setTotal', newTotal, 
						$(this).data('arguments')[Math.min($(this).data('minimum') - newTotal - 1, 
						$(this).data('arguments').length - 1)]);
					$(this).data('problem').updated();
					return;
				}
				else
				{
					newTotal = $(this).data('minimum');
				}
			}

			$(this).mySpin('setTotal', newTotal);
			$(this).data('problem').updated();
			return false;
		},

		hideBtn: function(cnt) {
			$(this).mySpin('getSpinImg').hide();
			if (isInt($(this).data('totalVal')))  {
				$(this).children('input').val(((!isNaN(cnt)) ? (cnt) : ($(this).data('totalVal'))) + '/' + $(this).data('totalVal'));
			}
		},

		showBtn: function() {
			$(this).mySpin('getSpinImg').show();
			$(this).children('input').val($(this).data('totalVal'));
		},

		startExecution: function(current) {
			$(this).data('currentTotal', $(this).data('total'));
			if (current != undefined) {
				$(this).data('value') = current;
			}
			else {
				if (isInt($(this).data('totalVal'))) {
					$(this).data('value', $(this).data('totalVal'));
				}
				else {
					$(this).data('value', parseInt($(this).data('argumentValues')[$(this).data('totalVal')]));
					$(this).data('currentTotal', $(this).data('value'));
				}
			}
			if (!isInt($(this).data('value')) || $(this).data('value') < 0) {
				throw 'Invalid counter!!!';
			}
			$(this).children('input').val($(this).data('value') + '/' + $(this).data('currentTotal'));
			$(this).data('isBeingExecuted', true);
		},

		stopExecution: function() {
			$(this).data('isBeingExecuted', false);
			$(this).mySpin('setTotal', $(this).data('total'), $(this).data('totalVal'));
		},

		decreaseValue: function() {
			$(this).data('value', Math.max($(this).data('value') - 1, 0));
			$(this).children('input').val( $(this).data('value') + '/' + $(this).data('currentTotal') );
		},

		setArguments: function(arguments) {
			var args = arguments.clone()
			$(this).data('arguments', args);
		},

		setArgumentValues: function(argumentValues) {
			var args = $.extend(true, {}, argumentValues);
			$(this).data('argumentValues', args);
		},
	}

	$.fn.mySpin = function(method) {
	    if (methods[method]) {
	    	return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } 
		else if (typeof method === 'object' || ! method) {
	      return methods.init.apply( this, arguments );
	    } 
		else {
	      $.error('Method ' +  method + ' does not exist on jQuery.mySpin');
		}
    }    
  
	
	$.fn.mySpin.defaults = {
	};
}
(jQuery));

