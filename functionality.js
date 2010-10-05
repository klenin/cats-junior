	const map = new Array(10);
	var cur_x = 0;
	var cur_y = 1;
	var cur_dir = "right";
	var cur_i = 0;
	var speed = 300;
	map[0] = new Array('#','#','#', '#', '#', '#', '#', '#', '#', '#');
	map[1] = new Array('.','.','.', '.', '.', '.', '.', '.', '.', '#');
	map[2] = new Array('#','#','#', '#', '#', '#', '#', '#', '.', '#');
	map[3] = new Array('#','.','.', '.', '.', '.', '.', '#', '.', '#');
	map[4] = new Array('#','.','#', '#', '#', '#', '.', '#', '.', '#');
	map[5] = new Array('#','.','#', '.', '#', '#', '.', '#', '.', '#');
	map[6] = new Array('#','.','#', '.', '.', '.', '.', '#', '.', '#');
	map[7] = new Array('#','.','#', '#', '#', '#', '#', '#', '.', '#');
	map[8] = new Array('#','.','.', '.', '.', '.', '.', '.', '.', '#');
	map[9] = new Array('#','#','#', '#', '#', '#', '#', '#', '#', '#');
	const classNames = {
		"forward ui-draggable": "forward1 ui-draggable",
		"forward1 ui-draggable": "forward ui-draggable",
		"left ui-draggable":"left1 ui-draggable",
		"left1 ui-draggable":"left ui-draggable",
		"right ui-draggable": "right1 ui-draggable",
		"right1 ui-draggable": "right ui-draggable"
		};
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
	document.write("<div class = 'field'>");
	document.writeln("<table border = '0''>");
	for (var i = 0; i < map.length; ++i){
		document.writeln("<tr>");
		for (var j = 0; j < map[i].length; ++j){
			map[i][j] == '.'  ? document.writeln("<td class = 'floor' id = '"+(i * 100 + j)+"'>") : document.writeln("<td class = 'wall' id = '"+(i * 100 + j)+"'>");
			document.writeln("</td>");
		}
		document.writeln("</tr>");
	}
	document.writeln("</table>");
	document.writeln("</div>");
	$(document).ready(function(){
		const commands = document.body.children[3].children[1].children[2];
		const maxx = 185;
		const miny = 0;
		var s = "#" + (cur_y * 100 + cur_x);
		$(s).append("<div class = '" + cur_dir + "'></div>");
		var divs = new Array("forward", "left", "right");
		$( "#sortable" ).sortable({
			revert: false,
			beforeStop: function(event, ui){
				if (ui.position.left > maxx || ui.position.top < miny)
					ui.item.remove();
			},
			cursor: 'move',
		});
		$( "#sortable" ).bind( "sortupdate", function(event, ui) {
			updated();
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
		function updated(){
			var arr = $("#sortable").sortable('toArray');
			cur_cmd_class = commands.children[cur_i].classList[0];
			if (arr.length < cur_list.length || cur_cmd_class[cur_cmd_class.length - 1] != "1")	{
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
			for (i = 0; i < commands.childElementCount; ++i){
				cur_cmd_class = commands.children[i].classList[0];
				if (cur_cmd_class[cur_cmd_class.length - 1] == "1")
					commands.children[i].className = classNames[commands.children[i].className];
			}
		}
		function setDefault(f){
			var s = '#' + (cur_y * 100 + cur_x);
			$(s).empty();
			cur_x = 0;
			cur_y = 1;
			cur_dir = 'right';
			if (commands.childElementCount > cur_i){
				var t = commands.children[cur_i];
				if (t.classList[0][t.classList[0].length - 1] == "1")
					t.className = classNames[t.className];
			}
			cur_i = 0;
			if (!f){
				s = "#" + (cur_y * 100 + cur_x);
				$(s).append("<div class = '" + cur_dir + "'></div>");
			}
		}
		function play(cnt){
			var result = $('#sortable').sortable('toArray');
			if (!cnt)
				cnt = result.length;
			if (result[cur_i] == "")
				++cur_i;
			var dx = 0;
			var dy = 0;
			var i = cur_i;
			function loop(i){
				if (i > cur_i && speed != 0){
					var t = commands.children[i - 1];
					t.className = classNames[t.className];
				}
				var x = cur_x;
				var y = cur_y;
				dx = changeDir[result[i]][cur_dir]["dx"];
				dy = changeDir[result[i]][cur_dir]["dy"];
				cur_dir = changeDir[result[i]][cur_dir]["cur_dir"];
				if (cur_x + dx >= 0 && cur_x + dx < map[0].length && cur_y + dy >= 0 && cur_y < map.length)
					if (map[cur_y + dy][cur_x + dx] == '.'){
						cur_x += dx;
						cur_y += dy;
					}
					else
						alert('Уткнулись в стенку');
				else
					alert('Выход за границы лабиринта');
				if (!(speed == 0 && (i + 1) < cnt)){
					s = '#' + (y * 100 + x);
					$(s).empty();
					s = '#' + (cur_y * 100 + cur_x);
					$(s).append('<div class = "' + cur_dir+'"></div>');
					var t = commands.children[i];
					t.className = classNames[t.className];
					setTimeout(function() { if (++i <cnt) loop(i); else cur_i = i - 1;}, speed);
				}
				else{
					if (++i <cnt) loop(i); else cur_i = i - 1;
				}
				
			}
			$("#sortable").sortable( "disable" );
			loop(i);
			$("#sortable").sortable( "enable" );
		}
		document.btn_form.btn_play.onclick = function(){
			setDefault();
			play();
		}
		document.btn_form.btn_continue.onclick = function(){
			++cur_i;
			clearClasses();
			play();
		}
		document.btn_form.btn_clear.onclick = function(){
			setDefault();
			$('#sortable').empty();
		}
		document.btn_form.btn_stop.onclick = function(){
			setDefault();
			
		}
		document.btn_form.btn_pause.onclick = function(){
			
		}
		document.btn_form.btn_next.onclick = function(){
			if (cur_i + 1 < $("#sortable").sortable('toArray').length)
			{
				if (commands.childElementCount > cur_i){
					var t = commands.children[cur_i];
					if (t.classList[0][t.classList[0].length - 1] == "1")
						t.className = classNames[t.className];
				}
				++cur_i;
				play(1);
			}
		}
		document.btn_form.btn_prev.onclick = function(){
			if (cur_i > 0){
				var t = cur_i;
				setDefault(true);
				var s = speed;
				speed = 0;
				play(t);
				speed = s;
			}
		}
	});
