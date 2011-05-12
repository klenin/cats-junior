function callScript(url, callback){
	if (atHome){
		$.ajax({
			async: false,
			dataType : 'json',
			url: 'script.php',
			data: 'url='+ url,
			success: function(data){callback(data);}
		});
	} 
	else{
		$.ajax({
			async: false,
			dataType : 'json',
			url: url,
			success: callback
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
		success: function(data){
			callback(data);
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
		success: callback,
		error: function(r, err1, err2){
			alert('Ошибка подключения к серверу');
		}  
	}); 
}

function getTest(data, l){
	var newProblem = $.extend(true, problems[l], {
		cmdIndex: 0, 
		divIndex: 0, 
		step: 0, 
		divName: '',
		speed: 300, 
		life: data.startLife,
		points: data.startPoints,
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
		monsters: [],
		numOfPrizes: 0, 
		curNumOfPrizes: 0, 
		visited: false, 
		dx: 0,
		dy: 0
	});
	if (newProblem.maxCmdNum)
		newProblem.maxStep = 0;
	setLabyrinth(data.specSymbols, newProblem);
	setMonsters(data.movingElements, newProblem);
	setKeysAndLocks(data.keys, data.locks, newProblem);
}

function setLabyrinth(specSymbols, problem){
	var obj = undefined;
	for (var i = 0; i < problem.mapFromTest.length; ++i){
		problem.map[i] = [];
		for (var j = 0; j < problem.mapFromTest[i].length; ++j){
			problem.map[i][j] = [];
			var c = new Coord(j, i);
			problem.map[i][j] = new FieldElem(problem.tabIndex, c,problem.mapFromTest[i][j] == "#")
			if (problem.mapFromTest[i][j] == "R" || problem.mapFromTest[i][j] == "U" || 
				problem.mapFromTest[i][j] == "D" ||problem.mapFromTest[i][j] == "L" ){
				obj = problem.arrow = new Arrow(problem.tabIndex, c, dirs[problem.mapFromTest[i][j]]);
			}
			for (var k = 0; k < specSymbols.length; ++k)
				if (specSymbols[k].symbol == problem.mapFromTest[i][j]){
					obj = specSymbols[k].action == "eat" ? 
						new Prize(problem.tabIndex, c, specSymbols[k]) : 
						new Box(problem.tabIndex, c,specSymbols[k]) ;
					if (obj.__self == Prize)
						++problem.numOfPrizes;
					break;
				}
			if (obj)
				problem.map[i][j].pushCell(obj);
			obj = undefined;
		}
	}
}

function setMonsters(monsters, problem){
	var obj = undefined;
	for (var k = 0; k < monsters.length; ++k){
		var c = new Coord(monsters[k].path[0].x, monsters[k].path[0].y);
		obj = new Monster(problem.tabIndex, c, monsters[k]);
		problem.map[c.y][c.x].pushCell(obj);
		problem.monsters.push({'x': c.x, 'y': c.y});
	}
}

function setKeysAndLocks(keys, locks, problem){
	var obj = undefined;
	for (var k = 0; k < keys.length; ++k){
		var c = new Coord(keys[k].x, keys[k].y);
		obj = new Key(problem.tabIndex, c, locks[k]);
		problem.map[c.y][c.x].pushCell(obj);
		for (var j = 0; j < locks[k].length; ++j){
			var c1 = new Coord(locks[k][j].x, locks[k][j].y);
			obj = new Lock(problem.tabIndex, c1);
			problem.map[c1.y][c1.x].pushCell(obj);
		}
	}
}

function commandsToJSON(){
	var list = $('#sortable' + curProblem.tabIndex).children();
	var arr = new Array();
	while (list.length){
		var dir;
		var obj = new Object();
		for (var i = 0; i < classes.length; ++i)
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

function changeCmdHighlight(elem){
	if (!elem)
		return false;
	elem = $('#' + elem);
	var divs = curProblem.commands;
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

function isCmdHighlighted(elem){
	if (!elem)
		return false;
	elem = $('#' + elem);
	var divs = curProblem.commands;
	for (var k = 0; k < divs.length; ++k)
		if (elem.hasClass(divs[k] + 1))
			return true;
	return false;
}

function cmdHighlightOff(){
	var el = $('#sortable' + curProblem.tabIndex).children();
	l = el.length;
	for (var i = 0; i < l; ++i){
		if (isCmdHighlighted(el.attr('id')))
			changeCmdHighlight(el.attr('id'));
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
	var needToClear = curProblem.arrow.dead || (curProblem.cmdListEnded && arr.length < divI());
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
						changeProgressBar();
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
						if (curProblem.cmdIndex >= c)
							needToClear = true;
						else{   //change the value of counter
							var numId = $('#' + arr[i]).attr('numId');
							$('#spinCnt' + numId).attr('cnt', (c - curProblem.cmdIndex));
							$('#spinCnt' + numId).attr('value', 
								(c - curProblem.cmdIndex) + '/' + $('#spin' + numId).attr('value'));	
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
		cmdHighlightOff();
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

function drawLabirint(){
	for (var i = 0; i < curProblem.map.length; ++i)
		for (var j = 0; j < curProblem.map[i].length; ++j)
			curProblem.map[i][j].draw();
}

function setDefault(f){
	for (var i = 0; i < btns.length; ++i)
		$('#btn_' + btns[i] + curProblem.tabIndex).button('enable');	
	$('#sortable' + curProblem.tabIndex).sortable('enable');
	for (var i = 0; i < curProblem.map.length; ++i)
		for (var j = 0; j < curProblem.map[i].length; ++j)
			curProblem.map[i][j].setDefault();
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
				}
			}
		}
	highlightOn(curProblem);
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
		divName = cmdList.length ? cmdList[0].name : "";
		nextOrPrev = false;
	}
	hideFocus();
	cmdHighlightOff();
	if (!f){
		drawLabirint();
		changeProgressBar();
	}
	$("#cons" + curProblem.tabIndex).empty();
	var el = $('#sortable' + curProblem.tabIndex).children();
	while (el.length > 0){
		var newVal = $('#spin' + el.attr('numId')).attr('value');
		$('#spinCnt' + el.attr('numId')).attr('cnt', newVal);
		if (!f)
			$('#spinCnt' + el.attr('numId')).attr('value', newVal + '/' + newVal);
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
	if (curProblem.speed != 0 && cmd() == 0 && t && isCmdHighlighted(t))
		changeCmdHighlight(t);
	newCmd = cmd() == 0;
	var x = curProblem.arrow.coord.x;
	var y = curProblem.arrow.coord.y;
	t = divN().replace(/\d{1,}/, "")
	curProblem.dx = changeDir[t][curProblem.arrow.dir].dx;
	curProblem.dy = changeDir[t][curProblem.arrow.dir].dy;
	changeLabyrinth(step(), cnt, changeDir[t][curProblem.arrow.dir].curDir, curProblem.speed == 0);
	if (divN()){
		var numId = $('#'+ divN()).attr('numId');
		var newCnt = $('#spinCnt' + numId).attr('cnt') - 1;
		$('#spinCnt' + numId).attr('cnt', newCnt);
	}
	if (curProblem.speed && (!cnt || (i < cnt))){
		if (newCmd || cmd() == 0)
			changeCmdHighlight(divN());
		if (divN())
			$('#spinCnt' + numId).attr('value', newCnt + '/' + $('#spin' + numId).attr('value'));
	}
	nextStep(cnt, ++i);	
}

function changeProgressBar(){
	if (curProblem.maxCmdNum){
		$('#curStep' + curProblem.tabIndex).text(curProblem.divIndex);
		$('#progressBar'  + curProblem.tabIndex).progressbar('option', 'value',  curProblem.divIndex / curProblem.maxCmdNum * 100);
	} 
	else if (curProblem.maxStep){
		$('#curStep' + curProblem.tabIndex).text(curProblem.step);
		$('#progressBar'  + curProblem.tabIndex).progressbar('option', 'value',  curProblem.step  / curProblem.maxStep * 100);
	}
}

function heroIsDead(){
	for (var i = 0; i < btns.length; ++i)
		$('#btn_' + btns[i] + curProblem.tabIndex).button('disable');
	$('#btn_stop' + curProblem.tabIndex).button('enable');
	$('#sortable' + curProblem.tabIndex).sortable('enable');
	if (!curProblem.speed)
		notSpeed();
	curProblem.playing = false;
	hideFocus();
}

function nextCmd(){
	if (divI() >= list().length)
		return false;
	if (cmd() == list()[divI()].cnt - 1){
		++curProblem.divIndex;
		curProblem.cmdIndex = 0;
		++curProblem.step;	
		if (divI() == list().length){
			curProblem.cmdListEnded = true;
			if (curProblem.speed)
				changeProgressBar();
			return false;
		}
		if (curProblem.maxCmdNum && curProblem.divIndex == curProblem.maxCmdNum){
			var mes = new MessageCmdLimit();
			curProblem.arrow.dead = true;
			changeProgressBar();
			if (curProblem.arrow.dead)
				heroIsDead();
			return false;
		}	
		curProblem.divName =  curProblem.cmdList[curProblem.divIndex].name;
	}
	else {
		++curProblem.cmdIndex;
		++curProblem.step;
	}
	if (curProblem.speed)
		changeProgressBar();
	return true;
}

function hideFocus(){
	for (var k = 0; k < btns.length; ++k)
		$('#btn_' + btns[k] + curProblem.tabIndex).removeClass('ui-state-focus').removeClass('ui-state-hover'); 
}

function notSpeed(){
	curProblem.speed = 300;
	setCounters(0, true);
	var lastCmd = (divI() >= list().length) ? 
		$('#sortable' + curProblem.tabIndex + ' > li:last').attr('id') : divN();
	if (!isCmdHighlighted(lastCmd))
		changeCmdHighlight(lastCmd);
	drawLabirint();
	changeProgressBar();
}

function nextStep(cnt, i){
	if (curProblem.arrow.dead || curProblem.stopped){
		if (curProblem.arrow.dead)
			heroIsDead();
		curProblem.playing = false;
		nextCmd();
		hideFocus();
		return;
	}
	if ( (!cnt || i < cnt) && nextCmd() && curProblem.playing && !curProblem.paused && !curProblem.stopped)
		setTimeout(function() { loop(cnt, i); }, curProblem.speed);
	else {
		curProblem.playing = false;
		hideFocus();
		enableButtons();
		if (!curProblem.speed)
			notSpeed();
		if (curProblem.nextOrPrev)
			nextCmd();
		curProblem.nextOrPrev = false;
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