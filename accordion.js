function accordionPush( id, name )
{
	$(id).append(
		'<div class="jstree-draggable funccall ui-accordion-header ui-helper-reset ui-state-default ui-corner-all" rel="funccall">' +
			'<span class="ui-accordion-icon ui-icon ui-icon-circle-minus func-icon"></span>'+
			'<span class="func-header">' +
				'<label data-type="editable" data-for=".input1">' + 
					name + 
				'</label>' + 
				'<input class="input1"/>' +
			'</span>' +
			'<div id = "funcDef-' + name + '" style="min-height:200px" class = "func-body ui-corner-all ui-widget-content"></div>' +
		'</div>');
	$('body').editables( 
    { 
    	editOn: 'dblclick',
		beforeEdit: function(field){
			field.val(this.text());
		},
		beforeFreeze: function(display){ 
			display.text(this.val());
		}
	} 
	);
}

function accordionUpdateEvents( id )
{
	$(id + ' >div .func-icon').unbind('click').bind('click', function(eventObject){
		$(this).next().next().toggle( 'fold', 1000 );
		$(this).toggleClass( 'ui-icon-circle-plus' );
		$(this).toggleClass( 'ui-icon-circle-minus' );
		return false;
	});
}
