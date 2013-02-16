(function($)
{
	var methods = 
	{
		//counter -- total 
		//value -- current
		//during execution we will see value/counter
		init: function(command, arguments) {
			return this.each(function(){
				var $this = $(this);
				$this.data('command', command);
				$this.data('arguments', arguments);
				$this.data('argumentValues', {});

				$this.data('total', 1);
				$this.data('minimum', 1);

				$this.data('isBeingExecuted', false);

				$this.append(
					'<input value="1"></input>' + 
					'<div class="spinImg"></div>'
					);

				$this.children('.spinImg').bind('click', function(e){
					var pos = e.pageY - $(this).offset().top;
          			var vector = ($(this).height()/2 > pos ? 1 : -1);
				});
			});
		},

		getSpinImg: function() {
			return $(this).children('.spinImg');
		},

		getTotal: function() {
			return $(this).children('input').val();
		},

		setTotal: function(total) {
			$(this).children('input').val(total);
		},

		onSpinImgClick: function(delta) {
			var total = $(this).mySpin('getTotal');
			var newTotal = total + delta;

			if (newTotal < $(this).data('minimum')) {
				if ($(this).data('arguments') && $(this).data('arguments').length) {
					newTotal = $(this).data('arguments')[Math.max($(this).data('minimum') - newTotal - 1, 
						$(this).data('minimum') - $(this).data('arguments').length + 1)];
				}
			}

			$(this).mySpin('setTotal', newTotal);
		},

		startExecution: function(current) {
			$(this).mySpin('getSpinImg').hide();
			$(this).data('total', $(this).mySpin('getTotal'));
			$(this).data('value') = current != undefined ? current : (isInt(total) ? total : $(this).data('argumentValues')[total]);
			if (!isInt($(this).data('value')) || $(this).data('value') < 0) {
				throw 'Invalid counter!!!';
			}
			$(this).children('input').value( $(this).data('value') + '\\' + total );
			$(this).data('isBeingExecuted', true);
		},

		stopExecution: function() {
			$(this).mySpin('getSpinImg').show();
			$(this).data('isBeingExecuted', false);
			$(this).mySpin('setTotal', $(this).data('total'));
		},

		decreaseValue: function() {
			$(this).data('value') = Math.max($(this).data('value') - 1, $(this).data('minimum'));
			$(this).children('input').value( $(this).value + '\\' + total );
		},

		setArguments: function(arguments) {
			$(this).data('arguments', arguments.clone());
		},

		setArgumentValues: function(argumentValues) {
			$(this).data('argumentValues', argumentValues.clone());
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

