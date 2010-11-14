	function checkCell(i){
		life += problem.d_life;
		var c_x = curX + dx;
		var c_y = curY + dy;
		for (var k = 0; k < problem.cleaner.length; ++k){
			if (problem.cleaner[k].x == c_x && problem.cleaner[k].y == c_y)
				for (var l = 0; l < problem.cleaned[k].length; ++l){
					s = '#' + (curProblem* 10000 + c_y * 100 + c_x);
					$(s).empty();
					var y = problem.cleaned[k][l].y;
					var x = problem.cleaned[k][l].x
					s = '#' + (curProblem* 10000 + y * 100 + x);
					$(s).empty();
					if ($(s).hasClass('floor'))
						break;
					$(s).addClass("floor");
					$("#cons").append("Шаг " + i + ": Открыли ячейку с координатами " + x + ", " + y + "\n");
					curMap[y][x] = '.';
				}
		}
		for (var k = 0; k < movingElems.symbol.length; ++k){
			if (curI >= movingElems.path[k].length && !movingElems.looped[k])
				continue;
			var j = (i - 1) % movingElems.path[k].length;
			var x = movingElems.path[k][j].x;
			var y = movingElems.path[k][j].y;
			curMap[y][x] = map[y][x];
			s = "#" + (curProblem* 10000 + y * 100 + x);
			$(s).empty();
			if (curMap[y][x] != "." && curMap[y][x] != "#")
				for (var j = 0; j < spec_symbols.list.length; ++j)
					if (spec_symbols.list[j] == curMap[y][x]){
						s = "#" + (curProblem* 10000 + y * 100 + x);
						$(s).empty();
						$(s).append("<div class = '" + spec_symbols.style_list[j] + "'></div>");
					}
			j = i % movingElems.path[k].length;
			x = movingElems.path[k][j].x;
			y = movingElems.path[k][j].y;
			curMap[y][x] = k + "";
			if (curMap[y][x] == "#")
				alert("Движущийся объект уткнулся в стенку");
			s = "#" + (curProblem* 10000 + y * 100 + x);
			$(s).empty();
			$(s).append("<div class = '" + movingElems.style[k] + "'></div>");
		}
		if (curMap[c_y][c_x][0] >= '0' && curMap[c_y][c_x][0] <= '9'){
			if (movingElems.die[curMap[c_y][c_x]]){
				$("#cons").append("Вас съели. Попробуйте снова \n");
				s = "#" + (curProblem* 10000 + cur_y * 100 + curX);
				$(s).empty();
				dead = true;
				return false;
			}
			life += movingElems.d_life[curMap[c_y][c_x]];
			pnts += movingElems.points[curMap[c_y][c_x]];
		}
		for (var k = 0; k < specSymbols.list.length; ++k){
			if (curMap[c_y][c_x] == specSymbols.list[k]){
				++specSymbols.cur_count[k];
				switch(specSymbols["do"][k]){
					case "eat":
						if (specSymbols.cur_count[k] == specSymbols.count[k])
							$("#cons").append("Шаг " + i + ": Нашли все артефакты '" + specSymbols.names[k] + "' \n");
						else
							$("#cons").append("Шаг " + i + ": Нашли артефакт '" +specSymbols.names[k] + "', " + specSymbols.cur_count[k] +"-й \n");
							break;
					case "move": //ящик, сможем пододвинуть, если за ним пусто
						var t_x = c_x + dx;
						var t_y = c_y + dy;
						if (curMap[t_y][t_x] != '.'){
							$("#cons").append("Шаг " + i + ": Не можем пододвинуть \n");
							return false;
						}
						else{
							s = '#' + (curProblem* 10000 + t_y * 100 + t_x);
							$(s).empty();
							$(s).append("<div class = '" + specSymbols.style_list[k] + "'></div>");
							curMap[t_y][t_x] = curMap[c_y][c_x];
						}
				}
				curMap[c_y][c_x] = '.';
				s = '#' + (curProblem* 10000 + c_y * 100 + c_x);
				$(s).empty();
				life += specSymbols.d_life[k];
				pnts += specSymbols.points[k];
				break;
			}
		}
		if (life == 0){
			$("#cons").append("Количество жизней = 0. Попробуйте снова \n");
			dead = true;
			return false;
		}
		return true;
	}