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
	'Misc'
], function () {
	var Problems = require('Problems');
	var ModesConversion = require('ModesConversion');
	var Servers = require('Servers');

	function updateCallbackFactory(callback) {
		return function (cb) {
			getContests(selectContest);
			if ($.isFunction(callback)) {
				callback();
			}
			if ($.isFunction(cb)) {
				cb();
			}
		};
	}

	function login(login, passwd, success, error) {
		var updateCallback = updateCallbackFactory(success);
		currentServer.loginRequest(login, passwd, function (data) {
			if (data.status != 'ok') {
				return error();
			}
			$.cookie('sid', data.sid);
			currentServer.authenticateBySid(data.sid, function () {
				updateCallback(fillTabs);
			});
		});
	}

	function loginBySessionId(sid, callback, initial) {
		if (callback === undefined && $.isFunction(sid)) {
			callback = sid;
			sid = null;
		}
		sid = sid || currentServer.getSid();

		var updateCallback = updateCallbackFactory(callback);

		if (!sid) {
			if (initial) {
				return;
			}
			return showLoginForm(callback);
		}

		currentServer.authenticateBySid(sid, function (data) {
			if (data.error == 'bad sid') {
				return logoutUser(showLoginForm.bind(null, callback));
			}
			$.cookie('sid', sid);
			updateCallback(fillTabs);
		});
	}

	function showLoginForm(callback) {
		$('#login-dialog').dialog({
			title: 'Авторизация',
			height: 200,
			width: 350,
			modal: true,
			buttons: [{
				text: 'Войти',
				click: function () {
					var $self = $(this);
					var $loginError = $('#login-error-message', $self).hide();

					var username = $('#login', this).val();
					var passwd = $('#password', this).val();

					login(username, passwd, function () {
						$self.dialog('close');
						if ($.isFunction(callback)) {
							callback();
						}
					}, function () {
						$loginError.show();
					});
				}
			}, {
				text: 'Отмена',
				click: function() {
					$(this).dialog('close')
				}
			}]
		})
	}

	function logoutUser(callback) {
		var updateCallback = updateCallbackFactory(callback);
		$.cookie('sid', '');
		currentServer.setUser(undefined);
		currentServer.setSid(undefined);
		currentServer.logoutRequest(updateCallback.bind(null, fillTabs));
	}

	function submit(submitStr, problem_id) {
		currentServer.submitRequest(submitStr, problem_id, function () {
			loginBySessionId(submit.bind(null, submitStr, problem_id));
		})
	}

	function submitClick() {
		if (!currentServer.getSid()) {
			alert('Невозможно отослать решение, так как не выбран пользователь');
			return false;
		}
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
						'<label for="attempts_' + i + '">' + data[i].time + '</label><br>');
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

	function getContests(callback) {
		currentServer.contestsListRequest(function(data) {
			if (!data)
				return;
			var contests = currentServer.getContests();
			$(contests).map(function (idx, contest) {
				var cid = contest.getCid();
				var name = contest.getName();

				return (
					'<input type="radio" name="contest_name" id="contest_name_' + idx + '"' + ' value="' + cid + '" ' + (idx == 0 ? 'checked': '') + ' class="radioinput" />' +
					'<label for="contest_name_' + idx + '">' + name  + '</label>' +
					'<br>'
				);
			}).appendTo($('#contestsList').empty());

			document.title = currentServer.getContest().getName();

			if (callback) {
				callback();
			}
		});
	}

	function selectContest() {
		var contest = $('#contestsList > input:checked');
		if (!contest.length)
			return false;
		return changeContest(contest.val());
	}

	function changeContest(cid, callback) {
		return currentServer.setContestById(parseInt(cid), function (contest) {
			document.title = contest.name;
			$.cookie('contestId', contest.cid);
			fillTabs();

			if ($.isFunction(callback)) {
				callback();
			}
		});
	}

	function showUser() {
		var $tabs = $('#tabs');
		var $userTab = $('#ui-tabs-0');
		if ($userTab.length){
			$userTab.empty();
			$tabs.tabs('remove', 0);
		}

		$tabs.tabs('add', '#ui-tabs-0', "Выбор пользователя", 0);
		$userTab = $('#ui-tabs-0');

		$userTab.append(
			'<table width = "100%">' +
			'<tr id = "tab0">' +
			'<td><div id="user-info"></div></td>' +
			'<td valign="top" id="user-buttons" align="right"></td>' +
			'</tr>' +
			'</table>');

		var $userInfo = $('#user-info', $userTab).empty();
		var $userBtns = $('#user-buttons', $userTab).empty();
		var user = currentServer.getUser();

		$('<button />')
			.text('Выбрать турнир')
			.button()
			.on('click', function(){
				$('#contestsList').show();
				$('#selectContest').dialog('open');
				return false;
			})
			.appendTo($userBtns);

		if (user) {
			$userInfo
				.append('<strong>Текущий пользователь: </strong>')
				.append('<span>' + user.name + '</span>')
				.append('<br />');

			$('<button />')
				.text('Выход')
				.button()
				.on('click', logoutUser)
				.appendTo($userBtns);
		}
		else {
			$userInfo.append('<strong>Вход не выполнен</strong>').append('<br />');
			currentServer.usersListRequest(function(data) {
				if (!data) {
					return;
				}

				var users = currentServer.getUsers();
				if (users.length > 0) {
					var $loginField = $('#login');
					$userInfo.append('<p>Выберите свое имя из списка</p>');

					var $userList = $('<ul />').appendTo($userInfo);
					$(users).map(function (idx, user) {
						return (
						'<input type="radio" name="user_name" id="user_name_' + idx + '" value="' + user.login + '" class="radioinput" />' +
						'<label for="user_name_' + idx + '">' + user.name + '</label>' +
						'<br>'
						);
					}).appendTo($userList);

					$userList.on('change', 'input', function () {
						$loginField.val($(this).val());
						showLoginForm();
					});
				}
			});

			$('<button />')
				.text('Вход')
				.button()
				.on('click', function () { loginBySessionId() })
				.appendTo($userBtns);
		}
	}

   function goToCommandsMode(problem) {
        var j = problem.tabIndex;
        var l = codeareas[j].getValue().length;
        var xmlWSBackup = problem.resetWorkspace();
        try {
            problem.prepareForExecuting();
            problem.prepareForConversionFromCode();
            if (finalcode[j]) {
                ModesConversion.pythonTreeToBlocks(problem, finalcode[j].compiled.ast.body);
                $('#jstree-container' + j).empty();
                $('#accordion' + j).myAccordion( 'clear' );
            }
        } catch(e) {
            console.error(e);
            console.log(e.stack)
            problem.setCurrentStage('IDLE');
            $.unblockUI();
            ++cmdId;
            if (l && !confirm('Невозможно сконвертировать код в команды. Все изменения будут потеряны')){
                $("#commandsMode" + j).prop('checked', false);
                $("#codeMode" + j).prop('checked', true);
                return;
            }
            if (xmlWSBackup) {
                problem.restoreWorkspace(xmlWSBackup);
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
		problem.updated();
		problem.Blockly.mainWorkspace.render();
        problem.Blockly.organizeWorkspace();
	}

	function goToCodeMode(problem) {
		var Blockly = problem.Blockly;
		var j = problem.tabIndex;
		//$('#accordion' + j).empty();
		problem.setDefault();
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
		var code = Blockly.Python.workspaceToCode(Blockly.mainWorkspace)
		codeareas[j].setValue(code);
		codeareas[j].refresh();
		$('#addWatch' + j).show();
		$('#watchTable' + j).show();
	}

	function fillTabs(callback) {
		showUser();

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
			if (callback)
				callback();
		});
	}

	function playClick(){
		var problem = curProblem;
		problem.speed = Math.max(1, $('#slider' + problem.tabIndex).slider('option', 'max') - $('#slider' + problem.tabIndex).slider('value'));
		problem.callPlay(problem.speed);
		$('#btn_play'+ problem.tabIndex).addClass('ui-state-focus');
	}

	function clearClick() {
		var problem = curProblem;
		if (!confirm('Вы уверены, что хотите очистить список команд?'))
			return;
		problem.Blockly.mainWorkspace.clear();

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

	function updateStyleSheet(index, filename) {
		if ($("#dynamic_css_" + index).length == 0) {
			$("head").append("<link>");
			var css = $("head").children(":last");
			css.attr({
				id: "dynamic_css_" + index,
				rel:  "stylesheet",
				type: "text/css",
				href: filename
			});
		} else {
			$("#dynamic_css_" + index).attr("href",filename);
		}
	}

	var btnFunctions = [playClick, pauseClick, stopClick, prevClick, nextClick];
	var btnTitles = ['Проиграть', 'Пауза', 'Стоп', 'Предыдущий шаг', 'Следующий шаг', 'В конец'];
	var buttonIconClasses = ['ui-icon-play', 'ui-icon-pause', 'ui-icon-stop', 'ui-icon-seek-prev', 'ui-icon-seek-next', 'ui-icon-seek-end'];

	return {
		login: login,
		loginBySessionId: loginBySessionId,
		getContests: getContests,
		selectContest: selectContest,
		changeContest: changeContest,
		fillTabs: fillTabs,
		goToCodeMode: goToCodeMode,
		goToCommandsMode: goToCommandsMode
	};

});
