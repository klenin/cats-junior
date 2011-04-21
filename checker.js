function labirintOverrun(x, y){
	return (x >= curProblem.map[0].length || x < 0 || y >= curProblem.map.length || y < 0);
}

function die(){
	var mes = new MessageStepsLimit();
	curProblem.arrow.dead = true;
}

function tryNextCoord(i, changedElems){
	var p = curProblem.tabIndex;
	var result = true;
	var cX = curProblem.arrow.coord.x + curProblem.dx;
	var cY = curProblem.arrow.coord.y + curProblem.dy;
	if (labirintOverrun(cX, cY)){
		var mes = new MessageLabirinthOverrun(i);
		result = false;
	}
	else {
		var elem = curProblem.map[cY][cX];
		if (elem.isWall){
			var mes = new MessageWall(i);
			result = false;
		}
		var cells = elem.getCells();
		for (var j = 0; !elem.isWall && j < cells.length; ++j){
			if (cells[j].__self == Lock && cells[j].locked){
				var mes = new MessageWall(i);
				result = false;
				break;
			}
			if (cells[j].__self == Monster){
				die();
				break;
			}
			if (cells[j].__self == Box){
				var tX = cX + curProblem.dx;
				var tY = cY + curProblem.dy;
				var f = labirintOverrun(tX, tY);
				if (!f){
					var el1 = curProblem.map[tY][tX];
					f = el1.isWall;
					var cells1 = el1.getCells();
					for (var k = 0; k < cells1.length; ++k)
						f = f || (cells1[k].zIndex >= cells[j].zIndex);
				}
				if (f){
					var mes = new MessageCantMove(i);
					result = false;
				}
				else{
					var box = cells[j];
					curProblem.map[cY][cX].deleteElement(cells[j]);
					box.coord = new Coord(tX, tY);
					curProblem.map[tY][tX].pushCell(box);
					changedElems.push(new Coord(tX, tY));
					--j;
					continue;
				}
			}
			if (cells[j].__self == Prize && !cells[j].eaten){
				cells[j].eaten = true;
				var mes = new MessagePrizeFound(i, cells[j].name, (curProblem.points + cells[j].points), 
					++curProblem.curNumOfPrizes == curProblem.numOfPrizes);
				--j;
				continue;
				
			}
			if (cells[j].__self == Key && !cells[j].found){
				for (var k = 0; k < cells[j].locks.length; ++k){
					var x = cells[j].locks[k].x;
					var y = cells[j].locks[k].y;
					var mes = new MessageCellOpened(i, x, y);
					var cells1 = curProblem.map[y][x].getCells();
					for(var l = 0; l < cells1.length; ++l)
						if(cells1[l].__self == Lock)
							cells1[l].setUnlocked();
					changedElems.push(new Coord(x, y));
				}
				cells[j].found = true;
			}						
			curProblem.life += cells[j].dLife;
			curProblem.points += cells[j].points;
		}
	}
	return result;
}

function changeLabyrinth(i, cnt, newDir){
	var p = curProblem.tabIndex;
	curProblem.life += curProblem.dLife;
	var changedElems = [];
	var cX = curProblem.arrow.coord.x + curProblem.dx;
	var cY = curProblem.arrow.coord.y + curProblem.dy;
	changedElems.push(new Coord(curProblem.arrow.coord.x, curProblem.arrow.coord.y));
	var changeCoord = tryNextCoord(i, changedElems);
	if (changeCoord){
		for (var i = 0; i < curProblem.map.length; ++i){
			curProblem.map[i][curProblem.arrow.coord.x].highlightOff();
			if (i != curProblem.arrow.coord.y)
				changedElems.push(new Coord(curProblem.arrow.coord.x, i));
		}
		for (var i = 0; i < curProblem.map[0].length; ++i){
			curProblem.map[curProblem.arrow.coord.y][i].highlightOff();
			if (i != curProblem.arrow.coord.x)
				changedElems.push(new Coord(i, curProblem.arrow.coord.y));
		}
	}
	if (!curProblem.arrow.dead){
		for (var k = 0; k < curProblem.monsters.length; ++k){
			var elem = curProblem.map[curProblem.monsters[k].y][curProblem.monsters[k].x];
			var m = elem.findCell(Monster, k);
			var c = m.tryNextStep();
			var elem1 = curProblem.map[c.y][c.x];
			if (elem1.mayPush(m)){
				elem.deleteElement(m);
				m.nextStep();
				m.coord = c;
				changedElems.push(c);
				changedElems.push(new Coord(curProblem.monsters[k].x, curProblem.monsters[k].y));
				elem1.pushCell(m);
				if (c.x == curProblem.arrow.coord.x && c.y == curProblem.arrow.coord.y)
					die();
				curProblem.monsters[k].x = c.x;
				curProblem.monsters[k].y = c.y;
			}
		}
	}
	if (changeCoord && 	!curProblem.arrow.dead){
		changedElems.push(new Coord(cX, cY));
		curProblem.map[curProblem.arrow.coord.y][curProblem.arrow.coord.x].deleteElement(curProblem.arrow);
		curProblem.arrow.coord = new Coord(cX, cY);
		curProblem.arrow.dir = newDir;
		curProblem.map[cY][cX].pushCell(curProblem.arrow);
		for (var i = 0; i < curProblem.map.length; ++i){
			curProblem.map[i][curProblem.arrow.coord.x].highlightOn();
			if (i != curProblem.arrow.coord.y)
				changedElems.push(new Coord(curProblem.arrow.coord.x, i));
		}
		for (var i = 0; i < curProblem.map[0].length; ++i){
			curProblem.map[curProblem.arrow.coord.y][i].highlightOn();
			if (i != curProblem.arrow.coord.x)
				changedElems.push(new Coord(i, curProblem.arrow.coord.y));
		}
	}
	for (var i = 0; i < changedElems.length; ++i)
		curProblem.map[changedElems[i].y][changedElems[i].x].draw();
}