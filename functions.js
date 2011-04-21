function callScript(url, callback){
	if (atHome){
		$.ajax({
			async: false,
			dataType : 'json',
			url: 'script.php',
			data: 'url='+ url,
			success: function(data) {
				callback(data);
			},
			error: function(r, err1, err2){
				alert(err1 + ' ' + err2);
			}  
		});
	} 
	else{
		$.ajax({
			async: false,
			dataType : 'json',
			url: url,
			success: function(data) {
				callback(data);
			}
		});
	}
}

function callSubmit_(serv, path, submitData, callback){
	if (!atHome)
		return;
	$.ajax({  
		async: false,
		url: 'submit.php',
		type: 'POST',
		data: 'serv='+ serv + '&' + 'path=' + path + '&' + submitData,  
		success: function(html){  
			callback(html);
		}  
	});  
}

function callSubmit(url, submitData, path, serv, sep, l, callback){
	if (atHome)
		return;
	$.ajax({  
		async: false,
		url: url,
		type: 'POST',
		contentType: 'multipart/form-data',
		data: submitData,
		beforeSend: function(xhr){
			xhr.setRequestHeader('Host', serv);
			xhr.setRequestHeader('Connection', 'keep-alive');
			xhr.setRequestHeader('Referer', url);
			return true;
		},  
		success: function(html){  
			callback(html);
		},
		error: function(r, err1, err2){
			alert(err1 + " " + err2);
		}  
	}); 
}

function getProblemStatement(i){
	$.ajax({
		async: false,
		dataType : "json",
		url: 'problems/' + (i + 1) + '/problem.json',
		success: function(data) {
			if (!data)
				return;
			problems[i] = data;
		},
		error: function(r, err1, err2){
			alert(r.responseText);
		}
	});
}

function getTest(l, k){
	$.ajax({
		async: false,
		dataType : "json",
		url: 'problems/' + (l  + 1) + '/Tests/' + k +'.json',
		success: function(data) {
			if (!data)
				return;
			var newProblem = $.extend(true, problems[l], {
				tabIndex: l, 
				cmdIndex: 0, 
				divIndex: 0, 
				step: 0, 
				divName: '',
				speed: 300, 
				life: problems[l].start_life,
				points: problems[l].start_pnts,
				paused: false, 
				stopped: false, 
				playing: false, 
				cmdListEnded: false, 
				cmdList: [], 
				mapFromTest:  data.map.slice(), 
				map: [], 
				maxBoxId: 0, 
				maxMonsterId: 0, 
				maxPrizeId: 0, 
				maxCellId: 0, 
				boxes: [], 
				monsters: [],
				numOfPrizes: 0, 
				curNumOfPrizes: 0, 
				visited: false, 
				dx: 0,
				dy: 0
			});
			var t1 = data.spec_symbols;
			var t2 = data.moving_elements;
			var t3 = data.cleaner;
			var t4 = data.cleaned;
			var obj = undefined;
			for (var i = 0; i < data.map.length; ++i){
				newProblem.map[i] = [];
				for (var j = 0; j < data.map[i].length; ++j){
					newProblem.map[i][j] = [];
					var c = new Coord(j, i);
					newProblem.map[i][j] = new FieldElem(l, c, data.map[i][j] == "#")
					if (data.map[i][j] == "R" || data.map[i][j] == "U" || 
						data.map[i][j] == "D" || data.map[i][j] == "L" ){
						obj = newProblem.arrow = new Arrow(l, c, dirs[newProblem.mapFromTest[i][j]]);
					}
					for (var k = 0; k < t1.length; ++k)
						if (t1[k].symbol == data.map[i][j]){
							obj = t1[k]["do"] == "eat" ? 
								new Prize(l, c, t1[k].style, t1[k].symbol, t1[k].zIndex ? t1[k].zIndex : 1, t1[k].points, 
											t1[k].d_life, t1[k].name) : 
								new Box(l, c, t1[k].style, t1[k].symbol, t1[k].zIndex ? t1[k].zIndex : 2, t1[k].points, 
											t1[k].d_life, t1[k].name);
							if (obj.__self == Prize)
								++newProblem.numOfPrizes;
							else
								newProblem.boxes.push({'id': newProblem.maxBoxId, 'x': j, 'y': i});
							break;
						}
					if (obj)
						newProblem.map[i][j].pushCell(obj);
					obj = undefined;
				}
			}
			for (var k = 0; k < t2.length; ++k){
				var c = new Coord(t2[k].path[0].x, t2[k].path[0].y);
				obj = new Monster(l, c, t2[k].style, "", t2[k].zIndex ? t2[k].zIndex : 3, t2[k].points, t2[k].d_life, t2[k].path, 
								t2[k].looped, t2[k].die);
				newProblem.map[c.y][c.x].pushCell(obj);
				newProblem.monsters.push({'x': c.x, 'y': c.y});
			}
			for (var k = 0; k < t3.length; ++k){
				var c = new Coord(t3[k].x, t3[k].y);
				obj = new Key(l, c, t4[k]);
				newProblem.map[c.y][c.x].pushCell(obj);
				for (var j = 0; j < t4[k].length; ++j){
					var c1 = new Coord(t4[k][j].x, t4[k][j].y);
					obj = new Lock(l, c1);
					newProblem.map[c1.y][c1.x].pushCell(obj);
				}
			}
		},
		error: function(r, err1, err2){
			alert(r.responseText);
		}
	});
}

function commandsToJSON(){
	var list = $('#sortable' + curProblem.tabIndex).children();
	var arr = new Array();
	while (list.length){
		var dir;
		var obj = new Object();
		for (var i = 0; i < classes.length / 2; ++i)
			if (list.first().hasClass(classes[i]) || list.first().hasClass(classes[i] + 1)){
				obj.dir = classes[i];
				break;
			}
		obj.cnt = $('#spin' + list.first().attr('numId')).attr('value');
		arr.push(obj);
		list = list.next();
	}
	return $.toJSON(arr);
}

function changeClass(elem){
	if (!elem)
		return false;
	elem = $('#' + elem);
	var divs = ['forward', 'right', 'left', 'wait'];
	for (var k = 0; k < divs.length; ++k){
		if (elem.hasClass(divs[k])){
			elem.removeClass(divs[k]);
			elem.addClass(divs[k] + 1);
		}   
		else if (elem.hasClass(divs[k] + 1)){
			elem.removeClass(divs[k] + 1);
			elem.addClass(divs[k]);
		}
	}
}

function isChangedClass(elem){
	if (!elem)
		return false;
	elem = $('#' + elem);
	var divs = ['forward', 'right', 'left', 'wait'];
	for (var k = 0; k < divs.length; ++k)
		if (elem.hasClass(divs[k] + 1))
			return true;
	return false;
}

function clearClasses(){
	var el = $('#sortable' + curProblem.tabIndex).children();
	l = el.length;
	for (var i = 0; i < l; ++i){
		if (isChangedClass(el.attr('id')))
			changeClass(el.attr('id'));
		el = el.next();
	}
}

function setCounters(j, dontReload){
	var el = $('#sortable' + curProblem.tabIndex).children();
	while(j){
		el = el.next();
		j--;
	}
	while (el.length > 0){
		var numId = el.attr('numId');
		var val =  $('#spin' + numId).attr('value');
		var newVal = dontReload ? $('#spinCnt' + numId).attr('cnt') : val;
		$('#spinCnt' + numId).attr('cnt', newVal);
		$('#spinCnt' + numId).attr('value', newVal + '/' + val);
		el = el.next();
	}
}

function divI(){ return curProblem.divIndex; }

function divN(){ return curProblem.divName;}

function cmd(){ return curProblem.cmdIndex;}

function step(){ return curProblem.step; }

function list() {return curProblem.cmdList; }

function updated(){
	var arr = $('#sortable' + curProblem.tabIndex).sortable('toArray');
	var needToClear = false;
	var j = curProblem.cmdList.length;  //number of first cmd that counters must be changed
	if(!curProblem.cmdList.length)
		needToClear = true;
	for (var i = 0; i < arr.length; ++i){
		var c = parseInt($('#' + arr[i] + ' input')[0].value); //current counter
		if (!curProblem.cmdList[i])
			curProblem.cmdList[i] = new Object();
		if (curProblem.cmdList[i].name != arr[i] || 
			(curProblem.cmdList[i].name == arr[i] && curProblem.cmdList[i].cnt != c)){ //if command was changed
			if (i < divI()){   
				if (curProblem.cmdListEnded && (i == divI() - 1) && 
					(curProblem.cmdList[i].name == arr[i] && curProblem.cmdList[i].cnt < c)){ //after axecuting all 
					with(curProblem){                   //of commands the counter of the last command was increased
						divIndex = i;
						cmdIndex = c - 1;
						divName = arr[i];
					}
					var numId = $('#' + arr[i]).attr('numId');
					$('#spinCnt' + numId).attr('cnt', c - curProblem.cmdList[i].cnt);
					$('#spinCnt' + numId).attr('value', 
							$('#spinCnt' + numId).attr('cnt') + '/' + $('#spin' + numId).attr('value'));
				}
				else{
					needToClear = true;
					j = 0;
				}
			}
			else
				if (i == divI()){     //parameters of last executed cmd were changed
					if (curProblem.cmdList[i].name == arr[i]){   //if counter was changed
						if (curProblem.cmdList[i].cnt > c)
							needToClear = true;
						else{   //change the value of counter
							var numId = $('#' + arr[i]).attr('numId');
							$('#spinCnt' + numId).attr('cnt', parseInt($('#spinCnt' + numId).attr('cnt')) + 1);
							$('#spinCnt' + numId).attr('value', 
								$('#spinCnt' + numId).attr('cnt') + '/' + $('#spin' + numId).attr('value'));	
						} 
					}
					else	
						j = i;
			}
			curProblem.cmdList[i].name = arr[i];
			curProblem.cmdList[i].cnt = c;
		}
	}
	curProblem.cmdListEnded = false;
	if (i < curProblem.cmdList.length)
		curProblem.cmdList.splice(i, curProblem.cmdList.length - i);
	if (needToClear){
		setDefault();
		clearClasses();
	}
	if (divI() < list().length)
		curProblem.divName = list()[divI()].name;
	showCounters();
	setCounters(j);
}

function highlightOn(problem){
	for (var i = 0; i < problem.map.length; ++i)
		problem.map[i][problem.arrow.coord.x].highlightOn();
	for (var i = 0; i < problem.map[0].length; ++i)
		problem.map[problem.arrow.coord.y][i].highlightOn();
}

function highlightOff(problem){
	for (var i = 0; i < problem.map.length; ++i)
		problem.map[i][problem.arrow.coord.x].highlightOff();
	for (var i = 0; i < problem.map[0].length; ++i)
		problem.map[problem.arrow.coord.y][i].highlightOff();
}

function setDefault(f){
	enableButtons();
	for (var i = 0; i < curProblem.map.length; ++i)
		for (var j = 0; j < curProblem.map[i].length; ++j){
			s = '#' + (curProblem.tabIndex * 10000 + i * 100 + j);
			$(s).empty();
			curProblem.map[i][j].setDefault();
		}
	for (var i = 0; i < curProblem.map.length; ++i)
		for (var j = 0; j < curProblem.map[i].length; ++j){
			var arr = curProblem.map[i][j].changedCells();
			for (var k = 0; k < arr.length; ++k){
				curProblem.map[arr[k].coord.y][arr[k].coord.x].pushCell(arr[k]);
				switch(arr[k].__self){
					case Arrow: 
						curProblem.arrow = arr[k];
						break;
					case Monster:
						curProblem.monsters[arr[k].id] = arr[k];
						curProblem.monsters[arr[k].id].x = arr[k].coord.x;
						curProblem.monsters[arr[k].id].y = arr[k].coord.y;
						break;
					case Box:
						curProblem.boxes[arr[k].id] = arr[k];
						break;
					}
			}
		}
	highlightOn(curProblem);
	for (var i = 0; i < curProblem.map.length; ++i)
		for (var j = 0; j < curProblem.map[i].length; ++j)
			curProblem.map[i][j].draw();
	$("#cons" + curProblem.tabIndex).empty();
	clearClasses();
	with (curProblem){
		arrow.setDefault();
		paused = false;
		stopped = false;
		points = 0;
		cmdListEnded = false;
		curNumOfPrizes = 0;
		cmdIndex = 0;
		divIndex = 0;
		step = 0;
		divName = cmdList[0].name;
	}
	if ($("#curStep" + curProblem.tabIndex)){
		$("#curStep" + curProblem.tabIndex).attr('value', 0);
		$('#progressBar'  + curProblem.tabIndex).progressbar('option', 'value',  0);
	}
	var el = $('#sortable' + curProblem.tabIndex).children();
	while (el.length > 0){
		$('#spinCnt' + el.attr('numId')).attr('cnt', $('#spin' + el.attr('numId')).attr('value'));
		el = el.next();
	}
}

function prevDivName(){
	if (curProblem.divIndex < 1)
		return false;
	return curProblem.cmdList[curProblem.divIndex - 1].name;
}

function loop(cnt, i){
	var newCmd = false;
	if (!i)
		i = 0;
	if (curProblem.arrow.dead || !curProblem.playing)
		return;
	if (curProblem.paused || curProblem.stopped){
		if (curProblem.paused)
			curProblem.paused = false;
		else{
			setDefault();
		}
		return;
	}
	var t = prevDivName();
	if (curProblem.speed != 0 && cmd() == 0 && t && isChangedClass(t))
		changeClass(t);
	newCmd = cmd() == 0;
	var x = curProblem.arrow.coord.x;
	var y = curProblem.arrow.coord.y;
	t = divN().replace(/\d{1,}/, "")
	curProblem.dx = changeDir[t][curProblem.arrow.dir].dx;
	curProblem.dy = changeDir[t][curProblem.arrow.dir].dy;
	var checked = checkCell(step(), cnt, changeDir[t][curProblem.arrow.dir].curDir);
	if (divN()){
		var numId = $('#'+ divN()).attr('numId');
		var newCnt = $('#spinCnt' + numId).attr('cnt') - 1;
		$('#spinCnt' + numId).attr('cnt', newCnt);
	}
	if (!curProblem.speed || (i >= cnt))
		return nextStep(cnt, ++i);
	if (newCmd || cmd() == 0)
		changeClass(divN());
	if (divN()){
		$('#spinCnt' + numId).attr('value', newCnt + '/' + $('#spin' + numId).attr('value'));
	}
	if (curProblem.arrow.dead)
		return;
	setTimeout(function() { nextStep(cnt, ++i); }, curProblem.speed);	
}

function nextCmd(){
	var t = curProblem.tabIndex;
	if ((divI() == list().length - 1 && cmd() == list()[divI()].cnt - 1)){
		with(curProblem){
			divIndex = list().length;
			cmdIndex = 0;
			step = curProblem.step + 1;
		}
		curProblem.cmdListEnded = true;
		return false;
	}
	else
	if (divI() >= list().length)
		return false;
	if (cmd() == list()[divI()].cnt - 1)
		with(curProblem){
			cmdIndex = 0;
			divName =  curProblem.cmdList[++divIndex].name;
		}
	else 
		++curProblem.cmdIndex;
	$('#curStep' + t).attr('value', ++curProblem.step + 1);
	$('#progressBar'  + t).progressbar('option', 'value',  (curProblem.step + 1) / problems[t].max_step * 100);
	if (curProblem.step == problems[t].max_step){
		$('#cons' + t).append('Превышен лимит затраченных шагов');
		curProblem.arrow.dead = true;
	}
	return true;
}

function nextStep(cnt, i){
	if (curProblem.arrow.dead || curProblem.stopped)
		return;
	if (curProblem.playing && nextCmd() && !curProblem.paused && !curProblem.stopped && (!cnt || i < cnt))
		loop(cnt, i);
	else {
		curProblem.playing = false;
		enableButtons();
		if (!curProblem.speed){
			curProblem.speed = 300;
			setCounters(0, true);
			var lastCmd = (divI() >= list().length) ? 
				$('#sortable' + curProblem + ' > li:last').attr('id') : divN();
			if (!isChangedClass(lastCmd))
				changeClass(lastCmd);
		}	
	}
}

function play(cnt){
	if (curProblem.arrow.dead)
		return;
	curProblem.playing = true;
	if (!divN())
		curProblem.divName = list()[0].name;
	if ((divI() == list().length - 1 && cmd() == list()[divI()].cnt) || (divI() >= list().length)){
		setDefault();
		setCounters();
	}
	loop(cnt);
}