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
			$.cookie('tabIndex', ui.index);
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
		for (var k = 0; k < classes.length; ++k){
			$('#' + classes[k] + problem.tabIndex).bind('dblclick', function(j){
				return function() {
					if ($(this).prop('ifLi'))
						return;
					$("#jstree-container" + problem.tabIndex).jstree("create", false,  "last", false, function(newNode){
							onCreateItem(this, newNode, $('#' + classes[j] + problem.tabIndex), problem);
						}, true); 
					problem.updated();
				}
			}(k));
		}
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
	    $("#jstree-container" + problem.tabIndex).jstree({ 
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
					}
					
				}
			},
			"crrm":{
				"move" : {
					"default_position" : "inside", 
					"check_move" : function (data) {
						var node = data.o;
						var type = this._get_type(node);
						if (type == 'else')
							return false;
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
					return result;
				},
				"drag_finish" : function (data) { 
					var node = data.r;
					//; //=(
					var pos = data.p;
					if (!isBlock(this._get_type(node)) && pos == 'inside'){
						pos = 'after';
					}
					$("#jstree-container" + problem.tabIndex).jstree("create", node, pos, false, function(newNode){
						onCreateItem(this, newNode, $(data.o), problem);
					}, true); 
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
				$.cookie('userId', undefined);
				$.cookie('passwd', undefined);
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
