define('Interface', ['jQuery', 
	'jQueryUI', 
	'BlockUI',
	'jQueryCookie',
	'CodeMirrorModule',
	'Servers',
	'Problems',
	'jQueryTmpl',
	'ModesConversion',
	'Declaration',
	'CommandsMode'], function(){
	var Problems = require('Problems');
	var ModesConversion = require('ModesConversion');
	var Servers = require('Servers');
	var CommandsMode = require('CommandsMode');

	function login(callback, firstTrying){
		currentServer.setSid(undefined);
		currentServer.loginRequest(currentServer.user.login, currentServer.user.passwd, function(data) {
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
		currentServer.setUserByName($('#userListDiv > input:checked').first()[0].defaultValue, function(newUser){
			if ($.cookie('passwd')) {
				newUser.passwd = $.cookie('passwd');
			}
			login(showNewUser, true);
			$.cookie('contestId', $('#contestsList > input:checked').prop('id'));
			$.cookie('userId', $('#userListDiv > input:checked').prop('id'));
		});
	}

	function changeUser(){
		for (var i = 0; i < problems.length; ++i)
			$('#forJury' + i).hide();
		try{ //temporary wa
			currentServer.logoutRequest(function(data){
			});
		}catch(e){
			console.error(e);
		}
		currentServer.setSid(undefined);
		$.cookie('userId', undefined);
		$.cookie('passwd', undefined);

		currentServer.usersListRequest(function(data) {
			if (!data)
				return;
			currentServer.setUser(undefined);
			var users = currentServer.getUsers();
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
		currentServer.submitRequest(submitStr, problem_id, function(){
			login(function() {
				submit(submitStr, problem_id);
			}, true);
		})
	}

	var submitClick = function(){
		if (!currentServer.getSid()) {
			alert('Невозможно отослать решение, так как не выбран пользователь');
			return false;
		}		
		if (!currentServer.getSid())
			(currentServer.user.jury) ? $('#enterPassword').dialog('open') : login();
		submit(curProblem.getSubmitStr(), curProblem.id);
		return true;
	}

	function loadCode(rid){
		currentServer.codeRequest(rid, function(data){
			var i = curProblem.tabIndex;
			codeareas[i].setValue(data);
			codeareas[i].refresh();
			curProblem.setDefault();
			if ($("input[name='group" + i + "']" + ":checked").prop('id') == 'commandsMode' + i) {
				try {
					goToCommandsMode(problems[i]);
				}
				catch(e) {
					$('#cons' + i).html('Невозможно сконвертировать полученный код в команды');
				}
				
		   	}
		});
	}

	var getContestContentClick = function () {
		if (!currentServer.getSid()) {
			alert('Невозможно загрузить решение, так как не выбран пользователь');
			return false;
		}

		currentServer.consoleContentRequest(function(data){
			var div = $('<div></div>');
			for (var i = 0; i < data.length; ++i) {
				if (data[i].type == 'submit' && data[i].problem_title == curProblem.title) {
					$(div).append('<input type="radio" name="attempts" id="attempts_' + i + '" value="'+ data[i].id + '"' + 
						(i == 0 ? 'checked': '') +'/>' + 
						'<label for="attempts_' +  i + '">' + data[i].time + '</label><br>');
				}
			}

			if (!$(div).children('input').length) {
				$(div).append('<p>Попытки отсутствуют</p>');
			}

			$(div).dialog({
				modal: true,
				buttons: {
					Ok: function() {
						if ($(this).children('input').length) {
							loadCode($(this).children(':checked').val());
						}
						$(this).dialog('close');					
					},
					Cancel: function(){
						$(this).dialog('close');	
					}
				}, 
				autoOpen: false
			});

			$(div).dialog('open');
			return true;
		});
	};

	function getContests(){
		currentServer.contestsListRequest(function(data) { ////
			if (!data)
				return;
			var contests = currentServer.getContests();
			for (var i = 0; i < contests.length; ++i){
					$('#contestsList').append(
					'<input type="radio" name="contest_name" id="contest_name_' + i + '" value="' + contests[i].getName() + '" ' + 
					(i == 0 ? 'checked': '') + ' class="radioinput" /><label for="contest_name_' + i + '">' 
					+ contests[i].getName()  + '</label><br>');
			}
			document.title = currentServer.getContest().getName();
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
		currentServer.setContestByName(name, function(contest){
			$.cookie('contestId', $('#contestsList > input:checked').prop('id'));
			fillTabs();
		});
		
	}

	function onAddWatchClick()
	{
		$('#addWatchDialog').dialog('open');
	}

	function startWaitForCommandsGeneration(problem) {
		if (problem.loadedCnt > 0) {
			$.blockUI({ 
				message: '',
				fadeIn: 0,
				overlayCSS: { 
					backgroundColor: '#ffffff',
					opacity: 0,
					cursor: 'progress'
				}
			});
			waitForCommandsGeneration(problem);
		}
	}

	function waitForCommandsGeneration(problem) {
		if (problem.loadedCnt > 0) {
			setTimeout(function(){waitForCommandsGeneration(problem)}, 200);
		}
		else {
			$.unblockUI();
			problem.setCurrentStage('IDLE');
			problem.updated();
		}
	}

	function goToCommandsMode(problem) {
		var j = problem.tabIndex;
		var l = codeareas[j].getValue().length;
		try {
			problem.prepareForExecuting();
			problem.prepareForConversionFromCode();
			var block = finalcode[j] ?
				ModesConversion.convertTreeToCommands(finalcode[j].compiled.ast.body, undefined, problem, true):
				new CommandsMode.Block([], undefined, problem);

			$('#jstree-container' + j).empty();	
			$('#accordion' + j).myAccordion( 'clear' );
			
			if (block) {
				//problems[j].cmdList = block;//??
				problem.setCurrentStage('CONVERSION_TO_COMMANDS');
				problem.loadedCnt = 1;
				startWaitForCommandsGeneration(problem);
				block.generateVisualCommand(jQuery.jstree._reference('#jstree-container' + j));
				--problem.loadedCnt;
				
				//setTimeout(function() {problems[j].updated()}, 20000);
				//block.generateCommand(jQuery.jstree._reference('#jstree-container' + j))
			}
			else if (!confirm('Невозможно сконвертировать код в команды. Все изменения будут потеряны')){
				$("#commandsMode" + j).prop('checked', false);
				$("#codeMode" + j).prop('checked', true);
				problem.setCurrentStage('IDLE');
				problem.updated();
				return;
			}
		}
		catch(e){
			console.error(e);
			problem.setCurrentStage('IDLE');
			$.unblockUI();
			++cmdId;
			if (l && !confirm('Невозможно сконвертировать код в команды. Все изменения будут потеряны')){
				$("#commandsMode" + j).prop('checked', false);
				$("#codeMode" + j).prop('checked', true);
				return;
			}
			problem.updated();
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

	function goToCodeMode(problem) {
		var j = problem.tabIndex;
		//$('#accordion' + j).empty();
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
		codeareas[j].setValue(problem.convertCommandsToCode());
		codeareas[j].refresh();
		problem.setDefault();
		$('#addWatch' + j).show();
		$('#watchTable' + j).show();
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
		codeareas = [];
		currentServer.problemsListRequest(function(data){
			for (var i = 0; i < data.length; ++i){
				problems[i] = new Problems.Problem(data[i], i);
				if ($('#ui-tabs-' + (i + 1)).length){
					$('#ui-tabs-' + (i + 1)).empty();
					$('#tabs').tabs('remove', i + 1);
					$('#codearea' + i).empty();
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
				$('#loadCode' + i).button().click(getContestContentClick);
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
			           version: 3,
			           singleLineStringErrors: false},
			        indentUnit: 2,
			        tabMode: "shift",
			        matchBrackets: true,
			        onChange: function(instance, obj) {
			        	curProblem.stop();
			        } 
				});
				codeareas.push(CM);
				var groupBox = "input[name='group" + i + "']";
				$(groupBox).change(function(j){
					return function(){
					    if ($("input[name='group" + j + "']" + ":checked").prop('id') == 'commandsMode' + j) {
							goToCommandsMode(problems[j]);
					   	}
					    else {
					    	goToCodeMode(problems[j]);
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
			if ($('#ui-tabs-' + (problems.length + 1)).length){
				$('#ui-tabs-' + (problems.length + 1)).empty();
				$('#tabs').tabs('remove', (problems.length + 1));
			}
			$('#tabs').tabs('add', '#ui-tabs-' + (problems.length + 1), 'Результаты', (problems.length + 1));
			$('#ui-tabs-' + (problems.length + 1)).append('<button id = "refreshTable">Обновить таблицу</button>');
			$('#refreshTable').button({text:false, icons: {primary: 'ui-icon-refresh'}});
			$('#ui-tabs-' + (problems.length + 1)).append('<table class = "results"><tr><td>' + 
				'<iframe id = "results" src = "' + currentServer.getResultsUrl()+  '" class = "results"></iframe></td></tr></table>');
			$('#refreshTable').click(function() {$('#results').prop('src', currentServer.getResultsUrl())});
				$('#tabs').tabs('select', 0);
			for(var i = $('#tabs').tabs('length') - 1; i > problems.length + 1; --i){
			  while($('#ui-tabs-' + i).length){
					$('#ui-tabs-' + i).empty();
					$('#tabs').tabs('remove', i);
				}
			}
			cmdId = problems.length;
		});
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
		
		$('.funcInput').attr('funcid', undefined).hide();
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
	        $("head").append("<link>");
	        var css = $("head").children(":last");
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

	var btnFunctions = [playClick, pauseClick, stopClick, prevClick, nextClick];
	var btnTitles = ['Проиграть', 'Пауза', 'Стоп', 'Предыдущий шаг', 'Следующий шаг', 'В конец'];
	var buttonIconClasses = ['ui-icon-play', 'ui-icon-pause', 'ui-icon-stop', 'ui-icon-seek-prev', 'ui-icon-seek-next', 'ui-icon-seek-end'];

	return {
		login: login, 
		chooseUser: chooseUser, 
		getContests: getContests,
		changeContest: changeContest,
		fillTabs: fillTabs,
		onFinishExecuting: onFinishExecuting,
		goToCodeMode: goToCodeMode,
		goToCommandsMode: goToCommandsMode
	};

});
