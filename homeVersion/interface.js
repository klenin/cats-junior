﻿	function fillLabyrinth1(l){
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
		if (atHome){
			login = 'apress';
			passwd = 'tratata';
		}
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
		if (atHome){
			login = 'apress';
			passwd = 'tratata';		
			callScript(pathPref + 'f=login;login=' + login + ';passwd=' + passwd +';json=1;', function(data){
				if (data.status == "ok")
					sid = data.sid;
				else
					alert("Ошибка подключения к серверу. Попробуйте снова");
			});
			var result = "";
			var curList = $("#sortable" + curProblem).sortable("toArray");
			for (var i = 1; i < curList.length - 1; ++i){
				if (curList[i].search("invisible") != -1)
					continue;
				result += curList[i].replace(/[0-9]/, "") + " ";
			}
			if (curList.length > 1)
				result += curList[curList.length - 1].replace(/[0-9]/, "");
			submitStr = 'source=' + result + '&problem_id=771346&de_id=772264';
			callSubmit_('imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + sid + ';cid=' + cid +';', submitStr, function(data){
				alert(data);
			});  
		} 
		else {
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
			function genPostQuery(serv, path, data)	{
				var result = "Content-Type: multipart/form-data, boundary=" + sep + "\r\n";
				result += "Content-Length: " + data.length + "\r\n\r\n";
				l = data.length;
				result += data;
				return result;
			}
			function genFieldData(name, value){
				var result = sep + 'Content-Disposition: form-data; name="' + name + '"' + "\r\n\r\n";
				result += value + "\r\n";
				return result;
			}
			function genFileFieldData(name, filename, type, data){
				var result = sep + 'Content-Disposition: form-data; name="' + name  +  '"; filename="' + filename + '"' + "\r\n";
				result += 'Content-Type: ' + type + "\r\n\r\n";
				result += data + "\r\n\r\n";
				return result;
			}
			var data = genFieldData("search", "");
			data += genFieldData("rows", "20");
			data += genFieldData("problem_id", problem_id);
			data += genFieldData("de_id", de_id);
			data += genFieldData("submit", "send");
			data += genFileFieldData("source", "ans.txt", "text/plain", result);
			data += "-------------" + boundary  + "--\r\n";
			var query = genPostQuery('imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + sid + ';cid=' + cid, data);
			callSubmit(pathPref + 'f=problems;sid=' + sid + ';cid=' + cid, data,'imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + sid + ';cid=' + cid, sep, l, function(data){
				alert('Решение отослано на проверку');
			});
		}
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
		if (atHome)
			cid = 577647;
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
		if (curCmdIndex[curProblem] + 1 < $("#sortable" + curProblem).sortable('toArray').length){
			++curCmdIndex[curProblem];
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
		if (curCmdIndex[curProblem] + 1 < $("#sortable" + curProblem).sortable('toArray').length){
			if (curList[curProblem].length > curCmdIndex[curProblem]){
				var el = $("#sortable" + curProblem).children();
				changeClass(el[curCmdIndex[curProblem]]);
			}
			++curCmdIndex[curProblem];
			play(1);
		}
		else
			enableButtons();			
	}
	prevClick = function(){
		//disableButtons();
		if(curCmdIndex[curProblem] == 0 || curList[curProblem][curCmdIndex[curProblem] - 1] == "")
			setDefault();
		else if (curCmdIndex[curProblem] > 1){
			var t = curCmdIndex[curProblem];
			setDefault(true);
			var s = speed[curProblem];
			speed[curProblem] = 0;
			//disableButtons();
			play(t);
			speed[curProblem] = s;
		}
		else if(curCmdIndex[curProblem] == 1)
			setDefault(false);
	}