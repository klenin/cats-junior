	function copyMap(i){
		curMap[i] = [];
		for (var k = 0; k < map[i].length; ++k){
			curMap[i][k] = new Array();
			for (var l = 0; l < map[i][k].length; ++l)
				curMap[i][k][l] = map[i][k][l];
		}
	}
	function fillLabyrinth1(l){
		$("#field" + l).append("<table border = '0''>")
		for (var i = 0; i < curMap[l].length; ++i){
			$("#field" + l).append("<tr>");
			for (var j = 0; j < curMap[l][i].length; ++j){
				curMap[l][i][j] == '#'  ? $("#field" + l).append("<td class = 'wall' id = '"+(l * 10000 + i * 100 + j)+"'>") : 
										$("#field" + l).append("<td class = 'floor' id = '"+(l * 10000 + i * 100 + j)+"'>");
				if (curMap[l][i][j] == "R" || curMap[l][i][j] == "L" || curMap[l][i][j] == "U" || curMap[l][i][j] == "D"){
					startDir = dirs[curMap[l][i][j]];
					start_x = j;
					start_y = i;
				}
				for (var k = 0; k < specSymbols[l].list.length; ++k){
					if (curMap[l][i][j] == specSymbols[l].list[k]){
						specSymbols[l].coord.x.push(j);
						specSymbols[l].coord.y.push(i);
						specSymbols[l].style.push(specSymbols[l].style_list[k]);
						specSymbols[l].cur_count[k] = 0;
						specSymbols[l].symb.push(specSymbols[l].list[k]);
						break;
					}
				}
				$("#field" + l).append("</td>");
			}
			$("#field" + l).append("</tr>");
		}
		$("#field" + l).append("</table>");
	}
	function callScript(url, callback){
		$.ajax({
			async: false,
			dataType : "json",
			url: 'script.php',
			data: 'url='+ url,
			success: function(data) {
				callback(data);
			}
		});
	}
	function getProblemStatement(i){
		$.ajax({
			async: false,
			dataType : "json",
			url: 'problems/' + (i + 1) + '/problem.json',
			success: function(data) {
				problems[i] = new Object();
				problems[i].name = data.name;
				problems[i].statement = data.statement;
				problems[i].testsNum = data.testsNum;
				problems[i].commands = data.commands.slice();
				problems[i].start_life = data.start_life;
				problems[i].d_life = data.d_life;
				problems[i].start_pnts = data.start_pnts;
				problems[i].finish_symb = data.finish_symb;
				i = i;
			}
		});
	}
	function getTest(l, k){
		$.ajax({
			async: false,
			dataType : "json",
			url: 'problems/' + (l  + 1) + '/tests/' + k +'.json',
			success: function(data) {
				map[l] = [];
				map[l] = data.map.slice();
				var tmp = data.spec_symbols;
				specSymbols[l] = new Object();
				specSymbols[l].list  = [];
				specSymbols[l].style_list = [];
				specSymbols[l].count = [];
				specSymbols[l].names = [];
				specSymbols[l].points = [];
				specSymbols[l].d_life = [];
				specSymbols[l]["do"] = [];
				specSymbols[l].coord = new Object();
				specSymbols[l].coord.x = [];
				specSymbols[l].coord.y = [];
				specSymbols[l].style = [];
				specSymbols[l].cur_count = [];
				specSymbols[l].symb = [];
				specSymbols[l].symbol = [];
				for (var i = 0; i < tmp.length; ++i){
					specSymbols[l].list[i]  = tmp[i].symbol;
					specSymbols[l].style_list[i] = tmp[i].style;
					specSymbols[l].count[i] = tmp[i].count;
					specSymbols[l].names[i] = tmp[i].name;
					specSymbols[l].points[i] = tmp[i].points;
					specSymbols[l].d_life[i] = tmp[i].d_life;
					specSymbols[l]["do"][i] = tmp[i]["do"];
				}
				problems[l].cleaner = data.cleaner.slice();
				problems[l].cleaned = [];
				for (var i = 0; i < data.cleaned.length; ++i){
					problems[l].cleaned[i] = data.cleaned[i].slice();
				}
				if (data.commands)
					problems[l].commands = data.commands.slice();
				if (data.start_life)
					problems[l].start_life = data.start_life;
				if (data.d_life)
					problems[l].d_life = data.d_life;
				if (data.start_pnts)
					problems[l].start_pnts = data.start_pnts;
				if (data.finish_symb)
					problems[l].finish_symb = data.finish_symb;
				var tmp = data.moving_elements;
				movingElems[l] = new Object();
				movingElems[l].style = [];
				movingElems[l].path = [];
				movingElems[l].looped = [];
				movingElems[l].die = [];
				movingElems[l].symbol = [];
				for (var i = 0; i < tmp.length; ++i){
					movingElems[l].style.push(tmp[i].style);
					movingElems[l].path[i] = [];
					for (var j = 0; j < tmp[i].path.length; ++j)
						movingElems[l].path[i].push(tmp[i].path[j]);
					movingElems[l].looped.push(tmp[i].looped);
					movingElems[l].die.push(tmp[i].die);
					movingElems[l].symbol.push(mElemId++);
					map[l][tmp[i].path[0].y][tmp[i].path[0].x] = "" + mElemId;
				}
			}
		});
	}
	function fillTabs(){
		callScript('http://imcs.dvgu.ru/cats/main.pl?f=login;login=test;passwd=test;json=1;', function(data){
				if (data.status == "ok")
					sid = data.sid;
				else
					alert("Ошибка подключения к серверу. Попробуйте снова");
			});
		callScript('http://imcs.dvgu.ru/cats/main.pl?f=problems;sid='+sid+';cid='+cid+';json=1;', function(data){
			for (var i = 0; i < 3/*data.problems.length*/; ++i){
				getProblemStatement(i);
				getTest(i, 1);
				problemsList.push({"id":data.problems[i].id, "name": data.problems[i].name});
				$("#tabs").tabs("add", "#ui-tabs-" + (i + 1)*2,problems[i].name );
				$("#ui-tabs-" + (i + 1)*2).append('<div class = "statement" id = "statement' + i + '">');
				$("#ui-tabs-" + (i + 1)*2).append('</div>');
				$("#ui-tabs-" + (i + 1)*2).append('<div class = "comands" id = "comands' + i + '">');
				$("#comands" + i).append('<div class = "drag" id = "drag' + i + '">');
				$("#drag" + i).append('<ul class = "ul_comands" id = "ul_comands' + i + '">');
				$("#ul_comands" + i).append('<li id = "forward' + i + '" class = "forward"><span style = "margin-left: 40px;">Прямо</span></li>');
				$("#ul_comands" + i).append('<li id = "left' + i + '" class = "left"><span style = "margin-left: 40px;">Налево</span></li>');
				$("#ul_comands" + i).append('<li id = "right' + i + '" class = "right"><span style = "margin-left: 40px;">Направо</span></li>');
				$("#ul_comands" + i).append('<li id = "wait' + i + '" class = "wait"><span style = "margin-left: 40px;">Ждать</span></li>');
				$("#drag" + i).append('</ul>');
				$("#comands" + i).append('</div>');
				$("#ui-tabs-" + (i + 1)*2).append('</div>');
				$("#ui-tabs-" + (i + 1)*2).append('<div class = "drop" id = "drop' + i + '">');
				$("#drop" + i).append('<hr><br>');
				$("#drop" + i).append('Укажите последовательность действий');
				$("#drop" + i).append('<ul id = "sortable' + i + '">');
				$("#sortable" + i).append('<li class = "invisible"></li>');
				$("#drop" + i).append('</ul>');
				$("#ui-tabs-" + (i + 1)*2).append('</div>');
				$("#ui-tabs-" + (i + 1)*2).append('<div class = "btn" id = "btn' + i + '">');
				$("#btn" + i).append('<form name = "btn_form' + i + '" id = "btn_form' + i +'">');
				$("#btn_form" + i).append('<input type = "button" class = "clear" name = "btn_clear' + i + '" onClick = "clearClick"></input>');
				$("#btn_form" + i).append('<input type = "button" class = "play" name = "btn_play' + i + '" onClick = "playClick"></input>');
				$("#btn_form" + i).append('<input type = "button" class = "pause" name = "btn_pause' + i + '" onClick = "pauseClick"></input>');
				$("#btn_form" + i).append('<input type = "button" class = "stop" name = "btn_stop' + i + '" onClick = "stopClick"></input>');
				$("#btn_form" + i).append('<input type = "button" class = "next" name = "btn_next' + i + '" onClick = "nextClick"></input> <br>');
				$("#btn_form" + i).append('<input type = "button" class = "prev" name = "btn_prev' + i + '" onClick = "prevClick"></input>');
				$("#btn_form" + i).append('<input type = "button" class = "fast" name = "btn_fast' + i + '" onClick = "fastClick"></input>');
				$("#btn" + i).append('</form>');
				$("#ui-tabs-" + (i + 1)*2).append('</div>');
				$("#ui-tabs-" + (i + 1)*2).append('<div class = "field" id = "field' + i + '">');
				$("#ui-tabs-" + (i + 1)*2).append('</div>');
				$("#ui-tabs-" + (i + 1)*2).append('<div class = "cons_div" id = "cons_div' + i + '">');
				$("#cons_div" + i).append('<form name = "cons_form" id = "cons_form' + i + '">');
				$("#cons_form" + i).append('<textarea rows="37" cols="20" name="cons" id = "cons' + i + '" class = "cons" disabled readonly></textarea><br>');
				$("#cons_form" + i).append('<input type = "button" name="submit' + i + '" id = "submit' + i + '" class = "submit" onClick = submitClick></input>');
				$("#cons_div" + i).append('</form>');
				$("#ui-tabs-" + (i + 1)*2).append('</div>');
				copyMap(i);
				fillLabyrinth1(i);
				$("#statement" + i).append(problems[i].statement);
				var divs = problems[i].commands;
				$( "#sortable" + i ).sortable({
					revert: false,
					beforeStop: function(event, ui){
						if (ui.position.left > maxx || ui.position.top < miny)
							ui.item.remove();
						updated();
					},
					cursor: 'move',
				});
				curList = $("#sortable" + i).sortable('toArray');
				for (var k = 0; k < divs.length; ++k)
				{
					$("#" + divs[k] + i).draggable({
						connectToSortable: '#sortable' + i,
						helper: 'clone',
						revert: 'invalid',
						cursor: 'default',
					});
				}
			}
		});		
	}
	function enableButtons(){
		with (document.btn_form){
			btn_play.disabled = false;
			btn_next.disabled = false;
			btn_prev.disabled = false;
			btn_fast.disabled = false;
		}
	}
	function disableButtons(){
		with (document.btn_form){
			btn_play.disabled = true;
			btn_next.disabled = true;
			btn_prev.disabled = true;
			btn_fast.disabled = true;
		}
	}
	function changeClass(elem){
		if (!elem || elem.classList[0] == "invisible")
			return false;
		elem.className = classNames[elem.className];
	}
	function isChangedClass(elem){
		if (!elem || elem.classList[0] == "invisible")
			return false;
		if (elem.classList[0][elem.classList[0].length - 1] == "1")
			return true;
		return false;
	}
	function clearClasses(){
		var el = $("#sortable").children();
		for (var i = 0; i < el.length; ++i){
			if (isChangedClass(el[i]))
				changeClass(el[i]);
		}
	}
	function updated(){
		var arr = $("#sortable").sortable('toArray');
		var el = $("#sortable").children();
		if (arr.length < curList.length ||  !isChangedClass(el[curI])){
			setDefault();
			clearClasses();
			curList = arr;
		}
		else {
			for (var i = 0; i < curI; ++i){
				if (curList[i] != arr[i]){
					setDefault();
					break;
				}
			}
			curList = arr;
		}
	}
	function setDefault(f){
		enableButtons();
		dead = false;
		var s = '#' + (curProblem* 10000 + curY * 100 + curX);
		$(s).empty();
		for (var i = 0; i < curMap.length; ++i){
			for (var j = 0; j < curMap[i].length; ++j){
				s = '#' + (curProblem* 10000 + i * 100 + j);
				$(s).empty();
			}
		}
		for (var k = 0; k < specSymbols.coord.x.length; ++k){
			s = "#" + (curProblem* 10000 + specSymbols.coord.y[k] * 100 + specSymbols.coord.x[k]);
			$(s).empty();
			$(s).append("<div class = '" + specSymbols.style[k] + "'></div>");
			specSymbols.cur_count[k] = 0;
		}
		for (var k = 0; k < movingElems.symbol.length; ++k){
			s = "#" + (curProblem* 10000 + movingElems.path[k][curI % movingElems.symbol.length].y * 100 + movingElems.path[curI % movingElems.symbol.length][0].x);
			$(s).empty();
			s = "#" + (curProblem* 10000 + movingElems.path[k][0].y * 100 + movingElems.path[k][0].x);
			$(s).prepend("<div class = '" + movingElems.style[k] + "'></div>");
		}
		for (var k = 0; k < problem.cleaner.length; ++k){
			for (var l = 0; l < problem.cleaned[k].length; ++l){
				var y = problem.cleaned[k][l].y;
				var x = problem.cleaned[k][l].x
				s = '#' + (curProblem* 10000 + y * 100 + x);
				$(s).removeClass('floor');
			}
		}
		copyMap();
		pause = false;
		$("#cons").empty();
		curDir = startDir;
		curX = start_x;
		curY = start_y;
		if (!stopped && curList.length > curI){
			var el = $("#sortable").children();
			changeClass(el[curI]);
		}
		stopped = false;
		curI = 0;
		if (!f){
			s = "#" + (curProblem* 10000 + curY * 100 + curX);
			$(s).append("<div class = '" + curDir + "'></div>");
		}
	}
	function loop(i, cnt){
		if (dead)
			return;
		var result = $('#sortable').sortable('toArray');
		if (pause || stopped){
			if (pause)
				pause = false;
			else{
				stopped = false;
				setDefault();
			}
			curI = i - 1;
			return;
		}
		if (i > curI && speed != 0){
			var el = $("#sortable").children();
			changeClass(el[i - 1]);
		}
		var x = curX;
		var y = curY;
		dx = changeDir[result[i]][curDir].dx;
		dy = changeDir[result[i]][curDir].dy;
		curDir = changeDir[result[i]][curDir].curDir;
		var checked = checkCell(i);
		if (dead)
			return;
		if (checked)
			if (curX + dx >= 0 && curX + dx < curMap[0].length && curY + dy >= 0 && curY < curMap.length)
				if (curMap[curY + dy][curX + dx] != '#'){
					curX += dx;
					curY += dy;
				}
				else{
						$("#cons").append("Шаг " + i + ": Уткнулись в стенку \n");
						var s = '#' + (curProblem* 10000 + curY * 100 + curX);
						$(s).effect("highlight", {}, 300);
					}
			else
				$("#cons").append("Шаг " + i + ": Выход за границу лабиринта \n");
		if (!(speed == 0 && (i + 1) < cnt)){
			if (checked){
				s = '#' + (curProblem* 10000 + y * 100 + x);
				$(s).empty();
				s = '#' + (curProblem* 10000 + curY * 100 + curX);
				$(s).append('<div class = "' + curDir+'"></div>');
			}
			var el = $("#sortable").children();
			changeClass(el[i]);
			setTimeout("nextStep(" + i + ", " + cnt + ")", speed);
		}
		else
			nextStep(i, cnt);
	}
	function nextStep(i, cnt){
		if (dead)
			return;
		if (++i <cnt) loop(i, cnt); 
		else {
			curI = i - 1; 
			playing = false;
			enableButtons();
		}
	}
	function play(cnt){
		if (dead)
			return;
		disableButtons();
		playing = true;
		var result = $('#sortable').sortable('toArray');
		if (!cnt)
			cnt = result.length;
		if (result[curI] == "")
			++curI;
		$("#sortable").sortable( "disable" );
		loop(curI, cnt);
		$("#sortable").sortable( "enable" );
	}