$(document).ready(function(){
	if ($.browser.msie){
		$("#ver").html( 'Microsoft Interner Explorer не поддерживается данной системой. Пожалуйста, воспользуйтесь, другим браузером, например, <a href = "http://www.mozilla.org/ru/firefox/fx/">Mozilla Firefox</a>' );
		return;
	}

	currentServer = new CATS();
	currentServer.setSession(new Session(undefined, currentServer.defaultCid));

	$('#funcName').hide();
	$('#tabs').tabs({
		select: function(event, ui) {
			if (ui.index > 0 && ui.index - 1 < problems.length){
				curProblemIndex = ui.index - 1;
				curProblem = problems[curProblemIndex];
			}
			if (ui.index == (problems.length + 2))
			{
				setTimeout("codeareas[" + (problems.length + 1) + "].refresh()", 100);
			}
			$.cookie('tabIndex', ui.index);
		
		},

		show: function(event, ui) {
			if (ui.index > 0 && ui.index - 1 < problems.length) {
				curProblem.onTabSelect();
			}
		}
	});
	$('#changeContest').hide();
	$('#enterPassword').hide();
	$('#contestsList').hide();
	$('#about').hide();
	$('#tabs').tabs('paging', { cycle: false, follow: true, tabsPerPage: 0 } );
	getContests();
	$('#tabs').bind('tabsshow', function(event, ui) {
		if (!curProblem)
			return;
		var problem = curProblem;
		if (problem.visited)
			return;
		problem.visited = 1;
		/*for (var k = 0; k < classes.length; ++k){
			$('#' + classes[k] + problem.tabIndex).bind('dblclick', function(j){
				return function() {
					if ($(this).prop('ifLi')) {
						return;
					}
					$("#jstree-container" + problem.tabIndex).jstree("create", false,  "last", 
							{'data': (classes[j] == 'funcdef') ? ('func_' + problem.numOfFunctions) : cmdClassToName[classes[j]]}, function(newNode){
							onCreateItem(this, newNode, $('#' + classes[j] + problem.tabIndex).attr('rel'), problem);
						}, classes[j] != 'funcdef'); 
					problem.updated();
				}
			}(k));
		}*/
		$('#resizable' + problem.tabIndex).resizable({
			ghost: true,
			minHeight: 300,
			minWidth: 300,
			resize: function(event, ui) {
				$(codeareas[problem.tabIndex].getScrollerElement()).width(ui.size.width);
				$(codeareas[problem.tabIndex].getScrollerElement()).height(ui.size.height);
				codeareas[problem.tabIndex].refresh();
			}
		});
		
		createJsTreeForFunction('#jstree-container' + problem.tabIndex, problem, false);
		
		$('#accordion' + problem.tabIndex).myAccordion( {'problem': problem } );
			/*$('#accordion' + problem.tabIndex).accordion();
			$('#accordion' + problem.tabIndex).accordion( "enable" );
			$('#accordion' + problem.tabIndex).accordion({ collapsible: true });
			$('#accordion' + problem.tabIndex).accordion( "option", "autoHeight", false );*/

	});
	$('#about').dialog({
		modal: true,
		autoOpen: false,
		width: 700,
		height: 700,
		open: function(){
			$('#accordion').accordion();
		}
	});
	//$("#accordion").accordion();
	$('#enterPassword').dialog({
		modal: true,
		buttons: {
			Ok: function() {
				currentServer.user.setPasswd($('#password').prop('value')) ;
				login();
				$('#enterPassword').dialog('close');					
			},
			Cancel: function(){
				$.cookie('userId', undefined);
				$.cookie('passwd', undefined);
				$('#enterPassword').dialog('close');	
			}
		}, 
		autoOpen: false,
		close: function(){this.title = 'Введите пароль';}
	});
	$('#enterPassword').live('keyup', function(e){
	  if (e.keyCode == 13) {
	    $(this).dialog( "option", "buttons" )['Ok']();
	  }});
	$('#changeContest').dialog({
		modal: true,
		buttons: {
			Ok: function() {
				changeContest();
				$(this).dialog('close');					
			},
			Cancel: function(){
				$(this).dialog('close');	
			}
		}, 
		autoOpen: false
	});
	for (var i = 0; i < problems.length; ++i){
		$('ul, li').disableSelection();
	}
	$( "#addWatchDialog" ).dialog({
		autoOpen: false,
		height: 300,
		width: 350,
		modal: true,
		buttons: {
			"Добавить": function() {
				var problem = $('#tabs').tabs('option', 'selected') - 1;
				$( '#watchTable' + problem).append( '<tr id = watchTr_' + problem + '_' + lastWatchedIndex[problem] + ' style = "border: 1px">' +
					'<td style = "border: 1px solid white; width: 20px"><button id = "deleteWatch_' + problem + '_' + lastWatchedIndex[problem] + '"></button></td>' +
					'<td style = "border: 1px solid white">' + $('#watchName').val() + '</td>' + 
					'<td style = "border: 1px solid white" id = "calcVal_' + problem + '_' + lastWatchedIndex[problem] + '">' + 
						calculateValue($('#watchName').val()) + '</td>' + 
					'</tr>' ); 
				$('#deleteWatch_' + problem + '_' + lastWatchedIndex[problem]).prop('varId', lastWatchedIndex[problem]);
				$('#deleteWatch_' + problem + '_' + lastWatchedIndex[problem]).button({ text: false, icons: {primary:'ui-icon-close'}}).bind('click', function(){
					delete watchList[problem][$(this).prop('varId')];
					$('#watchTr_' + problem + '_' + $(this).prop('varId')).remove();
				});
				watchList[problem][lastWatchedIndex[problem]++] = $('#watchName').val();
				$( this ).dialog( "close" );
			},
			'Отмена': function() {
				$( this ).dialog( "close" );
			}
		}
	});
	$('.ui-tabs-nav').append('<li class = "ui-state-default ui-corner-top" style = "float: right">' +
		'<button id = "aboutBtn" style = "border-color:-moz-use-text-color -moz-use-text-color #D3D3D3; ' +
		'border-style:none none solid; border-width:0 0 1px;">?</button></li>');
	$('#aboutBtn').button();
	$('#aboutBtn').click(function() {
		$('#about').dialog('open');
		return false;
	});
	$('#tabs').tabs();
	var tabIndex = $.cookie('tabIndex') != undefined ? $.cookie('tabIndex') : 0;
	if ($.cookie('contestId') == undefined && tabIndex){
		fillTabs();
		$('#tabs').tabs("select" , tabIndex);
	}
	else if ($.cookie('contestId') != undefined && $.cookie('userId') == undefined){
		$('#' + $.cookie('contestId')).prop('checked', true);
			changeContest();
		if (tabIndex != undefined)
			$('#tabs').tabs( "select" , tabIndex );
	}
	else if ($.cookie('userId') != undefined){
		$('#' + $.cookie('contestId')).prop('checked', true);
		var userId = $.cookie('userId');
		var passwd = $.cookie('passwd');
		changeContest();
		$('#' + userId).prop('checked', true);
		$.cookie('passwd', passwd);
		chooseUser();	
		if (tabIndex != undefined)
			$('#tabs').tabs( "select" , tabIndex );
	}
	else 
		fillTabs();
	cmdId = problems.length;
});
