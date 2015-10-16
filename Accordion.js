define('Accordion', ['jQuery', 'jQueryUI', 'Declaration'], function(){
	(function($)
	{
		var methods =
		{
			init: function(options) {
				return this.each(function(){
					var $this = $(this);
					$this.data('target', $this);
					$this.data('problem', options.problem);
					$this.data('editing', false);
					$this.data('arguments', []);
				});
			},

			push: function(name, args, funcId) {
				var $this = $(this);
				$this.append(
					'<div id = "funcDiv' + cmdId + '"class="funccall ui-accordion-header ui-helper-reset ui-state-default ui-corner-all" style="display: inline-block; width: 100%;" rel="funccall">' +
						'<span class="func-icon ui-icon-minus">&nbsp;&nbsp;&nbsp</span>'+
						'<span class="func-header jstree-draggable" style="display: inline-block; min-height: 25px;" rel="func-header">' + name + '</span>' +
						'<span> (</span>' +
						'<span class="func-icon ui-icon-plus">&nbsp;&nbsp;&nbsp</span>'+
						'<span>)</span>' +
						//'<input id = "input' + cmdId + '"/>'  +
						'<div id = "funcDef-' + cmdId + '" style="min-height:200px; display: inline-block; width: 100%; overflow: auto;" class = "func-body ui-corner-all ui-widget-content" rel="func-body"></div>' +
					'</div>');

				$('#funcDiv' + cmdId).attr('funcId', funcId === undefined ? cmdId : funcId);
				//$this.children('div').children('input').hide();
				$this.data('arguments').push([]);

				if (!args) {
					$this.myAccordion('showFunctionNameInput', $('#funcDiv' + cmdId).children('.func-header'));
				}
				else {
					var plus =  $('#funcDiv' + cmdId).children('.func-header').next().next();
					var index = $this.data('arguments').length - 1;
					for (var i = 0; i < args.length; ++i) {
						if (i != 0) {
							var comma = $('<span>, </span>')
									.insertBefore(plus);
						}

						var argSpan = $('<span class="argInput"><a href="#">' + args[i] + '</a></span>')
							.insertBefore(plus)
							.bind('dblclick', function(eventObject) {
								$this.myAccordion('showFunctionArgumentInput', this);
								return false;
							})
							.bind('mouseover', function(eventObject){
								$(this).css('border', 'dotted');
							})
							.bind('mouseout', function(eventObject){
								$(this).css('border', 'none');
							});
						$this.data('arguments')[index].push(argSpan);
					}
				}
				$this.myAccordion('updateEvents');
			},

			updateEvents: function() {
				var $this = $(this);

				$this.children('div').children('.func-icon:even').unbind('click').bind('click', function(eventObject) {
					$(this).parent().children('.func-body').toggle('fold', 1000);
					$(this).toggleClass('ui-icon-plus');
					$(this).toggleClass('ui-icon-minus');
					return false;
				});

				$this.children('div').children('.func-header').unbind('dblclick').bind('dblclick', function(eventObject) {
					$this.myAccordion('showFunctionNameInput', this);
					return false;
				});

				$this.children('div').children('.func-icon:odd').unbind('click').bind('click', function(eventObject) {
					console.log('deprecated. TODO: remove')
				});
			},

			clear: function() {
				$(this).children().detach();
				$(this).data('arguments', []);
			},

			clearDiv: function(div) {
				if ($(div).index() >= 0) { //WA. this function is called twice for some reason.
					//The second time it's called for already removed div, it's idnex is -1 => we remove the last argument in the list
					$(this).data('arguments').splice($(div).index(), 1);
				}
			},

			showFunctionNameInput: function(div) {
				console.log('showFunctionNameInput is deprecated. TODO: remove')
			},

			showFunctionArgumentInput: function(span) {
				console.log('showFunctionArgumentInput is deprecated. TODO: remove')
			},

			showInput: function(top, left, span, value, className, onBlur) {
				var $this = $(this);
				$this.data('editing', true);

				var input = $('<input class="' + className + '"\>')
					.val(value)
					.css({'top': top, 'left': left, 'min-width': $(span).css('width')})
					.attr('funcId', $(span).parent().attr('funcId'))
					.appendTo('body')
					.focus();

				$this.data('input', input);
				$this.data('span', span);

				input.bind('blur', function(eventObject) {
					if ( $this.data('editing') ) {
						var span = $this.data('span')
						var oldName = className == 'funcInput' ? $(span).parent().children('.func-header').html() : $(span).children('a').html();
						var newName = $(this).val();

						if (onBlur(oldName, newName, this)) {
							$(this).toggle();
							$this.data('editing', false);
							$this.data('problem').updated();
							$this.data('problem').highlightWrongNames();
							$this.myAccordion( 'sort' );
							//$(this).unbind('blur');
							$(this).remove();
							$this.data('input', false);
							$this.data('span', false);
						}
						else {
							$(this).focus();
						}
					}
					return false;
				});
			},

			sort: function() {
				for (var i = 0; i < $(this).children('.funccall').length; ++i) {
					for (var j = 0; j < $(this).children('.funccall').length - i - 1; ++j) {
							var first = $(this).children('.funccall:eq(' + j +')');
							var second = $(this).children('.funccall:eq(' + (j + 1) +')');
							if (first.children('.func-header').text() > second.children('.func-header').text())	{
								var tmp = $(this).data('arguments')[i];
								$(this).data('arguments')[i] = $(this).data('arguments')[j];
								$(this).data('arguments')[j] = tmp;
								first.insertAfter(second);
							}
					}
				}
			},

			getFunctionName: function(div) {
				return $(div).children('.func-header').text().split(' ').join('');
			},

			findNextComma: function(comma) {
				var span = $(comma).next()
				while ($(span).length) {
					if ($(span).hasClass('comma')) {
						return span;
					}
					span = $(span).next();
				}
				return undefined;
			},

			fixComma: function(div) {
				var index = $(div).index();
				var comma = $(div).children('span.comma:eq(0)');
				var k = 0;

				while ($(comma).length) {
					var nextComma = $(this).myAccordion('findNextComma', comma);
					if (k == 0 && !$(comma).prev().hasClass('argInput')) {
						$(comma).remove()
					}
					else if (!$(nextComma).length && !$(comma).next().hasClass('argInput')) {
						$(comma).remove();
					}
					else if ($(comma).next().hasClass('comma')){
						$(comma).remove();
					}
					comma = nextComma;
					++k;
				}
			},

			checkArgumentExistence: function(span, newName, input, oldName) {
				var args = $(this).myAccordion('getArguments', $(span).parent());
				var cnt = 0;
				for (var i = 0; i < args.length; ++i) {
					if (args[i] == newName) {
						++cnt;
					}
				}


				if (cnt > 1) {
					if (input) {
						$(span).html(oldName);
						alert('The argument with the same name already exists!');
						$(input).focus();
					}
					return false;
				}
				return true;
			},


			getArguments: function(div) {
				var index = $(div).index();
				var args = [];
				var l = $(this).data('arguments')[index].length;
				for (var k = 0; k <  $(this).data('arguments')[index].length; ++k) {
					//console.log($(this).data('myAccordion').arguments[index][k], typeof $(this).data('myAccordion').arguments[index][k]);
					args.push($(this).data('arguments')[index][k].children('a').html().split(' ').join(''))
				}
				return args;
			}
		}

		$.fn.myAccordion = function(method) {
		    if (methods[method]) {
		    	return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		    }
			else if (typeof method === 'object' || ! method) {
		      return methods.init.apply( this, arguments );
		    }
			else {
		      $.error('Method ' +  method + ' does not exist on jQuery.myAccordion');
			}

			return false;
	    }

		$.fn.myAccordion.defaults = {
			problem: problems[0]
		};
	}

	(jQuery));
});
