	var cur_i = 0;
	var speed = 300;
	var pause = false;
	var stopped = false;
	var playing = false;
	var cur_map = new Array();
	var start_dir;
	var map;
	//var count = new Array();
	/*var styles;
	var goal_coord_x = new Array();
	var goal_coord_y = new Array();
	var goal_styles = new Array();*/
	var goal = {
		"list": [],
		"names": [],
		"style_list": [],
		"goal_count":[],
		"cur_count":[],
		"goal":[],
		"styles": [],
		"coord": {
			"x": [],
			"y": []
		}		
	};
	const classNames = {
		"forward ui-draggable": "forward1 ui-draggable",
		"forward1 ui-draggable": "forward ui-draggable",
		"left ui-draggable":"left1 ui-draggable",
		"left1 ui-draggable":"left ui-draggable",
		"right ui-draggable": "right1 ui-draggable",
		"right1 ui-draggable": "right ui-draggable"
		};
	const classes = new Array ("forward", "left", "right", "forward1", "left1", "right1");
	const changeDir = {
		"forward":{
			"up": {dx: 0, dy: -1, cur_dir: "up"},
			"down": {dx: 0, dy: 1, cur_dir: "down"},
			"left":{dx: -1, dy: 0, cur_dir: "left"},
			"right": {dx: 1, dy: 0, cur_dir: "right"},
		},
		"left":{
			"up": {dx: 0, dy: 0, cur_dir: "left"},
			"down": {dx: 0, dy: 0, cur_dir: "right"},
			"left":{dx: 0, dy: 0, cur_dir: "down"},
			"right": {dx: 0, dy: 0, cur_dir: "up"},
		},
		"right":{
			"up": {dx: 0, dy: 0, cur_dir: "right"},
			"down": {dx: 0, dy: 0, cur_dir: "left"},
			"left":{dx: 0, dy: 0, cur_dir: "up"},
			"right": {dx: 0, dy: 0, cur_dir: "down"},
			
		}
	}
	const dirs = {"R": "right", "L": "left", "U": "up", "D": "down"}
	$.ajax({
		async: false,
		dataType : "json",
		url: 'tests/01.json',
		success: function(data) {
			map = data.map.slice();
			goal["list"] = data.goals.slice();
			goal["style_list"] = data.styles.slice();
			goal["goal_count"] = data.goal_count.slice();
			goal["names"] = data.names.slice();
		}
	});
	for (var k = 0; k < map.length; ++k){
		cur_map[k] = new Array();
		for (var l = 0; l < map[k].length; ++l)
			cur_map[k][l] = map[k][l];
	}
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
			for (var k = 0; k < goal["list"].length; ++k){
				if (cur_map[i][j] == goal["list"][k]){
					goal["coord"]["x"].push(j);
					goal["coord"]["y"].push(i);
					goal["styles"].push(goal["style_list"][k]);
					++goal["goal_count"][k];
					goal["cur_count"][k] = 0;
					goal["goal"].push(goal["list"][k]);
					break;
				}
			}
			document.writeln("</td>");
		}
		document.writeln("</tr>");
	}
	document.writeln("</table>");
	document.writeln("</div>");
	$(document).ready(function(){
		const maxx = 185;
		const miny = 0;
		var cur_dir = start_dir;
		var cur_x = start_x;
		var cur_y = start_y;
		var console = document.getElementById("console");
		console.value = "";
		var s = "#" + (cur_y * 100 + cur_x);
		$(s).append("<div class = '" + cur_dir + "'></div>");
		for (var k = 0; k < goal["styles"].length; ++k){
			s = "#" + (goal["coord"]["y"][k] * 100 + goal["coord"]["x"][k]);
			$(s).append("<div class = '" + goal["styles"][k] + "'></div>");
		}
		var divs = new Array("forward", "left", "right");
		$( "#sortable" ).sortable({
			revert: false,
			beforeStop: function(event, ui){
				if (ui.position.left > maxx || ui.position.top < miny)
					ui.item.remove();
				updated();
			},
			cursor: 'move',
		});
		var cur_list = $("#sortable").sortable('toArray');
		for (var i = 0; i < 3; ++i)
		{
			$("#" + divs[i]).draggable({
				connectToSortable: '#sortable',
				helper: 'clone',
				revert: 'invalid',
				cursor: 'default',
			});
		}
		$( "ul, li" ).disableSelection();
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
		function clearClasses(){
			var el = $("#sortable").children();
			for (var i = 0; i < el.length; ++i){
				if (isChangedClass(el[i]))
					changeClass(el[i]);
			}
		}
		function setDefault(f){
			enableButtons();
			var s = '#' + (cur_y * 100 + cur_x);
			$(s).empty();
			for (var k = 0; k < goal["styles"].length; ++k){
				if (cur_map[goal["coord"]["y"][k]][goal["coord"]["x"][k]] == '.'){
					s = "#" + (goal["coord"]["y"][k] * 100 + goal["coord"]["x"][k]);
					$(s).empty();
					$(s).append("<div class = '" + goal["styles"][k] + "'></div>");
				}
				goal["cur_count"][k] = 0;
			}
			for (var k = 0; k < map.length; ++k){
				for (var l = 0; l < map[k].length; ++l)
					cur_map[k][l] = map[k][l];
			}
			pause = false;
			console.value = "";
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
						console.value +=  "Шаг " + (cur_list[0] == "" ? i : i + 1) + ": Уткнулись в стенку \n";
				else
					console.value += "Шаг " + (cur_list[0] == "" ? i : i + 1) + ": Выход за границу лабиринта \n";
				for (var k = 0; k < goal["list"].length; ++k){
					if (cur_map[cur_y][cur_x] == goal["list"][k]){
						++goal["cur_count"][k];
						cur_map[cur_y][cur_x] = '.';
						if (goal["cur_count"][k] == goal["goal_count"][k])
							console.value +=  "Шаг " + (cur_list[0] == "" ? i : i + 1) + ": Нашли все артефакты '" + goal["names"][k] + "' \n";
						else
							console.value +=  "Шаг " + (cur_list[0] == "" ? i : i + 1) + ": Нашли артефакт '" +goal["names"][k] + "', " + goal["cur_count"][k] +"-й \n";
						s = '#' + (cur_y * 100 + cur_x);
						$(s).empty();
						break;
					}
				}
				if (!(speed == 0 && (i + 1) < cnt)){
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
		function callPlay(s){
			disableButtons();
			if (cur_i + 1 < cur_list.length){
				++cur_i;
				clearClasses();
			}
			else
				setDefault();
			setTimeout(function() { play(); }, s);
		}
		document.btn_form.btn_play.onclick = function(){
			callPlay(300);
		}
		document.btn_form.btn_fast.onclick = function(){
			callPlay(100);
		}
		document.btn_form.btn_clear.onclick = function(){
			setDefault();
			$('#sortable').empty();
		}
		document.btn_form.btn_stop.onclick = function(){
			stopped = true;
			if (!playing){
				setDefault();
				clearClasses();
			}
		}
		document.btn_form.btn_pause.onclick = function(){
			pause = true;
			enableButtons();
		}
		document.btn_form.btn_next.onclick = function(){
			disableButtons();
			if (cur_i + 1 < $("#sortable").sortable('toArray').length){
				if (cur_list.length > cur_i){
					var el = $("#sortable").children();
					changeClass(el[cur_list[0] == "" ? cur_i : cur_i + 1]);
				}
				++cur_i;
				play(1);
			}
			else
				enableButtons();			
		}
		document.btn_form.btn_prev.onclick = function(){
			disableButtons();
			if(cur_i == 0 || cur_list[cur_i - 1] == "")
				setDefault();
			else if (cur_i > 0){
				var t = cur_i;
				setDefault(true);
				var s = speed;
				speed = 0;
				play(t);
				speed = s;
			}
		}
	});
