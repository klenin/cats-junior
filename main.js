$(document).ready(function(){
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
		}
	});
	$('#changeContest').hide();
	$('#enterPassword').hide();
	$('#contestsList').hide();
	$('#about').hide();
	$('#tabs').tabs('paging', { cycle: false, follow: true, tabsPerPage: 0 } );
	getContests();
	cmdId = problems.length;
	$('#tabs').bind('tabsshow', function(event, ui) {
		if (curProblem.visited)
			return;
		curProblem.visited = 1;
		/*$('#sortable' + curProblem.tabIndex).sortable({
			revert: false,
			cursor: 'move',
			appendTo: 'body',
			helper: 'clone'
		}).disableSelection();;
		for (var k = 0; k < classes.length; ++k){
			$('#' + classes[k] + curProblem.tabIndex).draggable({
				connectToSortable: ('#sortable' + curProblem.tabIndex),
				helper: 'clone',
				cursor: 'default',
				greedy: true,
				//connectWith: '.connectedSortable' 
			});
			$('#' + classes[k] + curProblem.tabIndex).bind('dblclick', function(){
				if ($(this).prop('ifLi'))
					return;
				for (var j = 0; j < classes.length; ++j)
					if ($(this).hasClass(classes[j]))
						addNewCmd(classes[j], true);
				updated();
			});
		}
		$('#sortable' + curProblem.tabIndex ).prop('cmdId', curProblem.tabIndex);
		$('#sortable' + curProblem.tabIndex ).bind('sortbeforestop', function(event, ui) {
			stoppedLvl = 0;
			if (!cmdAdded)
			{
				$('#cons0').html('');
				addedCmds = [];
			}
			var item = ui.helper.is(':visible') ? ui.helper : ui.item;
			if (item.offset().left > $(this).offset().left + parseInt($(this).css('width')) / 2 ||
				item.offset().left + parseInt(item.css('width'))/2 < $(this).offset().left ||
				item.offset().top > $(this).offset().top + parseInt($(this).css('height')) ||
				item.offset().top + 10 < $(this).offset().top)
			{
				ui.item.remove();
				updated();
				return;
			}
			var id = "";
			for (var k = 0; k < classes.length; ++k)
			{
				if (ui.item.hasClass(classes[k]))
				{
					id = classes[k];
					break;
				}
			}
			id += cmdId;
			if (!ui.item.prop('numId')){
				ui.item.prop('id', id);
				ui.item.prop('ifLi', 1);
				ui.item.prop('numId', cmdId);
				for (var j = 0; j < classes.length; ++j)
					if (ui.helper.hasClass(classes[j])){
						addNewCmd(classes[j], false, ui.item[0]);
					}
			}
			$('#cons0').append('sortbeforestop #sortable' + $(this).prop('cmdId') + '\n');
			addedCmds.push(ui.item);
			curProblem.cmdListEnded = false;
		});
		$('#sortable' + curProblem.tabIndex ).bind('sortstop', function(event, ui) {
			if (stoppedLvl)
			{
				/*if (receiveStarted)
					for (var i = addedCmds.length - 1; i > 0 ; --i)
						addedCmds[i].remove();
				else
					for (var i = 0; i < addedCmds.length - 1; ++i)
						addedCmds[i].remove();
			}
			stoppedLvl= 0;
			setTimeout(function(){updated();}, 1000);
			cmdAdded = false;
			$('#cons0').append('sortstop #sortable' + $(this).prop('cmdId') + '\n');

		});
		$('#sortable' + curProblem.tabIndex ).bind('sortreceive', function(event, ui) {
			$('#cons0').append('sortreceive #sortable' + $(this).prop('cmdId') + '\n');
			//receiveStarted = true;
			//setTimeout(function(){receiveFinished();}, 2000);
		});
		$('#sortable' + curProblem.tabIndex ).bind('sortout', function(event, ui) {
			var i = 0;	
		});
		$('#sortable' + curProblem.tabIndex).bind('click', function(event, ui) {
			if (!curProblem.playing)
				showCounters();
		});*/

	    $("#jstree-container" + curProblem.tabIndex).jstree({ 
			"types" : {
				"types" : {
					"block" : {
						"icon" : { 
							"image" : "images/block_small.png" 
						},
						"max_depth" : -1,
					},
					"if" : {
						"icon" : { 
							"image" : "images/block_small.png" 
						},
						"max_depth" : -1,
					},
					"ifelse" : {
						"icon" : { 
							"image" : "images/block_small.png" 
						},
						"max_depth" : -1,
					},
					"else" : {
						"icon" : { 
							"image" : "images/block_small.png" 
						},
						"max_depth" : -1,
					},
					"while" : {
						"icon" : { 
							"image" : "images/block_small.png" 
						},
						"max_depth" : -1,
					},
					"for" : {
						"icon" : { 
							"image" : "images/block_small.png" 
						},
						"max_depth" : -1,
					},
					"left" : {
						"max_depth" : 0,
						"icon" : { 
							"image" : "images/left_small.png" 
						},
					},
					"right" : {
						"max_depth" : 0,
						"icon" : { 
							"image" : "images/right_small.png" 
						},
					},
					"forward" : {
						"max_depth" : 0,
						"icon" : { 
							"image" : "images/forward_small.png" 
						},
					},
					"wait" : {
						"max_depth" : 0,
						"icon" : { 
							"image" : "images/wait_small.png" 
						},
					},
					
				}
			},
			"crrm":{
				"move" : {
					"check_move" : function (data) {
						var node = data.o;
						var type = this._get_type(data.o);
						if (type == 'else')
							return false;
						elseStmt = undefined;
						if (type == 'ifelse'){
							if (this._get_type(data.r) == 'else')
								return false;
							elseStmt = this._get_next(node);
						}
						return true;
					}
				}
				},
			"dnd" : {
				"drag_check" : function (data) {
					return { 
						after : false, 
						before : false, 
						inside : true 
					};
				},
				"drag_finish" : function (data) { 
					var node = data.r;
					//; //=(
					$("#jstree-container" + curProblem.tabIndex).jstree("create", node, isBlock(this._get_type(node)) ? "inside" : "after", false, function(newNode){
						onCreateItem(this, newNode, $(data.o));
					}, true); 
					//alert("DRAG OK"); 
				},
				"drop_finish": function(data){
					this.remove(data.o);
				}
			},
			"ui" : {
				"initially_select" : [ "phtml_2" ],
				"select_limit" : 1,
			},
			"core" : { "initially_open" : [ "phtml_1" ] },
			"plugins" : [ "themes", "html_data", "dnd", "crrm", "ui", "types", "json_data" ],
			
			
		})
		.bind("move_node.jstree", function(event, data){
			var node = data.args[0].o;
			if (data.inst._get_type(node) == 'ifelse' && elseStmt){
				data.inst.move_node(elseStmt, node, 'after', false, false, true);
			}
			updated();
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
	//$("#accordion").accordion();
	$('#enterPassword').dialog({
		modal: true,
		buttons: {
			Ok: function() {
				curUser.passwd = $('#password').prop('value');
				login();
				$(this).dialog('close');					
			},
			Cancel: function(){
				$(this).dialog('close');	
			}
		}, 
		autoOpen: false,
		close: function(){this.title = 'Введите пароль';}
	});
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
			"addWatch": function() {
				var problem = $('#tabs').tabs('option', 'selected') - 1;
				$( '#watchTable' + problem).append( '<tr id = watchTr_' + problem + '_' + lastWatchedIndex[problem] + '>' +
					'<td><button id = "deleteWatch_' + problem + '_' + lastWatchedIndex[problem] + '">delete</button></td>' +
					'<td>' + $('#watchName').val() + '</td>' + 
					'<td id = "calcVal_' + problem + '_' + lastWatchedIndex[problem] + '">' + 
						calculateValue($('#watchName').val()) + '</td>' + 
					'</tr>' ); 
				$('#deleteWatch_' + problem + '_' + lastWatchedIndex[problem]).prop('varId', lastWatchedIndex[problem]);
				$('#deleteWatch_' + problem + '_' + lastWatchedIndex[problem]).button().bind('click', function(){
					delete watchList[problem][$(this).prop('varId')];
					$('#watchTr_' + problem + '_' + $(this).prop('varId')).remove();
				});
				watchList[problem][lastWatchedIndex[problem]++] = $('#watchName').val();
				$( this ).dialog( "close" );
			},
			Cancel: function() {
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
});
