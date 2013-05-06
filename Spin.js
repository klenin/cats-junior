define('Spin', ['jQuery', 'jQueryUI', 'Misc'], function(){
	(function($)
	{
		var methods = 
		{
			//counter -- total 
			//value -- current
			//during execution we will see value/counter
			init: function(cmd, args, problem, type, isCounter, min, max) {
				return this.each(function(){
					var $this = $(this);

					var command = cmd;
					
					$this.data('command', command);
					$this.data('problem', problem);
					$this.data('arguments', args.clone());
					$this.data('type', type);
					$this.data('isCounter', isCounter);
					$this.data('argumentValues', {});
					
					$this.data('minimum', min != undefined ? min : 1);
					$this.data('maximum', max != undefined ? max : MAX_VALUE);
					
					$this.data('total', $this.data('minimum'));
					$this.data('totalVal', $this.data('minimum'));
					$this.data('currentTotal', $this.data('minimum'));

					$this.data('isBeingExecuted', false);

					$this.append(
						'<input class="spinCnt" value="' + $this.data('totalVal') + '" editable="false"></input>'
						);

					if ($this.data('type') == 'int') {
						$this.append('<img src="images/spin-button.png" style="position: relative; top: 4px">');
					}

					$this.children('img').bind('click', function(e){
						var pos = e.pageY - $(this).offset().top;
						var vector = ($(this).height()/2 > pos ? 1 : -1);

						$this.mySpin('onSpinImgClick', vector);
					});

					$this.children('input').change(function() {
						$this.mySpin('onUpdateTotal', $this.children('input').val())
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
				$(this).data('currentTotal', v ? v : total);
				$(this).data('totalVal', v ? v : total);
				$(this).children('input').val($(this).data('totalVal'));
			},

			setTotalWithArgument: function(total, afterDomCreation) {
				var args = $(this).data('arguments');
				var i = 0;
				for (i = 0; i < args.length; ++i) {
					if (args[i] == total) {
						break;
					}
				}

				if (i == args.length && !afterDomCreation) {
					throw "Неизвестный аргумент"
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
						return false;
					}
					else {
						newTotal = $(this).data('minimum');
					}
				}

				else if (newTotal > $(this).data('maximum')) {
					newTotal = $(this).data('maximum');
				}

				$(this).mySpin('setTotal', newTotal);
				$(this).data('problem').updated();
				return false;
			},

			onUpdateTotal: function(newTotal) {
				//TODO: create one function for  onUpdateTotal, onSpinImgClick if it's possible

				if (checkNumber(newTotal)) {
					if (newTotal < $(this).data('minimum')) {
						newTotal = $(this).data('minimum');
					}
					else if (newTotal > $(this).data('maximum')) {
							newTotal = $(this).data('maximum');
					}
					$(this).mySpin('setTotal', parseInt(newTotal));
				}
				else {
					if (!checkName(newTotal)) {
						throw 'Некорректное имя аргумента'
					}

					var i = 0;
					for (i = 0; i < $(this).data('arguments').length; ++i) {
						if (newTotal ==  $(this).data('arguments')) {
							break;
						}
					}

					if (i == $(this).data('arguments').length) {
						throw 'Некорректный аргумент'; //highlight?
					}

					$(this).mySpin('setTotal', $(this).data('maximum') - 1 - i, 
						$(this).data('arguments')[i]);
				}
					
				$(this).data('problem').updated();
				return false;
				
			},

			updateTotals: function(current){
				$(this).data('currentTotal', $(this).data('total'));
				if (current != undefined) {
					$(this).data('value', current);
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
			},

			hideBtn: function(cnt) {
				$(this).mySpin('getSpinImg').hide();
				//$(this).mySpin('updateTotals');
				if (isInt($(this).data('currentTotal')) && $(this).data('type') == 'int' && $(this).data('isCounter') == true)  {
					$(this).children('input').val($(this).data('value') + '/' + $(this).data('currentTotal'));
				}
				else {
					$(this).children('input').val($(this).data('value'));
				}
			},

			showBtn: function() {
				$(this).mySpin('getSpinImg').show();
				$(this).children('input').val($(this).data('totalVal'));
			},

			startExecution: function(current) {
				$(this).mySpin('updateTotals', current);
				if (!isInt($(this).data('value')) || $(this).data('value') < 0) {
					throw 'Некорректный счетчик';
				}
				if ($(this).data('type') == 'int' && $(this).data('isCounter') == true) {
					$(this).children('input').val($(this).data('value') + '/' + $(this).data('currentTotal'));
				}
				else {
					$(this).children('input').val($(this).data('value'));
				}
				$(this).data('isBeingExecuted', true);
			},

			stopExecution: function() {
				$(this).data('isBeingExecuted', false);
				$(this).mySpin('setTotal', $(this).data('total'), $(this).data('totalVal'));
			},

			decreaseValue: function() {
				if ($(this).data('type') != 'int') {
					throw 'Счетчик не может быть не целым';
				}
				$(this).data('value', Math.max($(this).data('value') - 1, 0));
				$(this).children('input').val( $(this).data('value') + '/' + $(this).data('currentTotal') );
			},

			setArguments: function(args) {
				var args = args.clone()
				$(this).data('arguments', args);
			},

			setArgumentValues: function(argumentValues) {
				var args = $.extend(true, {}, argumentValues);
				$(this).data('argumentValues', args);
			},

			setDefault: function() {
				$(this).data('currentTotal', $(this).data('totalVal'));
				$(this).data('value', $(this).data('total'));//
			}
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
			return false;
	    }    
	  
		
		$.fn.mySpin.defaults = {
		};
	}
	(jQuery));
});

