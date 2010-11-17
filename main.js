	$(document).ready(function(){
		$("#tabs").tabs({
			select: function(event, ui) {
				  curProblem = ui.index;
				  //alert(curProblem);
			}
		});
		fillTabs();
		//$("#tabs").tabs();
		document.title = "";

		for (var i = 0; i < problems.length; ++i){
			curI[i] = 0;
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
			$( "ul, li" ).disableSelection();
		}
		submitClick = function(){
			callScript('http://imcs.dvgu.ru/cats/main.pl?f=login;login=test;passwd=test;json=1;', function(data){
				if (data.status == "ok")
					sid = data.sid;
				else
					alert("Ошибка подключения к серверу. Попробуйте снова");
			});
			chooseProblem();
			chooseUser();
			var result = "";
			var curList = $("#sortable" + curProblem).sortable("toArray");
			for (var i = 1; i < curList.length - 1; ++i)
				result += "id" + i + "=" + curList[i] + "&";
			if (curList.length > 1)
				result += "id" + (curList.length - 1) + "=" + curList[curList.length - 1];
	
		}
	});
