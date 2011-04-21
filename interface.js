function fillLabyrinth(l){
	highlightOn(l);
	$('#tdField' + l).append('<table id = "table_field' + l + '" class = "field">');
	for (var i = 0; i < curMap[l].length; ++i){
		$('#table_field' + l).append('<tr id = "tr_field' + (l * 1000 + i) + '">');
		for (var j = 0; j < curMap[l][i].length; ++j){
			$('#tr_field' + (l * 1000 + i)).append('<td id = "'+ (l * 10000 + i * 100 + j)+'">');
			curMap[l][i][j].draw();
			$('#tr_field' + (l * 1000 + i)).append('</td>');
		}
		$('#table_field' + l).append('</tr>');
	}
	$('#tdField' + l).append('</table>');
}

function chooseUser(){
	var user = $('input:checked');
	$('#ui-tabs-0').empty();
	$('#ui-tabs-0').append('<p>Текущий пользователь:</p>');
	name = user[0].defaultValue;
	for (var i = 0; i < users.length; ++i){
		if (name == users[i].name)
			login = users[i].login;
	}
	$('#ui-tabs-0').append('<p>' + user[0].defaultValue +'</p>');
	$('#ui-tabs-0').append(
		'<input type = "button" name="changeUser" id = "changeUser" class = "changeUser" onClick = changeUser()></input>');
	if (atHome){
		login = 'apress';
		passwd = 'tratata';
	}
	callScript(pathPref + 'f=login;login=' + login + ';passwd=' + passwd +';json=1;', function(data){
		if (data.status == 'ok')
			sid = data.sid;
		else
			alert('Ошибка подключения к серверу. Попробуйте снова');
	});
}

function changeUser(){
	callScript(pathPref +'f=users;sid=' + sid + ';cid=' + cid + ';rows=100;json=1;', function(data){
			if (!data)
				return;
			login = undefined;
			for (var i = 0; i < data.length; ++i){
				if (data[i].ooc == 1)
					continue;
				users.push({'login': data[i].login, 'name': data[i].name}); 
			}
			$('#ui-tabs-0').empty();
			if (users.length > 0){
				$('#ui-tabs-0').append('<p>Выберите свое имя из списка</p>');
				$('#ui-tabs-0').append('<form name = "userList" id = "userList">');
				for (var i = 0; i < users.length; ++i)
					$('#userList').append(
					'<input type="radio" name="user_name" id="user_name_' + i + '" value="' + users[i].name + '" ' + 
					(i == 0 ? 'checked': '') + ' class="radioinput" /><label for="user_name_' + i + '">' 
					+ users[i].name + '</label><br>');
				$('#userList').append(
					'<input type = "button" name="userNameSubmit" id = "userNameSubmit" class = "userNameSubmit"' + 
					' onClick = chooseUser()></input>');
				$('#ui-tabs-0').append('</form>');
			}
			else 
				$('#ui-tabs-0').append('<p>На данный момент нет доступных пользователей</p>');	
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
		var result = commandsToJSON();
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
			if (data.status == 'ok')
				sid = data.sid;
			else
				alert("Ошибка подключения к серверу. Попробуйте снова");
		});
		var result = commandsToJSON();
		var problem_id = problemsList[curProblem].id;  //problem_id = 
		var de_id = 772264;
		var boundary = Math.round((Math.random() * 999999999999));
		var sep = '-------------' + boundary + '\r\n';
		var l = 0;
		function genPostQuery(serv, path, data)	{
			var result = 'Content-Type: multipart/form-data, boundary=' + sep + '\r\n';
			result += 'Content-Length: ' + data.length + '\r\n\r\n';
			l = data.length;
			result += data;
			return result;
		}
		function genFieldData(name, value){
			var result = sep + 'Content-Disposition: form-data; name="' + name + '"' + "\r\n\r\n";
			result += value + '\r\n';
			return result;
		}
		function genFileFieldData(name, filename, type, data){
			var result = sep + 'Content-Disposition: form-data; name="' + name  +  '"; filename="' + filename + '"' + "\r\n";
			result += 'Content-Type: ' + type + "\r\n\r\n";
			result += data + '\r\n\r\n';
			return result;
		}
		var data = genFieldData('search', '');
		data += genFieldData('rows', '20');
		data += genFieldData('problem_id', problem_id);
		data += genFieldData('de_id', de_id);
		data += genFieldData('submit', 'send');
		data += genFileFieldData('source', 'ans.txt', 'text/plain', result);
		data += '-------------' + boundary  + '--\r\n';
		var query = genPostQuery('imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + sid + ';cid=' + cid, data);
		callSubmit(pathPref + 'f=problems;sid=' + sid + ';cid=' + cid, data,'imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' 
				+ sid + ';cid=' + cid, sep, l, function(data){
			alert('Решение отослано на проверку');
		});
	}
}

function fillTabs(){
	if (!login)  {
		callScript(pathPref + 'f=login;login=' + 'apress' +';passwd=' + 'tratata' + ';json=1;', function(data){
		if (!data)
			return;
		if (data.status == 'ok')
			sid = data.sid;
		else {
			sid = undefined;
			alert('Ошибка подключения к серверу. Попробуйте снова');
		}
		});
	}
	else
		callScript(pathPref + 'f=login;login=' + login +';passwd=' + passwd + ';json=1;', function(data){
			if (data.status == 'ok')
				sid = data.sid;
			else {
				sid = undefined;
				alert('Ошибка подключения к серверу. Попробуйте снова');
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
	$('#tabs').tabs('add', '#ui-tabs-0', "Выбор пользователя" );
	changeUser();
	callScript(pathPref + 'f=problems;sid='+sid+';cid='+cid+';json=1;', function(data){
		for (var i = 0; i < 10/*data.problems.length*/; ++i){
			getProblemStatement(i);
			getTest(i, 1);
			if (data && i < data.problems.length)					///////
				problemsList.push({'id':data.problems[i].id, 'name': data.problems[i].name});
			$('#tabs').tabs('add', '#ui-tabs-' + (i + 1),problems[i].name );
			$('#ui-tabs-' + (i + 1)).append('<table id = "main' + i + '">');
			mainT = $('#main' + i);
			mainT.append('<tr id = "1tr' + i +'">');
			$('#1tr' + i).append('<td colspan = "' + (problems[i].max_step ? 1 : 2) +'" id = "tdSt' + i + '" valign = "top">');
			$('#1tr' + i).append('</td>');
			if (problems[i].max_step){
				$('#1tr' + i).append('<td align = "right"><table id = "tablePnts' + i + '"></table></td>')
				$('#tablePnts' + i).append('<tr><td id = "tdPnts' + i + '" valign = "top">');
				$('#tdPnts' + i).append('Затрачено шагов: <input class = "pnts" readonly id = "curStep' 
					+ i + '"> из ' + problems[i].max_step);
				$('#1tr' + i).append('</td></tr>');
				$('#curStep' + i).attr('value', '0');
				$('#tablePnts' + i).append('<tr><td id = "tdProgressBar' + i + '" valign = "top">');
				$('#tdProgressBar' + i).append('<div id = "progressBar' + i + '"></div>');
				$('#progressBar' + i).progressbar({value: 0});
				$('#1tr' + i).append('</td></tr>');
			}
			$('#1tr' + i).append('<td valign = "top" align = "right" id = "tdAboutBtn' + i + '">');
			$('#tdAboutBtn' + i).append(
				'<button class="ui-button ui-button-text-only ui-widget ui-state-default ui-corner-all" id = "aboutBtn' + i +'"></button>');
			$('#tdAboutBtn' + i).append(
				'<button class="ui-button ui-button-text-only ui-widget ui-state-default ui-corner-all" id = "exportBtn' + i +'"></button>');
			$('#tdAboutBtn' + i).append(
				'<button class="ui-button ui-button-text-only ui-widget ui-state-default ui-corner-all" id = "importBtn' + i +'"></button>');
			$('#aboutBtn' + i).append('<span class="ui-button-text">?</span>');
			$('#exportBtn' + i).append('<span class="ui-button-text">export</span>');
			$('#importBtn' + i).append('<span class="ui-button-text">import</span>');
			$('#tdAboutBtn' + i).append('<div id = "import' + i + '"></div>');
			$('#tdAboutBtn' + i).append('<div id = "export' + i + '"></div>');
			$('#exportBtn' + i).click(function() { return exportCommands(); });
			$('#importBtn' + i).click(function() { return import_(); });
			$('#import' + i).append('<textarea rows = "20" cols = "20" id = "importText' + i + '"></textarea>');
			$('#1tr' + i).append('</td>');
			mainT.append('</tr>');
			mainT.append('<tr id = "4tr' + i +'">');
			$('#4tr' + i).append('<td id = "tdBtns' + i + '" colspan = "2" valign = "top">');
			for (var j = 0; j < btns.length; ++j)
				$('#tdBtns' + i).append(
					'<input type = "button" class = "' + btns[j] + '" name = "btn_' + btns[j] +  i + '" id = "btn_' + 
					btns[j] + i + '" onClick = "' + btns[j] + 'Click()"></input>');
			$('#4tr' + i).append('</td>');
			$('#4tr' + i).append('<td id = "tdBtnSubmit' + i + '" valign = "top">');
			$('#tdBtnSubmit' + i).append(
				'<input type = "button" class = "clear" name = "btn_clear' + i + '" id = "btn_clear' 
				+ i + '" onClick = "clearClick()"></input>');
			$('#tdBtnSubmit' + i).append(
				'<input type = "button" align = "right" name="submit' + i + '" id = "submit' + i + 
				'" class = "submit" onClick = submitClick()></input>');
			$('#4tr' + i).append('</td>');
			mainT.append('</tr>');
			mainT.append('<tr id = "2tr'+ i +'">');	
			$('#2tr' + i).append('<td id = "tdCmd' + i + '" valign = "top" height = "100%">');				
			$('#tdCmd' + i).append('<ul class = "ul_comands" id = "ul_comands' + i + '">')
			var divs = problems[i].commands;
			for (var j = 0; j < divs.length; ++j){
				$('#ul_comands' + i).append('<li id = "' + divs[j] + i + '" class = "' + divs[j] + 
					'"><span style = "margin-left: 40px;">' + divNames[divs[j]] + '</span></li>');
				if($.browser.msie)
					$('#' + divs[j] + i).css('height', '35px');
			}
			$('#tdCmd' + i).append('</ul>');
			$('#2tr' + i).append('</td>');
			$('#2tr' + i).append('<td id = "tdField' + i + '" rowspan = "2" collspan = "2" valign = "top">');
			$('#2tr' + i).append('</td>');		
			$('#2tr' + i).append('<td id = "tdCons' + i + '" rowspan = "2" valign = "top">');
			$('#tdCons' + i).append('<textarea rows="34" cols="20" name="cons" id = "cons' + i + 
				'" class = "cons" disabled readonly></textarea><br>');
			$('#2tr' + i).append('</td>');		
			mainT.append('</tr>');
			mainT.append('<tr id = "3tr'+ i +'">');
			$('#3tr' + i).append('<td id = "tdDrop' + i + '" valign = "top">');
			$('#tdDrop' + i).append('<hr align = "left" width = "270px"><br>');
			$('#tdDrop' + i).append('Укажите последовательность действий');
			$('#tdDrop' + i).append('<table><tr><td><ul id = "sortable' + i + 
				'" class = "ui-sortable sortable"></ul></td></tr></table>')
			$('#3tr' + i).append('</td>');	
			mainT.append('</tr>');
			$('#ui-tabs-' + (i + 1)).append('</table>');
			fillLabyrinth(i);
			$('#tdSt' + i).append(problems[i].statement);
		}
	});
	$('#tabs').tabs('add', '#ui-tabs-' + (problems.length + 1), 'Результаты');	
	$('#ui-tabs-' + (problems.length + 1)).append('<table class = "results"><tr><td>' + 
		'<iframe src = "' + resultsUrl + '" class = "results"></iframe></td></tr></table>');
}

function exportCommands(){
	$('#export' + curProblem).html(commandsToJSON());
	$('#export' + curProblem).dialog('open');
	return false;
}

function addCmd(name, cnt){
	$('#sortable' + curProblem).append('<li id = "' + name + cmdId + '" class = "' + name + ' ui-draggable">' + 
		'<span style = "margin-left: 40px;">' + divNames[name] + '</span></li>');		
	if($.browser.msie)
		$('#' + name + cmdId).css('height', '35px');
	$('#' + name + cmdId).attr('numId', cmdId);
	$('#' + name + cmdId).attr('ifLi', 1);
	$('#' + name + cmdId).append('<span align = "right" id = "spinDiv' + cmdId + '" class = "cnt"></span>');
	$('#spinDiv' + cmdId).append('<input class = "cnt"  id="spin' + cmdId + '" value="' + cnt + '" type="text"/>');
}

function setSpin(){
	$('#spinDiv' + cmdId).append('<input id = "spinCnt' + cmdId + '" class = "spinCnt" type="text">')
	$('#spin' + cmdId++).spin({
		min: 1,
		changed: function(){
			updated();			
		}
	});
}

function import_(){
	$('#import' + curProblem).dialog('open');
	return false;
}

function importCommands(){
	var cmds = jQuery.parseJSON($('#importText' + curProblem).attr('value'));
	if (cmds){
		$('#sortable' + curProblem).children().remove();
		for (var i = 0; i < cmds.length; ++i){
			addCmd(cmds[i].dir, cmds[i].cnt);
			setSpin();
		}
		updated();
		setDefault();
		setCounters(0);
	}
	$('#import' + curProblem).dialog('close');
}

function addNewCmd(str, dblClick, elem){
	if (dblClick)	
		addCmd(str, 1);
	else{
		$('#' + str + cmdId).append('<span align = "right" id = "spinDiv' + cmdId + '" class = "cnt"></span>');
		$('#spinDiv' + cmdId).append('<input class = "cnt"  id="spin' + cmdId + '" value="1" type="text"/>');
	}
	setSpin();
}

function hideCounters(){
	$('#sortable' + curProblem + ' > li > span > img').hide();			
	$('#sortable' + curProblem + ' > li > span > input').hide();
	var el = $('#sortable' + curProblem).children();
	while (el.length > 0){
		$('#spinCnt' + el.attr('numId')).show();
		el = el.next();
	}
}

function showCounters(){
	$('#sortable' + curProblem + ' > li > span > img').show();			
	$('#sortable' + curProblem + ' > li > span > input').show();
	var el = $('#sortable' + curProblem).children();
	while (el.length > 0){
		$('#spinCnt' + el.attr('numId')).hide();
		el = el.next();
	}
}

function enableButtons(){
	$('#sortable' + curProblem).sortable('enable');
	for (var i = 0; i < btnsPlay.length; ++i)
		$('#btn_' + btnsPlay[i] + curProblem).removeAttr('disabled');		
}

function disableButtons(){
	$('#sortable' + curProblem).sortable('disable');
	for (var i = 0; i < btnsPlay.length; ++i)
		$('#btn_' + btnsPlay[i] + curProblem).attr('disabled', 'disabled');
}

function callPlay(s){
	if (!$('#sortable' + curProblem).sortable('toArray').length || dead[curProblem])
		return;
	pause[curProblem] = false;
	stopped[curProblem] = false;
	disableButtons();
	hideCounters();
	setCounters(divI() + 1);
	speed[curProblem] = s;
	setTimeout(function() { play(); }, s);
}

playClick = function(){
	callPlay(300);
}

fastClick = function(){
	callPlay(0);
}

clearClick = function(){
	if (!confirm('Вы уверены, что хотите очистить список команд?'))
		return;
	setDefault();
	$('#sortable' + curProblem).children().remove();
}

stopClick = function(){
	stopped[curProblem] = true;
	setDefault();
	playing[curProblem] = false;
	clearClasses();
	showCounters();
	setCounters();
}

pauseClick = function(){
	if (playing[curProblem])			
		pause[curProblem] = true;
	enableButtons();
}

nextClick = function(){
	var t = curProblem;
	if ((divI() == list().length - 1 && cmd() == list()[divI()].cnt)){
		curState[t].divIndex = list().length;
		++curState[t].step;
		curState[t].cmdIndex = 0;
		return;
	}
	else
		if (divI() >= list().length)
			return;
	if (cmd() == 0 && divI() == 0)
		setCounters();
	disableButtons();
	hideCounters();
	playing[curProblem] = true;
	pause[curProblem] = false;
	stopped[curProblem] = false;
	speed[curProblem] = 0;
	if (cmd() == list()[divI()].cnt - 1)
		changeClass(divN());
	loop(1);	
}

prevClick = function(){
	var t = step();
	if (step() <= 1) {
		setDefault();
		showCounters();
		setCounters();
		return;
	}
	disableButtons();
	--t;
	setDefault(true);
	hideCounters();
	var s = speed[curProblem];
	speed[curProblem] = 0;
	playing[curProblem] = true;
	loop(t);
}