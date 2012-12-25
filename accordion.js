(function($)
{
	var methods = 
	{
		init: function(options) {
			return this.each(function(){
				var $this = $(this);
				data = $this.data('myAccordion');

				if ( ! data ) {
					$(this).data('myAccordion', {
						target : $this,
						'problem' : options.problem,
						'editing': false,
						'arguments': []
					});
				}
			});
		},
		
		push: function(name) {
			var $this = $(this);
			$this.append(
				'<div id = "funcDiv' + cmdId + '"class="jstree-draggable funccall ui-accordion-header ui-helper-reset ui-state-default ui-corner-all" rel="funccall">' +
					'<span class="func-icon ui-icon-minus">&nbsp;&nbsp;&nbsp</span>'+
					'<span class="func-header" style="display: inline-block; min-height: 25px;" rel="func-header">' + name + '</span>' +
					'<span> (</span>' + 
					'<span>)</span>' + 
					'<span class="func-icon ui-icon-plus">&nbsp;&nbsp;&nbsp</span>'+
					//'<input id = "input' + cmdId + '"/>'  +
					'<div id = "funcDef-' + cmdId + '" style="min-height:200px" class = "func-body ui-corner-all ui-widget-content" rel="func-body"></div>' +
				'</div>');
			//$this.children('div').children('input').hide();
			$this.myAccordion('showFunctionNameInput', $('#funcDiv' + cmdId).children('.func-header'));
			$this.myAccordion('updateEvents');			
		},
		
		updateEvents: function() {
			var $this = $(this);
			$this.children('div').children('.func-icon:eq(0)').unbind('click').bind('click', function(eventObject) {
				$(this).next().next().toggle('fold', 1000);
				$(this).toggleClass('ui-icon-plus');
				$(this).toggleClass('ui-icon-minus');
				return false;
			});
			$this.children('div').children('.func-header').unbind('dblclick').bind('dblclick', function(eventObject) {
				$this.myAccordion('showFunctionNameInput', this);
				return false;
			});
			$this.children('div').children('.func-icon:eq(1)').unbind('click').bind('click', function(eventObject) {
				var index = $this.data('myAccordion').arguments.length; 
				var argSpan = $('<span class="argInput">arg' + index + '</span>')
					.insertBefore($(this).prev('span'))
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

				$this.data('myAccordion').arguments.push(argSpan);
				if (index != 0) {
					var comma = $('<span>, </span>')
						.insertBefore(argSpan);
				}
				
			});
		},

		clear: function() {
			$(this).children().detach();
		},

		showFunctionNameInput: function(div) {
			var top = $(div).offset().top;
			var left = $(div).offset().left;
			var span = $(div).children('.func-header');
			var value = $(div).html();	
			var $this = $(this);
			$(this).myAccordion('showInput', top, left, span, value, 'funcInput', function(oldName, newName, input) {
				if (oldName != newName && $this.data('myAccordion').problem.functions[newName]) {
					if (!confirm('The function with the same name already exists, continue anyway?')) {
						$(input).focus();
						return false;
					}
				}
				if (!checkName(newName)) {
					alert('Invalid function name!');
					$(input).focus();
					return false;
				}
				$($this.data('myAccordion').span).html($(input).val());
				$this.data('myAccordion').problem.updateFunctonName( oldName, newName );
			});
		},

		showFunctionArgumentInput: function(span) {
			var div = $(span).parent('.funccall');
			var top = $(span).offset().top;
			var left = $(span).offset().left;
			var value = $(span).html();
			var $this = $(this);
			$(this).myAccordion('showInput', top, left, span, value, 'argInput', function(oldName, newName, input) {
				/*if (oldName != newName && $this.data('myAccordion').problem.functions[newName]) {
					if (!confirm('The function with the same name already exists, continue anyway?')) {
						$(input).focus();
						return false;
					}
				}
				if (!checkName(newName)) {
					alert('Invalid function name!');
					$(input).focus();
					return false;
				}*/
				$($this.data('myAccordion').span).html($(input).val());
				//$this.data('myAccordion').problem.updateFunctonName( oldName, newName );
			});
		},

		showInput: function(top, left, span, value, className, onBlur) {
			var $this = $(this);
			$this.data('myAccordion').editing = true;
			var input = $('<input class="' + className + '"\>')
				.val(value)
				.css({'top': top, 'left': left, 'width': $(span).css('width')})
				.appendTo('body')
				.focus();

			$this.data('myAccordion').input = input;
			$this.data('myAccordion').span = span;

			
			input.bind('blur', function(eventObject) {
				if ( $this.data('myAccordion').editing ) {
					var oldName = $('#' + $(this).attr('funcId')).children('.func-header').html();
					var newName = $(this).val();
					onBlur(oldName, newName, this);
					$(this).toggle();
					$this.data('myAccordion').editing = false;
					$this.data('myAccordion').problem.updated();
					$this.data('myAccordion').problem.highlightWrongNames();
					$this.myAccordion( 'sort' );
					//$(this).unbind('blur');
					$(this).remove();
					$this.data('myAccordion').input = false;
					$this.data('myAccordion').span = false;
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
							first.insertAfter(second);
						}
				} 
			}
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
    }    
  
	
	$.fn.myAccordion.defaults = {
		problem: problems[0]
	};
}
(jQuery));

