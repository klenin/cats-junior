(function($)
{
	var methods = 
	{
		init: function( options ) {
			return this.each(function(){
				var $this = $(this);
				data = $this.data('myAccordion');

				if ( ! data ) {
					$(this).data('myAccordion', {
						target : $this,
						'problem' : options.problem,
						'editing': false
					});
				}
			});
		},
		
		push: function( name ) {
			var $this = $(this);
			$this.append(
				'<div id = "funcDiv' + cmdId + '"class="funccall jstree-draggable ui-accordion-header ui-helper-reset ui-state-default ui-corner-all" rel="funccall">' +
					'<span class="func-icon ui-icon-minus">&nbsp;&nbsp;&nbsp</span>'+
					'<span class="func-header" style="width: 95%; display: inline-block; min-height: 25px;" rel="func-header">' + name + '</span>' +
					//'<input id = "input' + cmdId + '"/>'  +
					'<div id = "funcDef-' + cmdId + '" style="min-height:200px" class = "func-body ui-corner-all ui-widget-content" rel="func-body"></div>' +
				'</div>');
			//$this.children('div').children('input').hide();
			$this.myAccordion('showInput', $('#funcDiv' + cmdId).children('.func-header'));
			$this.myAccordion('updateEvents');			
		},
		
		updateEvents: function( ) {
			var $this = $(this);
			$this.children('div').children('.func-icon').unbind('click').bind('click', function(eventObject)
			{
				//$this.myAccordion('hideInput');
				$(this).next().next().toggle( 'fold', 1000 );
				$(this).toggleClass( 'ui-icon-plus' );
				$(this).toggleClass( 'ui-icon-minus' );
				return false;
			});
			$this.children('div').children('.func-header').unbind('dblclick').bind('dblclick', function(eventObject)
			{
				//$this.myAccordion('hideInput');
				$this.myAccordion('showInput', this);
				//$(this).html('&nbsp;');
				
				return false;
			});
		},

		clear: function( ) {
			$(this).children().detach();
		},

		showInput: function( div ) {
			var $this = $(this);
			$this.data('myAccordion').editing = true;
			var input = $('<input class="funcInput"\>')
				.val($(div).html())
				.attr('funcId', $(div).parent().attr('id'))
				.css({'top': $(div).offset().top, 'left': $(div).offset().left})
				.appendTo('body')
				.focus();

			$this.data('myAccordion').input = input;
			
			input.bind('blur', function(eventObject) {
				if ( $this.data('myAccordion').editing ) {
					var oldName = $('#' + $(this).attr('funcId')).children('.func-header').html();
					var newName = $(this).val();
					if (oldName != newName && $this.data('myAccordion').problem.functions[newName]) {
						if (!confirm('The function with the same name already exists, continue anyway?')) {
							$(this).focus();
							return false;
						}
					}
					if (!checkName(newName)) {
						alert('Invalid function name!');
						$(this).focus();
						return false;
					}
					$('#' + $(this).attr('funcId')).children('.func-header').html($(this).val());
					$(this).toggle();
					$this.data('myAccordion').editing = false;
					$this.data('myAccordion').problem.updated();
					$this.data('myAccordion').problem.updateFunctonName( oldName, newName );
					$this.myAccordion( 'sort' );
					//$(this).unbind('blur');
					$(this).remove();
					$this.data('myAccordion').input = false;
				}
				return false;
			});
		},
		sort: function( ) {
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

	$.fn.myAccordion = function( method ) 
	{
	    if ( methods[method] )
		{
	    	return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } 
		else if ( typeof method === 'object' || ! method ) 
		{
	      return methods.init.apply( this, arguments );
	    } 
		else 
		{
	      $.error( 'Method ' +  method + ' does not exist on jQuery.myAccordion' );
		}
    }    
  
	
	$.fn.myAccordion.defaults = {
		problem: problems[0]
	};
}
(jQuery));

