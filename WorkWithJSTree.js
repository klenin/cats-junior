function onCreateItem(tree, newNode, type, problem, name){
	//var type = initObject.attr('rel');
	tree.set_type(type, newNode);
	//tree.rename_node(newNode, type == 'func' ? (name ? name : 'func_' + (problem.numOfFunctions - 1)) : cmdClassToName[type]);
	switch(type){
		case 'left':
		case 'right':
		case 'forward':
		case 'wait':
		case 'for':
			$(newNode).append('<span align = "right" id = "spinDiv' + cmdId + '" class = "cnt"></span>');
			$('#spinDiv' + cmdId).append('<input class = "cnt"  id="spin' + cmdId + '" value="1" type="text"/>');
			break;
		case 'if':
		case 'ifelse':
		case 'while':
			$(newNode).append('<select id = "selectConditions' + cmdId +'">');
			for (var i = 0; i < selectConditions.length; ++i)
			{
				$('#selectConditions' + cmdId).append('<option value = ' + i + '>' + selectConditions[i][1] + '</option><br>');
			}
			$(newNode).append('</select> (')
			
			$(newNode).append('<select id = "selectObjects' + cmdId +'">');
			for (var i = 0; i < selectObjects.length; ++i)
			{
				$('#selectObjects' + cmdId).append('<option value = ' + i + '>' + selectObjects[i][1] + '</option><br>');
			}
			$(newNode).append('</select>');

			$(newNode).append('<select id = "selectDirections' + cmdId +'">');
			for (var i = 0; i < selectDirections.length; ++i)
			{
				$('#selectDirections' + cmdId).append('<option value = ' + i + '>' + selectDirections[i][1] + '</option><br>');
			}
			$(newNode).append('</select>)');
			
			$('#selectObjects' + cmdId + ', #selectConditions' + cmdId + ', #selectDirections' + cmdId).change(function(p){return function() {p.updated();}}(problem));
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
		case 'funcdef':
			//tree.rename(newNode);
			$(newNode).bind('dblclick', function(node, t){
				return function() {
					t.rename(node);
				};
			}(newNode, tree));
			$('#funccall-container' + problem.tabIndex).append(
				'<div id = "funccall' + cmdId + 
				'" class = "funccall jstree-draggable" type = "funccall" rel = "funccall" title = "funccall">' +
				$.trim(newNode.text()) + '</div>'
				)
			break;
	}
	$(newNode).prop('id', type + cmdId);
	$(newNode).prop('numId', cmdId);
	$(newNode).prop('ifLi', 1);
	$(newNode).prop('type', type);
	$(newNode).addClass(type);
	setSpin(problem);
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

function createJsTreeForFunction(funcId, problem) {
	$(funcId).jstree({ 
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
				"left" : {
					"valid_children" : "none",
					"icon" : { 
						"image" : "images/left_small.png" 
					}
				},
				"right" : {
					"valid_children" : "none",
					"icon" : { 
						"image" : "images/right_small.png" 
					}
				},
				"forward" : {
					"valid_children" : "none",
					"icon" : { 
						"image" : "images/forward_small.png" 
					}
				},
				"wait" : {
					"valid_children" : "none",
					"icon" : { 
						"image" : "images/wait_small.png" 
					}
				},
				"funccall" : {
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
				var type = this._get_type(data.o);
				var name = cmdClassToName[type];
				if (type == 'funcdef') {
					name = 'func_' + problem.numOfFunctions;
				}
				else if (type == 'funccall') {
					name = $(data.o).text();
				}
				if (type != 'funcdef') {
					$(funcId).jstree(
						"create", node, pos, 
						{'data': name}, 
						function(newNode){
							onCreateItem(this, newNode, $(data.o).attr('rel'), problem);
						}, type != 'funcdef'); 
				}
			},
			"drop_finish": function(data){
				var node = data.o;
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
		problem.updated();
	}).bind('refresh.jstree', function(event, data) {
		problem.updated();
	});
}
