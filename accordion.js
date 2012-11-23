(function($)
{
	var methods = 
	{
		init: function( options )
		{
			return this.each(function(){
				var $this = $(this);
				data = $this.data('myAccordion');

				if ( ! data ) {
					$(this).data('myAccordion', {
						target : $this,
						'problem' : options.problem
					});
				}
			});
		},
		
		push: function( name )
		{
			var $this = $(this);
			$this.append(
				'<div id = "funcDiv' + $this.data('myAccordion', 'problem').numOfFunctions + '"class="jstree-draggable funccall ui-accordion-header ui-helper-reset ui-state-default ui-corner-all" rel="funccall">' +
					'<span class="func-icon ui-icon-plus">&nbsp;&nbsp;&nbsp</span>'+
					'<span class="func-header" >' + name + '</span>' +
					'<input />'  +
					'<div id = "funcDef-' + name + '" style="min-height:200px" class = "func-body ui-corner-all ui-widget-content"></div>' +
				'</div>');
			$this.children('div').children('input').hide();
			$this.myAccordion('updateEvents');
		},
		
		updateEvents: function( )
		{
			var $this = $(this);
			$this.children('div').children('.func-icon').first().unbind('click').bind('click', function(eventObject){
				$(this).next().next().next().toggle( 'fold', 1000 );
				$(this).toggleClass( 'ui-icon-plus' );
				$(this).toggleClass( 'ui-icon-minus' );
				return false;
			});
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

