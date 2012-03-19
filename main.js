$(document).ready(function(){
	$('#tabs').tabs({
		select: function(event, ui) {
			if (ui.index > 0 && ui.index - 1 < problems.length){
				curProblemIndex = ui.index - 1;
				curProblem = problems[curProblemIndex];
			}
			if (ui.index == (problems.length + 2))
			{
				setTimeout("codeareas[" + (problems.length + 1) + "].refresh()", 100);
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
		curProblem.visited = 1;
		$('#sortable' + curProblem.tabIndex).sortable({
			revert: false,
			cursor: 'move',
			appendTo: 'body',
			helper: 'clone'
		});
		for (var k = 0; k < classes.length; ++k){
			$('#' + classes[k] + curProblem.tabIndex).draggable({
				connectToSortable: ('#sortable' + curProblem.tabIndex),
				helper: 'clone',
				cursor: 'default',
				greedy: true
			});
			$('#' + classes[k] + curProblem.tabIndex).bind('dblclick', function(){
				if ($(this).prop('ifLi'))
					return;
				for (var j = 0; j < classes.length; ++j)
					if ($(this).hasClass(classes[j]))
						addNewCmd(classes[j], true);
				updated();
			});
		}
		$('#sortable' + curProblem.tabIndex ).bind('sortbeforestop', function(event, ui) {
			stoppedLvl = 0;
			if (!cmdAdded)
			{
				$('#cons0').html('');
				addedCmds = [];
			}
			if (ui.position.left > maxx || ui.position.top < miny){
				ui.item.remove();
				updated();
				return;
			}
			var id = "";
			for (var k = 0; k < classes.length; ++k)
			{
				if (ui.item.hasClass(classes[k]))
				{
					id = classes[k];
					break;
				}
			}
			id += cmdId;
			if (!ui.item.prop('numId')){
				ui.item.prop('id', id);
				ui.item.prop('ifLi', 1);
				ui.item.prop('numId', cmdId);
				for (var j = 0; j < classes.length; ++j)
					if (ui.helper.hasClass(classes[j])){
						addNewCmd(classes[j], false, ui.item[0]);
					}
			}
			addedCmds.push(ui.item);
			curProblem.cmdListEnded = false;
		});
		$('#sortable' + curProblem.tabIndex ).bind('sortstop', function(event, ui) {
			if (stoppedLvl)
			{
				for (var i = 0; i < addedCmds.length - 1; ++i)
					addedCmds[i].remove();
			}
			stoppedLvl= 0;
			setTimeout(function(){updated();}, 1000);
			cmdAdded = false;
			
		});
		$('#sortable' + curProblem.tabIndex).bind('click', function(event, ui) {
			if (!curProblem.playing)
				showCounters();
		});
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
				curUser.passwd = $('#password').prop('value');
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
				var problem = $('#tabs').tabs('option', 'selected') - 1;
				$( '#watchTable' + problem).append( '<tr id = watchTr_' + problem + '_' + lastWatchedIndex[problem] + '>' +
					'<td><button id = "deleteWatch_' + problem + '_' + lastWatchedIndex[problem] + '">delete</button></td>' +
					'<td>' + $('#watchName').val() + '</td>' + 
					'<td id = "calcVal_' + problem + '_' + lastWatchedIndex[problem] + '">' + 
						calculateValue($('#watchName').val()) + '</td>' + 
					'</tr>' ); 
				$('#deleteWatch_' + problem + '_' + lastWatchedIndex[problem]).prop('varId', lastWatchedIndex[problem]);
				$('#deleteWatch_' + problem + '_' + lastWatchedIndex[problem]).button().bind('click', function(){
					delete watchList[problem][$(this).prop('varId')];
					$('#watchTr_' + problem + '_' + $(this).prop('varId')).remove();
				});
				watchList[problem][lastWatchedIndex[problem]++] = $('#watchName').val();
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});

});
