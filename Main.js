require.config({
    waitSeconds: 180,
    baseUrl: '',
    paths: {
        'jQuery': 'import/jquery/jquery-1.11.1.min',
        'jquery': 'import/jquery/jquery-1.11.1.min',
		'jQueryUI': 'import/jquery/jquery-ui-1.9.2.min',
		'jQueryUITabsPaging': 'import/jquery/ui.tabs.paging',
		'jQueryCookie': 'import/jquery/jquery.cookie.min',
		'jQueryInherit': 'import/jquery/jquery.inherit.min',
		'jQueryColResizable': 'import/jquery/colResizable-1.3.min',
		'JsTree': 'import/jquery/jquery.jstree.min',
		'Env': 'import/skulpt/src/env.min',
		'BlockUI': 'import/jquery/jquery.blockUI.min',
		'CodeMirror': 'import/CodeMirror/lib/codemirror.min',
		'CodeMirrorPython': 'import/CodeMirror/mode/python/python.min',
		'FormData': 'import/formdata.min',
		'GoogBase': 'import/skulpt/support/closure-library/closure/goog/base.min',
		'GoogAsserts': 'import/skulpt/support/closure-library/closure/goog/asserts/asserts.min',
		'GoogError': 'import/skulpt/support/closure-library/closure/goog/debug/error.min',
		'GoogString': 'import/skulpt/support/closure-library/closure/goog/string/string.min',
		'GoogDeps': 'import/skulpt/support/closure-library/closure/goog/deps.min',
		'jQueryTmpl': 'import/jquery/jquery.tmpl',
		'SkMiscEval': 'import/skulpt/src/misceval.min',
		'SkBuiltin': 'import/skulpt/src/builtin.min',
		'SkErrors': 'import/skulpt/src/errors.min',
		'SkType': 'import/skulpt/src/type.min',
		//'SkObject': 'import/skulpt/src/object',
		'SkMethod': 'import/skulpt/src/method.min',
		'SkAbstract': 'import/skulpt/src/abstract.min',
		'SkMergeSort': 'import/skulpt/src/mergesort.min',
		'SkList': 'import/skulpt/src/list.min',
		'SkStr': 'import/skulpt/src/str.min',
		'SkTuple': 'import/skulpt/src/tuple.min',
		'SkDict': 'import/skulpt/src/dict.min',
		'SkLong': 'import/skulpt/src/long.min',
		'SkInt': 'import/skulpt/src/int.min',
		'SkFloat': 'import/skulpt/src/float.min',
		'SkSlice': 'import/skulpt/src/slice.min',
		'SkSet': 'import/skulpt/src/set.min',
		'SkModule': 'import/skulpt/src/module.min',
		'SkGenerator': 'import/skulpt/src/generator.min',
		'SkFile': 'import/skulpt/src/file.min',
		'SkFfi': 'import/skulpt/src/ffi.min',
		'SkTokenize': 'import/skulpt/src/tokenize.min',
		'SkParseTables': 'import/skulpt/gen/parse_tables.min',
		'SkParser': 'import/skulpt/src/parser.min',
		'SkAstNodes': 'import/skulpt/gen/astnodes.min',
		'SkAst': 'import/skulpt/src/ast.min',
		'SkSymtable': 'import/skulpt/src/symtable.min',
		'SkCompile': 'import/skulpt/src/compile.min',
		'SkImport': 'import/skulpt/src/import.min',
		'SkBuiltinDict': 'import/skulpt/src/builtindict.min',
		'SkFunc': 'import/skulpt/src/function.min',
		//'Svg': 'import/jquery/jquery.svg',
		'Cylinder': 'import/jquery/cylinder.min',
		'Raphael': 'import/jquery/raphael.min',
		'QUnit': 'import/jquery/qunit-1.11.0.min'
		// NOTE: load this extra Blockly instance is for global usage of static methods
	},
    shim: {
    	'jQuery': [],
    	'jQueryCookie': ['jQuery'],
		'jQueryUI': ['jQuery'],
		'jQueryUITabsPaging': ['jQueryUI'],
		'jQueryInherit': ['jQuery'],
		'jQueryTmpl': ['jQuery'],
		'jQueryColResizable': ['jQuery'],
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
		'Raphael': ['jQuery'],
		'Cylinder': ['Raphael']
    }
  });

	//QUnit.config.autostart = false;

requirejs([
	'jQuery',
	'jQueryUI',
	'jQueryUITabsPaging',
	'jQueryCookie',
	'jQueryColResizable',
	'Config',
	'Servers',
	'Interface',
	'InterfaceBlockly',
	'Declaration',
	'Accordion',
	'CodeMode'
	/*'Tests'*/],
	function   () {
		var Servers = require('Servers');
		var Config = require('Config');
		var Interface = require('Interface');
		var InterfaceBlockly = require('InterfaceBlockly');
		var CodeMode = require('CodeMode');
		//var Tests = require('Tests');

	    $(document).ready(function(){
		if (getInternetExplorerVersion()){
			$("#ver").html( 'Microsoft Internet Explorer не поддерживается данной системой. Пожалуйста, воспользуйтесь, другим браузером, например, <a href = "http://www.mozilla.org/ru/firefox/fx/">Mozilla Firefox</a>' );
			return;
		}

		currentServer = new Servers[Config.ServerName]();
		currentServer.setSession(new Servers.Session(undefined, currentServer.defaultCid));

		$('#funcName').hide();
		$('#tabs').tabs({
			select: function(event, ui) {
				var curProblemIndex = ui.index - 2;
				if (curProblemIndex >= 0) {
					curProblem = problems[curProblemIndex];
					if (curProblem) {
						curProblem.onTabSelect();
					}
				}
				/*if (ui.index == (problems.length + 2))
				{
					setTimeout("codeareas[" + (problems.length + 1) + "].refresh()", 100);
				}*/
				$.cookie('tabIndex', ui.index);
			},

			show: function() {
				if (curProblem) {
					curProblem.onTabSelect();
				}
			}
		});
		$('#selectContest').hide();
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

			InterfaceBlockly.injectBlockly(problem)

			$('#accordion' + problem.tabIndex).myAccordion( {'problem': problem } );
				/*$('#accordion' + problem.tabIndex).accordion();
				$('#accordion' + problem.tabIndex).accordion( "enable" );
				$('#accordion' + problem.tabIndex).accordion({ collapsible: true });
				$('#accordion' + problem.tabIndex).accordion( "option", "autoHeight", false );*/

			var $iframe = $('#blockly-container-' + problem.tabIndex)
			$(ui.panel).children('table').colResizable({
				minWidth: 250,
				// liveDrag: true,
				onDrag: function() {
					$iframe.css({'pointer-events': 'none'});
				},
                onResize: function() {
					$iframe.css({'pointer-events': 'auto'});
					if (problem.executionUnit.executionUnit.updateSizes) {
						problem.executionUnit.executionUnit.updateSizes();
					}
                }
			});
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

		$('#selectContest').dialog({
			modal: true,
			buttons: {
				Ok: function() {
					Interface.selectContest();
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
							CodeMode.calculateValue($('#watchName').val()) + '</td>' +
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

		var tabIndex = parseInt($.cookie('tabIndex') != undefined ? $.cookie('tabIndex') : 0) || 0;
		var urlArgs = $.extend({
			sid: $.cookie('sid'),
			cid: $.cookie('contestId')
		}, parseArgs());

		//Interface.getContests(Interface.selectContest);
		Interface.loginBySessionId(urlArgs.sid, function () {
			if (urlArgs.cid) {
				Interface.changeContest(urlArgs.cid)
			}
			$('#tabs').tabs('select', tabIndex);
			//sometimes this event is fired earlier than current labyrinth cell width is calculated
			//it happens only on loading of the last loaded tab
			//wait for 200ms to correctly update height of the cells -- WA!!!!!!!!
			setTimeout(function(){
				if (curProblem) {
					curProblem.onTabSelect();
				}
			}, 200);
		}, true);
		cmdId = problems.length;

		/*$('#startTests').button().click(function(){
			QUnit.start();
			Tests.RunTests();
		});*/

		//QUnit.start(); //Tests loaded, run tests
		//Tests.RunTests();

        // TEST
        // function testz() {
        //     $('#tabs').tabs({selected:2});
        //     if (!problems[1] || !problems[1].Blockly) {
        //     	console.log('boo')
        //     	setTimeout(testz, 200);
        //     	return
        //     }
        // 	var problem = problems[1];
        // 	var Blockly = problem.Blockly;
        //     // var code = "def f1(x):\n  fill(x)\n  pour(x, 2)\n  pourOut(2)\n  pour(1, 2)\nf1(1)";
        //     var code = "def Func1():\n  fill(1)\n  pour(1, 2)\n  pourOut(2)\n  pour(1, 2)\nwhile compare(2, '!=', 45):\n  Func1()";
        //     require('Interface').goToCodeMode(problem);
        //     codeareas[1].setValue(code);
        //     require('Interface').goToCommandsMode(problem);
        //     // var executor = problem.blocklyExecutor;
        //     // executor.setDefault();
        //     // executor.exec(1000000000);
        // }
		// testz();
	});
});
