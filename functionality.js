	const map = new Array(10);
	var cur_x = 0;
	var cur_y = 1;
	var cur_dir = "right";
	var cur_i = 1;
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
	for (var i = 0; i < map.length; ++i)
	{
		document.writeln("<tr>");
		for (var j = 0; j < map[i].length; ++j)
		{
			map[i][j] == '.'  ? document.writeln("<td class = 'floor' id = '"+(i * 100 + j)+"'>") : document.writeln("<td class = 'wall' id = '"+(i * 100 + j)+"'>");
			document.writeln("</td>");
		}
		document.writeln("</tr>");
	}
	document.writeln("</table>");
	document.writeln("</div>");
	$(document).ready(function() {
		const commands = document.body.children[3].children[1].children[2];
		const maxx = 185;
		const miny = 0;
		var s = "#" + (cur_y * 100 + cur_x);
		var cur_id = 0;
		$(s).append("<div class = '" + cur_dir + "'></div>");
		var divs = new Array("forward", "left", "right");
		$( "#sortable" ).sortable({
			revert: false,
			beforeStop: function(event, ui){
				if (ui.position.left > maxx || ui.position.top < miny)
					ui.item.remove();
			}
		});
		for (var i = 0; i < 3; ++i)
		{
			$("#" + divs[i]).draggable({
				connectToSortable: '#sortable',
				helper: 'clone',
				revert: 'invalid',
			});
		}
		$( "ul, li" ).disableSelection();
		function play()
		{
			var result = $('#sortable').sortable('toArray');
			var dx = 0;
			var dy = 0;
			var i = cur_i;
			function loop(i)
			{
				if (i > cur_i)
				{
					var t = commands.children[i - 1];
					t.className = classNames[t.className];
				}
				var x = cur_x;
				var y = cur_y;
				dx = changeDir[result[i]][cur_dir]["dx"];
				dy = changeDir[result[i]][cur_dir]["dy"];
				cur_dir = changeDir[result[i]][cur_dir]["cur_dir"];
				if (cur_x + dx >= 0 && cur_x + dx < map[0].length && cur_y + dy >= 0 && cur_y < map.length)
				{
					if (map[cur_y + dy][cur_x + dx] == '.')
					{
						cur_x += dx;
						cur_y += dy;
					}
					else
					{
						alert('Уткнулись в стенку');
					}
				}
				else
				{
					alert('Выход за границы лабиринта');
				}
				s = '#' + (y * 100 + x);
				$(s).empty();
				s = '#' + (cur_y * 100 + cur_x);
				$(s).append('<div class = "' + cur_dir+'"></div>');
				var t = commands.children[i];
				t.className = classNames[t.className];
				setTimeout(function() { if (++i < result.length) loop(i); else cur_i = i - 1;}, 300);
			}
			loop(i);
		}
		document.btn_form.btn_play.onclick = function()
		{
			var s = '#' + (cur_y * 100 + cur_x);
			$(s).empty();
			cur_x = 0;
			cur_y = 1;
			cur_dir = 'right';
			var s = '#'+ (cur_y * 100 + cur_x);
			var t = commands.children[cur_i];
			if (t.classList[0][t.classList[0].length - 1] == "1")
				t.className = classNames[t.className];
			cur_i = 1;
			play();
		}
		document.btn_form.btn_clear.onclick = function()
		{
			$('#sortable').empty();
			cur_x = 0;
			cur_y = 1;
			cur_dir = "right";
			cur_i = 1;
		}
		document.btn_form.btn_tmp.onclick = function()
		{
			var result = $('#sortable').sortable('toArray');
			for (var i = 1; i < result.length; ++i)
			{
				var s = "#" + result[i];
				alert($(s).draggable.id);
			}
		}
	});
