function labirintOverrun(x, y){
	return (x >= curMap[curProblem][0].length || x < 0 || y >= curMap[curProblem].length || y < 0);
}

function die(){
	var p = curProblem;
	$('#cons' + p).append('Вас съели. Попробуйте снова \n');
	dead[p] = true;
	curMap[p][arrow[p].getCoord().y][arrow[p].getCoord().x].deleteElement(arrow[p]);
	arrow[p].setDead();
	curMap[p][arrow[p].getCoord().y][arrow[p].getCoord().x].pushCell(arrow[p]);
}

function checkCell(i, cnt){
	var p = curProblem;
	life[p] += problems[p].d_life;
	var changeCoord = true;
	var changedElems = [];
	var cX = curX[p] + dx[p];
	var cY = curY[p] + dy[p];
	changedElems.push(new Coord(curX[p], curY[p]));
	if (labirintOverrun(cX, cY)){
		$('#cons' + p).append('Шаг ' + (step() + 1) + ': Выход за границу лабиринта \n');
		changeCoord = false;
	}
	else {
		var elem = curMap[p][cY][cX];
		if (elem.isWall){
			$("#cons" + p).append('Шаг ' + (step() + 1) + ': Уткнулись в стенку \n');
			changeCoord = false;
		}
		var cells = elem.getCells();
		for (var j = 0; !elem.isWall && j < cells.length; ++j){
			if (cells[j].getClass() == 'Lock' && cells[j].isLocked()){
				$("#cons" + p).append('Шаг ' + (step() + 1) + ': Уткнулись в стенку \n');
				changeCoord = false;
				break;
			}
			if (cells[j].getClass() == 'Monster'){
				die();
				changeCoord = false;
				break;
			}
			if (cells[j].getClass() == 'Box'){
				var tX = cX + dx[p];
				var tY = cY + dy[p];
				var f = labirintOverrun(tX, tY);
				if (!f){
					var el1 = curMap[p][tY][tX];
					f = el1.isWall;
					var cells1 = el1.getCells();
					for (var k = 0; k < cells1.length; ++k)
						f = f || (cells1[k].getZIndex() >= cells[j].getZIndex());
				}
				if (f){
					$("#cons" + p).append('Шаг ' + (i + 1) + ': Не можем пододвинуть \n');
					changeCoord = false;
				}
				else{
					var box = cells[j];
					curMap[p][cY][cX].deleteElement(cells[j]);
					box.setCoord(new Coord(tX, tY));
					curMap[p][tY][tX].pushCell(box);
					changedElems.push(new Coord(tX, tY));
					--j;
					continue;
				}
			}
			if (cells[j].getClass() == 'Prize' && !cells[j].isEaten()){
				var prize = cells[j];
				curMap[p][cY][cX].deleteElement(cells[j]);
				prize.setEaten();
				curMap[p][cY][cX].pushCell(prize);
				$('#cons' + p).append('Шаг ' + (i + 1) + ': Нашли бонус "' + prize.getName() + '"\n');
				$('#cons' + p).append('Текущее количество очков: ' + 
						(pnts[p] + prize.getPoints()) + '\n');
				if (++curNumOfPrizes[p] == numOfPrizes[p])
					$('#cons' + p).append('Вы собрали все бонусы!\n');
				--j;
				continue;
				
			}
			if (cells[j].getClass() == 'Key' && !cells[j].isFound()){
				for (var k = 0; k < cells[j].getLocks().length; ++k){
					var x = cells[j].getLocks()[k].x;
					var y = cells[j].getLocks()[k].y;
					$('#cons' + p).append('Шаг ' + (i + 1) + ': Открыли ячейку с координатами ' + x + ', ' + y + '\n');
					var cells1 = curMap[p][y][x].getCells();
					for(var l = 0; l < cells1.length; ++l)
						if(cells1[l].getClass() == 'Lock')
							cells1[l].setUnlocked();
					changedElems.push(new Coord(x, y));
				}
				cells[j].setFound();
			}						
			life[p] += cells[j].getDLife();
			pnts[p] += cells[j].getPoints();
		}
	}
	if (changeCoord){
		changedElems.push(new Coord(cX, cY));
		for (var i = 0; i < curMap[p].length; ++i){
			curMap[p][i][arrow[p].getCoord().x].highlightOff();
			if (i != arrow[p].getCoord().y)
				changedElems.push(new Coord(arrow[p].getCoord().x, i));
		}
		for (var i = 0; i < curMap[p][0].length; ++i){
			curMap[p][arrow[p].getCoord().y][i].highlightOff();
			if (i != arrow[p].getCoord().x)
				changedElems.push(new Coord(i, arrow[p].getCoord().y));
		}
		curMap[p][curY[p]][curX[p]].deleteElement(arrow[p]);
		arrow[p].setCoord(new Coord(cX, cY));
		arrow[p].setDir(dirs[curDir[p]]);
		curMap[p][cY][cX].pushCell(arrow[p]);
		for (var i = 0; i < curMap[p].length; ++i){
			curMap[p][i][arrow[p].getCoord().x].highlightOn();
			if (i != arrow[p].getCoord().y)
				changedElems.push(new Coord(arrow[p].getCoord().x, i));
		}
		for (var i = 0; i < curMap[p][0].length; ++i){
			curMap[p][arrow[p].getCoord().y][i].highlightOn();
			if (i != arrow[p].getCoord().x)
				changedElems.push(new Coord(i, arrow[p].getCoord().y));
		}
		curX[p] = cX;
		curY[p] = cY;
	}
	if (!dead[p]){
		for (var k = 0; k < monsters[p].length; ++k){
			var elem = curMap[p][monsters[p][k].y][monsters[p][k].x];
			var m = elem.findCell('Monster', k);
			var c = m.tryNextStep();
			var elem1 = curMap[p][c.y][c.x];
			if (elem1.mayPush(m)){
				elem.deleteElement(m);
				m.nextStep();
				m.setCoord(c);
				changedElems.push(c);
				changedElems.push(new Coord(monsters[p][k].x, monsters[p][k].y));
				elem1.pushCell(m);
				if (c.x == arrow[p].getCoord().x && c.y == arrow[p].getCoord().y)
					die();
				monsters[p][k].x = c.x;
				monsters[p][k].y = c.y;
			}
		}
	}
	for (var i = 0; i < changedElems.length; ++i)
		curMap[p][changedElems[i].getY()][changedElems[i].getX()].draw();
	return true;
}