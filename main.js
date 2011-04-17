	$(document).ready(function(){
		$('#tabs').tabs({
			select: function(event, ui) {
				curProblem = ui.index - 1;
			}
		});
		$('#tabs').tabs('paging', { cycle: false, follow: true, tabsPerPage: 0 } );
		fillTabs();
		document.title = "";
		cmdId = problems.length;
		divs = ['forward', 'left', 'right', 'wait'];
		$('#tabs').bind('tabsshow', function(event, ui) {
			if (visited[curProblem])
				return;
			visited[curProblem] = 1;
			$('#sortable' + curProblem).sortable({
				revert: false,
				cursor: 'move'
			});
			$('#sortable' + curProblem ).bind('sortbeforestop', function(event, ui) {
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
					for (var j = 0; j < divs.length; ++j)
						if (ui.helper.hasClass(divs[j])){
							addNewCmd(divs[j], false, ui.item[0]);
						}
				}
				updated();
				cmdListEnded[curProblem] = false;
			});
			$('#sortable' + curProblem ).bind('click', function(event, ui) {
				if (!playing[curProblem])
					showCounters();
			});
			for (var k = 0; k < divs.length; ++k){
				$('#' + divs[k] + curProblem).draggable({
					connectToSortable: ('#sortable' + curProblem),
					helper: 'clone',
					revert: 'invalid',
					cursor: 'default'
				});
				$('#' + divs[k] + curProblem).live('dblclick', function(){
					if ($(this).attr('ifLi'))
						return;
					for (var j = 0; j < divs.length; ++j)
						if ($(this).hasClass(divs[j]))
							addNewCmd(divs[j], true);
					updated();
				});
			}
			$('#aboutBtn' + curProblem).click(function() {
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
			title: 'О системе',
		});
		$('#about').html('Здесь будет help и информация о системе');
  		for (var i = 0; i < problems.length; ++i){
			curState[i] = new Object();
			curCmdList[i] = new Array();
			curState[i] = {'cmdIndex': 0, 'divIndex': 0, 'step': 0, 'divName': ''};
			curDir[i] = startDir[i];
			curX[i] = startX[i];
			curY[i] = startY[i];
			speed[i] = 300;
			life[i] = problems[i].start_life;
			pnts[i] = problems[i].start_points;
			pause[curProblem] = false;
			stopped[curProblem] = false;
			playing[curProblem] = false;
			dead[curProblem] = false;
			cmdListEnded[i] = false;
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