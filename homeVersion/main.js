	$(document).ready(function(){
		$("#tabs").tabs({
			select: function(event, ui) {
				curProblem = ui.index - 1;
			}
		});
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
				if (ui.position.left > maxx || ui.position.top < miny)
					ui.item.remove();
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
				$("#" + divs[k] + curProblem).bind( "dragstop", function(event, ui){
					/*for (var j = 0; j < divs.length; ++j)
						if ($(this).hasClass(divs[j]))
							addNewCmd(divs[j], false);*/
				});
				$("#" + divs[k] + curProblem).live('dblclick', function(){
					for (var j = 0; j < divs.length; ++j)
						if ($(this).hasClass(divs[j]))
							addNewCmd(divs[j], true);
					updated();
				});
			}
  		});    
  		for (var i = 0; i < problems.length; ++i){
			curState[i] = new Object();
			curCmdList[i] = new Array();
			curState[i].cmdIndex = 0;
			curState[i].divIndex = 0;
			curState[i].step = 0;
			curState[i].divName = "";
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
				s = "#" + (i* 10000 + movingElems[i].path[k][0].y * 100 + movingElems[i].path[k][0].x);
				$(s).prepend("<div class = '" + movingElems[i].style[k] + "'></div>");
			}
			$( "ul, li" ).disableSelection();
		}
	});