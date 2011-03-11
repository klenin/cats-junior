	function copyMap(i){
		curMap[i] = [];
		for (var k = 0; k < mapFromTest[i].length; ++k){
			curMap[i][k] = new Array();
			for (var l = 0; l < mapFromTest[i][k].length; ++l)
				curMap[i][k][l] = mapFromTest[i][k][l];
		}
	}
	function callScript(url, callback){
		if (atHome){
			$.ajax({
				async: false,
				dataType : "json",
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
				dataType : "json",
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
			url: "submit.php",
			type: "POST",
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
			type: "POST",
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
				problems[i] = new Object();
				problems[i].name = data.name;
				problems[i].statement = data.statement;
				problems[i].testsNum = data.testsNum;
				problems[i].commands = data.commands.slice();
				problems[i].start_life = data.start_life;
				problems[i].d_life = data.d_life;
				problems[i].start_pnts = data.start_pnts;
				problems[i].finish_symb = data.finish_symb;
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
				mapFromTest[l] = [];
				mapFromTest[l] = data.map.slice();
				var tmp = data.spec_symbols;
				specSymbols[l] = new Object();
				specSymbols[l].list  = [];
				specSymbols[l].style_list = [];
				specSymbols[l].count = [];
				specSymbols[l].names = [];
				specSymbols[l].points = [];
				specSymbols[l].d_life = [];
				specSymbols[l]["do"] = [];
				specSymbols[l].coord = new Object();
				specSymbols[l].coord.x = [];
				specSymbols[l].coord.y = [];
				specSymbols[l].style = [];
				specSymbols[l].cur_count = [];
				specSymbols[l].symb = [];
				specSymbols[l].symbol = [];
				for (var i = 0; i < tmp.length; ++i){
					specSymbols[l].list[i]  = tmp[i].symbol;
					specSymbols[l].style_list[i] = tmp[i].style;
					specSymbols[l].count[i] = tmp[i].count;
					specSymbols[l].names[i] = tmp[i].name;
					specSymbols[l].points[i] = tmp[i].points;
					specSymbols[l].d_life[i] = tmp[i].d_life;
					specSymbols[l]["do"][i] = tmp[i]["do"];
				}
				problems[l].cleaner = data.cleaner.slice();
				problems[l].cleaned = [];
				for (var i = 0; i < data.cleaned.length; ++i)
					problems[l].cleaned[i] = data.cleaned[i].slice();
				if (data.commands)
					problems[l].commands = data.commands.slice();
				if (data.start_life)
					problems[l].start_life = data.start_life;
				if (data.d_life)
					problems[l].d_life = data.d_life;
				if (data.start_pnts)
					problems[l].start_pnts = data.start_pnts;
				if (data.finish_symb)
					problems[l].finish_symb = data.finish_symb;
				var tmp = data.moving_elements;
				movingElems[l] = [];
				movingElems[l].style = [];
				movingElems[l].path = [];
				movingElems[l].looped = [];
				movingElems[l].die = [];
				movingElems[l].symbol = [];
				for (var i = 0; i < tmp.length; ++i){
					movingElems[l].style.push(tmp[i].style);
					movingElems[l].path[i] = [];
					for (var j = 0; j < tmp[i].path.length; ++j)
						movingElems[l].path[i].push(tmp[i].path[j]);
					movingElems[l].looped.push(tmp[i].looped);
					movingElems[l].die.push(tmp[i].die);
					movingElems[l].symbol.push(mElemId);
					mapFromTest[l][tmp[i].path[0].y][tmp[i].path[0].x] = "" + mElemId++;
				}
			},
			error: function(r, err1, err2){
				alert(r.responseText);
			}
		});
	}
	function changeClass(elem){
		if (!elem)
			return false;
		elem = $("#" + elem);
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
		elem = $("#" + elem);
		var divs = ['forward', 'right', 'left', 'wait'];
		for (var k = 0; k < divs.length; ++k)
			if (elem.hasClass(divs[k] + 1))
				return true;
		return false;
	}
	function clearClasses(){
		var el = $("#sortable" + curProblem).children();
		l = el.length;
		for (var i = 0; i < l; ++i){
			if (isChangedClass(el.attr('id')))
				changeClass(el.attr('id'));
			el = el.next();
		}
	}
	function setCounters(){
		var el = $('#sortable' + curProblem).children();
		while (el.length > 0){
			$("#spinCnt" + el.attr('numId')).attr('cnt', $("#spin" + el.attr('numId')).attr('value'));
			$("#spinCnt" + el.attr('numId')).attr('value', $("#spinCnt" + el.attr('numId')).attr('cnt') + "/" + $("#spin" + el.attr('numId')).attr('value'));
			el = el.next();
		}
	}
	function divI(){ return curState[curProblem].divIndex; }
	function divN(){ return curState[curProblem].divName;}
	function cmd(){ return curState[curProblem].cmdIndex;}
	function step(){ return curState[curProblem].step; }
	function list() {return curCmdList[curProblem]; }
	function updated(){
		var arr = $("#sortable" + curProblem).sortable('toArray');
		var needToClear = false;
		var k = 0;
		for (var i = 0; i < arr.length; ++i){
			var c = parseInt($('#' + arr[i] + ' input')[0].value);
			if (!curCmdList[curProblem][i])
				curCmdList[curProblem][i] = new Object();
			if (curCmdList[curProblem][i].name != arr[i] || (curCmdList[curProblem][i].name == arr[i] && curCmdList[curProblem][i].cnt == c)){
				if (i <= curState[curProblem].divIndex)
					needToClear = false;
				curCmdList[curProblem][i].name = arr[i];
				curCmdList[curProblem][i].cnt = c;
			}
		}
		if (needToClear){
			setDefault();
			clearClasses();
		}
		showCounters();
		setCounters();
	}
	function setDefault(f){
		enableButtons();
		dead[curProblem] = false;
		var s = '#' + (curProblem* 10000 + curY[curProblem] * 100 + curX[curProblem]);
		$(s).empty();
		for (var i = 0; i < curMap[curProblem].length; ++i){
			for (var j = 0; j < curMap[curProblem][i].length; ++j){
				s = '#' + (curProblem* 10000 + i * 100 + j);
				$(s).empty();
			}
		}
		for (var k = 0; k < specSymbols[curProblem].coord.x.length; ++k){
			s = "#" + (curProblem* 10000 + specSymbols[curProblem].coord.y[k] * 100 + specSymbols[curProblem].coord.x[k]);
			$(s).empty();
			$(s).append("<div class = '" + specSymbols[curProblem].style[k] + "'></div>");
			specSymbols[curProblem].cur_count[k] = 0;
		}
		for (var k = 0; k < movingElems[curProblem].symbol.length; ++k){
			s = "#" + (curProblem* 10000 + movingElems[curProblem].path[k][curCmdIndex[curProblem] % movingElems[curProblem].symbol.length].y * 100 + movingElems[curProblem].path[curCmdIndex[curProblem] % movingElems[curProblem].symbol.length][0].x);
			$(s).empty();
			s = "#" + (curProblem* 10000 + movingElems[curProblem].path[k][0].y * 100 + movingElems[curProblem].path[k][0].x);
			$(s).append("<div class = '" + movingElems[curProblem].style[k] + "'></div>");
		}
		for (var k = 0; k < problems[curProblem].cleaner.length; ++k){			
			var y = problems[curProblem].cleaner[k].y;			
			var x = problems[curProblem].cleaner[k].x;			
			var s = '#' + (curProblem* 10000 + y * 100 + x);			
			$(s).append('<div class = "key"></div>');			
			for (var l = 0; l < problems[curProblem].cleaned[k].length; ++l){				
				y = problems[curProblem].cleaned[k][l].y;				
				x = problems[curProblem].cleaned[k][l].x				
				s = '#' + (curProblem* 10000 + y * 100 + x);				
				$(s).removeClass('floor');				
				$(s).append('<div class = "lock"></div>');			
			}		
		}
		copyMap(curProblem);
		pause[curProblem] = false;
		$("#cons" + curProblem).empty();
		curDir[curProblem] = startDir;
		curX[curProblem] = startX[curProblem];
		curY[curProblem] = startY[curProblem];
		clearClasses();
		stopped[curProblem] = false;
		with (curState[curProblem]){
			cmdIndex = 0;
			divIndex = 0;
			step = 0;
			divName = curCmdList[curProblem][0].name;
		}
		var el = $('#sortable' + curProblem).children();
		while (el.length > 0){
			$("#spinCnt" + el.attr('numId')).attr('cnt', $("#spin" + el.attr('numId')).attr('value'));
			el = el.next();
		}
		if (!f){
			s = "#" + (curProblem* 10000 + curY[curProblem] * 100 + curX[curProblem]);
			$(s).append("<div class = '" + curDir[curProblem] + "'></div>");
		}
	}
	function prevDivName(){
		if (curState[curProblem].divIndex <= 1)
			return false;
		return curCmdList[curProblem][curState[curProblem].divIndex - 2].name;
	}
	function loop(cnt){
		var newCmd = false;
		if (dead[curProblem])
			return;
		if (pause[curProblem] || stopped[curProblem]){
			if (pause[curProblem])
				pause[curProblem] = false;
			else{
				stopped[curProblem] = false;
				setDefault();
			}
			return;
		}
		var t = prevDivName();
		if (speed[curProblem] != 0 && cmd() == 0 && t && isChangedClass(t)){
			changeClass(t);
			newCmd = true;
		}
		var x = curX[curProblem];
		var y = curY[curProblem];
		t = divN().replace(/\d{1,}/, "")
		dx[curProblem] = changeDir[t][curDir[curProblem]].dx;
		dy[curProblem] = changeDir[t][curDir[curProblem]].dy;
		curDir[curProblem] = changeDir[t][curDir[curProblem]].curDir;
		var checked = checkCell(step());
		if (dead[curProblem])
			return;
		if (checked)
			if (curX[curProblem] + dx[curProblem] >= 0 && curX[curProblem] + dx[curProblem] < curMap[curProblem][0].length 
				&& curY[curProblem] + dy[curProblem] >= 0 && curY[curProblem] + dy[curProblem] < curMap[curProblem].length)
				if ((curMap[curProblem][curY[curProblem] + dy[curProblem]][curX[curProblem] + dx[curProblem]] != '#') &&
					(curMap[curProblem][curY[curProblem] + dy[curProblem]][curX[curProblem] + dx[curProblem]] != '#_')){
					curX[curProblem] += dx[curProblem];
					curY[curProblem] += dy[curProblem];
				}
				else{
						$("#cons" + curProblem).append("Шаг " + step() + ": Уткнулись в стенку \n");
						var s = '#' + (curProblem* 10000 + curY[curProblem] * 100 + curX[curProblem]);
						$(s).effect("highlight", {}, 300);
					}
			else
				$("#cons" + curProblem).append("Шаг " + step() + ": Выход за границу лабиринта \n");
		if (divN()){
			var numId = $("#" + divN()).attr('numId');
			var newCnt = $("#spinCnt" + numId).attr('cnt') - 1;
			$("#spinCnt" + numId).attr('cnt', newCnt);
			$("#spinCnt" + numId).attr('value', newCnt + "/" + $("#spin" + numId).attr('value'));
		}
		if (!(speed[curProblem] == 0 && (!cnt || (step() + 1 < cnt)))){
			if (checked){
				s = '#' + (curProblem* 10000 + y * 100 + x);
				$(s).empty();
				s = '#' + (curProblem* 10000 + curY[curProblem] * 100 + curX[curProblem]);
				$(s).append('<div class = "' + curDir[curProblem]+'"></div>');
			}
			if (newCmd || cmd() == 0)
				changeClass(divN());
			setTimeout(function() { nextStep(cnt); }, speed[curProblem]);
		}
		else
			nextStep(cnt);
	}
	function nextCmd(){
		var t = curProblem;
		if ((divI() == list().length - 1 && cmd() == list()[divI() - 1].cnt) || (divI() >= list().length))
			return false;
		if (cmd() == list()[divI()].cnt - 1)
			with(curState[t]){
				cmdIndex = 0;
				divName =  curCmdList[t][divIndex++].name;
			}
		else 
			++curState[t].cmdIndex;
		++curState[t].step;
		return true;
	}
	function nextStep(cnt){
		if (dead[curProblem])
			return;
		if ((!cnt || step() < cnt - 1) && !pause[curProblem] && nextCmd())
			loop(cnt);
		else {
			playing[curProblem] = false;
			enableButtons();
		}
	}
	function play(cnt){
		if (dead[curProblem])
			return;
		playing[curProblem] = true;
		if (!divN())
			curState[curProblem].divName = list()[0].name;
		if (((divI() == list().length) && (cmd() == list()[divI() - 1].cnt))|| divI() > list().length)
			setDefault();
		nextStep(cnt);
	}