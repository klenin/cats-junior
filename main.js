	$(document).ready(function(){
		$("#tabs").tabs({
			select: function(event, ui) {
				curProblem = ui.index - 1;
			}
		});
		$("#tabs").tabs('paging', { cycle: false, follow: true, tabsPerPage: 0 } );
		fillTabs();
		document.title = "";
		for (var i = 0; i < 3; ++i)
			curCmdList[i] = [];
		cmdId = problems.length;
		divs = ["forward", "left", "right", "wait"];
		$( "#tabs" ).bind( "tabsshow", function(event, ui) {
			if (visited[curProblem])
				return;
			visited[curProblem] = 1;
			$( "#sortable" + curProblem).sortable({
				revert: false,
				cursor: 'move'
			});
			$( "#sortable" + curProblem ).bind( "sortbeforestop", function(event, ui) {
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
			});
			$( "#sortable" + curProblem ).bind( "click", function(event, ui) {
				if (!playing[curProblem])
					showCounters();
			});
			for (var k = 0; k < divs.length; ++k){
				$("#" + divs[k] + curProblem).draggable({
					connectToSortable: ("#sortable" + curProblem),
					helper: 'clone',
					revert: 'invalid',
					cursor: 'default'
				});
				$("#" + divs[k] + curProblem).live('dblclick', function(){
					if ($(this).attr('ifLi'))
						return;
					for (var j = 0; j < divs.length; ++j)
						if ($(this).hasClass(divs[j]))
							addNewCmd(divs[j], true);
					updated();
				});
			}
			$("#aboutBtn" + curProblem).click(function() {
				$("#about").dialog('open');
				return false;
			});
  		});  
		
		$("#about").dialog({
			modal: true,
			buttons: {
				Ok: function() {
					$( this ).dialog( "close" );
				}
			}, 
			autoOpen: false,
			title: 'О системе',
		});
		$("#about").html('Здесь будет help и информация о системе');
  		for (var i = 0; i < problems.length; ++i){
			curState[i] = new Object();
			curCmdList[i] = new Array();
			curState[i].cmdIndex = 0;
			curState[i].divIndex = 0;
			curState[i].step = 0;
			curState[i].divName = "";
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
			var s = "#" + (i* 10000 + curY[i] * 100 + curX[i]);
			$(s).append("<div class = '" + curDir[i] + "'></div>");
			for (var k = 0; k < specSymbols[i].style.length; ++k){
				s = "#" + (i* 10000 + specSymbols[i].coord.y[k] * 100 + specSymbols[i].coord.x[k]);
				$(s).prepend("<div class = '" + specSymbols[i].style[k] + "'></div>");
			}
			for (var k = 0; k < specSymbols[i].symbol.length; ++k){
				s = "#" + (i* 10000 + specSymbols[i].path[k][0].y * 100 + specSymbols[i].path[k][0].x);
				$(s).prepend("<div class = '" + specSymbols[i].style[k] + "'></div>");
			}
			for (var k = 0; k < movingElems[i].length; ++k){
				s = "#" + (i* 10000 + movingElems[i][k].path[0].y * 100 + movingElems[i][k].path[0].x);
				$(s).prepend("<div class = '" + movingElems[i][k].style + "'></div>");
			}
			highlightMap(i, curX[i], curY[i]);
			$( "ul, li" ).disableSelection();
		}
	});