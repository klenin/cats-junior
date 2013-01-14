var Command = $.inherit({
	__constructor : function(name, cnt, parent, id, problem) {
        this.name = name;
		this.cnt = cnt;
		this.curCnt = 0;
		this.parent = parent;
		this.id = id;
		this.problem = problem;
	},
	eq: function(cmd, compareCnt){
		return (cmd.getClass() == 'command' && cmd.id == this.id && (compareCnt ? cmd.cnt >= this.curCnt : cmd.cnt == this.cnt));
	},
	exec: function(cnt, arguments) {
		var t = Math.min(cnt, Math.abs(this.curCnt - this.cnt));
		var i;
		for (i = 0; i < t && !(this.problem.stopped || this.problem.paused || this.problem.executor.isDead()); ++i)
		{
			this.problem.oneStep(this.name, 1);
			//eval(this.name + '();');
			if ($.inArray(this.id, this.problem.usedCommands) == -1){
				++this.problem.divIndex;
				this.problem.usedCommands.push(this.id);
				if (this.problem.commandsFine){
					this.problem.points -= this.problem.commandsFine;
					var mes = new MessageCommandFine(this.problem.step, this.problem.points);
				}
			}
			this.problem.checkLimit();
			++this.curCnt;
		}
		if (this.problem.speed || this.cnt == this.curCnt)
		{
			var numId = $('#' + this.id).prop('numId');
			$('#spinCnt' + numId).prop('value', (this.cnt - this.curCnt) + '/' + this.cnt);
		}
		this.problem.lastExecutedCmd = this;
		return cnt - i;
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
			this.id = cmd.id;
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
	generateCommand: function(tree, node){
		var self = this;
		tree.create(node, isBlock(tree._get_type(node)) ? "last" : "after", 
			{'data': cmdClassToName[self.name]}, function(newNode){
				onCreateItem(tree, newNode, $('#' + self.name + '0').attr('rel'), self.problem);
				var numId = $(newNode).prop('numId');
				self.id = numId;
				$('#' + self.name + numId + ' > span > input').prop('value', self.cnt);
			}, true); 
	},
	updateFunctonName: function(oldName, newName) {
		return;
	},
	removeFunctionCall: function(funcId) {
		return;
	},
	highlightWrongNames: function() {
		return;
	},
	getFunction: function() { 
		return this.parent ? this.parent.getFunction() : undefined;
	},
	updateArguments: function(funcId, arguments) {
		return;
	},
	funcCallUpdated: function() {
		return;
	}
});

var ForStmt = $.inherit({
	__constructor : function(body, cnt, parent, id, problem) {
		this.executing = false;//
		this.isStarted = false; //should be changed to one or two properties.
		this.body = body;
		this.cnt = cnt;
		this.parent = parent;	
		this.id = id;
		this.curCnt = 0;
		this.problem = problem;
	},
	isFinished: function(){
		return this.curCnt > this.cnt;
	},
	eq: function(block){
		return block.getClass() == 'for' && this.body.eq(block.body);
	},
	exec: function(cnt, arguments)
	{
		while (cnt && !this.isFinished() && !(this.problem.stopped || this.problem.paused || this.problem.arrow.dead))
		{
			this.isStarted = true;
			if (!this.executing)
			{
				cnt -= 1;
				var numId = $('#' + this.id).prop('numId');
				$('#spinCnt' + numId).prop('value', (this.cnt - this.curCnt) + '/' + this.cnt);
				if (!cnt || this.problem.speed)
				{
					if (this.problem.speed)
					{
						if (this.problem.prevCmd)
							this.problem.prevCmd.highlightOff();
						this.problem.prevCmd = this;
					}
					$('#' + this.id + '>span').css('background-color', '#1CB2B3');
				}
				this.problem.lastExecutedCmd = this;
				if (this.curCnt + 1 > this.cnt)
				{
					++this.curCnt;
					return cnt;
				}
				this.executing = true;
				this.body.setDefault();
			}
			cnt = this.body.exec(cnt);
			if (this.body.isFinished())
			{
				this.executing = false;
				++this.curCnt;
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
		this.id = block.id;
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
		$('#' + this.id + '> span').css('background-color', '');
		$('#' + this.id + '> a').css('background-color', '');
		this.body.highlightOff();
	},
	highlightOn: function(){
		$('#' + this.id + '> span').css('background-color', '#1CB2B3');
		$('#' + this.id + '> a').css('background-color', '#1CB2B3');
	},
	convertToCode: function(tabsNum) {
		var curCnt = this.problem.curCounter;
		var str = generateTabs(tabsNum) + 'for ' + this.problem.counters[curCnt]['name'] + 
			(this.problem.counters[curCnt]['cnt'] ? this.problem.counters[curCnt]['cnt'] : '') + ' in range(' + this.cnt + '):\n';
		++this.problem.counters[curCnt]['cnt'];
		this.problem.curCounter = (this.problem.curCounter + 1) % 3;
		str += this.body.convertToCode(tabsNum + 1);
		--this.problem.counters[curCnt]['cnt'];
		this.problem.curCounter = curCnt;
		return str;
	},
	generateCommand: function(tree, node){
		var self = this;
		tree.create(node, isBlock(tree._get_type(node)) ? "last" : "after", 
			{'data': cmdClassToName[self.getClass()]}, function(newNode){
				onCreateItem(tree, newNode, $('#for0').attr('rel'), self.problem);
				var numId = $(newNode).prop('numId');
				self.id = numId;
				$('#for' + numId + ' > span > input').prop('value', self.cnt);
				self.body.generateCommand(tree, $(newNode));
			}, true); 
	},
	updateFunctonName: function(oldName, newName) {
		this.body.updateFunctonName(oldName, newName);
	},
	removeFunctionCall: function(funcId) {
		this.body.removeFunctionCall(funcId);
	},
	highlightWrongNames: function() {
		return;
	},
	getFunction: function() { 
		return this.parent ? this.parent.getFunction() : undefined;
	},
	updateArguments: function(funcId, arguments) {
		this.body.updateArguments(funcId, arguments);
	},
	funcCallUpdated: function() {
		this.body.funcCallUpdated();
	}
});

var CondStmt = $.inherit({
	__constructor : function(testName, args, parent, id, problem) {
		this.args = args.clone();
		this.testName = testName;
		this.parent = parent;	
		this.id = id;
		this.problem = problem;
		this.generateArguments();
	},
	eq: function(block){
		return block.getClass() == this.getClass() && this.testName == block.testName && this.args.compare(block.args);
	},
	copyDiff: function(block, compareCnt){
		//this.test = block.test; //?
		this.testName = block.testName;
		this.args = block.args.clone();
		this.id = block.id;
		this.generateArguments();
	},
	highlightOff: function(){
		$('#' + this.id + '>select').css('background-color', '');
		$('#' + this.id + '>a').css('background-color', '');
		//$('#' + this.id + '>ins').css('background-color', '#eeeeee');
	},
	highlightOn: function(){
		$('#' + this.id + '>select').css('background-color', '#1CB2B3');
		$('#' + this.id + '>a').css('background-color', '#1CB2B3');
		//$('#' + this.id + '>ins').css('background-color', '#1CB2B3');
	},
	convertToCode: function(tabsNum) {
		//var str = generateTabs(tabsNum) + 'if ';
		str = '';
		switch(this.testName){
			case 'objectPosition':
				if (this.args[2])
					str += 'not ';
				var funcDef = this.getFunction();
				var funcArguments = funcDef ? funcDef.getArguments() : [];
				var object = selectObjects[this.args[0]];
				if (object === undefined) { 
					if (!funcDef || this.args[0] - selectObjects.length < 0 || this.args[0] - selectObjects.length > funcArguments.length) {
						throw 'Invalid argument ' + this.args[0];
					}
					object = funcArguments[this.args[0] - selectObjects.length];
				}
				else {
					object = object[0];
				}
				var direction = selectDirections[this.args[1]];
				if (direction=== undefined){
					if (!funcDef || this.args[1] - selectDirections.length < 0 || this.args[1] - selectDirections.length > funcArguments.length) {
						throw 'Invalid argument ' + this.args[1];
					}
					direction = funcArguments[this.args[1] - selectDirections.length];
				}
				else {
					direction = direction[0];
				}
				str += 'objectPosition("' + object + '", "' + direction + '"):\n';
				break;
			default:
				str += 'False';
		}
		return str;
	},
	generateSelect: function(newNode){
		var numId = $(newNode).prop('numId');
		switch (this.testName){
			case 'objectPosition':
				$('#selectObjects' + numId).val(this.args[0]);
				$('#selectConditions' + numId).val(this.args[2]);
				$('#selectDirections' + numId).val(this.args[1]);
				break;
		}
	},
	updateFunctonName: function(oldName, newName) {
		this.body.updateFunctonName(oldName, newName);
	},
	removeFunctionCall: function(funcId) {
		this.body.removeFunctionCall(funcId);
	},
	highlightWrongNames: function() {
		return;
	},
	constructTestFunc: function(args) {
		switch(this.testName){
			case 'objectPosition':
				this.test = function(){
					return objectPosition(selectObjects[args[0]][0], 
						selectConditions[args[2]][0], 
						selectDirections[args[1]][0])};
				break;
			default:
				this.test = function(){return false};
		}
	},
	convertArguments: function(arguments) {
		var selects = [selectObjects, selectDirections, selectConditions];
		var funcDef = this.getFunction();
		var funcArguments = funcDef ? funcDef.getArguments() : [];

		var args = [];

		for (var i = 0; i < selects.length; ++i) {
			if (selects[i][this.args[i]] === undefined) {
				var j = 0;
				for (j = 0; j < selects[i].length; ++j) {
					var arg = this.args[i];
					if (selects[i][j][1] === arguments[funcArguments[this.args[i] - selects[i].length]]) {
						args.push(j);
						break;
					}
				}
				if (j == selects[i].length) {
					throw 'Invalid argument ' + this.args[i] + '!!!';
				}
			}
			else {
				args.push(this.args[i]);
			}
		}

		return args;
	},
	checkArguments: function() {
		if (this.args[2] != 0 && this.args[2] != 1)
			throw 'Invalid argument ' + this.args[2];
	},
	getFunction: function() { 
		return this.parent ? this.parent.getFunction() : undefined;
	},
	generateArguments: function() {
		var funcDef = this.getFunction();
		if (funcDef) {
			var arguments = funcDef.getArguments();
			for (var i = 0; i < $('#' + this.id).children('select').length; ++i) {
				var index = $('#' + this.id).children('select:eq(' + i + ')').children('option').length;
				for (var j = 0; j < arguments.length; ++j) {
					var k = 0;
					for (k = 0; k < $('#' + this.id).children('select:eq(' + i + ')').children('option').length; ++k) {
						if ($('#' + this.id).children('select:eq(' + i + ')').children('option:eq(' + k +')').html() == arguments[j]) {
							break;
						}
					}
					if (k == $('#' + this.id).children('select:eq(' + i + ')').children('option').length) {
						$('#' + this.id).children('select:eq(' + i + ')').append(
							'<option value="' + (index + j) + '">' + arguments[j] + '</option><br>');
					}
				}
			}
		}
	},
	updateArguments: function(funcId, arguments) {
		this.body.updateArguments(funcId, arguments);
	},
	funcCallUpdated: function() {
		this.body.funcCallUpdated();
	}
});

var IfStmt = $.inherit(CondStmt, {
	__constructor : function(testName, args, firstBlock, secondBlock, parent, id, problem) {
		this.__base(testName, args, parent, id, problem);
        this.curBlock = undefined;
		this.blocks = [firstBlock, secondBlock];
	},
	isFinished: function(){
		return this.curBlock != undefined && (!this.blocks[this.curBlock] || this.blocks[this.curBlock].isFinished());
	},
	eq: function(block){
	
		return this.__base(block) &&
			((this.curBlock == undefined && block.curBlock == undefined) ||
			(this.curBlock != undefined && block.curBlock != undefined && 
			this.blocks[this.curBlock].eq(block.blocks[this.curBlock])));
	},
	exec: function(cnt, arguments)
	{
		if (this.curBlock == undefined && cnt)
		{		
			this.constructTestFunc(this.convertArguments(arguments));
			this.curBlock = this.test() ? 0 : 1;
			cnt -= 1;
			if (!cnt || this.problem.speed)
			{
				if (this.problem.speed)
				{
					if (this.problem.prevCmd)
						this.problem.prevCmd.highlightOff();
					this.problem.prevCmd = this;
				}
				this.highlightOn();
			}
			this.problem.lastExecutedCmd = this;
			if (!this.blocks[this.curBlock])
				return cnt;
		}
		return this.blocks[this.curBlock].exec(cnt, arguments);
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
		if (block.getClass() != this.getClass())
		{
			return block;
		}
		this.__base(block, compareCnt);
		this.blocks[0] = this.blocks[0].copyDiff(block.blocks[0], compareCnt);
		if (!this.blocks[1] || !block.blocks[1])
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
		this.__base();
		this.blocks[0].highlightOff();
		if (this.blocks[1])
			this.blocks[1].highlightOff();
	},
	convertToCode: function(tabsNum) {
		var str = generateTabs(tabsNum) + 'if ';
		str += this.__base(tabsNum);		 
		str += this.blocks[0].convertToCode(tabsNum + 1);
		if (this.blocks[1])
		{
			str += generateTabs(tabsNum) + 'else:\n';
			str += this.blocks[1].convertToCode(tabsNum + 1);
		}
		return str;
	},
	generateCommand: function(tree, node){
		var self = this;
		tree.create(node, isBlock(tree._get_type(node)) ? "last" : "after", 
			{'data': cmdClassToName[self.getClass()]}, function(newNode){
				onCreateItem(tree, newNode, self.blocks[1] ? $('#ifelse0').attr('rel') : $('#if0').attr('rel'), self.problem);
				var numId = $(newNode).prop('numId');
				self.id = numId;
				self.generateSelect(newNode);
				self.blocks[0].generateCommand(tree, $(newNode));
				if (self.blocks[1])
				{
					var next = getNextNode(tree, $(newNode));
					if (next)
					{
						self.blocks[1].generateCommand(tree, next);
					}
				}
			}, true); 
	},
	getFunction: function() { 
		return this.parent ? this.parent.getFunction() : undefined;
	},
	updateArguments: function(funcId, arguments) {
		this.body.updateArguments(funcId, arguments);
	},
	funcCallUpdated: function() {
		this.body.funcCallUpdated();
	}
});

var WhileStmt = $.inherit(CondStmt, {
	__constructor : function(testName, args, body, parent, id, problem) {
        this.finished = false;//
		this.executing = false;//
		this.isStarted = false; //should be changed to one or two properties.
		this.args = args.clone();
		this.testName = testName;
		this.body = body;
		this.parent = parent;	
		this.id = id;
		this.problem = problem;
	},
	isFinished: function(){
		return this.finished;
	},
	eq: function(block){
		return this.__base(block) && this.body.eq(block.body);
	},
	exec: function(cnt, arguments)
	{
		while (cnt && !this.finished && !(this.problem.stopped || this.problem.paused || this.problem.arrow.dead))
		{
			this.isStarted = true;
			if (!this.executing)
			{
				this.constructTestFunc(this.convertArguments(arguments));
				cnt -= 1;
				if (!cnt || this.problem.speed)
				{
					if (this.problem.speed)
					{
						if (this.problem.prevCmd)
							this.problem.prevCmd.highlightOff();
						this.problem.prevCmd = this;
					}
					this.highlightOn();
				}
				this.problem.lastExecutedCmd = this;
				if (!this.test())
				{
					this.finished = true;
					return cnt;
				}
				this.executing = true;
				this.body.setDefault();
			}
			cnt = this.body.exec(cnt, arguments);
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
		if (block.getClass() != this.getClass())
		{
			return block;
		}
		this.__base(block, compareCnt);
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
		this.__base();
		this.body.highlightOff();
	},
	convertToCode: function(tabsNum) {
		var str = generateTabs(tabsNum) + 'while ';
		str += this.__base(tabsNum);		 
		return str + this.body.convertToCode(tabsNum + 1);
	},
	generateCommand: function(tree, node){
		var self = this;
		tree.create(node, isBlock(tree._get_type(node)) ? "last" : "after", 
			{'data': cmdClassToName[self.getClass()]}, function(newNode){
				onCreateItem(tree, newNode, $('#while0').attr('rel'), self.problem);
				var numId = $(newNode).prop('numId');
				self.id = numId;
				self.generateSelect(newNode);
				self.body.generateCommand(tree, $(newNode));
			}, true); 
	},
	getFunction: function() { 
		return this.parent ? this.parent.getFunction() : undefined;
	},
	updateArguments: function(funcId, arguments) {
		this.body.updateArguments(funcId, arguments);
	},
	funcCallUpdated: function() {
		this.body.funcCallUpdated();
	}
});


var Block = $.inherit({
	__constructor : function(commands, parent, problem) {
        this.curCmd = 0;
		this.commands = commands;
		this.parent = parent;
		this.problem = problem;
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
	exec: function(cnt, arguments)
	{
		var cmd = undefined;
		while(cnt && this.commands.length > this.curCmd && !(this.problem.stopped || this.problem.paused || this.problem.executor.isDead()))
		{
			cmd = this.commands[this.curCmd];
			cnt = cmd.exec(cnt, arguments);
			if (cmd.isFinished())
				++this.curCmd;
		}
		if (cmd && cmd.getClass() == 'command' && (this.problem.speed || !cnt)) 
		{
			if (this.problem.speed)
			{
				if (this.problem.prevCmd && this.problem.prevCmd.id != cmd.id)
					this.problem.prevCmd.highlightOff()
				this.problem.prevCmd = cmd;
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
		var i = 0;
		for (; i < this.commands.length; ++i)
		{
			this.commands[i].showCounters(); 
		}
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
		for (var i = 0; i < this.commands.length; ++i){
			str += this.commands[i].convertToCode(tabsNum);
		}
		return str;
	},
	generateCommand: function(tree, node){
		for (var i = 0; i < this.commands.length; ++i)
		{
			this.commands[i].generateCommand(tree, node ? node : 0);
		}
	},
	updateFunctonName: function(oldName, newName){
		for (var i = 0; i < this.commands.length; ++i) {
			this.commands[i].updateFunctonName(oldName, newName);
		}
	},
	removeFunctionCall: function(funcId){
		for (var i = 0; i < this.commands.length; ++i) {
			this.commands[i].removeFunctionCall(funcId);
		}
	},
	highlightWrongNames: function() {
		for (var i = 0; i < this.commands.length; ++i) {
			this.commands[i].highlightWrongNames();
		}
	},
	getFunction: function() { 
		return this.parent ? this.parent.getFunction() : undefined;
	},
	updateArguments: function(funcId, arguments) {
		for (var i = 0; i < this.commands.length; ++i) {
			this.commands[i].updateArguments(funcId, arguments);
		}
	},
	funcCallUpdated: function() {
		for (var i = 0; i < this.commands.length; ++i) {
			this.commands[i].funcCallUpdated();
		}
	}
});

var FuncDef = $.inherit({
	__constructor : function(name, argumentsList, body, parent, id, funcId, problem) {
		this.name = name;
		this.body = body;
		this.argumentsList = argumentsList.clone();
		this.parent = parent;
		this.problem = problem;
		this.finished = false;
		this.id = id;
		if (!this.problem.functions[this.name]) {
			this.problem.functions[this.name] = [];
		}
		this.problem.functions[this.name][this.argumentsList.length] = this; //cheat!!! needs to be reworked
		this.funcId = funcId;
		this.problem.functionsWithId[this.funcId] = this;
	},
	isFinished: function(){
		return this.finished;
	},
	eq: function(func) {
		if (func.getClass() != 'functionDef')
			return false;
		return func.name == this.name && this.body.eq(func.body); //???
	},
	exec: function(cnt) {
		//return this.body.exec(cnt);
		this.finished = true;
	},
	getClass: function(){
		return 'functionDef';
	},
	setDefault: function(){
		this.finished = false;
		//this.body.setDefault();
	},
	showCounters: function() {
		this.body.showCounters();
		return;
	},
	hideCounters: function() {
		this.body.hideCounters();
		return;
	},
	started: function() {
		return this.finished;
	},
	copyDiff: function(func, compareCnt) {
		if (func.getClass() != 'functionDef'){
			return func;
		}
		this.body.copyDiff(func.body, compareCnt);
		this.argumentsList = func.argumentsList.clone();
		this.name = func.name;
		return this;
	},
	makeUnfinished: function(){
		this.body.makeUnfinished();
	},
	highlightOff: function(){
		this.body.highlightOff();
	},
	highlightOn: function(){
		return;
	},
	convertToCode: function(tabsNum) {
		str = generateTabs(tabsNum) + 'def ' + this.name + '(';
		for (var i = 0; i < this.argumentsList.length; ++i) {
			if (i != 0) {
				str += ', ';
			}
			str += this.argumentsList[i];
		}
		str += '):\n';
		if ( this.body.commands.length )
			str += this.body.convertToCode(tabsNum + 1);
		else
			str += generateTabs(tabsNum + 1) + 'pass\n';
		return str;
	},
	generateCommand: function(tree, node){
		var self = this;
		var c = cmdId;
		$('#accordion' + this.problem.tabIndex).myAccordion('push', this.name, this.argumentsList, this.funcId);
		$('#funcDef-' + c).bind('loaded.jstree', function(){		
			self.body.generateCommand(jQuery.jstree._reference('funcDef-' +  c));
			++cmdId;
		});
		createJsTreeForFunction('#funcDef-' + c, this.problem);
	},
	updateFunctonName: function (funcId, newName){
		if (this.funcId == funcId)
		{
			this.name = newName;
			this.updateJstreeObject();
			this.body.updateFunctonName(funcId, newName);
		}
	},
	updateJstreeObject: function(){
		$('#' + this.id).children('.func-header').text(this.name);
	},
	removeFunctionCall: function (funcId){
		this.body.removeFunctionCall(funcId);
	},
	highlightWrongNames: function() {
		if (!checkName(this.name)) {
			$('#' + this.id).children('span:eq(1)').addClass('wrongName');
		}
		else {
			$('#' + this.id).children('span:eq(1)').removeClass('wrongName');
		}
	},
	getArguments: function() {
		return this.argumentsList;
	},
	getFunction: function() { 
		return this;
	},
	updateArguments: function(funcId, arguments) {
		this.argumentsList = arguments.clone();
		//this.updateJstreeObject();
		this.body.updateArguments(funcId, arguments);
	},
	funcCallUpdated: function() {
		this.body.funcCallUpdated();
	}
});

var FuncCall = $.inherit({
	__constructor : function(name, argumentsValues, parent, id, funcId, problem) {
		this.name = name;
		this.parent = parent;
		this.problem = problem;
		this.executing = false;
		this.id = id;
		this.argumentsValues = argumentsValues.clone();
		this.funcId = funcId;
	},
	isFinished: function(){
		funcDef = this.getFuncDef();
		return funcDef ? funcDef.body.isFinished() : false;
	},
	getFuncDef: function() {
		return this.problem.functionsWithId[this.funcId];
	},
	operateFuncDef: function(func) {
		var funcDef = this.getFuncDef();
		if (funcDef) {
			funcDef[func]();
		}
	},
	eq: function(func) {
		return (func.getClass() == 'functionCall') && this.name == func.name;
	},
	exec: function(cnt) {
		funcDef = this.getFuncDef();
		if (!funcDef) {
			throw "Undefined function " + this.name;
		}
		if (!this.executing)
		{
			this.setArguments(funcDef.getArguments(), this.argumentsValues);
			cnt -= 1;
			var numId = $('#' + this.id).prop('numId');
			if (!cnt || this.problem.speed)
			{
				if (this.problem.speed)
				{
					if (this.problem.prevCmd)
						this.problem.prevCmd.highlightOff();
					this.problem.prevCmd = this;
				}
				$('#' + this.id + '>a').css('background-color', '#1CB2B3');
			}
			this.problem.lastExecutedCmd = this;
			if (this.curCnt + 1 > this.cnt)
			{
				++this.curCnt;
				return cnt;
			}
			this.executing = true;
			if (funcDef) {
				funcDef.body.setDefault();
			}
		}
		if (funcDef) {
			cnt = funcDef.body.exec(cnt, this.arguments);
		}
		return cnt;
	},
	getClass: function(){
		return 'functionCall';
	},
	setDefault: function(){
		$('#' + this.id + '>span').css('background-color', '#FFFFFF');
		this.executing = false;
		/*funcDef = this.getFuncDef();
		if (funcDef) {
			funcDef.body.setDefault();	
		}*/
	},
	showCounters: function() {
		/*funcDef = this.getFuncDef();
		if (funcDef) {
			funcDef.body.showCounters();	
		}	*/
	},
	hideCounters: function() {
		/*funcDef = this.getFuncDef();
		if (funcDef) {
			funcDef.body.hideCounters();
		}*/
	},
	started: function() {
		return this.executing;
	},
	copyDiff: function(func, compareCnt) {
		if (func.getClass() != 'functionCall'){
			return func;
		}
		this.name = func.name;
		this.argumentsValues = func.argumentsValues.clone();
		return this;
	},
	makeUnfinished: function(){
		funcDef = this.getFuncDef();
		if (funcDef) {
			funcDef.body.makeUnfinished();	
		}
	},
	highlightOff: function(){
		$('#' + this.id + '>a').css('background-color', '');
	},
	highlightOn: function(){
		$('#' + this.id + '>a').css('background-color', '#1CB2B3');
	},
	convertToCode: function(tabsNum) {
		var str = generateTabs(tabsNum) + this.name + '(';
		for (var i = 0; i < this.argumentsValues.length; ++i) {
			if (i != 0) {
				str += ', ';
			}
			if (checkNumber(this.argumentsValues[i]) || checkName(this.argumentsValues[i])) {
				str += this.argumentsValues[i];
			}
			else {
				str += "u'" + encodeURIComponent(this.argumentsValues[i]) + "'";
			}
		}
		str += ')\n';
		return str;
	},
	generateCommand: function(tree, node){
		var self = this;
		tree.create(node, isBlock(tree._get_type(node)) ? "last" : "after", 
			{'data': self.name}, function(newNode){
				onCreateItem(tree, newNode, 'funccall', self.problem, self.funcId);  //$('#func0')?!
				var numId = $(newNode).prop('numId');
				self.id = numId;
				for (var i = 0; i < self.argumentsValues.length; ++i) {
					$(newNode).children('input:eq(' + i + ')').val(self.argumentsValues[i]);
				}
				$(newNode).attr('funcId', this.funcId);
			}, true); 	
	},
	updateFunctonName: function(funcId, newName) {
		if (this.funcId == funcId) {
			this.name = newName;
			this.updateJstreeObject();
		}
	},
	updateJstreeObject: function(arguments){
		$('#' + this.id).children('a').html('<ins class="jstree-icon"> </ins>' + this.name);
		var inputs = $('#' + this.id).children('.argCallInput');
		arguments = arguments ? arguments : this.getFuncDef().getArguments();
		if (inputs.length > arguments.length) {
			inputs.children(':gt(' + (arguments.length - 1) + ')').remove();
		}
		else {
			for (var i = inputs.length; i < arguments.length; ++i) {
				$('#' + this.id)
					.append('<input class="argCallInput"/>')
					.bind('change', function(){
						return function(pr) {
							pr.updated();
						}(problem)
					})
			}
		}
		
	},
	removeFunctionCall: function (funcId){
		if (this.funcId == funcId) {
			$('#' + this.id).remove();
		}
	},
	highlightWrongNames: function() {
		if (!this.problem.functions[this.name] || !checkName(this.name)) {
			$('#' + this.id).children('a').addClass('wrongName');
		}
		else {
			$('#' + this.id).children('a').removeClass('wrongName');
		}
	},
	setArguments: function(argumentsList, argumentsValues) {
		var i = 0;
		this.arguments = {};
		
		for (i = 0; i < Math.min(argumentsList.length, argumentsValues.length); ++i) {
			this.arguments[argumentsList[i]] = argumentsValues[i];
		}

		if (i != argumentsList.length) {
			throw "Invalid arguments list ";
			return false;
		}

		return true;
	},
	getFunction: function() { 
		return this.parent ? this.parent.getFunction() : undefined;
	},
	updateArguments: function(funcId, arguments) {
		if (this.funcId == funcId) {
			this.updateJstreeObject(arguments);
		}
		//this.body.updateArguments(funcId, arguments);
	},
	funcCallUpdated: function() {
		//TODO:
	}
});

var Problem = $.inherit({
	__constructor : function(problem, tabIndex) {
		$.extend(true, this, problem, problem.data);
		this.cmdIndex = 0; 
		this.divIndex = 0; 
		this.divName = '';
		this.speed = 1000; 
		this.paused = false; 
		this.stopped = false; 
		this.playing = false; 
		this.cmdListEnded = false; 
		this.cmdList = new Block([], undefined, this);
		this.executedCommandsNum = 0;
		this.lastExecutedCmd = undefined;
		this.prevCmd = undefined;
		this.tabIndex = tabIndex;
		if (this.maxCmdNum)
			this.maxStep = 0;
		//this.map = jQuery.extend(true, [], this.defaultLabirint);
		this.curCounter = 0;
		this.counters = [{'name': 'i', 'cnt': 0}, {'name': 'j', 'cnt': 0}, {'name': 'k', 'cnt': 0}];
		this.playedLines = [];
		this.usedCommands = [];
		this.commandsFine = this.commandsFine ? this.commandsFine : 0;
		this.stepsFine = this.stepsFine ? this.stepsFine : 0;
		this.functions = {};
		this.functionsWithId = [];
		this.numOfFunctions = 0;
	},

	initExecutor: function(data) {
		this.executor = new ExecutorWrapper(this, data, $('#tdField' + this.tabIndex).children('div'), data.executorName ? data.executorName : 'arrowInLabyrinth');
	},

	setDefault: function(f) {
		for (var i = 0; i < btns.length; ++i)
			$('#btn_' + btns[i] + this.tabIndex).button('enable');	
		//$('#jstree-container' + this.tabIndex).sortable('enable');
		/*this.map = jQuery.extend(true, [], this.defaultLabirint);
		*/

		this.executor.setDefault(f);

		//this.arrow.setDefault();
		this.paused = false;
		this.stopped = false;
		this.playing = false;
		this.cmdListEnded = false;
		this.cmdIndex = 0;
		this.divIndex = 0;
		this.divName = this.cmdList.length ? this.cmdList[0].name : "";
		this.prevCmd = undefined;
		this.lastExecutedCmd = undefined;
		this.executedCommandsNum = 0;
		this.curCounter = 0;
		this.counters = [{'name': 'i', 'cnt': 0}, {'name': 'j', 'cnt': 0}, {'name': 'k', 'cnt': 0}]
		this.playedLines = [];
		this.usedCommands = [];
		this.hideFocus();
		this.cmdHighlightOff();
		if (!f){
			this.changeProgressBar();
		}
		$("#cons" + this.tabIndex).empty();
		this.cmdList.setDefault();

		this.enableButtons();

		var problem = this.tabIndex;
		finalcode[problem] = undefined;
		$scope[problem] = undefined,
		$gbl[problem] = undefined,
		$loc[problem] = $gbl[problem];
		nextline[problem] = undefined;
		for (var i = 0; i < codeareas[problem].lineCount(); ++i)
			codeareas[problem].setLineClass(i, null);
		this.updateWatchList();
	},
	hideFocus: function(){
		for (var k = 0; k < btns.length; ++k){
			$('#btn_' + btns[k] + this.tabIndex).removeClass('ui-state-focus').removeClass('ui-state-hover'); 
		}
	},
	cmdHighlightOff: function(){
		if (this.cmdList){
			this.cmdList.highlightOff();
		}
	},
	changeProgressBar: function(){
		if (this.maxCmdNum){ 
			$('#curStep' + this.tabIndex).text(this.divIndex);
			$('#progressBar'  + this.tabIndex).progressbar('option', 'value',  this.divIndex / this.maxCmdNum * 100);
			//if (this.divIndex == this.maxCmdNum)
			//	this.stopped = true;
		} 
		else if (this.maxStep){
			$('#curStep' + this.tabIndex).text(this.step);
			$('#progressBar'  + this.tabIndex).progressbar('option', 'value',  this.step  / this.maxStep * 100);
			//if (this.step == this.maxStep)
			//	this.stopped = true;
		}
	},
	enableButtons: function(){
		//$('#jstree-container' + this.tabIndex).sortable('enable');
		for (var i = 0; i < btnsPlay.length; ++i)
			$('#btn_' + btnsPlay[i] + this.tabIndex).removeAttr('disabled');
		$('#tabs').tabs( "option", "disabled", [] );
	},

	disableButtons: function(){
		//$('#jstree-container' + this.tabIndex).sortable('disable');
		for (var i = 0; i < btnsPlay.length; ++i)
			$('#btn_' + btnsPlay[i] + this.tabIndex).prop('disabled', true);
		var disabled = [];
		for (var i = 0; i < $('#tabs').tabs('length'); ++i){
			if (i != this.tabIndex + 1)
				disabled.push(i);
		}
		$('#tabs').tabs( "option", "disabled", disabled );
	},
	updateWatchList: function()
	{
		var problem = this.tabIndex;
		for(var p in watchList[problem])
		{
			var res = calculateValue(watchList[problem][p]);
			$('#calcVal_' + problem + '_' + p).html(res == undefined ? 'undefined' : res);
		}
	},
	tryNextStep: function(dontHiglight){
		var problem = this.tabIndex;
		if(!finalcode[problem]){
			return;
		}
		if (getCurBlock() >= 0){
			if (nextline[problem] != undefined && !dontHiglight)
				codeareas[problem].setLineClass(nextline[problem], null);
			var e = 1;
			while (getCurBlock() >= 0 && (e || $expr[problem]))
			{
				$expr[problem] = 0;
				e = getScope().blocks[getCurBlock()].expr;
				try
				{
					eval(finalcode[problem].code);
					this.updateWatchList();
				}catch(e)
				{
					console.error(e);
					$('#cons' + problem).append('\n' + e + '\n');
					return 0;

				}
			}
			++this.executedCommandsNum;
			this.executor.draw();
			if (getCurBlock() >= 0)
			{
				var b = getCurBlock();
				while(getScope().blocks[b].funcdef)
					++b;
				nextline[problem] = getScope().blocks[b].lineno;		
			}
				
			if (nextline[problem] != undefined)
			{
				if(!dontHiglight)
					codeareas[problem].setLineClass(nextline[problem], 'cm-curline');
				if (codeareas[problem].lineInfo(nextline[problem]).markerText)
				{
					this.paused = true;
					//curProblem.playing = false;
					return 1;
				}
			}
			if (getCurBlock() < 0)
			{
				if (nextline[problem] != undefined && !dontHiglight)
					codeareas[problem].setLineClass(nextline[problem], null);
				//$('#cons' + problem).append('\nfinished\n');
				this.playing = false;
				return 0;
			} 
		}
		else
		{
			if (nextline[problem] != undefined)
				codeareas[problem].setLineClass(nextline[problem], null);
			//$('#cons' + problem).append('\nfinished\n');
			this.playing = false;
			return 0;
		}
		return 1;
	},
	divI: function(){ return this.divIndex; },
	divN: function(){ return this.divName;},
	list: function() {return this.cmdList; },
	setCounters_: function(el, j, dontReload){
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
	},
	setCounters: function(j, dontReload){
		this.setCounters_($('#jstree-container' + this.tabIndex).children(), j, dontReload);
	},
	updated: function(){
		this.functions = {};
		this.functionsWithId = [];
		this.numOfFunctions = 0;
		var accordion = $('#accordion' + this.tabIndex);
		var newCmdList = new Block([], undefined, this);
		for (var i = 0; i < accordion.children('.funccall').length; ++i) {
			var div =  accordion.children('.funccall:eq(' + i + ')');
			var name = accordion.myAccordion('getFunctionName', div);
			var id = $(div).attr('id');
			var funcId = $(div).attr('funcId');
			var argumentsList = accordion.myAccordion('getArguments', div);
			var code = convert(div.children('.func-body').jstree('get_json', -1), newCmdList, this, name, id, argumentsList, funcId);
			newCmdList.pushCommand(code);
		}

		var code = convert($("#jstree-container" + this.tabIndex).jstree('get_json', -1), newCmdList, this, false);
		if (newCmdList){
			newCmdList.pushCommand(code);
		}
		else {
			newCmdList = code;
		}
		//$('#accordion' + this.tabIndex).accordion('resize');
		var needHideCounters = this.cmdList && this.cmdList.started();
		this.changed = true;
		if (this.cmdList && !this.cmdList.eq(newCmdList) || !this.cmdList) {
			this.cmdList = newCmdList;
			this.setDefault();
			this.showCounters();
		}
		else {
			this.cmdList = this.cmdList.copyDiff(newCmdList, true);
			if (!this.playing)
				this.showCounters();
			if (needHideCounters) {
				this.playing = true;
				//this.hideCounters();
			}
			if (this.cmdList.isFinished())
				this.cmdList.makeUnfinished();	
		}

		this.highlightWrongNames();
		//$('#accordion' + this.tabIndex).accordion( "resize" );
	},
	updateFunctonName: function(funcId, newName) {
		//if (!this.functions[oldName]) {
			this.cmdList.updateFunctonName(funcId, newName);
		//}
	},
	removeFunctionCall: function(funcId) {
		this.updated();
		//if (!this.functions[name]){
			this.cmdList.removeFunctionCall(funcId);	
		//}
		this.highlightWrongNames();
	},
	updateArguments: function(funcId, arguments) {
		this.cmdList.updateArguments(funcId, arguments);
	},
	highlightWrongNames: function() {
		this.cmdList.highlightWrongNames();
	},
	funcCallUpdated: function() {
		this.cmdList.funcCallUpdated();
	},
	loop: function(cnt, i) {
		try{
			if (!this.playing || this.paused)
				return;// cheat
			if ($('#codeMode' + this.tabIndex).prop('checked'))
			{
				this.tryNextStep();
			}
			else
			{
				if (!this.cmdList.exec(1))
					++this.executedCommandsNum;
				this.changeProgressBar();
				if (this.cmdList.isFinished())
				{
					this.playing = false;
					this.enableButtons();
					return;
				}
			}
			this.nextStep(cnt - 1, ++i);	
		} catch(e) {
			console.error(e);
			$('#cons' + this.tabIndex).append(e);
		}
	},
	heroIsDead: function() {
		for (var i = 0; i < btns.length; ++i)
			$('#btn_' + btns[i] + this.tabIndex).button('disable');
		$('#btn_stop' + this.tabIndex).button('enable');
		//$('#jstree-container' + this.tabIndex).sortable('enable');
		if (!this.speed)
			this.notSpeed();
		this.playing = false;
		this.hideFocus();
	},
	nextCmd: function() {
		if (this.speed)
			this.changeProgressBar();
		return true;
	},
	notSpeed: function() { //check! looks like outdated
		this.speed = 100;
		this.setCounters(0, true);
		var lastCmd = (this.divI() >= this.list().length) ? 
			$('#jstree-container' + this.tabIndex + ' > li:last').prop('id') : this.divN();
		if (!isCmdHighlighted(lastCmd))
			changeCmdHighlight(lastCmd);
		this.executor.draw();
		this.changeProgressBar();
	},
	nextStep: function(cnt, i) {
		if (this.executor.isDead() || this.stopped){
			if (this.executor.isDead()) //check it!!!
				this.heroIsDead();
			if (this.stopped)
			{
				this.setDefault();
				this.cmdHighlightOff();
				this.showCounters();
				this.setCounters();
				return;
			}
			this.playing = false;
			this.nextCmd();
			this.hideFocus();
			this.enableButtons();
			return;
		}
		if (cnt && !this.paused && this.playing)
		{
			setTimeout(function(problem) { return function() {problem.loop(cnt, i);} }(this), this.speed);
		}
		else
		{
			this.executor.draw();
			this.changeProgressBar();
			this.enableButtons();
			if (!this.playing && $('#codeMode' + this.tabIndex).prop('checked'))
				onFinishExecuting(getCurProblem());
		}
	},
	highlightLast: function() {
		if (this.lastExecutedCmd && !isCmdHighlighted(this.lastExecutedCmd.id))	{
			this.lastExecutedCmd.highlightOn()
		}
	},
	play: function(cnt) {
		try{
			if (!this.speed)
			{
				if ($('#codeMode' + this.tabIndex).prop('checked'))
				{
					for (var i = 0; i < cnt && i < maxStep && !this.paused && !this.stopped && this.tryNextStep(); ++i){};
					if (i < cnt && i == maxStep && !this.paused){
						$('#cons' + this.tabIndex).append('Превышено максимальное число шагов');
					}
				}
				else
				{
					var c = cnt == MAX_VALUE ? maxStep : cnt;
					var executed = this.cmdList.exec(c);
					this.executedCommandsNum += c - executed;
					if (cnt == MAX_VALUE && !executed && !this.paused){
						$('#cons' + this.tabIndex).append('Превышено максимальное число шагов');
					}
					if (this.cmdList.isFinished())
						this.playing = false;
				}
				this.changeProgressBar();
				this.executor.draw();
				this.enableButtons();
				
				this.cmdList.highlightOff();//inefficiency!!!!!!!!
				
				this.highlightLast();
			}
			else
				this.nextStep(cnt);
		} catch(e) {
			console.error(e);
			$('#cons' + this.tabIndex).append(e);
		}
	},
	oneStep: function(command, cnt) {
		for (var i = 0; i < cnt && !this.stoped && !this.paused; ++i) {
			this.executor.executeCommand(command);
			++this.step;
			if (this.maxStep && this.step == this.maxStep)
				continue;
			this.checkLimit();
		}

		if (nextline[this.tabIndex] != undefined && !this.playedLines[nextline[this.tabIndex]] && this.codeMode()) {
			++this.divIndex;
			if (this.commandsFine){
				this.points -= this.commandsFine;
				var mes = new MessageCommandFine(this.step, this.points);
			}
			this.playedLines[nextline[this.tabIndex]] = true;
		}
		
		this.checkLimit();
		//if (this.speed)
		{
			this.changeProgressBar();
		}
		
	},
	convertCommandsToCode: function(){
		this.curCounter = 0;
		this.counters = [{'name': 'i', 'cnt': 0}, {'name': 'j', 'cnt': 0}, {'name': 'k', 'cnt': 0}]

		return this.cmdList.convertToCode(0);
	},

	die: function(){
		var mes = new MessageDead();
		for (var i = 0; i < btnsPlay.length; ++i)
			$('#btn_' + btnsPlay[i] + this.tabIndex).button('disable');
		$('#btn_pause' + this.tabIndex).button('disable');		
	},
	
	hideCounters: function(){
		this.cmdList.hideCounters();

	},
	showCounters: function(){
		this.cmdList.showCounters();
	},
	
	submit: function(){
		var result;
		if ($('#codeMode' + this.tabIndex).prop('checked'))
		{
			result = codeareas[this.tabIndex].getValue();
		}
		else
		{
			result = this.convertCommandsToCode();
		}
		if (atHome){
			submitStr = 'source=' + result + '&problem_id=' + this.id + '&de_id=772264';
			submit(submitStr, this.id);
		} 
		else {
			submit(result, this.id);
		}
	},
	
	exportCommands: function(){
		$('#export' + this.tabIndex).html(this.convertCommandsToCode());
		$('#export' + this.tabIndex).dialog('open');
		return false;
	},
	
	callPlay: function(s){
		if (!this.checkLimit()){
			return;
		}
		if (!this.playing || this.executor.isDead())
		{
			this.setCounters();
			this.hideCounters();
			this.setDefault();
		}
		try
		{	
			this.speed = s;
			if (!this.playing)
			{
				if (!$('#codeMode' + this.tabIndex).prop('checked'))
				{
					var str = this.convertCommandsToCode();
					codeareas[this.tabIndex].setValue(str);
				}
				this.prepareForExecuting(!this.speed);
				this.playing = true;
			}
			this.cmdHighlightOff();
			this.paused = false;
			this.stopped = false;
			this.disableButtons();
			this.hideCounters();
			
			this.lastExecutedCmd = undefined;
			setTimeout(function(problem) { return function() {problem.play(MAX_VALUE);} }(this), s);
		}
		catch(e)
		{
			console.error(e);
			this.playing = false;
			$('#cons' + this.tabIndex).html('Некорректный код');
		}
	},
	
	prepareForExecuting: function(dontHighlight)
	{
		var problem = this.tabIndex;
		this.setDefault();
		this.playing = false;
		this.cmdHighlightOff();
		this.setCounters();
		this.compileCode()
		this.updateWatchList();
		if (!dontHighlight && nextline[problem] != undefined){
			codeareas[problem].setLineClass(nextline[problem], 'cm-curline');
		}
	},
	
	compileCode: function(){
		try{
			var problem = this.tabIndex;
			var output = $('#cons' + this.tabIndex);
			var input = codeareas[problem].getValue();
			output.html('');
			Sk.configure({output:outf, 'problem': problem});
			finalcode[problem] = Sk.importMainWithBody("<stdin>", false, input);
			$scope[problem] = 0,
			$gbl[problem] = {},
			$loc[problem] = $gbl[problem];
			for (var i = 0; i < finalcode[problem].compiled.scopes.length; ++i)
			{
				eval('$loc[' + problem + '].' + finalcode[problem].compiled.scopes[i].scopename + ' = {};');
				eval('$loc[' + problem + '].' + finalcode[problem].compiled.scopes[i].scopename + '.defaults = [];');
				eval('$loc[' + problem + '].' + finalcode[problem].compiled.scopes[i].scopename + '.stack = [];');
			}
			eval('$loc[' + problem + '].scope0.stack.push({"loc": {}, "param": {}, blk: 0});');
			nextline[problem] = getScope().firstlineno;
			$scopename[problem] = finalcode[problem].compiled.scopes[0].scopename;
			$scopestack[problem] = 0;
			$gbl[problem]['forward'] = forward;
			$gbl[problem]['left'] = left;
			$gbl[problem]['right'] = right;
			$gbl[problem]['wait'] = wait;
			$gbl[problem]['objectPosition'] = objectPosition_handler;
			this.changed = false;
		}
		catch(e){
			console.error(e);
			var problem = this.tabIndex;
			finalcode[problem] = undefined;
			$scope[problem] = undefined,
			$gbl[problem] = undefined,
			$loc[problem] = $gbl[problem];
			nextline[problem] = undefined;
			this.updateWatchList();
			if (codeareas[problem].getValue().length){
				throw "Некорректный код\n";
			}
		}
	},
	
	stop: function(){
		this.stopped = true;
		this.setDefault();
		this.cmdHighlightOff();
		this.showCounters();
		this.setCounters();
		this.playing = false;
	},
	
	pause: function(){
		if (this.playing)			
			this.paused = true;
		this.enableButtons();
	},
	
	codeMode: function(){
		return $('#codeMode' + this.tabIndex).prop('checked');
	},
	
	next: function(){
		if (!this.checkLimit()){
			return;
		}
		if (this.codeMode())
		{
			try
			{
				if (!this.playing)
				{
					this.prepareForExecuting();
					this.playing = true;
				}
				else
				{
					this.tryNextStep();
				}
			}
			catch (e)
			{
				console.error(e);
				this.playing = false;
				$('#cons' + this.tabIndex).append(e);
			}
		}
		else
		{
			try{
				this.speed = 0;
				this.paused = false;
				this.hideCounters();
				if (!this.playing || this.changed)
				{
					
						if (!this.playing)
						{
							this.setCounters();
							this.hideCounters();
							var needReturn = this.cmdList.isFinished();
							this.setDefault();
							if (needReturn)
								return;
						}
						codeareas[this.tabIndex].setValue(this.convertCommandsToCode());
						if (!this.playing)
						{
							this.prepareForExecuting();
						}
						else
						{
							this.compileCode();
						}
						this.playing = true;
					
				}
				this.lastExecutedCmd = undefined;
				this.cmdHighlightOff();
				this.cmdList.exec(1);
				this.changeProgressBar();
				++this.executedCommandsNum;
				this.highlightLast();
				this.executor.draw();
				if (this.cmdList.isFinished())
					this.playing = false;
			}
			catch(e){
				console.error(e);
				$('#cons' + this.tabIndex).append(e);
			}
		}
	},
	
	prev: function(){
		try {
		var t = this.executedCommandsNum;
		if (t <= 1) {
			this.setDefault();
			if ($('#codeMode' + this.tabIndex).prop('checked') && t == 1)
			{
				this.prepareForExecuting();
				return;
			}
			this.playing = false;
			this.showCounters();
			this.setCounters();
			return;
		}
		++c;
		--t;
		this.setDefault(true);
		if ($('#codeMode' + this.tabIndex).prop('checked'))
		{
			this.prepareForExecuting();
		}
		this.disableButtons();
		this.hideCounters();
		var s = this.speed;
		this.speed = 0;
		this.playing = true;
		this.play(t);
		} 
		catch(e) {
			console.error(e);
			$('#cons' + this.tabIndex).append(e);
		}
	},
	
	checkLimit: function(){
		if (this.maxCmdNum && this.divIndex == this.maxCmdNum || 
			this.maxStep && this.step == this.maxStep){
			var mes = this.maxCmdNum ? new MessageCmdLimit() : new MessageStepsLimit();
			this.executor.heroIsDead();
			//this.stopped = true;
			this.heroIsDead();
			return false;
		}
		return true;
	}
});
