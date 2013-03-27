function onCreateItem(tree, newNode, type, problem, funcId, inputArgs){
	//var type = initObject.attr('rel');
	if (type == 'func-header' ||type == 'func-body')
		type = 'funccall';
	tree.set_type(type, newNode);
	$(newNode).addClass(type);

	$(newNode).prop('id', type + ++cmdId);
	$(newNode).prop('numId', cmdId);
	$(newNode).prop('ifLi', 1);
	$(newNode).prop('type', type);
	$(newNode).addClass(type);

	newNode = '#' + type + cmdId;
	
	//tree.rename_node(newNode, type == 'func' ? (name ? name : 'func_' + (problem.numOfFunctions - 1)) : cmdClassToName[type]);
	if (problem.executionUnit.isCommandSupported(type)) {
		var command = problem.executionUnit.getCommands()[type];
		var args = command.getArguments();
		for (var i = 0; i < args.length; ++i) {
			var spin = $('<spin></spin>');
			spin.mySpin('init', $(newNode), [], problem, args[i].type, args[i].isCounter, args[i].minValue, args[i].maxValue);
			$(newNode).append(spin);
		}
	}
	else {
		switch(type){
			case 'for':
				var spin = $('<spin></spin>');
				spin.mySpin('init', $(newNode), [], problem, 'int');
				$(newNode).append(spin);
				break;
			case 'if':
			case 'ifelse':
			case 'while':
				$(newNode).append('<select id = "selectCondition0_' + cmdId +'">');
				for (var i = 0; i < selectConditions.length; ++i)
				{
					$('#selectCondition0_' + cmdId).append('<option value = "' + (i == 0 ? '""' : 'not') + '">' + selectConditions[i][1] + '</option><br>');
				}
				$(newNode).append('</select> (')
				$('#selectCondition0_' + cmdId).change(function(p){
					return function() {
						p.updated();
					}
				}(problem));

				if (inputArgs) {
					$('#selectCondition0_' + cmdId).val(inputArgs[0]);
				}

				var conditionProperties = problem.executionUnit.getConditionProperties();
				var args = conditionProperties['args'];
				if (!args || !$.isArray(args)) {
					throw 'Invalid arguments list in condtion properties';
				}
				
				for (var i = 0; i < args.length; ++i) {
					args[i].generateDomObject($(newNode), 
						function(p) {
							return function() {
								p.updated();
							}
						}(problem), 
						inputArgs && inputArgs.length ? inputArgs[i + 1] : undefined);
				}
				if (type == 'ifelse'){
					tree.rename_node(newNode, 'Если');
					tree.create($(newNode), "after", false, 
						function(elseNode){
						tree.set_type('else', elseNode);
						tree.rename_node(elseNode, 'Иначе');
							$(elseNode).prop('numId', cmdId);
							$(elseNode).prop('ifLi', 1);
							$(elseNode).prop('type', 'else');
							$(elseNode).addClass('else');
							$(elseNode).prop('id', 'else' + cmdId);
					}, true); 
				}
				break;
			case 'funccall':
				var arguments = inputArgs;
				for (var i = 0; i < arguments.length; ++i) {
					$(newNode)
						.append('<input class="argCallInput"/>')
						.bind('change', function(){
							return function(pr) {
								pr.updated();
							}(problem)
						})
				}
				$(newNode).attr('funcId', funcId);
				break;
		}
	}
	//setSpin(problem);
	problem.updated();
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
	//return function() {
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
							"image" : "images/block_small.png" 
						}
					},
					"ifelse" : {
						"icon" : { 
							"image" : "images/block_small.png" 
						}
					},
					"else" : {
						"icon" : { 
							"image" : "images/block_small.png" 
						}
					},
					"while" : {
						"icon" : { 
							"image" : "images/block_small.png" 
						}
					},
					"for" : {
						"icon" : { 
							"image" : "images/block_small.png" 
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
					if ( !$(data.o).hasClass('jstree-draggable') )
						data.o = $(data.o).parent()[0];
					if ( !$(data.o).hasClass('jstree-draggable') )
						data.o = $(data.o).parent()[0];

					var type = this._get_type(data.o);
					var name = problem.getCommandName(type);

					if (type == 'funcdef') {
						name = 'func_' + problem.numOfFunctions;
					}
					else if (type == 'funccall') {
						name = $(data.o).children('.func-header').text();
					}
					else if (type == 'func-header') {
						name = $(data.o).text()
					}
					else if(type == 'func-body') {
						name = $(data.o).prev().prev().text();
					}
					if (type != 'funcdef') {
						$(id).jstree(
							"create", node, pos, 
							{'data': name}, 
							function(newNode){
								var args = [];
								if (type == 'funccall' || type == 'func-header' || type == 'func-body') {
									args = $( '#accordion' + problem.tabIndex ).myAccordion('getArguments', $(data.o).parent());
								}
								onCreateItem(this, newNode, $(data.o).attr('rel'), problem, $(data.o).parent().attr('funcId'), args);
							}, type != 'funcdef'); 
					}
					else if (!isFunction){
						$( '#accordion' + problem.tabIndex ).myAccordion( 'push', problem.getAvaliableFunctionName() );
						createJsTreeForFunction( '#funcDef-' + cmdId++, problem, true );
						//problem.updated();
					}
				},
				"drop_finish": function(data){
					var node = data.o;

						if ($(node).hasClass('jstree-draggable') && $(node).parent().hasClass('funccall')) {
							node = $(node).parent();
							$( '#accordion' + problem.tabIndex ).myAccordion('clearDiv', node);
							$(node).remove();
							problem.removeFunctionCall($(node).attr('funcId'));
							return true;
						}

						/*if ($(node).parent().hasClass('jstree-draggable') && $(node).parent().hasClass('funccall'))
						{
							$(node).parent().remove();
							problem.removeFunctionCall($(node).parent().children('.func-header').html());
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
						problem.updated();				
					}
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
			problem.updated();
		}).bind('click', function(event, ui) {
			problem.showCounters();
		}).bind("rename.jstree", function(event, data) {
			if (!checkName(data.rslt.new_name)) {
				alert('Invalid function name!!!');
				setTimeout(function(tree, node, name) { 
					return function() {
						$(tree).jstree('rename', node, name);
					} }(this, data.rslt.obj, data.rslt.old_name), 500);
				
				return false;
			}
			problem.updated();
		}).bind('refresh.jstree', function(event, data) {
			problem.updated();
		}).bind("dblclick.jstree", function (e, data) {
	        /*var node = $(e.target).closest("li");
	        var type = $.jstree._reference(this)._get_type(node);
			if (type == 'funccall') {
				$.jstree._reference(this).rename(node);
				problem.funcCallUpdated();
			}*/
			//TODO:
		}).bind("loaded.jstree", function (e, data) {
	    	problem.executionUnit.addTypesInTree(jQuery.jstree._reference(id));
		});
//	}
}
