$(document).ready(function(){
	$('#tabs').tabs({
		select: function(event, ui) {
			if (ui.index > 0 && ui.index - 1 < problems.length){
				curProblemIndex = ui.index - 1;
				curProblem = problems[curProblemIndex];
			}
			if (ui.index == (problems.length + 2))
			{
				setTimeout("curCodeMirror.refresh()", 100);
			}
		}
	});
	$('#changeContest').hide();
	$('#enterPassword').hide();
	$('#contestsList').hide();
	$('#about').hide();
	$('#tabs').tabs('paging', { cycle: false, follow: true, tabsPerPage: 0 } );
	getContests();
	cmdId = problems.length;
	$('#tabs').bind('tabsshow', function(event, ui) {
		if (curProblem.visited)
			return;
		//curProblem = {};
		curProblem.visited = 1;
		$('#sortable' + curProblem.tabIndex).sortable({
			revert: false,
			cursor: 'move'
		});
		$('#sortable' + curProblem.tabIndex ).bind('sortbeforestop', function(event, ui) {
			if (ui.position.left > maxx || ui.position.top < miny){
				ui.item.remove();
				updated();
				return;
			}
			var id = ui.item.attr('id');
			id = id.replace(/\d{1,}/, "");
			id += cmdId;
			if (!ui.item.attr('numId')){
				ui.item.attr('id', id);
				ui.item.attr('ifLi', 1);
				ui.item.attr('numId', cmdId);
				for (var j = 0; j < classes.length; ++j)
					if (ui.helper.hasClass(classes[j])){
						addNewCmd(classes[j], false, ui.item[0]);
					}
			}
			updated();
			curProblem.cmdListEnded = false;
		});
		$('#sortable' + curProblem.tabIndex).bind('click', function(event, ui) {
			if (!curProblem.playing)
				showCounters();
		});
		for (var k = 0; k < classes.length; ++k){
			$('#' + classes[k] + curProblem.tabIndex).draggable({
				connectToSortable: ('#sortable' + curProblem.tabIndex),
				helper: 'clone',
				revert: 'invalid',
				cursor: 'default'
			});
			$('#' + classes[k] + curProblem.tabIndex).bind('dblclick', function(){
				if ($(this).attr('ifLi'))
					return;
				for (var j = 0; j < classes.length; ++j)
					if ($(this).hasClass(classes[j]))
						addNewCmd(classes[j], true);
				updated();
			});
		}
		$('#aboutBtn' + curProblem.tabIndex).click(function() {
			$('#about').dialog('open');
			return false;
		});
	});  
	$('#about').dialog({
		modal: true,
		autoOpen: false,
		width: 700,
		height: 700,
		open: function(){
			$('#accordion').accordion();
		}
	});
	//$("#accordion").accordion();
	$('#enterPassword').dialog({
		modal: true,
		buttons: {
			Ok: function() {
				curUser.passwd = $('#password').attr('value');
				login();
				$(this).dialog('close');					
			},
			Cancel: function(){
				$(this).dialog('close');	
			}
		}, 
		autoOpen: false,
		close: function(){this.title = 'Введите пароль';}
	});
	$('#changeContest').dialog({
		modal: true,
		buttons: {
			Ok: function() {
				changeContest();
				$(this).dialog('close');					
			},
			Cancel: function(){
				$(this).dialog('close');	
			}
		}, 
		autoOpen: false
	});
	for (var i = 0; i < problems.length; ++i){
		$('ul, li').disableSelection();
	}
	$( "#addWatchDialog" ).dialog({
		autoOpen: false,
		height: 300,
		width: 350,
		modal: true,
		buttons: {
			"addWatch": function() {
				$( "#watchTable" ).append( "<tr>" +
					"<td>" + $('#watchName').val() + "</td>" + 
					"<td>" + calculateValue($('#watchName').val()) + "</td>" + 
				"</tr>" ); 
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});

});
