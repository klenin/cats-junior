define('Tests',
	['jQuery', 'jQueryUI', 'jQueryInherit', 'ModesConversion', 'Interface'],
	function(){
		var ModesConversion = require('ModesConversion');
		var Interface = require('Interface');

		function convertCommandsToCode(problem) {
			return problem.convertCommandsToCode();
		}

		function convertCodeToCommands(problem) {
			problem.prepareForExecuting();
			var j = problem.tabIndex;
			var block = finalcode[j] ?
				ModesConversion.convertTreeToCommands(finalcode[j].compiled.ast.body, undefined, problems[j], true):
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
