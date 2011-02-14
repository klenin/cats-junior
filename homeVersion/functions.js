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
					//alert(r.responseText);
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
		if (elem.id == "")
			return false;
		var item = $('#' + elem.id);
		if (!item || item.hasClass('invisible'))
			return false;
		var divs = ['forward', 'right', 'left', 'wait'];
		for (var k = 0; k < divs.length; ++k){
			if (item.hasClass(divs[k])){
				item.removeClass(divs[k]);
				item.addClass(divs[k] + 1);
			}   
			else if (item.hasClass(divs[k] + 1)){
				item.removeClass(divs[k] + 1);
				item.addClass(divs[k]);
			}
		}
	}
	function isChangedClass(elem){
		if (elem.id == "")
			return false;
		var item = $('#' + elem.id);
		if (!item || item.hasClass('invisible'))
			return false;
		var divs = ['forward', 'right', 'left', 'wait'];
		for (var k = 0; k < divs.length; ++k)
			if (item.hasClass(divs[k] + 1))
				return true;
		return false;
	}
	function clearClasses(){
		var el = $("#sortable" + curProblem).children();
		for (var i = 0; i < el.length; ++i){
			if (isChangedClass(el[i]))
				changeClass(el[i]);
		}
	}
	function updated(){
		var arr = $("#sortable" + curProblem).sortable('toArray');
		var el = $("#sortable" + curProblem).children();
		if (arr.length < curCmdIndex[curProblem] || (curCmdIndex[curProblem] && !isChangedClass(el[curCmdIndex[curProblem] - 1]))){
			setDefault();
			clearClasses();
			curList[curProblem] = arr;
		}
		else {
			for (var i = 0; i < curCmdIndex[curProblem]; ++i){
				if (curList[curProblem][i] != arr[i]){
					setDefault();
					break;
				}
			}
			curList[curProblem] = arr;
		}
	}
	function setDefault(f){
		enableButtons();
		$("#sortable" + curProblem).sortable( "enable" );
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
			$(s).prepend("<div class = '" + movingElems[curProblem].style[k] + "'></div>");
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
				//$(s).addClass('wall');				
				$(s).append('<div class = "lock"></div>');			
			}		
		}
		copyMap(curProblem);
		pause[curProblem] = false;
		$("#cons" + curProblem).empty();
		curDir[curProblem] = startDir;
		curX[curProblem] = startX[curProblem];
		curY[curProblem] = startY[curProblem];
		if (!stopped[curProblem] && curCmdIndex[curProblem] && curList[curProblem].length >= curCmdIndex[curProblem]){
			var el = $("#sortable" + curProblem).children();
			changeClass(el[curCmdIndex[curProblem] - 1]);
		}
		stopped[curProblem] = false;
		curCmdIndex[curProblem] = 0;
		if (!f){
			s = "#" + (curProblem* 10000 + curY[curProblem] * 100 + curX[curProblem]);
			$(s).append("<div class = '" + curDir[curProblem] + "'></div>");
		}
	}
	function loop(i, cnt){
		if (dead[curProblem])
			return;
		var result = $('#sortable' + curProblem).sortable('toArray');
		if (pause[curProblem] || stopped[curProblem]){
			if (pause[curProblem])
				pause[curProblem] = false;
			else{
				stopped[curProblem] = false;
				setDefault();
			}
			curCmdIndex[curProblem] = i;
			return;
		}
		if (i > curCmdIndex[curProblem] && speed[curProblem] != 0){
			var el = $("#sortable" + curProblem).children();
			changeClass(el[i - 1]);
		}
		var x = curX[curProblem];
		var y = curY[curProblem];
		var t = result[i];
		while(t.charAt(t.length - 1) >= "0" && t.charAt(t.length - 1) <= "9")
			t = t.substr(0, t.length - 1);
		dx[curProblem] = changeDir[t][curDir[curProblem]].dx;
		dy[curProblem] = changeDir[t][curDir[curProblem]].dy;
		curDir[curProblem] = changeDir[t][curDir[curProblem]].curDir;
		var checked = checkCell(i);
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
						$("#cons" + curProblem).append("Шаг " + i + ": Уткнулись в стенку \n");
						var s = '#' + (curProblem* 10000 + curY[curProblem] * 100 + curX[curProblem]);
						$(s).effect("highlight", {}, 300);
					}
			else
				$("#cons" + curProblem).append("Шаг " + i + ": Выход за границу лабиринта \n");
		if (!(speed[curProblem] == 0 && (i + 1) < cnt)){
			if (checked){
				s = '#' + (curProblem* 10000 + y * 100 + x);
				$(s).empty();
				s = '#' + (curProblem* 10000 + curY[curProblem] * 100 + curX[curProblem]);
				$(s).append('<div class = "' + curDir[curProblem]+'"></div>');
			}
			var el = $("#sortable" + curProblem).children();
			changeClass(el[i]);
			setTimeout("nextStep(" + i + ", " + cnt + ")", speed[curProblem]);
		}
		else
			nextStep(i, cnt);
	}
	function nextStep(i, cnt){
		if (dead[curProblem])
			return;
		if (++i <cnt) {
			loop(i, cnt);
		} 
		else {
			curCmdIndex[curProblem] = i; 
			playing[curProblem] = false;
			$("#sortable" + curProblem).sortable( "enable" );
			enableButtons();
		}
	}
	function play(cnt){
		if (dead[curProblem])
			return;
		playing[curProblem] = true;
		var result = $('#sortable' + curProblem).sortable('toArray');
		if (curCmdIndex[curProblem] == result.length)
			setDefault();
		if (!cnt)
			cnt = result.length;
		if (result[curCmdIndex[curProblem]] == "")
			++curCmdIndex[curProblem];
		var j = cnt - curCmdIndex[curProblem];
		loop(curCmdIndex[curProblem], cnt);
	}