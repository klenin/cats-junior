	function getProblemStatement(){
		$.ajax({
			async: false,
			dataType : "json",
			url: 'problems/01/problem.json',
			success: function(data) {
				problem.name = data.name;
				problem.statement = data.statement;
				problem.testsNum = data.testsNum;
				problem.commands = data.commands.slice();
				element.list = data.elements.list.slice();
				element.style_list = data.elements.styles.slice();
				element.count = data.elements.count.slice();
				element.names = data.elements.names.slice();
				element["do"] = data.elements["do"].slice();
				element.pnts = data.elements.pnts.slice();
				element.d_life = data.elements.d_life.slice();
			}
		});
	}
	function getTest(i){
		$.ajax({
			async: false,
			dataType : "json",
			url: 'problems/01/tests/' + i +'.json',
			success: function(data) {
				map = data.map.slice();
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
				for (var k = 0; k < element.list.length; ++k){
					if (cur_map[i][j] == element.list[k]){
						element.coord.x.push(j);
						element.coord.y.push(i);
						element.style.push(element.style_list[k]);
						element.cur_count[k] = 0;
						element.elem.push(element.list[k]);
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
		document.btn_form.btn_play.disabled = false;
		document.btn_form.btn_next.disabled = false;
		document.btn_form.btn_prev.disabled = false;
		document.btn_form.btn_fast.disabled = false;
	}
	function disableButtons(){
		document.btn_form.btn_play.disabled = true;
		document.btn_form.btn_next.disabled = true;
		document.btn_form.btn_prev.disabled = true;
		document.btn_form.btn_fast.disabled = true;
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
		if (arr.length < cur_list.length ||  !isChangedClass(el[cur_list[0] == "" ? cur_i : cur_i + 1])){
			setDefault();
			clearClasses();
			cur_list = arr;
			return;
		}
		else {
			for (var i = 0; i < cur_list.length; ++i){
				if (cur_list[i] != arr[i]){
					setDefault();
					cur_list = arr;
					return;
				}
			}
			cur_list = arr;
		}
	}
	function setDefault(f){
		enableButtons();
		var s = '#' + (cur_y * 100 + cur_x);
		$(s).empty();
		for (var k = 0; k < element.coord.x.length; ++k){
			if (cur_map[element.coord.y[k]][element.coord.x[k]] == '.'){
				s = "#" + (element.coord.y[k] * 100 + element.coord.x[k]);
				$(s).empty();
				$(s).append("<div class = '" + element.style[k] + "'></div>");
			}
			element.cur_count[k] = 0;
		}
		copyMap();
		pause = false;
		$("#cons").empty();
		cur_dir = start_dir;
		cur_x = start_x;
		cur_y = start_y;
		if (!stopped && cur_list.length > cur_i){
			var el = $("#sortable").children();
			changeClass(el[cur_list[0] == "" ? cur_i : cur_i + 1]);
		}
		stopped = false;
		cur_i = 0;
		if (!f){
			s = "#" + (cur_y * 100 + cur_x);
			$(s).append("<div class = '" + cur_dir + "'></div>");
		}
	}
	function play(cnt){
		function loop(i){
			if (pause){
				pause = false;
				cur_i = i - 1;
				return;
			}
			if (stopped){
				stopped = false;
				cur_i = i - 1;
				setDefault();
				return;
			}
			if (i > cur_i && speed != 0){
				var el = $("#sortable").children();
				changeClass(el[cur_list[0] == "" ? i - 1 : i]);
			}
			var x = cur_x;
			var y = cur_y;
			dx = changeDir[result[i]][cur_dir]["dx"];
			dy = changeDir[result[i]][cur_dir]["dy"];
			cur_dir = changeDir[result[i]][cur_dir]["cur_dir"];
			if (cur_x + dx >= 0 && cur_x + dx < cur_map[0].length && cur_y + dy >= 0 && cur_y < cur_map.length)
				if (cur_map[cur_y + dy][cur_x + dx] != '#'){
					cur_x += dx;
					cur_y += dy;
				}
				else
					$("#cons").append("Шаг " + (cur_list[0] == "" ? i : i + 1) + ": Уткнулись в стенку \n");
			else
				$("#cons").append("Шаг " + (cur_list[0] == "" ? i : i + 1) + ": Выход за границу лабиринта \n");
			if (!(checkCell(i) && speed == 0 && (i + 1) < cnt)){
				s = '#' + (y * 100 + x);
				$(s).empty();
				s = '#' + (cur_y * 100 + cur_x);
				$(s).append('<div class = "' + cur_dir+'"></div>');
				var el = $("#sortable").children();
				changeClass(el[cur_list[0] == "" ? i : i + 1]);
				setTimeout(function() { 
					if (++i <cnt) loop(i); 
					else {
						cur_i = i - 1; 
						playing = false;
						enableButtons();
					}
					}, speed);
			}
			else{
				if (++i <cnt)
					loop(i); 
				else {
					cur_i = i - 1; 
					playing = false;
					enableButtons();
				}
			}	
		}
		disableButtons();
		playing = true;
		var result = $('#sortable').sortable('toArray');
		if (!cnt)
			cnt = result.length;
		if (result[cur_i] == "")
			++cur_i;
		var dx = 0;
		var dy = 0;
		var i = cur_i;
		$("#sortable").sortable( "disable" );
		loop(i);
		$("#sortable").sortable( "enable" );
	}