	function getProblemStatement(){
		$.ajax({
			async: false,
			dataType : "json",
			url: 'problems/03/problem.json',
			success: function(data) {
				with (problem){
					name = data.name;
					statement = data.statement;
					testsNum = data.testsNum;
					commands = data.commands.slice();
					start_life = data.start_life;
					d_life = data.d_life;
					start_pnts = data.start_pnts;
					finish_symb = data.finish_symb;
				}
			}
		});
	}
	function getTest(i){
		$.ajax({
			async: false,
			dataType : "json",
			url: 'problems/03/tests/' + i +'.json',
			success: function(data) {
				map = data.map.slice();
				var tmp = data.spec_symbols;
				for (var i = 0; i < tmp.length; ++i){
					with (spec_symbols){
						list.push(tmp[i].symbol);
						style_list.push(tmp[i].style);
						count.push(tmp[i].count);
						names.push(tmp[i].name);
						points.push(tmp[i].points);
						d_life.push(tmp[i].d_life);
					}
					spec_symbols["do"].push(tmp[i]["do"]);
				}
				with (problem){
					cleaner = data.cleaner.slice();
					for (var i = 0; i < data.cleaned.length; ++i)
						cleaned[i] =  data.cleaned[i].slice();
					if (data.commands)
						commands = data.commands.slice();
					if (data.start_life)
						start_life = data.start_life;
					if (data.d_life)
						d_life = data.d_life;
					if (data.start_pnts)
						start_pnts = data.start_pnts;
					if (data.finish_symb)
						finish_symb = data.finish_symb;
				}
				tmp = data.moving_elements;
				for (var i = 0; i < tmp.length; ++i){
					with (moving_elems){
						style.push(tmp[i].style);
						path[i] = [];
						for (var j = 0; j < tmp[i].path.length; ++j){
							path[i].push(tmp[i].path[j]);
						}
						looped.push(tmp[i].looped);
						die.push(tmp[i].die);
						symbol.push(m_elem_id++);
					}
					map[tmp[i].path[0].y, tmp[i].path[0].x] = m_elem_id;
				}
			}
		});
	}
	function copyMap(){
		for (var k = 0; k < map.length; ++k){
			cur_map[k] = new Array();
			for (var l = 0; l < map[k].length; ++l)
				cur_map[k][l] = map[k][l];
		}
	}
	function fillLabyrinth(){
		document.write("<div class = 'field'>");
		document.writeln("<table border = '0''>");
		for (var i = 0; i < cur_map.length; ++i){
			document.writeln("<tr>");
			for (var j = 0; j < cur_map[i].length; ++j){
				cur_map[i][j] == '#'  ? document.writeln("<td class = 'wall' id = '"+(i * 100 + j)+"'>") : document.writeln("<td class = 'floor' id = '"+(i * 100 + j)+"'>");
				if (cur_map[i][j] == "R" || cur_map[i][j] == "L" || cur_map[i][j] == "U" || cur_map[i][j] == "D"){
					start_dir = dirs[cur_map[i][j]];
					start_x = j;
					start_y = i;
				}
				with (spec_symbols)
					for (var k = 0; k < list.length; ++k){
						if (cur_map[i][j] == list[k]){
							coord.x.push(j);
							coord.y.push(i);
							style.push(style_list[k]);
							cur_count[k] = 0;
							symb.push(list[k]);
							break;
						}
					}
				document.writeln("</td>");
			}
			document.writeln("</tr>");
		}
		document.writeln("</table>");
		document.writeln("</div>");
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
		if (arr.length < cur_list.length ||  !isChangedClass(el[cur_i])){
			setDefault();
			clearClasses();
			cur_list = arr;
		}
		else {
			for (var i = 0; i < cur_i; ++i){
				if (cur_list[i] != arr[i]){
					setDefault();
					break;
				}
			}
			cur_list = arr;
		}
	}
	function setDefault(f){
		enableButtons();
		var s = '#' + (cur_y * 100 + cur_x);
		$(s).empty();
		for (var i = 0; i < cur_map.length; ++i){
			for (var j = 0; j < cur_map[i].length; ++j){
				s = '#' + (i * 100 + j);
				$(s).empty();
			}
		}
		for (var k = 0; k < spec_symbols.coord.x.length; ++k){
			s = "#" + (spec_symbols.coord.y[k] * 100 + spec_symbols.coord.x[k]);
			$(s).empty();
			$(s).append("<div class = '" + spec_symbols.style[k] + "'></div>");
			spec_symbols.cur_count[k] = 0;
		}
		for (var k = 0; k < moving_elems.symbol.length; ++k){
			s = "#" + (moving_elems.path[k][cur_i].y * 100 + moving_elems.path[cur_i][0].x);
			$(s).empty();
			s = "#" + (moving_elems.path[k][0].y * 100 + moving_elems.path[k][0].x);
			$(s).prepend("<div class = '" + moving_elems.style[k] + "'></div>");
		}
		for (var k = 0; k < problem.cleaner.length; ++k){
			for (var l = 0; l < problem.cleaned[k].length; ++l){
				var y = problem.cleaned[k][l].y;
				var x = problem.cleaned[k][l].x
				s = '#' + (y * 100 + x);
				$(s).removeClass('floor');
			}
		}
		copyMap();
		pause = false;
		$("#cons").empty();
		cur_dir = start_dir;
		cur_x = start_x;
		cur_y = start_y;
		if (!stopped && cur_list.length > cur_i){
			var el = $("#sortable").children();
			changeClass(el[cur_i]);
		}
		stopped = false;
		cur_i = 0;
		if (!f){
			s = "#" + (cur_y * 100 + cur_x);
			$(s).append("<div class = '" + cur_dir + "'></div>");
		}
	}
	function loop(i, cnt){
		var result = $('#sortable').sortable('toArray');
		if (pause || stopped){
			if (pause)
				pause = false;
			else{
				stopped = false;
				setDefault();
			}
			cur_i = i - 1;
			return;
		}
		if (i > cur_i && speed != 0){
			var el = $("#sortable").children();
			changeClass(el[i - 1]);
		}
		var x = cur_x;
		var y = cur_y;
		dx = changeDir[result[i]][cur_dir].dx;
		dy = changeDir[result[i]][cur_dir].dy;
		cur_dir = changeDir[result[i]][cur_dir].cur_dir;
		var checked = checkCell(i);
		if (checked)
			if (cur_x + dx >= 0 && cur_x + dx < cur_map[0].length && cur_y + dy >= 0 && cur_y < cur_map.length)
				if (cur_map[cur_y + dy][cur_x + dx] != '#'){
					cur_x += dx;
					cur_y += dy;
				}
				else{
						$("#cons").append("Шаг " + i + ": Уткнулись в стенку \n");
						var s = '#' + (cur_y * 100 + cur_x);
						$(s).effect("highlight", {}, 300);
					}
			else
				$("#cons").append("Шаг " + i + ": Выход за границу лабиринта \n");
		if (!(speed == 0 && (i + 1) < cnt)){
			if (checked){
				s = '#' + (y * 100 + x);
				$(s).empty();
				s = '#' + (cur_y * 100 + cur_x);
				$(s).append('<div class = "' + cur_dir+'"></div>');
			}
			var el = $("#sortable").children();
			changeClass(el[i]);
			setTimeout("nextStep(" + i + ", " + cnt + ")", speed);
		}
		else
			nextStep(i, cnt);
	}
	function nextStep(i, cnt){
		if (++i <cnt) loop(i, cnt); 
		else {
			cur_i = i - 1; 
			playing = false;
			enableButtons();
		}
	}
	function play(cnt){
		disableButtons();
		playing = true;
		var result = $('#sortable').sortable('toArray');
		if (!cnt)
			cnt = result.length;
		if (result[cur_i] == "")
			++cur_i;
		$("#sortable").sortable( "disable" );
		loop(cur_i, cnt);
		$("#sortable").sortable( "enable" );
	}