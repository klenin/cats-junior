function onCreateItem(tree, newNode, initObject, problem){
	var type = initObject.attr('rel');
	tree.set_type(type, newNode);
	tree.rename_node(newNode, cmdClassToName[type]);
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
				tree.rename_node(newNode, 'If');
				$("#jstree-container" + problem.tabIndex).jstree("create", $(newNode), "after", false, 
					function(elseNode){
					tree.set_type('else', elseNode);
					tree.rename_node(elseNode, 'Else');
						$(elseNode).prop('numId', cmdId);
						$(elseNode).prop('ifLi', 1);
						$(elseNode).prop('type', 'else');
						$(elseNode).addClass('else');
						$(elseNode).prop('id', 'else' + cmdId);
				}, true); 
			}
			break;
	}
	$(newNode).prop('numId', cmdId);
	$(newNode).prop('ifLi', 1);
	$(newNode).prop('type', type);
	$(newNode).addClass(type);
	$(newNode).prop('id', type + cmdId);
	setSpin(problem);
	problem.updated();
}
	
function isBlock(type){
	return type == false || type == 'block' || type == 'if' || type == 'ifelse' || 
		type == 'while' || type == 'for' || type == 'else';
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

