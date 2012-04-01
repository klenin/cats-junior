function generateTabs(tabsNum)
{
	var str = '';
	for (var i = 0; i < tabsNum; ++i)
		str += '  ';
	return str;
}

function test1()
{
	return true;
}

function test2()
{
	return false;
}

var testFunctions = ['test1', 'test2'];
var testFunctionsDict = {'test1': test1, 'test2': test2};

var Command = $.inherit({
	__constructor : function(name, cnt, parent, id) {
        this.name = name;
		this.cnt = cnt;
		this.curCnt = 0;
		this.parent = parent;
		this.id = id;
	},
	eq: function(cmd, compareCnt){
		return (cmd.getClass() == 'command' && cmd.id == this.id && (compareCnt ? cmd.cnt >= this.curCnt : cmd.cnt == this.cnt));
	},
	exec: function(cnt) {
		var t = Math.min(cnt, Math.abs(this.curCnt - this.cnt));
		for (var i = 0; i < t && !(curProblem.stopped || curProblem.paused); ++i)
		{
			eval(this.name + '();');
			++this.curCnt;
		}
		if (curProblem.speed || this.cnt == this.curCnt)
		{
			var numId = $('#' + this.id).prop('numId');
			$('#spinCnt' + numId).prop('value', (this.cnt - this.curCnt) + '/' + this.cnt);
		}
		curProblem.lastExecutedCmd = this;
		return cnt - t;
	},
	getClass: function(){
		return 'command'
	},
	setDefault: function() {
		this.curCnt = 0;
		var numId = $('#' + this.id).prop('numId');
		$('#spinCnt' + numId).prop('value', this.cnt + '/' + this.cnt);
		if (isCmdHighlighted(this.id))
			changeCmdHighlight(this.id);
	},
	isFinished: function() {
		return this.curCnt >= this.cnt;
	},
	showCounters: function() {
		$('#' + this.id + ' > span > img').show();		
		$('#' + this.id + ' > span > input').show();			
		var numId = $('#' + this.id).prop('numId');
		$('#spinCnt' + numId).hide();
	},
	hideCounters: function() {
		$('#' + this.id + ' > span > img').hide();		
		$('#' + this.id + ' > span > input').hide();			
		var numId = $('#' + this.id).prop('numId');
		$('#spinCnt' + numId).prop('value', (this.cnt - this.curCnt) + '/' + this.cnt);
		$('#spinCnt' + numId).show();
	},
	started: function() {
		return this.curCnt > 0;
	},
	copyDiff: function(cmd, compareCnt){
		if (this.eq(cmd, compareCnt))
		{
			this.cnt = cmd.cnt;
			return this;
		}
		return  cmd;
	},
	makeUnfinished: function(){
		return;
	},
	highlightOff: function() {
		if (isCmdHighlighted(this.id))
			changeCmdHighlight(this.id);
	},
	highlightOn: function(){
		if (!isCmdHighlighted(this.id))
			changeCmdHighlight(this.id);
	},
	convertToCode: function(tabsNum) {
		return generateTabs(tabsNum) + this.name + '(' + this.cnt + ')\n';
	},
	generateCommand: function(container){
		name = this.name;
		$(container).append('<li id = "' + name + cmdId + '" class = "' + name + ' ui-draggable"></li>');	
		var newContainer = '#' + name + cmdId;
		if($.browser.msie)
			$(newContainer).css('height', '35px');
		$(newContainer).append('<span style = "margin-left: 40px;">' + cmdClassToName[name] + '</span>');
		$(newContainer).append('<span align = "right" id = "spinDiv' + cmdId + '" class = "cnt"></span>');
		$('#spinDiv' + cmdId).append('<input class = "cnt"  id="spin' + cmdId + '" value="' + this.cnt + '" type="text"/>');
		$(newContainer).prop('numId', cmdId);
		$(newContainer).prop('ifLi', 1);
		$(newContainer).prop('type', name);
		$('#spinDiv' + cmdId).append('<input id = "spinCnt' + cmdId + '" class = "spinCnt" type="text">')
		$('#spin' + cmdId).spin({
			min: 1,
			changed: function(){
				updated();			
			}
		});
	}
});

var ForStmt = $.inherit({
	__constructor : function(body, cnt, parent, id) {
		this.executing = false;//
		this.isStarted = false; //should be changed to one or two properties.
		this.body = body;
		this.cnt = cnt;
		this.parent = parent;	
		this.id = id;
		this.curCnt = 0;
	},
	isFinished: function(){
		return this.curCnt > this.cnt;
	},
	eq: function(block){
		return block.getClass() == 'for' && this.body.eq(block.body);
	},
	exec: function(cnt)
	{
		while (cnt && !this.isFinished() && !(curProblem.stopped || curProblem.paused))
		{
			this.isStarted = true;
			if (!this.executing)
			{
				cnt -= 1;
					var numId = $('#' + this.id).prop('numId');
					$('#spinCnt' + numId).prop('value', (this.cnt - this.curCnt) + '/' + this.cnt);
				if (!cnt || curProblem.speed)
				{
					if (curProblem.speed)
					{
						if (curProblem.prevCmd)
							curProblem.prevCmd.highlightOff();
						curProblem.prevCmd = this;
					}
					$('#' + this.id + '>span').css('background-color', 'green');
				}
				curProblem.lastExecutedCmd = this;
				if (++this.curCnt > this.cnt)
				{
					return cnt;
				}
				this.executing = true;
				this.body.setDefault();
			}
			cnt = this.body.exec(cnt);
			if (this.body.isFinished())
			{
				this.executing = false;
			}
		}
		return cnt;
	},
	getClass: function(){
		return 'for';
	},
	setDefault: function(){
		this.executing = false;
		this.isStarted = false;
		this.curCnt = 0;
		var numId = $('#' + this.id).prop('numId');
		$('#spinCnt' + numId).prop('value', this.cnt + '/' + this.cnt);
		this.body.setDefault();
		this.highlightOff();
	},
	showCounters: function() {
		$('#' + this.id + ' > span > img').show();		
		$('#' + this.id + ' > span > input').show();			
		var numId = $('#' + this.id).prop('numId');
		$('#spinCnt' + numId).hide();
		this.body.showCounters();
	},
	hideCounters: function() {
		$('#' + this.id + ' > span > img').hide();		
		$('#' + this.id + ' > span > input').hide();			
		var numId = $('#' + this.id).prop('numId');
		$('#spinCnt' + numId).prop('value', (this.cnt - this.curCnt) + '/' + this.cnt);
		$('#spinCnt' + numId).show();
		this.body.hideCounters();
	},
	started: function() {
		return this.isStarted;
	},
	copyDiff: function(block, compareCnt){
		if (block.getClass() != 'for')
		{
			return block;
		}
		this.cnt = block.cnt; //?
		this.body.copyDiff(block.body);
		return this;
	},
	makeUnfinished: function(){
		if (this.isFinished())
		{
			this.curCnt = Math.max(this.cnt - 1, 0);
			this.executing = true;
			this.body.makeUnfinished();
		}
	},
	highlightOff: function(){
		$('#' + this.id + '>span').css('background-color', 'white');
		this.body.highlightOff();
	},
	highlightOn: function(){
		$('#' + this.id + '>span').css('background-color', 'green');
	},
	convertToCode: function(tabsNum) {
		var str = generateTabs(tabsNum) + 'for ' + this.id + 'Var in range(' + this.cnt + '):\n';
		str += this.body.convertToCode(tabsNum + 1);
		return str;
	},
	generateCommand: function(container){
		$(container).append('<li id = "for' + cmdId + '" class = "for ui-draggable"></li>');	
		var newContainer = '#for' + cmdId;
		if($.browser.msie)
			$(newContainer).css('height', '35px');
		$(newContainer).append('<span style = "margin-left: 40px;">For</span>');
		$(newContainer).append('<span align = "right" id = "spinDiv' + cmdId + '" class = "cnt"></span>');
		$('#spinDiv' + cmdId).append('<input class = "cnt"  id="spin' + cmdId + '" value="' + this.cnt + '" type="text"/>');
		$(newContainer).css('height', '220px');
		$(newContainer).prop('numId', cmdId);
		$(newContainer).prop('ifLi', 1);
		$(newContainer).prop('type', 'for');
		$('#spinDiv' + cmdId).append('<input id = "spinCnt' + cmdId + '" class = "spinCnt" type="text">')
		$('#spin' + cmdId).spin({
			min: 1,
			changed: function(){
				updated();			
			}
		});
		this.body.generateCommand(newContainer, 'for');
	}
});

var IfStmt = $.inherit({
	__constructor : function(testName, firstBlock, secondBlock, parent, id) {
        this.curBlock = undefined;
		this.testName = testName;
		this.test = testFunctionsDict[testName]
		this.blocks = [firstBlock, secondBlock];
		this.parent = parent;	
		this.id = id;
	},
	isFinished: function(){
		return this.curBlock != undefined && (!this.blocks[this.curBlock] || this.blocks[this.curBlock].isFinished());
	},
	eq: function(block){
		return block.getClass() == 'if' && this.test == block.test && 
			((this.curBlock == undefined && block.curBlock == undefined) ||
			(this.curBlock != undefined && block.curBlock != undefined && 
			this.blocks[this.curBlock].eq(block.blocks[this.curBlock])));
	},
	exec: function(cnt)
	{
		if (this.curBlock == undefined && cnt)
		{
			this.curBlock = this.test() ? 0 : 1;
			cnt -= 1;
			if (!cnt || curProblem.speed)
			{
				if (curProblem.speed)
				{
					if (curProblem.prevCmd)
						curProblem.prevCmd.highlightOff();
					curProblem.prevCmd = this;
				}
				$('#' + this.id + '>select').css('background-color', 'green');

			}
			curProblem.lastExecutedCmd = this;
			if (!this.blocks[this.curBlock])
				return cnt;
		}
		return this.blocks[this.curBlock].exec(cnt);
	},
	getClass: function(){
		return 'if';
	},
	setDefault: function(){
		this.blocks[0].setDefault();
		if (this.blocks[1])
			this.blocks[1].setDefault();
		this.curBlock = undefined;
		this.highlightOff();
	},
	showCounters: function() {
		this.blocks[0].showCounters();
		if (this.blocks[1])
			this.blocks[1].showCounters();
	},
	hideCounters: function() {
		this.blocks[0].hideCounters();
		if (this.blocks[1])
			this.blocks[1].hideCounters();
	},
	started: function() {
		return this.curBlock != undefined;
	},
	copyDiff: function(block, compareCnt){
		if (block.getClass() != 'if')
		{
			return block;
		}
		this.test = block.test; //?
		this.blocks[0] = this.blocks[0].copyDiff(block.blocks[0], compareCnt);
		if (!this.blocks[1])
			this.blocks[1] = block.blocks[1];
		else if (block.blocks[1])
			this.blocks[1].copyDiff(block.blocks[1], compareCnt);
		return this;
	},
	makeUnfinished: function(){
		if (this.isFinished())
		{
			if (this.blocks[this.curBlock])
				this.blocks[this.curBlock].makeUnfinished();
			else
				this.curBlock = undefined;
		}
	},
	highlightOff: function(){
		$('#' + this.id + '>select').css('background-color', 'white');
		this.blocks[0].highlightOff();
		if (this.blocks[1])
			this.blocks[1].highlightOff();
	},
	highlightOn: function(){
		$('#' + this.id + '>select').css('background-color', 'green');
	},
	convertToCode: function(tabsNum) {
		var str = generateTabs(tabsNum) + 'if ' + this.testName + '():\n';
		str += this.blocks[0].convertToCode(tabsNum + 1);
		if (this.blocks[1])
		{
			str += generateTabs(tabsNum) + 'else:\n';
			str += this.blocks[1].convertToCode(tabsNum + 1);
		}
		return str;
	},
	generateCommand: function(container){
		str = this.blocks[1] ? 'ifelse' : 'if';  
		var newContainer = '#' + str + cmdId;
		$(container).append('<li id = "' + str + cmdId + '" class = "if ui-draggable"></li>');
		$(newContainer).append('<span style = "margin-left: 40px;">If</span>');
		$(newContainer).append('<select id = "ifselect' + cmdId +'">');
		var options = ['wall at the left', 'wall at the right'];
		for (var i = 0; i < options.length; ++i)
		{
			$('#ifselect' + cmdId).append('<option value = ' + i + '>' + options[i] + '</option><br>');
		}
		$(newContainer).append('</select>');
		$('#ifselect' + cmdId).change(updated);
		$(newContainer).css('height', this.blocks[1] ? '440px' : '220px');
		$(newContainer).prop('type', str);
		this.blocks[0].generateCommand(newContainer, 'if');
		if (this.blocks[1])
			this.blocks[1].generateCommand(newContainer, 'else');
	}
});

var WhileStmt = $.inherit({
	__constructor : function(testName, body, parent, id) {
        this.finished = false;//
		this.executing = false;//
		this.isStarted = false; //should be changed to one or two properties.
		this.testName = testName;
		this.test = testFunctionsDict[testName]
		this.body = body;
		this.parent = parent;	
		this.id = id;
	},
	isFinished: function(){
		return this.finished;
	},
	eq: function(block){
		return block.getClass() == 'while' && this.test == block.test && 
			this.body.eq(block.body);
	},
	exec: function(cnt)
	{
		while (cnt && !this.finished && !(curProblem.stopped || curProblem.paused))
		{
			this.isStarted = true;
			if (!this.executing)
			{
				cnt -= 1;
				if (!cnt || curProblem.speed)
				{
					if (curProblem.speed)
					{
						if (curProblem.prevCmd)
							curProblem.prevCmd.highlightOff();
						curProblem.prevCmd = this;
					}
					$('#' + this.id + '>select').css('background-color', 'green');
				}
				curProblem.lastExecutedCmd = this;
				if (!this.test())
				{
					this.finished = true;
					return cnt;
				}
				this.executing = true;
				this.body.setDefault();
			}
			cnt = this.body.exec(cnt);
			if (this.body.isFinished())
			{
				this.executing = false;
			}
		}
		return cnt;
	},
	getClass: function(){
		return 'while';
	},
	setDefault: function(){
		this.finished = false;
		this.executing = false;
		this.isStarted = false;
		this.body.setDefault();
		this.highlightOff();
	},
	showCounters: function() {
		this.body.showCounters();
	},
	hideCounters: function() {
		this.body.hideCounters();
	},
	started: function() {
		return this.isStarted;
	},
	copyDiff: function(block, compareCnt){
		if (block.getClass() != 'while')
		{
			return block;
		}
		this.test = block.test; //?
		this.body.copyDiff(block.body);
		return this;
	},
	makeUnfinished: function(){
		if (this.isFinished())
		{
			this.finished = false;
			this.executing = true;
			this.body.makeUnfinished();
		}
	},
	highlightOff: function(){
		$('#' + this.id + '>select').css('background-color', 'white');
		this.body.highlightOff();
	},
	highlightOn: function(){
		$('#' + this.id + '>select').css('background-color', 'green');
	},
	convertToCode: function(tabsNum) {
		var str = generateTabs(tabsNum) + 'while ' + this.testName + '():\n';
		return str + this.body.convertToCode(tabsNum + 1);
	},
	generateCommand: function(container){
		str = 'while';
		$(container).append('<li id = "' + str + cmdId + '" class = "while ui-draggable"></li>');
		var newContainer = '#' + str + cmdId;
		$(newContainer).append('<span style = "margin-left: 40px;">While</span>');
		$(newContainer).append('<select id = "whileselect' + cmdId +'">');
		var options = ['wall at the left', 'wall at the right'];
		for (var i = 0; i < options.length; ++i)
		{
			$('#whileselect' + cmdId).append('<option value = ' + i + '>' + options[i] + '</option><br>');
		}
		$(newContainer).append('</select>');
		$('#whileselect' + cmdId).change(updated);
		$(newContainer).css('height', '220px');
		$(newContainer).prop('type', str);
		this.body.generateCommand(newContainer, 'while');
	}
});


var Block = $.inherit({
	__constructor : function(commands, parent) {
        this.curCmd = 0;
		this.commands = commands;
		this.parent = parent;
		
	},
	insertCommand : function(command, pos) {
	    this.commands.splice(pos, command);
	},
	pushCommand: function(command){
		this.commands.push(command);
	},
	isFinished: function(){
		return this.commands.length <= this.curCmd;
	},
	eq: function(block){
		if (block.getClass() != 'block')
			return false;
		var f = true;
		for (var i = 0; i < Math.min(this.commands.length, this.curCmd + 1) && f; ++i) //rewrite!
		{
			if (i >= block.commands.length)
				return false;
			var f1 = this.commands[i].eq(block.commands[i], block.commands[i].getClass() == 'command' && 
				i == Math.min(this.commands.length - 1, this.curCmd));
			f = f && f1;
		}
		return f;
	},
	exec: function(cnt)
	{
		var cmd = undefined;
		while(cnt && this.commands.length > this.curCmd && !(curProblem.stopped || curProblem.paused))
		{
			cmd = this.commands[this.curCmd];
			cnt = cmd.exec(cnt);
			if (cmd.isFinished())
				++this.curCmd;
		}
		if (cmd && cmd.getClass() == 'command' && (curProblem.speed || !cnt)) 
		{
			if (curProblem.speed)
			{
				if (curProblem.prevCmd && curProblem.prevCmd.id != cmd.id)
					curProblem.prevCmd.highlightOff()
				curProblem.prevCmd = cmd;
				if (!isCmdHighlighted(cmd.id))
				{
					changeCmdHighlight(cmd.id);
				}
			}
			if (!cnt)
				cmd.hideCounters();
		}
		return cnt;
	},
	getClass: function(){
		return 'block';
	},
	setDefault: function(){
		for (var i = 0; i < this.commands.length; ++i)
			this.commands[i].setDefault();
		this.curCmd = 0;
	},
	showCounters: function() {
		for (var i = 0; i < this.commands.length; ++i)
			this.commands[i].showCounters(); 
	},
	hideCounters: function() {
		for (var i = 0; i < this.commands.length; ++i)
			this.commands[i].hideCounters(); 
	},
	started: function() {
		return this.curCmd > 0 || (this.commands.length && this.commands[0].started());
	},
	copyDiff: function(block, compareCnt){
		if (block.getClass() != 'block')
		{
			return block;
		}
		for (var i = 0; i < Math.min(this.commands.length, block.commands.length); ++i)
		{
			this.commands[i] = this.commands[i].copyDiff(block.commands[i], this.isFinished() && i == this.commands.length - 1 && compareCnt);
		}
		if (this.commands.length < block.commands.length)
			this.commands = this.commands.concat(block.commands.slice(this.commands.length))
		else if (this.commands.length > block.commands.length)
			this.commands.splice(block.commands.length, this.commands.length - block.commands.length);
		return this;
	},
	makeUnfinished: function(){
		if (this.isFinished())
		{
			this.curCmd = Math.max(this.commands.length - 1, 0);
			if (this.commands.length)
				this.commands[this.curCmd].makeUnfinished();
		}
	},
	highlightOff: function(){
		for (var i = 0; i < this.commands.length; ++i)
			this.commands[i].highlightOff();
	},
	highlightOn: function(){
		return;
	},
	convertToCode: function(tabsNum) {
		str = '';
		for (var i = 0; i < this.commands.length; ++i)
			str += generateTabs(tabsNum) + this.commands[i].convertToCode(tabsNum + 1);
		return str;
	},
	generateCommand: function(container, str){
		str = str ?  str : 'block';
		var newContainer = '#sortable' + str + cmdId;
		if (container != '#sortable' + curProblem.tabIndex){
			$(container).append('<ul id = "sortable' + str + cmdId + '" class = "ui-sortable sortable connectedSortable" style = "height: 200px; width: 220px;">');

			$('#sortable' + str + cmdId).sortable({
				revert: false,
				cursor: 'move',
				appendTo: 'body',
				helper: 'clone',
			}).disableSelection();
			$('#sortable' + str + cmdId).prop('sortName', 'sortable' + str + cmdId);
			$('#sortable' + str + cmdId).prop('cmdId', cmdId);
			$('#sortable' + str + cmdId).bind('sortbeforestop', function(event, ui) {
				cmdAdded = true;
				var item = ui.helper.is(':visible') ? ui.helper : ui.item;
				if (item.offset().left > $(this).offset().left + parseInt($(this).css('width')) / 2 ||
					item.offset().left + parseInt(item.css('width'))/2 < $(this).offset().left ||
					item.offset().top > $(this).offset().top + parseInt($(this).css('height')) / 2 ||
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
				$('#cons0').append('sortbeforestop #sortable' + str + $(this).prop('cmdId') + '\n');
				curProblem.cmdListEnded = false;
			});
			$('#sortable' + str + cmdId).bind('sortstop', function(event, ui) {
				++stoppedLvl;
				$('#cons0').append('sortstop #sortable' + str +  $(this).prop('cmdId') + '\n');

			});
			$('#sortable' + str + cmdId).bind('sortreceive', function(event, ui) {
				$('#cons0').append('sortreceive #sortable' + str +  $(this).prop('cmdId') + '\n');

			});
			$('#sortable' + str + cmdId).bind('sortout', function(event, ui) {
				var i = 0;	
			});
			$('#sortable' + str + cmdId).bind('click', function(event, ui) {
				if (!curProblem.playing)
					showCounters();
			});
			var sortables =  $('#' + str + curProblem.tabIndex).draggable('option', 'connectToSortable');
			sortables = '#sortable' + str + cmdId + ', ' + sortables;
			for (var k = 0; k < classes.length; ++k){
				$('#' + classes[k] + curProblem.tabIndex).draggable('option', 'connectToSortable', sortables);
			}
		}
		else
			newContainer = container;
		$(newContainer).prop('type', str);
		for (var i = 0; i < this.commands.length; ++i){
			++cmdId;
			this.commands[i].generateCommand(newContainer);
		}
	}
});


function callScript(url, callback){
	if (atHome){
		$.ajax({
			async: false,
			dataType : 'json',
			url: 'script.php',
			data: 'url='+ url,
			success: function(data){callback(data);},
			error: function(jqXHR, textStatus, errorThrown) {
				alert(jqXHR, textStatus, errorThrown);
			}
		});
	} 
	else{
		$.ajax({
			async: false,
			dataType : 'json',
			url: url,
			success: callback
		});
	}
}

function callSubmit_(serv, path, submitData, callback){
	if (!atHome)
		return;
	$.ajax({  
		async: false,
		url: 'submit.php',
		type: 'POST',
		data: 'serv='+ serv + '&' + 'path=' + path + '&' + submitData,  
		success: function(data){
			callback(data);
		},
		error: function(data){
			alert(data);
		}
	});  
}

function callSubmit(url, submitData, path, serv, sep, l, callback){
	if (atHome)
		return;
	$.ajax({  
		async: false,
		url: url,
		type: 'POST',
		contentType: 'multipart/form-data',
		data: submitData,
		beforeSend: function(xhr){
			xhr.setRequestHeader('Host', serv);
			xhr.setRequestHeader('Connection', 'keep-alive');
			xhr.setRequestHeader('Referer', url);
			return true;
		},  
		success: callback,
		error: function(r, err1, err2){
			alert('Ошибка подключения к серверу');
		}  
	}); 
}

function getTest(data, l){
	var newProblem = $.extend(true, problems[l], {
		cmdIndex: 0, 
		divIndex: 0, 
		step: 0, 
		divName: '',
		speed: 300, 
		life: data.startLife,
		points: data.startPoints,
		paused: false, 
		stopped: false, 
		playing: false, 
		cmdListEnded: false, 
		cmdList: new Block([]), 
		mapFromTest:  data.map.slice(), 
		map: [], 
		maxBoxId: 0, 
		maxMonsterId: 0, 
		maxPrizeId: 0, 
		maxCellId: 0, 
		monsters: [],
		numOfPrizes: 0, 
		curNumOfPrizes: 0, 
		visited: false, 
		dx: 0,
		dy: 0
	});
	if (newProblem.maxCmdNum)
		newProblem.maxStep = 0;
	setLabyrinth(data.specSymbols, newProblem);
	setMonsters(data.movingElements, newProblem);
	setKeysAndLocks(data.keys, data.locks, newProblem);
}

function setLabyrinth(specSymbols, problem){
	var obj = undefined;
	for (var i = 0; i < problem.mapFromTest.length; ++i){
		problem.map[i] = [];
		for (var j = 0; j < problem.mapFromTest[i].length; ++j){
			problem.map[i][j] = [];
			var c = new Coord(j, i);
			problem.map[i][j] = new FieldElem(problem.tabIndex, c,problem.mapFromTest[i][j] == "#")
			if (problem.mapFromTest[i][j] == "R" || problem.mapFromTest[i][j] == "U" || 
				problem.mapFromTest[i][j] == "D" ||problem.mapFromTest[i][j] == "L" ){
				obj = problem.arrow = new Arrow(problem.tabIndex, c, dirs[problem.mapFromTest[i][j]]);
			}
			for (var k = 0; k < specSymbols.length; ++k)
				if (specSymbols[k].symbol == problem.mapFromTest[i][j]){
					obj = specSymbols[k].action == "eat" ? 
						new Prize(problem.tabIndex, c, specSymbols[k]) : 
						new Box(problem.tabIndex, c,specSymbols[k]) ;
					if (obj.__self == Prize)
						++problem.numOfPrizes;
					break;
				}
			if (obj)
				problem.map[i][j].pushCell(obj);
			obj = undefined;
		}
	}
}

function setMonsters(monsters, problem){
	var obj = undefined;
	for (var k = 0; k < monsters.length; ++k){
		var c = new Coord(monsters[k].path[0].x, monsters[k].path[0].y);
		obj = new Monster(problem.tabIndex, c, monsters[k]);
		problem.map[c.y][c.x].pushCell(obj);
		problem.monsters.push({'x': c.x, 'y': c.y});
	}
}

function setKeysAndLocks(keys, locks, problem){
	var obj = undefined;
	for (var k = 0; k < keys.length; ++k){
		var c = new Coord(keys[k].x, keys[k].y);
		obj = new Key(problem.tabIndex, c, locks[k]);
		problem.map[c.y][c.x].pushCell(obj);
		for (var j = 0; j < locks[k].length; ++j){
			var c1 = new Coord(locks[k][j].x, locks[k][j].y);
			obj = new Lock(problem.tabIndex, c1);
			problem.map[c1.y][c1.x].pushCell(obj);
		}
	}
}

function commandsToJSON(){
	var list = $('#sortable' + curProblem.tabIndex).children();
	var arr = new Array();
	while (list.length){
		var dir;
		var obj = new Object();
		for (var i = 0; i < classes.length; ++i)
			if (list.first().hasClass(classes[i]) || list.first().hasClass(classes[i] + 1)){
				obj.dir = classes[i];
				break;
			}
		obj.cnt = $('#spin' + list.first().prop('numId')).prop('value');
		arr.push(obj);
		list = list.next();
	}
	return $.toJSON(arr);
}

function changeCmdHighlight(elem){
	if (!elem)
		return false;
	elem = $('#' + elem);
	var divs = curProblem.commands;
	for (var k = 0; k < divs.length; ++k){
		if (elem.hasClass(divs[k])){
			elem.removeClass(divs[k]);
			elem.addClass(divs[k] + 1);
		}   
		else if (elem.hasClass(divs[k] + 1)){
			elem.removeClass(divs[k] + 1);
			elem.addClass(divs[k]);
		}
	}
}

function isCmdHighlighted(elem){
	if (!elem)
		return false;
	elem = $('#' + elem);
	var divs = curProblem.commands;
	for (var k = 0; k < divs.length; ++k)
		if (elem.hasClass(divs[k] + 1))
			return true;
	return false;
}

function cmdHighlightOff(){
	if (curProblem.cmdList)
		curProblem.cmdList.highlightOff();
}

function setCounters(j, dontReload){
	var el = $('#sortable' + curProblem.tabIndex).children();
	while(j){
		el = el.next();
		j--;
	}
	while (el.length > 0){
		var numId = el.prop('numId');
		var val =  $('#spin' + numId).prop('value');
		var newVal = dontReload ? $('#spinCnt' + numId).prop('cnt') : val;
		$('#spinCnt' + numId).prop('cnt', newVal);
		$('#spinCnt' + numId).prop('value', newVal + '/' + val);
		el = el.next();
	}
}

function divI(){ return curProblem.divIndex; }

function divN(){ return curProblem.divName;}

function cmd(){ return curProblem.cmdIndex;}

function step(){ return curProblem.step; }

function list() {return curProblem.cmdList; }

function getCurProblemBlock()
{
	var block = curProblem.cmdList;
	while(block.commands[curProblem.cmdList.curCmd].name == 'block')
		block = block.commands[curProblem.cmdList.curCmd];
	return block;
}

function getCurProblemCommand()
{
	var block =  getCurProblemBlock();
	return block.commands[block.curCmd];
}

function receiveFinished(){
	receiveStarted = false;
}

function convert(commands, parent)
{
	var block = new Block([], parent);
	for (var i = 0; i < commands.length; ++i)
	{
		var type = commands[i].attr['rel'];
		var id = commands[i].attr['id'];
		if (type == 'block' && commands[i].children)
		{
			block.pushCommand(convert(commands[i].children, block));
		}
		else if (type == 'if' || type == 'ifelse' || type == 'while')
		{
			var test = testFunctions[$('#' + id + ' option:selected').val()];
			var block1 = commands[i].children ? (convert(commands[i].children, block)) : new Block([], block);
			var block2 = undefined;
			if (type == 'ifelse' && commands[++i].children)
				block2 = convert(commands[i].children, block);
			block.pushCommand(type == 'while' ? 
				new WhileStmt(test, block1, block, id) : 
				new IfStmt(test, block1, block2, block, id));
		}
		else if (type == 'for')
		{
			var cnt = parseInt($('#' + id + ' .cnt .cnt').val());
			var block1 =  commands[i].children ? (convert(commands[i].children, block)) : new Block([], block);
			block.pushCommand(new ForStmt(block1, cnt, block,  id));
		}
		else
		{
			var cmd = new Command(type, parseInt($('#' + id + ' input').val()),
				block, id);
			block.pushCommand(cmd);
		}
	}
	return block;
}

function updated(){
	var newCmdList = convert($("#jstree-container" + curProblem.tabIndex).jstree('get_json', -1), undefined);
	var needHideCounters = curProblem.cmdList && curProblem.cmdList.started();
	if (curProblem.cmdList && !curProblem.cmdList.eq(newCmdList) || !curProblem.cmdList)
	{
		curProblem.cmdList = newCmdList;
		setDefault();
		showCounters();
	}
	else
	{
		curProblem.cmdList = curProblem.cmdList.copyDiff(newCmdList, true);
		if (needHideCounters)
		{
			curProblem.playing = true;
			hideCounters();
		}
		if (curProblem.cmdList.isFinished())
			curProblem.cmdList.makeUnfinished();

		
	}
}

function highlightOn(problem){
	for (var i = 0; i < problem.map.length; ++i)
		problem.map[i][problem.arrow.coord.x].highlightOn();
	for (var i = 0; i < problem.map[0].length; ++i)
		problem.map[problem.arrow.coord.y][i].highlightOn();
}

function highlightOff(problem){
	for (var i = 0; i < problem.map.length; ++i)
		problem.map[i][problem.arrow.coord.x].highlightOff();
	for (var i = 0; i < problem.map[0].length; ++i)
		problem.map[problem.arrow.coord.y][i].highlightOff();
}

function drawLabirint(){
	for (var i = 0; i < curProblem.map.length; ++i)
		for (var j = 0; j < curProblem.map[i].length; ++j)
			curProblem.map[i][j].draw();
}

function setDefault(f){
	for (var i = 0; i < btns.length; ++i)
		$('#btn_' + btns[i] + curProblem.tabIndex).button('enable');	
	$('#sortable' + curProblem.tabIndex).sortable('enable');
	for (var i = 0; i < curProblem.map.length; ++i)
		for (var j = 0; j < curProblem.map[i].length; ++j)
			curProblem.map[i][j].setDefault();
	for (var i = 0; i < curProblem.map.length; ++i)
		for (var j = 0; j < curProblem.map[i].length; ++j){
			var arr = curProblem.map[i][j].changedCells();
			for (var k = 0; k < arr.length; ++k){
				curProblem.map[arr[k].coord.y][arr[k].coord.x].pushCell(arr[k]);
				switch(arr[k].__self){
					case Arrow: 
						curProblem.arrow = arr[k];
						break;
					case Monster:
						curProblem.monsters[arr[k].id] = arr[k];
						curProblem.monsters[arr[k].id].x = arr[k].coord.x;
						curProblem.monsters[arr[k].id].y = arr[k].coord.y;
						break;
				}
			}
		}
	highlightOn(curProblem);
	with (curProblem){
		arrow.setDefault();
		paused = false;
		stopped = false;
		points = 0;
		cmdListEnded = false;
		curNumOfPrizes = 0;
		cmdIndex = 0;
		divIndex = 0;
		step = 0;
		divName = cmdList.length ? cmdList[0].name : "";
		nextOrPrev = false;
		prevCmd = undefined;
		lastExecutedCmd = undefined;
	}
	hideFocus();
	cmdHighlightOff();
	if (!f){
		drawLabirint();
		changeProgressBar();
	}
	//$("#cons" + curProblem.tabIndex).empty();
	curProblem.cmdList.setDefault();
	enableButtons();
}

function prevDivName(){
	if (curProblem.divIndex < 1)
		return false;
	return curProblem.cmdList[curProblem.divIndex - 1].name;
}

function loop(cnt, i){
	curProblem.cmdList.exec(1);
	++curProblem.step;
	if (curProblem.cmdList.isFinished())
	{
		curProblem.playing = false;
		enableButtons();
		return;
	}
	nextStep(cnt - 1, ++i);	
}

function changeProgressBar(){
	if (curProblem.maxCmdNum && isCommandMode()){ 
		$('#curStep' + curProblem.tabIndex).text(curProblem.divIndex);
		$('#progressBar'  + curProblem.tabIndex).progressbar('option', 'value',  curProblem.divIndex / curProblem.maxCmdNum * 100);
	} 
	else if (curProblem.maxStep){
		$('#curStep' + curProblem.tabIndex).text(curProblem.step);
		$('#progressBar'  + curProblem.tabIndex).progressbar('option', 'value',  curProblem.step  / curProblem.maxStep * 100);
	}
}

function heroIsDead(){
	for (var i = 0; i < btns.length; ++i)
		$('#btn_' + btns[i] + curProblem.tabIndex).button('disable');
	$('#btn_stop' + curProblem.tabIndex).button('enable');
	$('#sortable' + curProblem.tabIndex).sortable('enable');
	if (!curProblem.speed)
		notSpeed();
	curProblem.playing = false;
	hideFocus();
}

function nextCmd(){
		++curProblem.step;
	if (curProblem.speed)
		changeProgressBar();
	return true;
}

function hideFocus(){
	for (var k = 0; k < btns.length; ++k)
		$('#btn_' + btns[k] + curProblem.tabIndex).removeClass('ui-state-focus').removeClass('ui-state-hover'); 
}

function notSpeed(){
	curProblem.speed = 300;
	setCounters(0, true);
	var lastCmd = (divI() >= list().length) ? 
		$('#sortable' + curProblem.tabIndex + ' > li:last').prop('id') : divN();
	if (!isCmdHighlighted(lastCmd))
		changeCmdHighlight(lastCmd);
	drawLabirint();
	changeProgressBar();
}

function nextStep(cnt, i){
	if (curProblem.arrow.dead || curProblem.stopped){
		if (curProblem.arrow.dead)
			heroIsDead();
		if (curProblem.stopped)
		{
			setDefault();
			cmdHighlightOff();
			showCounters();
			setCounters();
			return;
		}
		curProblem.playing = false;
		nextCmd();
		hideFocus();
		enableButtons();
		return;
	}
	if (cnt && !curProblem.paused)
		setTimeout(function() { loop(cnt, i); }, curProblem.speed);
	else
	{
		drawLabirint();
		changeProgressBar();
		enableButtons();
	}
}

function highlightLast()
{
	if (curProblem.lastExecutedCmd && !isCmdHighlighted(curProblem.lastExecutedCmd.id))
	{
		curProblem.lastExecutedCmd.highlightOn()
	}
}

function play(cnt){
	if (!curProblem.playing || curProblem.arrow.dead)
	{
		setCounters();
		hideCounters();
		setDefault();
		curProblem.playing = true;
	}
	if (!curProblem.speed)
	{
		curProblem.step += cnt - curProblem.cmdList.exec(cnt);
		changeProgressBar();
		drawLabirint();
		enableButtons();
		if (curProblem.cmdList.isFinished())
			curProblem.playing = false;
		curProblem.cmdList.highlightOff();//inefficiency!!!!!!!!
		highlightLast();
	}
	else
		nextStep(cnt);
}

function getCurProblem()
{
	return $('#tabs').tabs('option', 'selected') - 1;
}

function isCommandMode()
{
	var p = getCurProblem();
	return $("input[name='group" + p + "']" + ":checked").prop('id') == 'commandsMode' + p;
}

function oneStep(dir, cnt)
{
	for (var i = 0; i < cnt; ++i)
{
	var x = curProblem.arrow.coord.x;
	var y = curProblem.arrow.coord.y;
	curProblem.dx = changeDir[dir][curProblem.arrow.dir].dx;
	curProblem.dy = changeDir[dir][curProblem.arrow.dir].dy;
	changeLabyrinth(step(), undefined, changeDir[dir][curProblem.arrow.dir].curDir, !curProblem.speed);
	if (curProblem.speed)
	{
		changeProgressBar();
	}
}
}

function forward(cnt)
{
	oneStep('forward', cnt != undefined ? cnt : 1);
}

function left(cnt)
{
	oneStep('left', cnt != undefined ? cnt : 1);
}

function right(cnt)
{
	oneStep('right', cnt != undefined ? cnt : 1);
}

function wait(cnt)
{
	oneStep('wait', cnt != undefined ? cnt : 1);
}

function convertCommandsToCode()
{
	return curProblem.cmdList.convertToCode(-1);
}

function convertTreeToCommands(commands, parent)
{
	var block = new Block([], parent);
	for (var i = 0; i < commands.length; ++i)
	{
		switch(commands[i]._astname)
		{
			case 'Expr':
				if (commands[i].value._astname != 'Call' || 
					commands[i].value.func._astname != 'Name')
					return undefined;
				switch(commands[i].value.func.id.v)
				{
					case 'left':
					case 'right':
					case 'forward':
					case 'wait':
						if (commands[i].value.args.length != 1 || 
							commands[i].value.args[0]._astname != 'Num')
							return undefined;
						block.pushCommand(new Command(commands[i].value.func.id.v, commands[i].value.args[0].n, block));
						break;
					default:
						return undefined;
				}
				break;
			case 'For':
				//__constructor : function(body, cnt, parent, id)
				if (!commands[i].iter || commands[i].iter._astname != 'Call' ||  
					commands[i].iter.func._astname != 'Name' || commands[i].iter.func.id.v != 'range' ||
					commands[i].iter.args.length != 1 || commands[i].iter.args[0]._astname != 'Num') //
					return undefined;
				var cnt = commands[i].iter.args[0].n;
				var forStmt = new ForStmt(undefined, cnt, block);
				var body = convertTreeToCommands(commands[i].body, forStmt);
				if (!body)
					return undefined;
				forStmt.body = body;
				block.pushCommand(forStmt);
				break;
			case 'If':
				//__constructor : function(testName, firstBlock, secondBlock, parent, id) 
				if (!commands[i].test || commands[i].test._astname != 'Call' ||  
					commands[i].test.func._astname != 'Name') //
					return undefined;
				var testName = '';
				switch(commands[i].test.func.id.v)
				{
					case 'test1':
					case 'test2':
						testName = commands[i].test.func.id.v;
						break;
					default:
						return undefined;
				}
				var ifStmt = new IfStmt(testName, undefined, undefined, block);			
				var body1 = convertTreeToCommands(commands[i].body, ifStmt);
				var body2;
				if (commands[i].orelse.length)
					body2 = convertTreeToCommands(commands[i].orelse, ifStmt);
				ifStmt.blocks[0] = body1;
				ifStmt.blocks[1] = body2;
				block.pushCommand(ifStmt);
				break;
			case 'While':
				//__constructor : function(testName, body, parent, id)
				if (!commands[i].test || commands[i].test._astname != 'Call' ||  
					commands[i].test.func._astname != 'Name') //
					return undefined;
				var testName = '';
				switch(commands[i].test.func.id.v)
				{
					case 'test1':
					case 'test2':
						testName = commands[i].test.func.id.v;
						break;
					default:
						return undefined;
				}
				var whileStmt = new WhileStmt(testName, undefined, block)
				var body = convertTreeToCommands(commands[i].body, ifStmt);
				if (!body)
					return undefined;
				whileStmt.body = body;
				block.pushCommand(whileStmt);
				break;
			default: 
				return undefined;
		}
	}
	return block;
}

