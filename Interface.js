define('Interface', ['jQuery', 
	'jQueryUI', 
	'BlockUI',
	'jQueryCookie',
	'CodeMirrorModule',
	'Servers',
	'CallServer',
	'Problems',
	'CodeMode',
	'jQueryTmpl',
	'ModesConvertion'], function(){
	var Problems = require('Problems');
	var ModesConvertion = require('ModesConvertion');
	var btnFunctions = [playClick, pauseClick, stopClick, prevClick, nextClick];

	function login(callback, firstTrying){
		currentServer.setSid(undefined);
		currentServer.login(currentServer.user.login, currentServer.user.passwd, function(data) {
			if (data.status == 'ok') {
				currentServer.setSid(data.sid);
			}
			else if(firstTrying){
				$("#enterPassword").bind("dialogbeforeclose", function(event, ui) {
					if (currentServer.getSid())
						showNewUser();
					$("#enterPassword").bind("dialogbeforeclose", function(event, ui){});
				});
				$('#enterPassword').dialog('open') ;
				return;
			}
			else{
				alert(data.message);
				return false;
			}
			$.cookie('passwd', currentServer.user.passwd);
			if(currentServer.user.jury){
				currentServer.user.passwd = '';
				$('#password').prop('value', '');
				for (var i = 0; i < problems.length; ++i)
					$('#forJury' + i).show();
			}
			//logined = true;
			if (callback)
				callback();
			return true;
		});
	}

	function showNewUser(){
		$('#userListDiv').empty();
		$('#userListDiv').append('<p>Текущий пользователь:</p>');
		$('#userListDiv').append('<p>' + currentServer.user.name +'</p>');
		$('#userListDiv').append('<button name="changeUser" id = "changeUser">Сменить пользователя</button>');
		$('#changeUser').button();
		$('#changeUser').click(changeUser);
	}

	function chooseUser(){
		currentServer.setSid(undefined);
		//logined = false;
		var user = $('#userListDiv > input:checked');
		name = user[0].defaultValue;
		for (var i = 0; i < users.length; ++i){
			if (name == users[i].name){
				var curUser = new Servers.User(users[i].login, '', users[i].jury, users[i].name);
				if ($.cookie('passwd')) {
					curUser.passwd = $.cookie('passwd');
				}
				currentServer.setUser(curUser);
				login(showNewUser, true);
				break;
			}
		}
		$.cookie('contestId', $('#contestsList > input:checked').prop('id'));
		$.cookie('userId', user.prop('id'));
	}

	function changeUser(){
		for (var i = 0; i < problems.length; ++i)
			$('#forJury' + i).hide();
		try{ //temporary wa
			currentServer.logout(function(data){
			});
		}catch(e){
			console.error(e);
		}
		currentServer.setSid(undefined);
		$.cookie('userId', undefined);
		$.cookie('passwd', undefined);

		currentServer.getUsersList(function(data) {
			if (!data)
				return;
			currentServer.setUser(undefined);
			users = [];
			for (var i = 0; i < data.length; ++i){
				if (data[i].ooc == 1)
					continue;
				users.push({'login': data[i].login, 'name': data[i].name, 'jury': data[i].jury, 'passwd': currentServer.defaultPass}); 
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

	function submit(submitStr, problem_id){
		currentServer.submit(submitStr, problem_id, function(){
			login(function() {submit(submitStr, problem_id)}, true);
		})
	}

	submitClick = function(){
		if (!currentServer.getSid()) {
			alert('Невозможно отослать решение, так как не выбран пользователь');
			return false;
		}		
		if (!currentServer.getSid())
			(currentServer.user.jury) ? $('#enterPassword').dialog('open') : login();
		curProblem.submit();
	}

	function getContests(){
		currentServer.getContestsList(function(data) { ////
			if (!data)
				return;
			contests = data.contests;
			for (var i = 0; i < contests.length; ++i){
					$('#contestsList').append(
					'<input type="radio" name="contest_name" id="contest_name_' + i + '" value="' + contests[i].name + '" ' + 
					(i == 0 ? 'checked': '') + ' class="radioinput" /><label for="contest_name_' + i + '">' 
					+ contests[i].name + '</label><br>');
			}
			currentServer.setCid(contests[0].id);
			document.title = contests[0].name;
		});
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
				//if (cid != contests[i].id){
					currentServer.setCid(contests[i].id);
					fillTabs();
				//}
				break;
			}
		}
		$.cookie('contestId', contest.prop('id'));
	}

	function onAddWatchClick()
	{
		$('#addWatchDialog').dialog('open');
	}

	function startWaitForCommandsGeneration(problem) {
		if (problem.loadedCnt > 0) {
			$.blockUI({ 
				message: '<img src="images/busy.gif" />', 
				fadeIn: 0,
				css: {
					width: '20px', 
			        top: '20px', 
			        left: '20px'
				}});
			waitForCommandsGeneration(problem);
		}
	}

	function waitForCommandsGeneration(problem) {
		if (problem.loadedCnt > 0) {
			setTimeout(function(){waitForCommandsGeneration(problem)}, 200);
		}
		else {
			$.unblockUI();
			problem.updated();
			problem.executionUnit.draw();
		}
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
		currentServer.getProblems(function(data){
			for (var i = 0; i < data.length; ++i){
				problems[i] = new Problems.Problem(data[i], i);
				if ($('#ui-tabs-' + (i + 1)).length){
					$('#ui-tabs-' + (i + 1)).empty();
					$('#tabs').tabs('remove', i + 1);
				}
				$('#tabs').tabs('add', '#ui-tabs-' + (i + 1), problems[i].code, i + 1);
				var buttons = [];
				for (var j = 0; j < btns.length; ++j) {
					buttons.push({'tab': i, 'btn': btns[j], 'title': btnTitles[j]});
				}
				$('#tabTemplate').tmpl({'tab': i, 
					'statement': problems[i].statement, 
					'maxCmdNum': problems[i].maxCmdNum,
					'maxStep': problems[i].maxStep,
					//'commands': divs,
					'title': problems[i].title,
					'btns': buttons},{}).appendTo('#ui-tabs-' + (i + 1));
				$('#hideStatement' + i)
					.button({text: false, icons: {primary: 'ui-icon-minus'}})
					.click(function(j){
						return function(){
							if ($('#statement' + j).is(':visible'))
							{
								$('#statement' + j).hide();
								$(this).button( 'option', 'icons', {primary:'ui-icon-plus'});
							}
							else
							{
								$('#statement' + j).show();
								$(this).button( 'option', 'icons', {primary:'ui-icon-minus'});
							}
						}
					}(i));
				$('#progressBar' + i).progressbar({value: 0});
				$('#btn_clear' + i).button({text:false, icons: {primary: 'ui-icon-trash'}});
				$('#btn_clear' + i).click(clearClick);
				$('#submit' + i).button({icons: {primary: 'ui-icon-check'}});
				$('#submit' + i).click(submitClick);
				$('#tdcode' + i).hide();
				$('#addWatch' + i).hide();
				$('#watchTable' + i).hide();
				$('#slider' + i).slider({
					min: 0,
					max : 1000,
					value: 650
				}).bind("slidechange", function(j){
					return function(){
						problems[j].speed = Math.max(1, $(this).slider('option', 'max') - $(this).slider('value'));
					}
				}(i));
				var CM = CodeMirror.fromTextArea($('#codearea' + i)[0], {
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
			        indentUnit: 2,
			        tabMode: "shift",
			        matchBrackets: true
				});
				codeareas.push(CM);
				var groupBox = "input[name='group" + i + "']";
				$(groupBox).change(function(j){
					return function(){
					    if ($("input[name='group" + j + "']" + ":checked").prop('id') == 'commandsMode' + j) {
							var l = codeareas[j].getValue().length;
							try {
								$('#jstree-container' + j).empty();	
								$('#accordion' + j).myAccordion( 'clear' );
								problems[j].prepareForExecuting();
								problems[j].functions = {};
								var block = undefined;
								if (finalcode[j]) {
									block = ModesConvertion.convertTreeToCommands(finalcode[j].compiled.ast.body, undefined, problems[j], true);
									if (block) {
										//problems[j].cmdList = block;//??

										problems[j].loadedCnt = 1;
										startWaitForCommandsGeneration(problems[j]);
										block.generateCommand(jQuery.jstree._reference('#jstree-container' + j));
										--problems[j].loadedCnt;
										
										//setTimeout(function() {problems[j].updated()}, 20000);
										//block.generateCommand(jQuery.jstree._reference('#jstree-container' + j))
									}
									else if (!confirm('Невозможно сконвертировать код в команды. Все изменения будут потеряны')){
										$("#commandsMode" + j).prop('checked', false);
										$("#codeMode" + j).prop('checked', true);
										problems[j].updated();
										return;
									}
								}
							}
							catch(e){
								console.error(e);
								$.unblockUI();
								++cmdId;
								problems[j].updated();
								if (l && !confirm('Невозможно сконвертировать код в команды. Все изменения будут потеряны')){
									$("#commandsMode" + j).prop('checked', false);
									$("#codeMode" + j).prop('checked', true);
									return;
								}
							}
							$('#ulCommands' + j).show();
							$('#jstree-container' + j).show();
							$('#funccall-container' + j).show();
							$('#tdcode' + j).hide();
							$('#addWatch' + j).hide();
							$('#watchTable' + j).hide();
							$('#tdcommands' + j).show();
							$('#btn_clear' + j).show();
							$('#tdcontainer' + j).show();
							$('#accordion' + j).show();
							problems[j].updated();
					
				    	}
					    else {
							$('#accordion' + j).empty();
							$('#accordion' + j).hide()
				    		$('#ulCommands' + j).hide();
							$('#ulCommands_' + j).show();
							$('#jstree-container' + j).hide();
							$('#funccall-container' + j).hide();
							$('#tdcommands' + j).hide();
							$('#tdcommands_' + j).show();
							$('#tdcontainer' + j).hide();
							$('#btn_clear' + j).hide();
							$('#tdcode' + j).show();
							codeareas[j].setValue(problems[j].convertCommandsToCode());
							codeareas[j].refresh();
							problems[j].setDefault();
							$('#addWatch' + j).show();
							$('#watchTable' + j).show();
				    	}
					}
				}(i));
				problems[i].initExecutor(data[i]);
				updateStyleSheet(i, problems[i].executionUnit.getCssFileName());
				problems[i].generateCommands();
			
				$('#forJury' + i).hide();
				for (var j = 0; j < btns.length; ++j){
					$('#btn_'+ btns[j] + i).button({text: false, icons: {primary: buttonIconClasses[j]}});
					$('#btn_'+ btns[j] + i).bind('click', function() {
						curProblem.hideFocus();
						eval( $(this).prop('name') + 'Click()'); 		
						return false;
					});
				}
				$('#addWatch' + i)
					.button()
					.click(function(j) {
						return function() {
							$('#addWatchDialog').dialog('open');
						}
					}(i));
				lastWatchedIndex.push(0);
				watchList.push({});
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
			'<iframe id = "results" src = "' + resultsUrl + currentServer.getCid() + ';" class = "results"></iframe></td></tr></table>');
		$('#refreshTable').click(function() {$('#results').prop('src', resultsUrl + currentServer.getCid())});
			$('#tabs').tabs('select', 0);
		for(var i = $('#tabs').tabs('length') - 1; i > problems.length + 1; --i){
		  while($('#ui-tabs-' + i).length){
				$('#ui-tabs-' + i).empty();
				$('#tabs').tabs('remove', i);
			}
		}
		/*$('#tabs').tabs('add', '#ui-tabs-' + (problems.length + 2), 'test code mirror', (problems.length + 2));
		$('#ui-tabs-' + (problems.length + 2)).append('<div id = "pythonForm"></div>');
		$('#pythonForm').append('<textarea id = "code" name = "code"></textarea>');
		$('#pythonForm').append('<select id = "selectTest" name = "selectTest" onchange = "testChanged()"></select>');
		for(var i = 0; i < TESTS_NUM; i++)
		{
			$('#selectTest').append('<option id = "test' + i + '" value = "' + i + '">' + (i + 1) + '</option>');
		}
		$('#code').append(tests[0]);
		codeareas[problems.length + 1] = CodeMirror.fromTextArea($('#code')[0], {
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
		$('#ui-tabs-' + (problems.length + 2)).append('<button id = "addWatch' + (problems.length + 1) + '">Add watch</button>');
		$('#pythonForm').append('<pre id = "cons' + (problems.length + 1) + '"></pre>');
		$('#pythonForm').append('<input type = "checkbox" onchange = "showHideCode()" id = "showHide">Show/hide code</input>');
		$('#pythonForm').append('<pre id = "codeRes1"></pre>');
		$('#pythonForm').append('<div id = "watchDiv"><table id = "watchTable' + (problems.length + 1) + '"></table></div>');
		$('#addWatch' + (problems.length + 1)).button().click(onAddWatchClick);
		$('#btnPython').button();
		$('#btnPython').click(tryCode);
		$('#btnPythonNext').button();
		$('#btnPythonNext').click(tryNextStep_);*/
		cmdId = problems.length;
	}

	function setSpin(problem){
		$('#spinDiv' + cmdId).append('<input id = "spinCnt' + cmdId + '" class = "spinCnt" type="text">')
		$('#spin' + cmdId).spin({
			min: 1
		});
		$('#spin' + cmdId++).change(function(p){
			return function(){
				p.updated();
			}
		}(problem));
	}

	function onFinishExecuting(problem)
	{
		/*finalcode[problem] = undefined;
		$scope[problem] = undefined,
		$gbl[problem] = undefined,
		$loc[problem] = $gbl[problem];
		nextline[problem] = undefined;
		for (var i = 0; i < codeareas[problem].lineCount(); ++i)
			codeareas[problem].setLineClass(i, null);
		updateWatchList();*/
	}

	function playClick(){
		var problem = curProblem;
		problem.speed = Math.max(1, $('#slider' + problem.tabIndex).slider('option', 'max') - $('#slider' + problem.tabIndex).slider('value'));
		problem.callPlay(problem.speed);
		$('#btn_play'+ problem.tabIndex).addClass('ui-state-focus');
	}

	function clearClick(){
		var problem = curProblem;
		if (!confirm('Вы уверены, что хотите очистить список команд?'))
			return;
		problem.cmdList = new CommandsMode.Block([], undefined, problem);
		$('#jstree-container' + problem.tabIndex).children().remove();
		$('#accordion' + problem.tabIndex).myAccordion('clear');
		$('#accordion' + problem.tabIndex).children().remove();
		
		problem.setDefault();
		problem.updated();
	}

	function stopClick(){
		curProblem.stop();
	}

	function pauseClick(){
		curProblem.pause();
	}

	function nextClick(){
		curProblem.next();
	}

	function prevClick(){
		curProblem.prev();
	}

	function updateStyleSheet(index, filename) 
	{
	    if ($("#dynamic_css_" + index).length == 0) {
	        $("head").append("<link>")
	        css = $("head").children(":last");
	        css.attr({
	          id: "dynamic_css_" + index,
	          rel:  "stylesheet",
	          type: "text/css",
	          href: filename
	        });
	    } 
		else 
	    {
	        $("#dynamic_css_" + index).attr("href",filename);
	    }
	 
	}

	return {
		login: login, 
		chooseUser: chooseUser, 
		getContests: getContests,
		changeContest: changeContest,
		fillTabs: fillTabs,
		onFinishExecuting: onFinishExecuting,
	};

});
