	$(document).ready(function(){
		$("#tabs").tabs({
			select: function(event, ui) {
				curProblem = ui.index - 1;
			}
		});
		fillTabs();
		document.title = "";
		for (var i = 0; i < 3; ++i)
			curList[i] = [];
		cmdId = problems.length;
		divs = ["forward", "left", "right", "wait"];
		$( "#tabs" ).bind( "tabsshow", function(event, ui) {
			if (visited[curProblem])
				return;
			visited[curProblem] = 1;
			$( "#sortable" + curProblem).sortable({
				revert: false,
				cursor: 'move',
			});
			/*$("#btn_play" + curProblem).bind("click", function(event, ui){
				if ($("#btn_play" + curProblem).attr('disabled'))
					var i = i;
				$("#btn_play" + curProblem).attr('disabled', 'disabled');
				$("#btn_next" + curProblem).attr('disabled', 'disabled');
				$("#btn_prev" + curProblem).attr('disabled', 'disabled');
				$("#btn_fast" + curProblem).attr('disabled', 'disabled');
				$("#sortable" + curProblem).sortable( "disable" );	
				callPlay(300);
			});*/
			$( "#sortable" + curProblem ).bind( "sortbeforestop", function(event, ui) {
				if (ui.position.left > maxx || ui.position.top < miny)
					ui.item.remove();
				var id = ui.item[0].id;
				id = id.replace(/\d{1,}/, "");
				id += cmdId++;
				ui.item[0].id = id;
				updated();
			});
			for (var k = 0; k < divs.length; ++k){
				$("#" + divs[k] + curProblem).draggable({
					connectToSortable: ("#sortable" + curProblem),
					helper: 'clone',
					revert: 'invalid',
					cursor: 'default',
				});
				$("#" + divs[k] + curProblem).live('dblclick', function(){
					for (var j = 0; j < divs.length; ++j)
						if ($(this).hasClass(divs[j]))
							addNewCmd(divs[j]);
				});
			}
  		});    
  		for (var i = 0; i < problems.length; ++i){
			curCmdIndex[i] = 0;
			curDir[i] = startDir;
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
			for (var k = 0; k < movingElems[i].symbol.length; ++k){
				s = "#" + (i* 10000 + movingElems[i].path[k][curCmdIndex[i] % movingElems[i].symbol.length].y * 100 + movingElems[i].path[curCmdIndex[i] % movingElems[i].symbol.length][0].x);
				$(s).empty();
				s = "#" + (i* 10000 + movingElems[i].path[k][0].y * 100 + movingElems[i].path[k][0].x);
				$(s).prepend("<div class = '" + movingElems[i].style[k] + "'></div>");
			}
			$( "ul, li" ).disableSelection();
		}
	});