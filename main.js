$(document).ready(function(){
	$('#tabs').tabs({
		select: function(event, ui) {
			curProblemIndex = ui.index - 1;
			curProblem = problems[curProblemIndex];
		}
	});
	$('#tabs').tabs('paging', { cycle: false, follow: true, tabsPerPage: 0 } );
	fillTabs();
	document.title = "";
	cmdId = problems.length;
	$('#tabs').bind('tabsshow', function(event, ui) {
		if (curProblem.visited)
			return;
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
			$('#' + classes[k] + curProblem.tabIndex).live('dblclick', function(){
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
		buttons: {
			Ok: function() {
				$( this ).dialog('close');
			}
		}, 
		autoOpen: false,
		title: 'О системе'
	});
	$('#enterPassword').dialog({
		modal: true,
		buttons: {
			Ok: function() {
				curUser.passwd = $('#password').attr('value');
				login();
				$(this).dialog('close');					
			}
		}, 
		autoOpen: false,
		close: function(){this.title = 'Введите пароль';}
	});
	$('#about').html('Здесь будет help и информация о системе');
	for (var i = 0; i < problems.length; ++i){
		$('#export' + i).dialog({
			modal: true,
			buttons: {
				Ok: function() {
					$(this).dialog('close');
				}
			}, 
			autoOpen: false,
			title: 'Список команд',
			minWidth: 250,
			minHeight: 400
		});
		$('#import' + i).dialog({
			modal: true,
			buttons: {
				'Load': function() {
					if (!confirm('Вы уверены, что хотите изменить список команд?'))
						return;
					importCommands();
				},
				'Cancel': function() {
					$(this).dialog('close');
				}
			}, 
			autoOpen: false,
			title: 'Загрузка списка команд',
			minWidth: 250,
			minHeight: 400
			
		});
		$('ul, li').disableSelection();
	}
});