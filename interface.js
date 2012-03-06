var btnFunctions = [playClick, pauseClick, stopClick, prevClick, nextClick, fastClick];
function fillLabyrinth(problem){
	highlightOn(problem);
	var l = problem.tabIndex;
	$('#tdField' + l).append('<table id = "table_field' + l + '" class = "field"></table>');
	var table = $('#table_field' + l);
	for (var i = 0; i < problem.map.length; ++i){
		table.append('<tr id = "tr_field' + (l * 1000 + i) + '"></tr>');
		var tr = $('#tr_field' + (l * 1000 + i));
		for (var j = 0; j < problem.map[i].length; ++j){
			tr.append('<td id = "'+ (l * 10000 + i * 100 + j)+'"></td>');
			problem.map[i][j].draw();
		}
	}
}

function login(callback){
	logined = false;
	callScript(pathPref + 'f=login;login=' + curUser.login + ';passwd=' + curUser.passwd +';json=1;', function(data){
		if (data.status == 'ok')
			sid = data.sid;
		else{
			alert(data.message);
			return false;
		}
		if(curUser.jury){
			curUser.passwd = '';
			$('#password').attr('value', '');
			for (var i = 0; i < problems.length; ++i)
				$('#forJury' + i).show();
		}
		logined = true;
		callback();
		return true;
	});
}

function showNewUser(){
	$('#userListDiv').empty();
	$('#userListDiv').append('<p>Текущий пользователь:</p>');
	$('#userListDiv').append('<p>' + curUser.name +'</p>');
	$('#userListDiv').append('<button name="changeUser" id = "changeUser">Сменить пользователя</button>');
	$('#changeUser').button();
	$('#changeUser').click(changeUser);
}

function chooseUser(){
	logined = false;
	var user = $('#userListDiv > input:checked');
	name = user[0].defaultValue;
	for (var i = 0; i < users.length; ++i){
		if (name == users[i].name){
			curUser = users[i];
			if (curUser.jury) {
				$("#enterPassword").bind("dialogbeforeclose", function(event, ui) {
					if (logined)
						showNewUser();
					$("#enterPassword").bind("dialogbeforeclose", function(event, ui){});
				});
				$('#enterPassword').dialog('open') ;
			}
			else
				login(showNewUser);
			break;
		}
	}
}

function changeUser(){
	for (var i = 0; i < problems.length; ++i)
		$('#forJury' + i).hide();
	logined = false;
	callScript(pathPref +'f=logout;sid=' + sid + ';json=1;', function(){});
	sid = undefined;
	callScript(pathPref +'f=users;cid=' + cid + ';rows=100;json=1;', function(data){
		if (!data)
			return;
		curUser = new Object();
		users = [];
		for (var i = 0; i < data.length; ++i){
			if (data[i].ooc == 1)
				continue;
			users.push({'login': data[i].login, 'name': data[i].name, 'jury': data[i].jury, 'passwd': defaultPass}); 
		}
		$('#userListDiv').empty();
		if (users.length > 0){
			$('#userListDiv').append('<p>Выберите свое имя из списка</p>');
			for (var i = 0; i < users.length; ++i){
				$('#userListDiv').append(
				'<input type="radio" name="user_name" id="user_name_' + i + '" value="' + users[i].name + '" ' + 
				(i == 0 ? 'checked': '') + ' class="radioinput" /><label for="user_name_' + i + '">' 
				+ users[i].name + '</label><br>');
			}
			$('#userListDiv').append('<br><button id = "userNameSubmit" >Выбрать пользователя</button>');
			$('#userNameSubmit').button({icons: {primary: 'ui-icon-check'}});
			$('#userNameSubmit').click(chooseUser);
		}
		else 
			$('#userListDiv').append('<p>На данный момент нет доступных пользователей</p>');	
	});
}

function submit(data, sep, l, submitStr){
	callScript(pathPref + 'f=contests;filter=json;sid=' + sid + ';json=1;', function(data){
		if (data.error == 'bad sid'){
			if (curUser.jury) {
				$("#enterPassword").bind("dialogbeforeclose", function(event, ui) {
					if (logined && confirm('Переотправить решение?'))
						submit(data, sep, l, submitStr);	
					$("#enterPassword").bind("dialogbeforeclose", function(event, ui){});
				});
				$('#enterPassword').dialog('title', 'sid устарел. Введите пароль снова');
				$('#enterPassword').dialog('open');
			}					
			else
				login(function() {submit(data, sep, l, submitStr)});
		} 
		else{
			if (atHome){
				callSubmit_('imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + sid + ';cid=' + cid +';json=1;', submitStr, function(data){
					alert('Решение отослано на проверку');
				});  
			}
			else
			callSubmit(pathPref + 'f=problems;sid=' + sid + ';cid=' + cid+ ';json=1;', data,'imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' 
					+ sid + ';cid=' + cid, sep, l, function(data){
				alert('Решение отослано на проверку');
			});
		}
	})
}

submitClick = function(){
	if (!logined) {
		alert('Невозможно отослать решение, так как не выбран пользователь');
		return false;
	}		
	if (!sid)
		(curUser.jury) ? $('#enterPassword').dialog('open') : login();
	if (atHome){
		var result = commandsToJSON();
		submitStr = 'source=' + result + '&problem_id=' + curProblem.id + '&de_id=772264';
		submit('', '', '', submitStr);
	} 
	else {
		var result = commandsToJSON();
		var problem_id = curProblem.id;  //problem_id = 
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
		submit(data, sep, l);
	}
}

function getContests(){
	callScript(pathPref + 'f=contests;filter=json;sort=1;sort_dir=0;json=1;', function(data){ ////
		if (!data)
			return;
		contests = data.contests;
		for (var i = 0; i < contests.length; ++i){
				$('#contestsList').append(
				'<input type="radio" name="contest_name" id="contest_name_' + i + '" value="' + contests[i].name + '" ' + 
				(i == 0 ? 'checked': '') + ' class="radioinput" /><label for="contest_name_' + i + '">' 
				+ contests[i].name + '</label><br>');
		}
		cid = contests[0].id;
		document.title = contests[0].name;
	});
	fillTabs();
}

function clearTabs(){
	$('#tabs > div').each(function(index, elem){
		$(elem.id).empty();
		$('#tabs').tabs('remove', index);
	});
}

function changeContest(){
	var contest = $('#contestsList > input:checked');
	name = contest[0].defaultValue;
	document.title = name;
	for (var i = 0; i < contests.length; ++i){
		if (name == contests[i].name){
			if (cid != contests[i].id){
				cid = contests[i].id;
				fillTabs();
			}
			break;
		}
	}
}

var curCodeMirror;

function outf(text)
{
	text = text.replace(/</g, '&lt;');
	$('#codeRes').append(text);
}
var finalcode, $gbl, $loc, $expr, $scope, nextline, $scopename, $scopestack;

function getCurBlock()
{
	var scope = finalcode.compiled.scopes[$scope].scopename;
	return eval('$loc.' + scope + '.stack[$loc.' + scope + '.stack.length - 1].blk');
}

function getScope()
{
	return finalcode.compiled.scopes[$scope];
}

function tryNextStep()
{
	if (getCurBlock() >= 0)
	{
		if (nextline != undefined)
			curCodeMirror.setLineClass(nextline, null);
		var e = 1;
		while (getCurBlock() >= 0 && (e || $expr))
		{
			$expr = 0;
			e = getScope().blocks[getCurBlock()].expr;
			try
			{
				eval(finalcode.code);
				updateWatchList();
			}catch(e)
			{
				alert(e);
			}
		}
		if (getCurBlock() >= 0)
		{
			var b = getCurBlock();
			while(getScope().blocks[b].funcdef)
				++b;
			nextline = getScope().blocks[b].lineno;		
		}
			
		if (nextline != undefined)
			curCodeMirror.setLineClass(nextline, 'cm-curline');
		if (getCurBlock() < 0)
		{
			if (nextline != undefined)
				curCodeMirror.setLineClass(nextline, null);
			alert('finished');
		} 
	}
	else
	{
		if (nextline != undefined)
			curCodeMirror.setLineClass(nextline, null);
		alert('finished');
	}
}

function updateWatchList()
{
	for(var p in watchList)
	{
		var res = calculateValue(watchList[p]);
		$('#calcVal' + p).html(res == undefined ? 'undefined' : res);
	}
}

function tryCode()
{
	var output = $('#codeRes');
	output.html('');
	Sk.configure({output:outf});
	var input = curCodeMirror.getValue();
	try {
		finalcode = Sk.importMainWithBody("<stdin>", false, input);
		$scope = 0,
		$gbl = {},
		$loc = $gbl;
		for (var i = 0; i < finalcode.compiled.scopes.length; ++i)
		{
			eval('$loc.' + finalcode.compiled.scopes[i].scopename + ' = {};');
			eval('$loc.' + finalcode.compiled.scopes[i].scopename + '.defaults = [];');
			eval('$loc.' + finalcode.compiled.scopes[i].scopename + '.stack = [];');
		}
		eval('$loc.scope0.stack.push({"loc": {}, "param": {}, blk: 0});');
		nextline = getScope().firstlineno;
		curCodeMirror.setLineClass(nextline, 'cm-curline');
		$scopename = finalcode.compiled.scopes[0].scopename;
		$scopestack = 0;
		$('#codeRes1').html(finalcode.code);
		$gbl['my_function'] = my_function;
		updateWatchList();
	} catch (e) {
		alert(e);
	}
}

function showHideCode()
{
	if ($('#showHide').attr('checked'))
		$('#codeRes1').hide();
	else
		$('#codeRes1').show();
}

function testChanged()
{
	curCodeMirror.setValue(tests[$('#selectTest :selected').val()]);
}

function calculateValue(name)
{
	var result = undefined;
	if ($scope != undefined && $loc != undefined)
	{
		var scope = finalcode.compiled.scopes[$scope].scopename;
		var t_scope = $scope, 
			t_scopename = $scopename, 
			t_scopestack = $scopestack;
		while(eval("$loc." + t_scopename + ".stack[" + t_scopestack + "].loc." + name) == undefined
			&& eval("$loc." + t_scopename + ".stack[" + t_scopestack + "].parentStack") != undefined)
		{
			t_scope = eval("$loc." + t_scopename + ".stack[" + t_scopestack + "].parent");
			var nm = t_scopename;
			t_scopename = eval("$loc." + t_scopename + ".stack[" + t_scopestack + "].parentName");
			t_scopestack = eval("$loc." + nm + ".stack[" + t_scopestack + "].parentStack");
		}
		result = eval("$loc." + t_scopename + ".stack[" + t_scopestack + "].loc." + name) !== undefined ?
					eval("$loc." + t_scopename + ".stack[" + t_scopestack + "].loc." + name):
					Sk.misceval.loadname(name, $gbl, 1);
	}
	return result;
}

function my_function()
{
	alert('yeah!!!');
}

function onAddWatchClick()
{
	$('#addWatchDialog').dialog('open');
}

function fillTabs(){
	if ($('#ui-tabs-0').length){
		$('#ui-tabs-0').empty();
		$('#tabs').tabs('remove', 0);
	}
	$('#tabs').tabs('add', '#ui-tabs-0', "Выбор пользователя", 0);
	$('#ui-tabs-0').append('<table width = "100%"><tr id = "tab0"><td><div id = "userListDiv"></div></td>');
	$('#tab0').append('<td valign = "top" align = "right"><button id = "changeContestBtn">Выбрать турнир</button></td></tr>');
	$('#ui-tabs-0').append('</table>');
	$('#changeContestBtn').button();
	$('#changeContestBtn').click(function(){
		$('#contestsList').show(); 
		$('#changeContest').dialog('open'); 
		return false; 
	}); 
	changeUser();
	problems = [];
	callScript(pathPref + 'f=problem_text;notime=1;nospell=1;noformal=1;cid=' + cid + ';nokw=1;json=1', function(data){
		for (var i = 0; i < data.length; ++i){
			problems[i] = $.extend({}, data[i], data[i].data);
			problems[i].tabIndex = i;
			getTest(data[i].data, i);
			if ($('#ui-tabs-' + (i + 1)).length){
				$('#ui-tabs-' + (i + 1)).empty();
				$('#tabs').tabs('remove', i + 1);
			}
			$('#tabs').tabs('add', '#ui-tabs-' + (i + 1),problems[i].title, i + 1);
			var divs = [];
			for (var j = 0; j < problems[i].commands.length; ++j)
			{
				divs.push({'tab': i, 'divclass': problems[i].commands[j], 'divname': cmdClassToName[problems[i].commands[j]]});
			}
			var buttons = [];
			for (var j = 0; j < btns.length; ++j)
			{
				buttons.push({'tab': i, 'btn': btns[j]});
			}
			$('#tabTemplate').tmpl({'tab': i, 
				'statement': problems[i].statement, 
				'maxCmdNum': problems[i].maxCmdNum,
				'maxStep': problems[i].maxStep,
				'commands': divs,
				'btns': buttons},{}).appendTo('#ui-tabs-' + (i + 1));
			$("#aboutBtn" + i).button();
			$('#exportBtn' + i).button();
			$('#importBtn' + i).button();
			$('#exportBtn' + i).click(function() { return exportCommands(); });
			$('#importBtn' + i).click(function() { return import_(); });
			$('#progressBar' + i).progressbar({value: 0});
			$('#btn_clear' + i).button({text:false, icons: {primary: 'ui-icon-trash'}});
			$('#btn_clear' + i).button({text:false, icons: {primary: 'ui-icon-trash'}});
			fillLabyrinth(problems[i]);
			$('#forJury' + i).hide();
			for (var j = 0; j < btns.length; ++j){
				$('#btn_'+ btns[j] + i).button({text: false, icons: {primary: buttonIconClasses[j]}});
				$('#btn_'+ btns[j] + i).bind('click', function() {
					hideFocus();
					eval( $(this).attr('name') + 'Click()'); 		
					return false;
				});
			}
		}
		
	});
	if ($('#ui-tabs-' + (problems.length + 1)).length){
		$('#ui-tabs-' + (problems.length + 1)).empty();
		$('#tabs').tabs('remove', (problems.length + 1));
	}
	$('#tabs').tabs('add', '#ui-tabs-' + (problems.length + 1), 'Результаты', (problems.length + 1));
	$('#ui-tabs-' + (problems.length + 1)).append('<button id = "refreshTable">Обновить таблицу</button>');
	$('#refreshTable').button({text:false, icons: {primary: 'ui-icon-refresh'}});
	$('#ui-tabs-' + (problems.length + 1)).append('<table class = "results"><tr><td>' + 
		'<iframe id = "results" src = "' + resultsUrl + cid + ';" class = "results"></iframe></td></tr></table>');
	$('#refreshTable').click(function() {$('#results').attr('src', resultsUrl + cid)});
		$('#tabs').tabs('select', 0);
	for(var i = $('#tabs').tabs('length') - 1; i > problems.length + 1; --i){
	  while($('#ui-tabs-' + i).length){
			$('#ui-tabs-' + i).empty();
			$('#tabs').tabs('remove', i);
		}
	}
	$('#tabs').tabs('add', '#ui-tabs-' + (problems.length + 2), 'test code mirror', (problems.length + 2));
	$('#ui-tabs-' + (problems.length + 2)).append('<div id = "pythonForm"></div>');
	$('#pythonForm').append('<textarea id = "code" name = "code"></textarea>');
	$('#pythonForm').append('<select id = "selectTest" name = "selectTest" onchange = "testChanged()"></select>');
	for(var i = 0; i < TESTS_NUM; i++)
	{
		$('#selectTest').append('<option id = "test' + i + '" value = "' + i + '">' + (i + 1) + '</option>');
	}
	$('#code').append(tests[0]);
	curCodeMirror = CodeMirror.fromTextArea($('#code')[0], {
		lineNumbers: true,
		onGutterClick: function(cm, n) {
			var info = cm.lineInfo(n);
				if (info.markerText)
					cm.clearMarker(n);
				else
				cm.setMarker(n, "<span style=\"color: #900\">●</span> %N%");
		},
	    mode: {name: "python",
           version: 2,
           singleLineStringErrors: false},
        indentUnit: 4,
        tabMode: "shift",
        matchBrackets: true
	});
	$('#ui-tabs-' + (problems.length + 2)).append('<button id = "btnPython">Post python code</button>');
	$('#ui-tabs-' + (problems.length + 2)).append('<button id = "btnPythonNext">next</button>');
	$('#ui-tabs-' + (problems.length + 2)).append('<button id = "btnAddWatch">Add watch</button>');
	$('#pythonForm').append('<pre id = "codeRes"></pre>');
	$('#pythonForm').append('<input type = "checkbox" onchange = "showHideCode()" id = "showHide">Show/hide code</input>');
	$('#pythonForm').append('<pre id = "codeRes1"></pre>');
	$('#pythonForm').append('<div id = "watchDiv"><table id = "watchTable"></table></div>');
	$('#btnAddWatch').button().click(onAddWatchClick);
	$('#btnPython').button();
	$('#btnPython').click(tryCode);
	$('#btnPythonNext').button();
	$('#btnPythonNext').click(tryNextStep);
}

function exportCommands(){
	$('#export' + curProblem.tabIndex).html(commandsToJSON());
	$('#export' + curProblem.tabIndex).dialog('open');
	return false;
}

function addCmd(name, cnt){
	$('#sortable' + curProblem.tabIndex).append('<li id = "' + name + cmdId + '" class = "' + name + ' ui-draggable">' + 
		'<span style = "margin-left: 40px;">' + cmdClassToName[name] + '</span></li>');		
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
	$('#importText' + curProblem.tabIndex).show();
	$('#import' + curProblem.tabIndex).dialog('open');
	return false;
}

function importCommands(){
	var cmds = jQuery.parseJSON($('#importText' + curProblem.tabIndex).attr('value'));
	if (cmds){
		$('#sortable' + curProblem.tabIndex).children().remove();
		for (var i = 0; i < cmds.length; ++i){
			addCmd(cmds[i].dir, cmds[i].cnt);
			setSpin();
		}
		updated();
		setDefault();
		setCounters(0);
	}
	$('#import' + curProblem.tabIndex).dialog('close');
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
	$('#sortable' + curProblem.tabIndex + ' > li > span > img').hide();			
	$('#sortable' + curProblem.tabIndex + ' > li > span > input').hide();
	var el = $('#sortable' + curProblem.tabIndex).children();
	while (el.length > 0){
		$('#spinCnt' + el.attr('numId')).show();
		el = el.next();
	}
}

function showCounters(){
	$('#sortable' + curProblem.tabIndex + ' > li > span > img').show();			
	$('#sortable' + curProblem.tabIndex + ' > li > span > input').show();
	var el = $('#sortable' + curProblem.tabIndex).children();
	while (el.length > 0){
		$('#spinCnt' + el.attr('numId')).hide();
		el = el.next();
	}
}

function enableButtons(){
	$('#sortable' + curProblem.tabIndex).sortable('enable');
	for (var i = 0; i < btnsPlay.length; ++i)
		$('#btn_' + btnsPlay[i] + curProblem.tabIndex).removeAttr('disabled');		
}

function disableButtons(){
	$('#sortable' + curProblem.tabIndex).sortable('disable');
	for (var i = 0; i < btnsPlay.length; ++i)
		$('#btn_' + btnsPlay[i] + curProblem.tabIndex).attr('disabled', 'disabled');
}

function callPlay(s){
	if (!$('#sortable' + curProblem.tabIndex).sortable('toArray').length || curProblem.arrow.dead)
		return;
	if (curProblem.maxCmdNum && curProblem.divIndex == curProblem.maxCmdNum){
		var mes = new MessageCmdLimit();
		curProblem.arrow.dead = true;
		return;
	}
	curProblem.paused = false;
	curProblem.stopped = false;
	disableButtons();
	hideCounters();
	setCounters(divI() + 1);
	curProblem.speed = s;
	setTimeout(function() { play(); }, s);
}

function playClick(){
	callPlay(300);
	$('#btn_play'+ curProblem.tabIndex).addClass('ui-state-focus');
}

function fastClick(){
	cmdHighlightOff();
	callPlay(0);
}

function clearClick(){
	if (!confirm('Вы уверены, что хотите очистить список команд?'))
		return;
	setDefault();
	$('#sortable' + curProblem.tabIndex).children().remove();
}

function stopClick(){
	curProblem.stopped = true;
	setDefault();
	curProblem.playing = false;
	cmdHighlightOff();
	showCounters();
	setCounters();
}

function pauseClick(){
	if (curProblem.playing)			
		curProblem.paused = true;
	enableButtons();
}

function nextClick(){
	if (curProblem.maxCmdNum && curProblem.divIndex == curProblem.maxCmdNum){
		var mes = new MessageCmdLimit();
		curProblem.arrow.dead = true;
		changeProgressBar();
		if (curProblem.arrow.dead)
			heroIsDead();
		return;
	}
	if ((divI() == list().length - 1 && cmd() == list()[divI()].cnt)){
		curProblem.divIndex = list().length;
		++curProblem.step;
		curProblem.cmdIndex = 0;
		return;
	}
	else
		if (divI() >= list().length)
			return;
	if (cmd() == 0 && divI() == 0)
		setCounters();
	disableButtons();
	hideCounters();
	curProblem.playing = true;
	curProblem.paused = false;
	curProblem.stopped = false;
	curProblem.speed = 0;
	curProblem.nextOrPrev = true;
	if (divI() >= 1 && isCmdHighlighted(curProblem.cmdList[divI()- 1].name))
		changeCmdHighlight(curProblem.cmdList[divI()- 1].name);	
	loop(1);
}

function prevClick(){
	var t = step();
	if (step() <= 1) {
		setDefault();
		showCounters();
		setCounters();
		return;
	}
	++c;
	--t;
	setDefault(true);
	disableButtons();
	hideCounters();
	var s = curProblem.speed;
	curProblem.speed = 0;
	curProblem.playing = true;
	curProblem.nextOrPrev = true;
	loop(t);
}
