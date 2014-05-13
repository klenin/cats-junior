define('InterfaceJSTree', ['jQuery', 'jQueryUI', 'JsTree', 'CommandsMode'], function(){
	var CommandsMode = require ('CommandsMode');

	var elseStmt = undefined;

	function onCreateItem(tree, newNode, type, problem, funcId, inputConditionPropertiesId, inputArgs, dontNeedToUpdate){
		if (type == 'func-header' || type == 'func-body') {
			type = 'funccall';
		}

		if (problem.executionUnit.isCommandSupported(type)) {
			var command = problem.executionUnit.getCommands()[type];
			if (command.getArguments().length) {
				if (command.hasCounter) {
					CommandsMode.CommandWithCounter.onCreateJsTreeItem(tree, newNode, type, problem, dontNeedToUpdate);
				}
				else {
					CommandsMode.Command.onCreateJsTreeItem(tree, newNode, type, problem, dontNeedToUpdate);
				}
			}
			else {
				CommandsMode.CommandBase.onCreateJsTreeItem(tree, newNode, type, problem, dontNeedToUpdate);
			}
		}
		else {
			switch(type) {
				case 'for':
					CommandsMode.ForStmt.onCreateJsTreeItem(tree, newNode, type, problem, dontNeedToUpdate);
					break;
				case 'if':
				case 'ifelse':
					CommandsMode.IfStmt.onCreateJsTreeItem(tree, newNode, type, problem, dontNeedToUpdate);
					break;
				case 'while':
					CommandsMode.WhileStmt.onCreateJsTreeItem(tree, newNode, type, problem, dontNeedToUpdate);
					break;
				case 'funccall':
					CommandsMode.FuncCall.onCreateJsTreeItem(tree, newNode, type, problem, dontNeedToUpdate, inputArgs);
					break;
			}

		}
	}

	function isBlock(type){
		return type == false || type == 'block' || type == 'if' || type == 'ifelse' ||
			type == 'while' || type == 'for' || type == 'else' || type == 'funcdef';
	}
	function getNextNode(tree, node)
	{
		var parent = tree._get_parent(node);
		var next;
		var cur = node;
		while(1)
		{
			next = tree._get_next(cur, true);
			cur = next;
			var p1 = tree._get_parent(next);
			if (!next || p1 == -1 || p1.prop('id') == parent.prop('id'))
				break;
		}
		return next;
	}

	function getTreeIdByObject(tree) {
		return tree.data.html_data.original_container_html.context;
	}

	function createJsTreeForFunction(id, problem, isFunction) {
		//return function(p) {
			return $(id).jstree({
				"types" : {
					"max_depth" : -2,
			        "max_children" : -2,
					"types" : {
						"block" : {
							"icon" : {
								"image" : "images/block_small.png"
							}
						},
						"if" : {
							"icon" : {
								"image" : "images/if_small.png"
							}
						},
						"ifelse" : {
							"icon" : {
								"image" : "images/if_else_small.png"
							}
						},
						"else" : {
							"icon" : {
								"image" : "images/block_small.png"
							}
						},
						"while" : {
							"icon" : {
								"image" : "images/loop_small.png"
							}
						},
						"for" : {
							"icon" : {
								"image" : "images/loop_small.png"
							}
						},
						"funccall" : {
							"valid_children" : "none",
							"icon" : {
								"image" : "images/block_small.png"
							}
						},
						"func-header" : {
							"valid_children" : "none",
							"icon" : {
								"image" : "images/block_small.png"
							}
						},
						"func-body" : {
							"valid_children" : "none",
							"icon" : {
								"image" : "images/block_small.png"
							}
						}
					}
				},
				"crrm":{
					"move" : {
						"default_position" : "inside",
						"check_move" : function (data) {
							var node = data.o;
							var type = this._get_type(node);
							if (type == 'else') {
								return false;
							}
							elseStmt = undefined;
							if (type == 'ifelse'){
								elseStmt = getNextNode(this, node);
							}
							node = data.r;
							type = this._get_type(node);
							if (type == 'ifelse' && data.p == 'after'){
								return false;
							}
							if (type == 'else' && data.p == 'before'){
								return false;
							}
							if (type == 'funcdef' && this._get_type(data.o) == 'funcdef' && data.p == 'inside' ){
								return false;
							}
							if (type == 'funccall' && data.p == 'inside' ){
								return false;
							}
							return true;
						}
					}
					},
				"dnd" : {
					"drag_check" : function (data) {
						result = {
							after : true,
							before : true,
							inside : true
						};
						if (this._get_type(data.r) == 'ifelse'){
							result['after'] = false;
						}
						if (this._get_type(data.r) == 'else'){
							result['before'] = false;
						}
						if (this._get_type(data.r) == 'funcdef' && this._get_type(data.o) == 'funccall'){
							result['inside'] = false;
						}
						if (this._get_type(data.r) == 'funccall'){
							result['inside'] = false;
						}
						return result;
					},
					"drag_finish" : function (data) {
						var node = data.r;
						//; //=(
						var pos = data.p;
						if ((!isBlock(this._get_type(node)) || this._get_type(node) == 'funcdef' && this._get_type(data.o) == 'funcdef') && pos == 'inside'){
							pos = 'after';
						}
						while ( !$(data.o).hasClass('jstree-draggable') ) {
							data.o = $(data.o).parent()[0];
						}

						var type = this._get_type(data.o);
						var name = curProblem.getCommandName(type);

						if (type == 'funccall') {
							name = $(data.o).children('.func-header').text();
						}
						else if (type == 'func-header') {
							name = $(data.o).text()
						}
						else if (type == 'func-body') {
							name = $(data.o).prev().prev().text();
						}
						if (type != 'funcdef') {
							$(id).jstree(
								"create", node, pos,
								{'data': name},
								function(newNode){
									var args = [];
									if (type == 'funccall' || type == 'func-header' || type == 'func-body') {
										args = $( '#accordion' + curProblem.tabIndex ).myAccordion('getArguments', $(data.o).parent());
									}
									onCreateItem(this, newNode, $(data.o).attr('rel'), curProblem, $(data.o).parent().attr('funcId'), undefined, args);
								}, type != 'funcdef');
						}
						else if (!isFunction){
							$( '#accordion' + curProblem.tabIndex ).myAccordion( 'push', curProblem.getAvaliableFunctionName() );
							createJsTreeForFunction( '#funcDef-' + cmdId++, curProblem, true );
							//curProblem.updated();
						}
					},
					"drop_finish": function(data){
						var node = data.o;

						if ($(node).hasClass('jstree-draggable') && $(node).parent().hasClass('funccall')) {
							node = $(node).parent();
							$( '#accordion' + curProblem.tabIndex ).myAccordion('clearDiv', node);
							$(node).remove();
							curProblem.removeFunctionCall($(node).attr('funcId'));
							return true;
						}

						/*if ($(node).parent().hasClass('jstree-draggable') && $(node).parent().hasClass('funccall'))
						{
							$(node).parent().remove();
							curProblem.removeFunctionCall($(node).parent().children('.func-header').html());
							return true;
						}*/

						if (node) {
							var type = this._get_type(node);
							if (type == 'else')
								return false;
							var next = undefined;
							if (type == 'ifelse'){
								next = getNextNode(this, node);
							}
							this.remove(data.o);
							if (next)
								this.remove(next);
							curProblem.updated();
						}
						return true;
					}
				},
				"ui" : {
					"initially_select" : [ "phtml_2" ],
					"select_limit" : 1
				},
				"core" : { "initially_open" : [ "phtml_1" ] },
				"plugins" : [ "themes", "html_data", "dnd", "crrm", "ui", "types", "json_data" ]
			})
			.bind("move_node.jstree", function(event, data){
				var node = data.args[0].o;
				if (data.inst._get_type(node) == 'ifelse' && elseStmt){
					data.inst.move_node(elseStmt, node, 'after', false, false, true);
					elseStmt = undefined;
			}
				curProblem.updated();
			}).bind('click', function(event, ui) {
				curProblem.updateInterface('FINISH_EXECUTION');
			}).bind("rename.jstree", function(event, data) {
				if (!checkName(data.rslt.new_name)) {
					alert('Invalid function name!!!');
					setTimeout(function(tree, node, name) {
						return function() {
							$(tree).jstree('rename', node, name);
						} }(this, data.rslt.obj, data.rslt.old_name), 500);

					return false;
				}
				curProblem.updated();
				return true;
			}).bind('refresh.jstree', function(event, data) {
				curProblem.updated();
			}).bind("dblclick.jstree", function (e, data) {
		        /*var node = $(e.target).closest("li");
		        var type = $.jstree._reference(this)._get_type(node);
				if (type == 'funccall') {
					$.jstree._reference(this).rename(node);
					curProblem.funcCallUpdated();
				}*/
				//TODO:
			}).bind("loaded.jstree", function (e, data) {
		    	curProblem.executionUnit.addTypesInTree(jQuery.jstree._reference(id));
			});
		//}(problem);
	}

	return {
		onCreateItem: onCreateItem,
		isBlock: isBlock,
		getNextNode: getNextNode,
		createJsTreeForFunction: createJsTreeForFunction
	}
});


