function accordionPush( id, name )
{
	$(id).append('<div class="jstree-draggable funccall"><h3 class="func-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all"><span class="ui-accordion-header-icon ui-icon ui-icon-carat-1-n"></span><a href="#">' + name + '</a></h3><div id = "funcDef-' + name + '" style="min-height:200px" class = "func-body ui-corner-all ui-widget-content"></div></div>');
}

function accordionUpdateEvents( id )
{
	$(id + ' >div .func-header').unbind('click').bind('click', function(eventObject){
		$(this).next().toggle( 'fold', 1000 );
		$(this).children('span').toggleClass( 'ui-icon-carat-1-s' );
		$(this).children('span').toggleClass( 'ui-icon-carat-1-n' );
		return false;
	});
}
