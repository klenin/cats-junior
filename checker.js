	function checkCell(i){
		life += problem.d_life;
		for (var k = 0; k < problem.cleaner.length; ++k){
			if (problem.cleaner[k].x == cur_x && problem.cleaner[k].y == cur_y)
				for (var l = 0; l < problem.cleaned[k].length; ++l){
					s = '#' + (cur_y * 100 + cur_x);
					$(s).empty();
					var y = problem.cleaned[k][l].y;
					var x = problem.cleaned[k][l].x
					s = '#' + (y * 100 + x);
					$(s).empty();
					if ($(s).hasClass('floor'))
						break;
					$(s).addClass("floor");
					$("#cons").append("Шаг " + i + ": Открыли ячейку с координатами " + x + ", " + y + "\n");
					cur_map[y][x] = '.';
				}
		}
		for (var k = 0; k < moving_elems.symbols.length; ++k){
			if (cur_i + 1 >= moving_elems.path[k].length && !moving_elems.looped[k])
				continue;
			var x = moving_elems.path[k][cur_i].x;
			var y = moving_elems.path[k][cur_i].y;
			cur_map[y][x] = map[y][x];
			s = "#" + (y * 100 + x);
			$(s).empty();
			if (cur_map[y][x] != "." && cur_map[y][x] != "#")
				for (var i = 0; i < spec_symbols.list.length; ++i)
					if (spec_symbols.list[i] == cur_map[y][x]){
						s = "#" + (y * 100 + x);
						$(s).empty();
						$(s).append("<div class = '" + spec_symbols.style[i] + "'></div>");
					}
			var i = (cur_i + 1) % moving_elems.path[k].length;
			x = moving_elems.path[k][i].x;
			y = moving_elems.path[k][i].y;
			if (cur_map[y][x] == "#")
				alert("Движущийся объект уткнулся в стенку");
			$(s).append("<div class = '" + moving_elems.style[k] + "'></div>");
		}
		if (cur_map[cur_y][cur_x][0] >= '0' && cur_map[cur_y][cur_x][0] <= '9'){
			if (moving_elems.die[cur_map[cur_y][cur_x]]){
				$("#cons").append("Вас съели \n");
				return false;
			}
			life += moving_elems.d_life[cur_map[cur_y][cur_x]];
			pnts += moving_elems.points[cur_map[cur_y][cur_x]];
		}
		for (var k = 0; k < spec_symbols.list.length; ++k){
			if (cur_map[cur_y][cur_x] == spec_symbols.list[k]){
				++spec_symbols.cur_count[k];
				switch(spec_symbols["do"][k]){
					case "e":
						if (spec_symbols.cur_count[k] == spec_symbols.count[k])
							$("#cons").append("Шаг " + i + ": Нашли все артефакты '" + spec_symbols.names[k] + "' \n");
						else
							$("#cons").append("Шаг " + i + ": Нашли артефакт '" +spec_symbols.names[k] + "', " + spec_symbols.cur_count[k] +"-й \n");
							break;
					case "m": //ящик, сможем пододвинуть, если за ним пусто
						var t_x = cur_x + dx;
						var t_y = cur_y + dy;
						if (cur_map[t_y][t_x] != '.'){
							$("#cons").append("Шаг " + i + ": Не можем пододвинуть \n");
							return false;
						}
						else{
							s = '#' + (t_y * 100 + t_x);
							$(s).empty();
							$(s).append("<div class = '" + spec_symbols.style[k] + "'></div>");
							cur_map[t_y][t_x] = cur_map[cur_y][cur_x];
						}
				}
				cur_map[cur_y][cur_x] = '.';
				s = '#' + (cur_y * 100 + cur_x);
				$(s).empty();
				life += spec_symbols.d_life[k];
				pnts += spec_symbols.points[k];
				break;
			}
		}
		if (life == 0){
			$("#cons").append("Количество жизней = 0. Попробуйте снова \n");
			return false;
		}
		return true;
	}