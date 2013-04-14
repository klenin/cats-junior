define('Tests',
	['jQuery', 'jQueryUI', 'jQueryInherit', 'InterfaceJSTree', 'ModesConvertion', 'CommandsMode', 'Interface'],
	function(){
		var InterfaceJSTree = require('InterfaceJSTree');
		var ModesConvertion = require('ModesConvertion');
		var CommandsMode = require('CommandsMode');
		var Interface = require('Interface');

		function getJsTree(problem) {
			return $('#jstree-container' + problem.tabIndex);
		}

		function addCommand(tree, type, problem){
			if (type == 'funcdef') {
				$('#accordion' + problem.tabIndex).myAccordion('push', problem.getAvaliableFunctionName());
			}
			else {
				tree.jstree("create", false,  "last", 
						{'data' : type}, function(newNode){
						InterfaceJSTree.onCreateItem(this, newNode, $('#' + type + problem.tabIndex).attr('rel'), problem);
				}, true); 
			} 
		}

		function convertCommandsToCode(problem) {
			return problem.convertCommandsToCode();
		}

		function convertCodeToCommands(problem) {
			problem.prepareForExecuting();
			var j = problem.tabIndex;
			var block = finalcode[j] ?
				ModesConvertion.convertTreeToCommands(finalcode[j].compiled.ast.body, undefined, problems[j], true):
				new CommandsMode.Block([], undefined, problems[j]);
			return block;
		}

		function goToCommandsMode(problem) {
			Interface.goToCommandsMode(problem);
		}

		function goToCodeMode(problem) {
			Interface.goToCodeMode(problem);
		}

		function getState(problem) {
			return problem.getState();
		}

		function getTreeNodes(tree) {
			return tree.jstree('get_json', -1);
		}

		function selectProblem(tabIndex) {
			$('#tabs').tabs('select', tabIndex);
		}

		asyncTest('test select of problems', 1, function(){
			selectProblem(1);

			setTimeout(function(){
				ok(curProblem.tabIndex == 0, 'problem was properly selected');
				start();
			}, 500);
		});

		asyncTest('test addCommand()', 2, function(){
			var tree = getJsTree(curProblem);
			var type = 'forward';

			addCommand(tree, type, curProblem);

			setTimeout(function(){
				var nodes = getTreeNodes(tree);

				ok(nodes.length == 1, 'nodes count');
				ok(nodes[0].attr.rel == type, 'check type');
				start();
			}, 1000);
		});
	}
)