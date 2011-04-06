	function isEaten(monster, mx, my, px, py){
		if (mx == px && my == py){
			if (monster.die){
				$('#cons' + curProblem).append('Вас съели. Попробуйте снова \n');
				s = '#' + (curProblem* 10000 + curY[curProblem] * 100 + curX[curProblem]);
				$(s).empty();
				dead[curProblem] = true;
				highlightMapOff(curProblem, curX[curProblem], curY[curProblem]);	
				highlightMap(curProblem, mx, my);	
				for (var k = 0; k < movingElems[curProblem].length; ++k)
					drawMonster(movingElems[curProblem][k]);
				return true;
			}
			life[curProblem] += monster.d_life;
			pnts[curProblem] += monster.points;
		}
		return false;
	}
	function drawMonster(monster){
		x = monster.path[monster.pathIndex].x;
		y = monster.path[monster.pathIndex].y;
		s = '#' + (curProblem* 10000 + y * 100 + x);
		$(s).empty();
		$(s).append('<div class = "' + monster.style + '"></div>');
	}
	function checkCell(i, cnt){
		life[curProblem] += problems[curProblem].d_life;
		pnts[curProblem] = pnts[curProblem] ? pnts[curProblem] : 0;
		var c_x = curX[curProblem] + dx[curProblem];
		var c_y = curY[curProblem] + dy[curProblem];
		for (var k = 0; k < movingElems[curProblem].length; ++k){
			var monster = movingElems[curProblem][k];
			var x, y, s;
			if (monster.pathIndex < monster.path.length){
				x = movingElems[curProblem][k].path[monster.pathIndex].x;
				y = movingElems[curProblem][k].path[monster.pathIndex].y;
				s = '#' + (curProblem* 10000 + y * 100 + x);
				$(s).empty();
				if (curMap[curProblem][y][x] != '.' && curMap[curProblem][y][x] != '#' &&
					curMap[curProblem][y][x] != '._' && curMap[curProblem][y][x] != '#_')
					for (var j = 0; j < specSymbols[curProblem].list.length; ++j)
						if (specSymbols[curProblem].list[j] == curMap[curProblem][y][x]){
							s = '#' + (curProblem* 10000 + y * 100 + x);
							$(s).empty();
							$(s).append('<div class = "' + specSymbols[curProblem].style_list[j] + '"></div>');
						}
				if (isEaten(monster, x, y, c_x, c_y))
					return false;
				if (monster.path[monster.pathIndex].cnt == monster.path[monster.pathIndex].initCnt)
					++monster.pathIndex;
			}
			if ((monster.pathIndex >= monster.path.length || 
				(monster.pathIndex == monster.path.length - 1 && 
					monster.path[monster.pathIndex].cnt == monster.path[monster.pathIndex].initCnt))){
				if (!movingElems[curProblem][k].looped)
					continue;
				for (var t = 0; t < monster.path.length; ++t){
					monster.path[t].x = monster.path[t].startX;
					monster.path[t].y = monster.path[t].startY;
					monster.path[t].cnt = 0;
				}
				monster.pathIndex = 0;
			}
			x = monster.path[monster.pathIndex].x + changeDir.forward[dirs[monster.path[monster.pathIndex].dir]].dx;
			y = monster.path[monster.pathIndex].y + changeDir.forward[dirs[monster.path[monster.pathIndex].dir]].dy;			
			monster.path[monster.pathIndex].x = x;
			monster.path[monster.pathIndex].y = y;
			++monster.path[monster.pathIndex].cnt;
			movingElems[curProblem][k] = monster;
			if (curMap[curProblem][y][x] == '#')
				continue;
			if (isEaten(monster, x, y, c_x, c_y))
				return false;
		}
		if (c_x >= curMap[curProblem][0].length || c_x < 0 || c_y >= curMap[curProblem].length || c_y < 0)
			return true;
		for (var k = 0; k < problems[curProblem].cleaner.length; ++k){			
			if (problems[curProblem].cleaner[k].x == c_x && problems[curProblem].cleaner[k].y == c_y){				
				var s = '#' + (curProblem* 10000 + c_y * 100 + c_x);				
				$(s).empty();				
				for (var l = 0; l < problems[curProblem].cleaned[k].length; ++l){					
					var y = problems[curProblem].cleaned[k][l].y;					
					var x = problems[curProblem].cleaned[k][l].x;					
					s = '#' + (curProblem* 10000 + y * 100 + x);					
					$(s).empty();					
					if ($(s).hasClass('floor'))						
						break;					
					//$(s).removeClass("wall");					
					$(s).addClass('floor');
					$('#cons' + curProblem).append('Шаг ' + (i + 1) + ': Открыли ячейку с координатами ' + x + ', ' + y + '\n');
					curMap[curProblem][y][x] = '.';
				}
			}
		}	
		for (var k = 0; k < specSymbols[curProblem].list.length; ++k){
			if (curMap[curProblem][c_y][c_x] == specSymbols[curProblem].list[k]){
				++specSymbols[curProblem].cur_count[k];
				switch(specSymbols[curProblem]['do'][k]){
					case 'eat':
						if (specSymbols[curProblem].cur_count[k] == specSymbols[curProblem].count[k])
							$('#cons' + curProblem).append('Шаг ' + (i + 1) + ': Нашли все артефакты "' + 
								specSymbols[curProblem].names[k] + '" \n');
						else
						$('#cons' + curProblem).append('Шаг ' + (i + 1) + ': Нашли артефакт "' + specSymbols[curProblem].names[k] + 
							'", ' + specSymbols[curProblem].cur_count[k] + '-й \n');
						$('#cons' + curProblem).append('Текущее количество очков: ' + 
							(pnts[curProblem] + specSymbols[curProblem].points[k]) + "\n");
						break;
					case "move": //ящик, сможем пододвинуть, если за ним пусто
						var t_x = c_x + dx[curProblem];
						var t_y = c_y + dy[curProblem];
						if (t_x >= curMap[curProblem][0].length || t_x < 0 || 
							t_y >= curMap[curProblem].length || t_y < 0)
							continue;
						if (curMap[curProblem][t_y][t_x] != '.'){
							$("#cons" + curProblem).append('Шаг ' + (i + 1) + ': Не можем пододвинуть \n');
							return false;
						}
						else{
							s = '#' + (curProblem* 10000 + t_y * 100 + t_x);
							$(s).empty();
							$(s).append('<div class = "' + specSymbols[curProblem].style_list[k] + '"></div>');
							curMap[curProblem][t_y][t_x] = curMap[curProblem][c_y][c_x];
						}
				}
				curMap[curProblem][c_y][c_x] = '.';
				s = '#' + (curProblem* 10000 + c_y * 100 + c_x);
				$(s).empty();
				life[curProblem] += specSymbols[curProblem].d_life[k];
				pnts[curProblem] += specSymbols[curProblem].points[k];
				break;
			}
		}
		if (life[curProblem] == 0){
			$('#cons' + curProblem).append('Количество жизней = 0. Попробуйте снова \n');
			dead[curProblem] = true;
			return false;
		}
	if (c_x >= 0 && c_x < curMap[curProblem][0].length && c_y >= 0 && c_y < curMap[curProblem].length)
		if (curMap[curProblem][c_y][c_x] != '#' && curMap[curProblem][c_y][c_x] != '#_'){
			if (!(speed[curProblem] == 0 && (!cnt || (step() + 1 < cnt)))){
				s = '#' + (curProblem* 10000 + curY[curProblem]* 100 + curX[curProblem]);
				$(s).empty();
				highlightMapOff(curProblem, curX[curProblem], curY[curProblem]);
				s = '#' + (curProblem* 10000 + c_y * 100 + c_x);
				$(s).append('<div class = "' + curDir[curProblem]+'"></div>');
				highlightMap(curProblem, c_x, c_y);	
				for (var k = 0; k < movingElems[curProblem].length; ++k)
					drawMonster(movingElems[curProblem][k]);
			}			
			curX[curProblem] = c_x;
			curY[curProblem] = c_y;
		}
		else{
			$("#cons" + curProblem).append('Шаг ' + (step() + 1) + ': Уткнулись в стенку \n');
			var s = '#' + (curProblem * 10000 + curY[curProblem] * 100 + curX[curProblem]);
			$(s).effect('highlight', {}, 300);
			}
	else
		$('#cons' + curProblem).append('Шаг ' + (step() + 1) + ': Выход за границу лабиринта \n');
	return true;
}