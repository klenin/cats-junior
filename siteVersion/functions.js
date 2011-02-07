	function copyMap(i){
		curMap[i] = [];
		for (var k = 0; k < map[i].length; ++k){
			curMap[i][k] = new Array();
			for (var l = 0; l < map[i][k].length; ++l)
				curMap[i][k][l] = map[i][k][l];
		}
	}
	function fillLabyrinth1(l){
		$("#field" + l).append("<table id = 'table_field" + l + "' style = 'border-width:0px; border-spacing: 0px'>")
		for (var i = 0; i < curMap[l].length; ++i){
			$("#table_field" + l).append("<tr id = 'tr_field" + (l * 1000 + i) + "'>");
			for (var j = 0; j < curMap[l][i].length; ++j){
				switch(curMap[l][i][j] ){					
				case "#":						
					$("#tr_field" + (l * 1000 + i)).append("<td class = 'wall' id = '"+(l * 10000 + i * 100 + j)+"' width = '50px'>");						
					break;					
				case "#_":						
					$("#tr_field" + (l * 1000 + i)).append("<td class = 'wall' id = '"+(l * 10000 + i * 100 + j)+"' width = '50px'>");						
					$('#' + (l * 10000 + i * 100 + j)).append('<div class = "lock"></div>');						
					break;					
				case "._":						
					$("#tr_field" + (l * 1000 + i)).append("<td class = 'floor' id = '"+(l * 10000 + i * 100 + j)+"' width = '50px'>");						
					$('#' + (l * 10000 + i * 100 + j)).append('<div class = "key"></div>');						
					break;					
				default:						
					$("#tr_field" + (l * 1000 + i)).append("<td class = 'floor' id = '"+(l * 10000 + i * 100 + j)+"' width = '50px'>");				
				}
                if (curMap[l][i][j] == "R" || curMap[l][i][j] == "L" || curMap[l][i][j] == "U" || curMap[l][i][j] == "D"){
					startDir[l] = dirs[curMap[l][i][j]];
					startX[l] = j;
					startY[l] = i;
				}
				for (var k = 0; k < specSymbols[l].list.length; ++k){
					if (curMap[l][i][j] == specSymbols[l].list[k]){
						specSymbols[l].coord.x.push(j);
						specSymbols[l].coord.y.push(i);
						specSymbols[l].style.push(specSymbols[l].style_list[k]);
						specSymbols[l].cur_count[k] = 0;
						specSymbols[l].symb.push(specSymbols[l].list[k]);
						break;
					}
				}
				$("#tr_field" + (l * 1000 + i)).append("</td>");
			}
			$("#table_field" + l).append("</tr>");
		}
		$("#field" + l).append("</table>");
	}
	function callScript(url1, callback){
		$.ajax({
			async: false,
			dataType : "json",
			url: url1,
			success: function(data) {
				callback(data);
			}
		});
	}
	function callSubmit(url1, submitData, path, serv, sep, l, callback){
		$.ajax({  
			async: false,
			url: url1,
			type: "POST",
	    	contentType: 'multipart/form-data',
			data: submitData,
			beforeSend: function(xhr){
				xhr.setRequestHeader('Host', serv);
				xhr.setRequestHeader('Connection', 'keep-alive');
				xhr.setRequestHeader('Referer', url1);
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
				map[l] = [];
				map[l] = data.map.slice();
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
					map[l][tmp[i].path[0].y][tmp[i].path[0].x] = "" + mElemId++;
				}
			}
		});
	}
	function chooseUser(){
		var user = $("input:checked");
		$("#ui-tabs-0").empty();
		$("#ui-tabs-0").append('<p>Текущий пользователь:</p>');
		name = user[0].defaultValue;
		for (var i = 0; i < users.login.length; ++i){
			if (name == users.name[i])
				login = users.login[i];
		}
		$("#ui-tabs-0").append('<p>' + user[0].defaultValue +'</p>');
		$("#ui-tabs-0").append('<input type = "button" name="changeUser" id = "changeUser" class = "changeUser" onClick = changeUser()></input>');
		callScript(pathPref + 'f=login;login=' + login + ';passwd=' + passwd +';json=1;', function(data){
			if (data.status == "ok")
				sid = data.sid;
			else
				alert("Ошибка подключения к серверу. Попробуйте снова");
		});
	}
	function changeUser(){
		callScript(pathPref +'f=users;sid=' + sid + ';cid=' + cid + ';rows=100;json=1;', function(data){
				if (!data)
					return;
				login = undefined;
    			users.login = [];
				users.name = [];
				for (var i = 0; i < data.length; ++i){
					if (data[i].ooc == 1)
						continue;
					users.login.push(data[i].login);
					users.name.push(data[i].name);
				}
				$("#ui-tabs-0").empty();
				if (users.login.length > 0){
					$("#ui-tabs-0").append('<p>Выберите свое имя из списка</p>');
					$("#ui-tabs-0").append('<form name = "userList" id = "userList">');
					for (var i = 0; i < users.login.length; ++i)
						$("#userList").append('<input type="radio" name="user_name" id="user_name_' + i + '" value="' + users.name[i] + '" ' + (i == 0 ? 'checked': '') + ' class="radioinput" /><label for="user_name_' + i + '">' + users.name[i] + '</label><br>');
					$("#userList").append('<input type = "button" name="userNameSubmit" id = "userNameSubmit" class = "userNameSubmit" onClick = chooseUser()></input>');
					$("#ui-tabs-0").append('</form>');
				}
				else 
					$("#ui-tabs-0").append('<p>На данный момент нет доступных пользователей</p>');	
			});
	}
	submitClick = function(){
   		if (!login) {
   			alert('Невозможно отослать решение, так как не выбран пользователь');
   			return false;
   		}
		callScript(pathPref + 'f=login;login=' + login + ';passwd=' + passwd +';json=1;', function(data){
			if (!data)
				return;
			if (data.status == "ok")
				sid = data.sid;
			else
				alert("Ошибка подключения к серверу. Попробуйте снова");
		});
		var result = "";
		var curList = $("#sortable" + curProblem).sortable("toArray");
		for (var i = 1; i < curList.length - 1; ++i){
			result += curList[i].replace(/\d{1,}/, "") + " ";
		}
		if (curList.length > 1)
			result += curList[curList.length - 1].replace(/\d{1,}/, "");
		var problem_id = problemsList[curProblem].id;  //problem_id = 
		var de_id = 772264;
		var boundary = Math.round((Math.random() * 999999999999));
		var sep = "-------------" + boundary + "\r\n";
		var l = 0;
		function GenPostQuery(serv, path, data)
		{
			var result = "Content-Type: multipart/form-data, boundary=" + sep + "\r\n";
			result += "Content-Length: " + data.length + "\r\n\r\n";
			l = data.length;
			result += data;
			return result;
		}
		function GenFieldData(name, value)
		{
			var result = sep + 'Content-Disposition: form-data; name="' + name + '"' + "\r\n\r\n";
			result += value + "\r\n";
			return result;
		}
		function GenFileFieldData(name, filename, type, data)
		{
			var result = sep + 'Content-Disposition: form-data; name="' + name  +  '"; filename="' + filename + '"' + "\r\n";
			result += 'Content-Type: ' + type + "\r\n\r\n";
			result += data + "\r\n\r\n";
			return result;
		}
		var data = GenFieldData("search", "");
		data += GenFieldData("rows", "20");
		data += GenFieldData("problem_id", problem_id);
		data += GenFieldData("de_id", de_id);
		data += GenFieldData("submit", "send");
		data += GenFileFieldData("source", "ans.txt", "text/plain", result);
		data += "-------------" + boundary  + "--\r\n";
		var query = GenPostQuery('imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + sid + ';cid=' + cid, data);

		callSubmit(pathPref + 'f=problems;sid=' + sid + ';cid=' + cid, data,'imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + sid + ';cid=' + cid, sep, l, function(data){
			alert('Решение отослано на проверку');
		});
	}
	function fillTabs(){
		if (!login)  {
			callScript(pathPref + 'f=login;login=' + 'apress' +';passwd=' + 'tratata' + ';json=1;', function(data){
			if (!data)
				return;
			if (data.status == "ok")
				sid = data.sid;
			else {
				sid = undefined;
				alert("Ошибка подключения к серверу. Попробуйте снова");
			}
			});
		}
		else
			callScript(pathPref + 'f=login;login=' + login +';passwd=' + passwd + ';json=1;', function(data){
			if (data.status == "ok")
				sid = data.sid;
			else {
				sid = undefined;
				alert("Ошибка подключения к серверу. Попробуйте снова");
			}
			});
		callScript(pathPref + 'f=contests;filter=current;json=1;', function(data){
				if (!data)
					return;
				var contests = data.contests;
				for (var i = 0; i < data.length; ++i){
					if(contests[i].is_official)
						cid = contests[i].id;
				}
		 });
		$("#tabs").tabs("add", "#ui-tabs-0", "Выбор пользователя" );
		changeUser();
		callScript(pathPref + 'f=problems;sid='+sid+';cid='+cid+';json=1;', function(data){
			for (var i = 0; i < 3/*data.problems.length*/; ++i){
			    getProblemStatement(i);
				getTest(i, 1);
				if (data)					///////
					problemsList.push({"id":data.problems[i].id, "name": data.problems[i].name});
				$("#tabs").tabs("add", "#ui-tabs-" + (i + 1)*2,problems[i].name );
				$("#ui-tabs-" + (i + 1)*2).append('<table id = "main' + i + '">');
				mainT = $("#main" + i);
				mainT.append('<tr id = "1tr' + i +'">');
				$("#1tr" + i).append('<td colspan = "4" id = "tdSt' + i + '" valign = "top">');
				$("#tdSt" + i).append('<div class = "statement" id = "statement' + i + '">');
				$("#tdSt" + i).append('</div>');
				$("#1tr" + i).append('</td>');
				mainT.append('</tr>');
				mainT.append('<tr id = "4tr' + i +'">');
				$("#4tr" + i).append('<td id = "tdBtns' + i + '" colspan = "2" valign = "top">');
				$("#tdBtns" + i).append('<div class = "btn" id = "btn' + i + '">');
				$("#btn" + i).append('<form name = "btn_form' + i + '" id = "btn_form' + i +'">');
				$("#btn_form" + i).append('<input type = "button" class = "play" name = "btn_play' + i + '" id = "btn_play' + i + '" onClick = "playClick()"></input>');
				$("#btn_form" + i).append('<input type = "button" class = "pause" name = "btn_pause' + i + '" id = "btn_pause' + i + '" onClick = "pauseClick()"></input>');
				$("#btn_form" + i).append('<input type = "button" class = "stop" name = "btn_stop' + i + '" id = "btn_stop' + i + '" onClick = "stopClick()"></input>');
				$("#btn_form" + i).append('<input type = "button" class = "prev" name = "btn_prev' + i + '" id = "btn_prev' + i + '" onClick = "prevClick()"></input>');
				$("#btn_form" + i).append('<input type = "button" class = "next" name = "btn_next' + i + '" id = "btn_next' + i + '" onClick = "nextClick()"></input>');
				$("#btn_form" + i).append('<input type = "button" class = "fast" name = "btn_fast' + i + '" id = "btn_fast' + i + '" onClick = "fastClick()"></input>');
				$("#btn" + i).append('</form>');
				$("#tdBtns" + i).append('</div>');
				$("#4tr" + i).append('</td>');
				$("#4tr" + i).append('<td id = "tdBtnSubmit' + i + '" valign = "top">');
				$("#tdBtnSubmit" + i).append('<div class = "submit_div" id = "submit_div' + i + '">');
				$("#submit_div" + i).append('<form name = "submit_form" class = "submit_form" id = "submit_form' + i + '">');
				$("#submit_form" + i).append('<input type = "button" class = "clear" name = "btn_clear' + i + '" id = "btn_clear' + i + '" onClick = "clearClick()"></input>');
				$("#submit_form" + i).append('<input type = "button" name="submit' + i + '" id = "submit' + i + '" class = "submit" onClick = submitClick()></input>');
				$("#submit_div" + i).append('</form>');
				$("#tdBtnSubmit" + i).append('</div>');
				$("#4tr" + i).append('</td>');
				mainT.append('</tr>');
				mainT.append('<tr id = "2tr'+ i +'">');	
				$("#2tr" + i).append('<td id = "tdCmd' + i + '" valign = "top" height = "100%">');				
				$("#tdCmd" + i).append('<div class = "comands" id = "comands' + i + '">');
				$("#comands" + i).append('<div class = "drag" id = "drag' + i + '">');
				$("#drag" + i).append('<ul class = "ul_comands" id = "ul_comands' + i + '">');
				var divs = problems[i].commands;
				for (var j = 0; j < divs.length; ++j)
					$("#ul_comands" + i).append('<li id = "' + divs[j] + i + '" class = "' + divs[j] + '"><span style = "margin-left: 40px;">' + divNames[divs[j]] + '</span></li>');
				$("#drag" + i).append('</ul>');
				$("#comands" + i).append('</div>');
				$("#tdCmd" + i).append('</div>');
				$("#2tr" + i).append('</td>');
				$("#2tr" + i).append('<td id = "tdField' + i + '" rowspan = "2" collspan = "2" valign = "top">');
				$("#tdField" + i).append('<div class = "field" id = "field' + i + '" style = "padding-left: 10px;">');
				$("#tdField" + i).append('</div>');
				$("#2tr" + i).append('</td>');		
				$("#2tr" + i).append('<td id = "tdCons' + i + '" rowspan = "2" valign = "top">');
				$("#tdCons" + i).append('<div class = "cons_div" id = "cons_div' + i + '">');
				$("#cons_div" + i).append('<form name = "cons_form" class = "cons_form" id = "cons_form' + i + '">');
				$("#cons_form" + i).append('<textarea rows="34" cols="20" name="cons" id = "cons' + i + '" class = "cons" disabled readonly></textarea><br>');
				$("#cons_div" + i).append('<div class = "submit_div" id = "submit_div' + i + '">');
				$("#cons_div" + i).append('</form>');
				$("#tdCons" + i).append('</div>');
				$("#2tr" + i).append('</td>');		
				mainT.append('</tr>');
				mainT.append('<tr id = "3tr'+ i +'">');
				$("#3tr" + i).append('<td id = "tdDrop' + i + '" valign = "top" style="width:170px;">');
				$("#tdDrop" + i).append('<div class = "drop" id = "drop' + i + '">');
				$("#drop" + i).append('<hr align = "left" width = "270px"><br>');
				$("#drop" + i).append('Укажите последовательность действий');
				$("#drop" + i).append('<div class = "divSortable" id = "divSortable' + i + '">');
				$("#divSortable" + i).append('<ul id = "sortable' + i + '" class = "sortable">');
				$("#sortable" + i).append('<li class = "invisible ui-draggable" id = "invisible' + i + '"></li>');
				$("#divSortable" + i).append('</div>');
				$("#drop" + i).append('</ul>');
				$("#tdDrop" + i).append('</div>');
				$("#3tr" + i).append('</td>');	
				mainT.append('</tr>');
				$("#ui-tabs-" + (i + 1)*2).append('</table>');
				copyMap(i);
				fillLabyrinth1(i);
				$("#statement" + i).append(problems[i].statement);
			}
		});		
	}
	function addNewCmd(str){
		$("#sortable" + curProblem).append('<li id = "' + str + cmdId++ + '" class = "' + str + ' ui-draggable"><span style = "margin-left: 40px;">' + divNames[str] + '</span></li>')
		var arr = $("#sortable" + curProblem).sortable('toArray');
		curList[curProblem] = arr;
	}
	function enableButtons(){
		$("#btn_play" + curProblem).removeAttr('disabled');
		$("#btn_next" + curProblem).removeAttr('disabled');
		$("#btn_prev" + curProblem).removeAttr('disabled');
		$("#btn_fast" + curProblem).removeAttr('disabled');
	}
	function disableButtons(){
		$("#btn_play" + curProblem).attr('disabled', 'disabled');
		$("#btn_next" + curProblem).attr('disabled', 'disabled');
		$("#btn_prev" + curProblem).attr('disabled', 'disabled');
		$("#btn_fast" + curProblem).attr('disabled', 'disabled');
	}
	function callPlay(s){
		if ($("#sortable" + curProblem).sortable('toArray').length == 1 || dead[curProblem])
			return;
		if (curI[curProblem] + 1 < $("#sortable" + curProblem).sortable('toArray').length){
			++curI[curProblem];
			clearClasses();
		}
		else
			setDefault();
		//disableButtons();
		speed[curProblem] = s;
		setTimeout(function() { play(); }, s);
	}
	playClick = function(){
		//disableButtons();
		//alert ($("#btn_play0"))
		callPlay(300);
	}
	fastClick = function(){
		//disableButtons();
		callPlay(1);
	}
	clearClick = function(){
		if (!confirm('Вы уверены, что хотите очистить список команд?'))
			return;
		setDefault();
		$('#sortable' + curProblem).children(":gt(0)").remove();
		if ($( '#sortable' + curProblem ).sortable( 'option', 'disabled' ))
			$('#sortable' + curProblem).sortable('enable');	
	}
	stopClick = function(){
		stopped[curProblem] = true;
		setDefault();
		clearClasses();
	}
	pauseClick = function(){
		if (playing[curProblem])			
			pause[curProblem] = true;
		enableButtons();
	}
	nextClick = function(){
		//disableButtons();
		if ($("#sortable" + curProblem).sortable('toArray').length == 1){
			enableButtons();
			return;
		}
		if (curI[curProblem] + 1 < $("#sortable" + curProblem).sortable('toArray').length){
			if (curList[curProblem].length > curI[curProblem]){
				var el = $("#sortable" + curProblem).children();
				changeClass(el[curI[curProblem]]);
			}
			++curI[curProblem];
			play(1);
		}
		else
			enableButtons();			
	}
	prevClick = function(){
		//disableButtons();
		if(curI[curProblem] == 0 || curList[curProblem][curI[curProblem] - 1] == "")
			setDefault();
		else if (curI[curProblem] > 1){
			var t = curI[curProblem];
			setDefault(true);
			var s = speed[curProblem];
			speed[curProblem] = 0;
			//disableButtons();
			play(t);
			speed[curProblem] = s;
		}
		else if(curI[curProblem] == 1)
			setDefault(false);
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
		if (arr.length < curI[curProblem] - 1 ||  !isChangedClass(el[curI[curProblem]])){
			setDefault();
			clearClasses();
			curList[curProblem] = arr;
		}
		else {
			for (var i = 0; i < curI[curProblem]; ++i){
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
			s = "#" + (curProblem* 10000 + movingElems[curProblem].path[k][curI[curProblem] % movingElems[curProblem].symbol.length].y * 100 + movingElems[curProblem].path[curI[curProblem] % movingElems[curProblem].symbol.length][0].x);
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
		if (!stopped[curProblem] && curList[curProblem].length > curI[curProblem]){
			var el = $("#sortable" + curProblem).children();
			changeClass(el[curI[curProblem]]);
		}
		stopped[curProblem] = false;
		curI[curProblem] = 0;
		if (!f){
			s = "#" + (curProblem* 10000 + curY[curProblem] * 100 + curX[curProblem]);
			$(s).append("<div class = '" + curDir[curProblem] + "'></div>");
		}
	}
	function loop(i, cnt){
		if (!i)
			i = 1;
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
			curI[curProblem] = i - 1;
			return;
		}
		if (i > curI[curProblem] && speed[curProblem] != 0){
			var el = $("#sortable" + curProblem).children();
			changeClass(el[i - 1]);
		}
		var x = curX[curProblem];
		var y = curY[curProblem];
		var t = result[i];
		while(t[t.length - 1] >= "0" && t[t.length - 1] <= "9")
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
		//disableButtons();
		//$("#sortable" + curProblem).sortable( "disable" );
		if (++i <cnt) {
			loop(i, cnt);
			setTimeout(function() {
				$("#sortable" + curProblem).sortable( "enable" );
				enableButtons();
			}, 
			speed[curProblem] * cnt
			);
		} 
		else {
			curI[curProblem] = i - 1; 
			playing[curProblem] = false;
			enableButtons();
		}
	}
	function play(cnt){
		if (dead[curProblem])
			return;
		disableButtons();
		playing[curProblem] = true;
		var result = $('#sortable' + curProblem).sortable('toArray');
		if (!cnt)
			cnt = result.length;
		if (result[curI[curProblem]] == "")
			++curI[curProblem];
		$("#sortable" + curProblem).sortable( "disable" );
		var j = cnt - curI[curProblem];
		loop(curI[curProblem], cnt);
		setTimeout(function() {
				$("#sortable" + curProblem).sortable( "enable" );
				enableButtons();
			}, 
			speed[curProblem] * j
		);
	}