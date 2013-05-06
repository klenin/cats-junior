require.config({
    baseUrl: '',
    paths: {
        'jQuery': 'import/jquery/jquery-1.8.2',
		'jQueryUI': 'import/jquery/jquery-ui-1.8.24.custom.min',
		'jQueryCookie': 'import/jquery/jquery.cookie',
		'jQueryInherit': 'import/jquery/jquery.inherit-1.3.2.M',
		'JsTree': 'import/jquery/jquery.jstree',
		'Env': 'import/skulpt/src/env',
		'BlockUI': 'import/jquery/jquery.blockUI',
		'CodeMirror': 'import/CodeMirror/lib/codemirror',
		'CodeMirrorPython': 'import/CodeMirror/mode/python/python',
		'FormData': 'import/formdata',
		'GoogBase': 'import/skulpt/support/closure-library/closure/goog/base',
		'GoogAsserts': 'import/skulpt/support/closure-library/closure/goog/asserts/asserts',
		'GoogError': 'import/skulpt/support/closure-library/closure/goog/debug/error',
		'GoogString': 'import/skulpt/support/closure-library/closure/goog/string/string',
		'GoogDeps': 'import/skulpt/support/closure-library/closure/goog/deps',
		'jQueryTmpl': 'import/jquery/jquery.tmpl',
		'SkMiscEval': 'import/skulpt/src/misceval',
		'SkBuiltin': 'import/skulpt/src/builtin',
		'SkErrors': 'import/skulpt/src/errors',
		'SkType': 'import/skulpt/src/type',
		//'SkObject': 'import/skulpt/src/object',
		'SkMethod': 'import/skulpt/src/method',
		'SkAbstract': 'import/skulpt/src/abstract',
		'SkMergeSort': 'import/skulpt/src/mergesort',
		'SkList': 'import/skulpt/src/list',
		'SkStr': 'import/skulpt/src/str',
		'SkTuple': 'import/skulpt/src/tuple',
		'SkDict': 'import/skulpt/src/dict',
		'SkLong': 'import/skulpt/src/long',
		'SkInt': 'import/skulpt/src/int',
		'SkFloat': 'import/skulpt/src/float',
		'SkSlice': 'import/skulpt/src/slice',
		'SkSet': 'import/skulpt/src/set',
		'SkModule': 'import/skulpt/src/module',
		'SkGenerator': 'import/skulpt/src/generator',
		'SkFile': 'import/skulpt/src/file',
		'SkFfi': 'import/skulpt/src/ffi',
		'SkTokenize': 'import/skulpt/src/tokenize',
		'SkParseTables': 'import/skulpt/gen/parse_tables',
		'SkParser': 'import/skulpt/src/parser',
		'SkAstNodes': 'import/skulpt/gen/astnodes',
		'SkAst': 'import/skulpt/src/ast',
		'SkSymtable': 'import/skulpt/src/symtable',
		'SkCompile': 'import/skulpt/src/compile',
		'SkImport': 'import/skulpt/src/import',
		'SkBuiltinDict': 'import/skulpt/src/builtindict',
		'SkFunc': 'import/skulpt/src/function',
		//'Svg': 'import/jquery/jquery.svg',
		'Cylinder': 'import/jquery/cylinder',
		'Raphael': 'import/jquery/raphael', 
		'QUnit': 'import/jquery/qunit-1.11.0'
    },
    shim: {
    	'jQuery': [],
    	'jQueryCookie': ['jQuery'],
		'jQueryUI': ['jQuery'],
		'jQueryInherit': ['jQuery'],
		'jQueryTmpl': ['jQuery'],
		'JsTree': ['jQuery'],
		'Env': ['GoogBase', 'GoogAsserts'],
		'GoogDeps': ['GoogBase'],
		'GoogString': ['GoogBase'],
		'GoogError': ['GoogBase'],
		'GoogAsserts': ['GoogError', 'GoogString'],
		'CodeMirror': [],
		'CodeMirrorPython': ['CodeMirror'],
		'Misc': ['jQuery', 'jQueryInherit', 'Declaration'],
		'SkMiscEval': ['Env'],
		'SkBuiltin': ['Env'],
		'SkErrors': ['SkBuiltin'],
		'SkType': ['SkBuiltin'],
		//'SkObject': ['SkType'],
		'SkFunc': ['SkType'],
		'SkMethod': ['SkBuiltin'],
		'SkAbstract': ['Env'],
		'SkMergeSort': ['SkFunc'],
		'SkList': ['SkFunc'],
		'SkStr': ['SkFunc'],
		'SkTuple': ['SkType'],
		'SkDict': ['SkFunc'],
		'SkLong': ['SkType'],
		'SkInt': ['SkType'],
		'SkFloat': ['SkType'],
		'SkSlice': ['SkBuiltin'],
		'SkSet': ['SkFunc'],
		'SkModule': ['SkType'],
		'SkGenerator': ['SkFunc'],
		'SkFile': ['SkFunc'],
		'SkFfi': ['Env'],
		'SkTokenize': ['Env'],
		'SkParseTables': ['SkTokenize'],
		'SkParser': ['Env'],
		'SkAstNodes': ['GoogAsserts'],
		'SkAst': ['SkParseTables'],
		'SkSymtable': ['Env'],
		'SkCompile': ['Env'],
		'SkImport': ['SkDict'],
		'SkBuiltinDict': ['SkStr'],
		'AtHome': [],
		'Declaration': ['AtHome'],
		'Raphael': ['jQuery'],
		'Cylinder': ['Raphael']
    }
  });

	//QUnit.config.autostart = false;

requirejs(['require', 
	'jQuery', 
	'jQueryUI', 
	'Servers', 
	'Interface', 
	'CommandsMode',//
	'InterfaceJSTree', 
	'jQueryCookie',
	'CodeMode',
	'Accordion',
	'SkMiscEval',
	'Declaration', 
	'Accordion',
	'jQueryTmpl'
	/*'Tests'*/],
	function   () {
		var Servers = require('Servers');
		var Interface = require('Interface');
		var InterfaceJSTree = require('InterfaceJSTree');
		//var Tests = require('Tests');

	    $(document).ready(function(){
		if ($.browser.msie){
			$("#ver").html( 'Microsoft Interner Explorer не поддерживается данной системой. Пожалуйста, воспользуйтесь, другим браузером, например, <a href = "http://www.mozilla.org/ru/firefox/fx/">Mozilla Firefox</a>' );
			return;
		}

		currentServer = new Servers.CATS();
		currentServer.setSession(new Servers.Session(undefined, currentServer.defaultCid));

		$('#funcName').hide();
		$('#tabs').tabs({
			select: function(event, ui) {
				curProblemIndex = ui.index - 1;
				if (curProblemIndex >= 0) {
					curProblem = problems[curProblemIndex];
				}
				for (var i = 0; i < problems.length; ++i) {
					problems[i].onTabSelected(curProblemIndex);
				}
				/*if (ui.index == (problems.length + 2))
				{
					setTimeout("codeareas[" + (problems.length + 1) + "].refresh()", 100);
				}*/
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
		Interface.getContests();
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
			
			InterfaceJSTree.createJsTreeForFunction('#jstree-container' + problem.tabIndex, problem, false);
			
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
					Interface.login();
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
					Interface.changeContest();
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
			Interface.fillTabs();
			$('#tabs').tabs("select" , tabIndex);
			//sometimes this event is fired earlier than current labyrinth cell width is calculated
			//it happens only on loading of the last loaded tab
			//wait for 200ms to correctly update height of the cells -- WA!!!!!!!!
			setTimeout(function(){
				curProblem.onTabSelect();
			}, 200);
		}
		else if ($.cookie('contestId') != undefined && $.cookie('userId') == undefined){
			$('#' + $.cookie('contestId')).prop('checked', true);
				Interface.changeContest();
			if (tabIndex != undefined)
				$('#tabs').tabs( "select" , tabIndex );
		}
		else if ($.cookie('userId') != undefined){
			$('#' + $.cookie('contestId')).prop('checked', true);
			var userId = $.cookie('userId');
			var passwd = $.cookie('passwd');
			Interface.changeContest();
			$('#' + userId).prop('checked', true);
			$.cookie('passwd', passwd);
			Interface.chooseUser();	
			if (tabIndex != undefined)
				$('#tabs').tabs( "select" , tabIndex );
		}
		else 
			Interface.fillTabs();
		cmdId = problems.length;

		/*$('#startTests').button().click(function(){
			QUnit.start();
			Tests.RunTests();
		});*/

		//QUnit.start(); //Tests loaded, run tests
		//Tests.RunTests();
	});
});	
