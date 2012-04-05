function generateTabs(tabsNum)
{
	var str = '';
	for (var i = 0; i < tabsNum; ++i)
		str += '\t';
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
	generateCommand: function(tree, node){
		var self = this;
		$("#jstree-container" + curProblem.tabIndex).jstree("create", node, isBlock(tree._get_type(node)) ? "last" : "after", 
			false, function(newNode){
				onCreateItem(tree, newNode, $('#' + self.name + '0'));
				var numId = $(newNode).prop('numId');
				$('#' + self.name + numId + ' > span > input').prop('value', self.cnt);
			}, true); 
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
	generateCommand: function(tree, node){
		var self = this;
		$("#jstree-container" + curProblem.tabIndex).jstree("create", node, 
			isBlock(tree._get_type(node)) ? "last" : "after", 
			false, function(newNode){
				onCreateItem(tree, newNode, $('#for0'));
				var numId = $(newNode).prop('numId');
				$('#' + self.name + numId + ' > span > input').prop('value', self.cnt);
				self.body.generateCommand(tree, $(newNode));
			}, true); 
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
		return block.getClass() == 'if' && this.testName == block.testName && 
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
		this.testName = block.testName;
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
	generateCommand: function(tree, node){
		var self = this;
		$("#jstree-container" + curProblem.tabIndex).jstree("create", node, 
			isBlock(tree._get_type(node)) ? "last" : "after", 
			false, function(newNode){
				onCreateItem(tree, newNode, self.blocks[1] ? $('#ifelse0') : $('#if0'));
				var numId = $(newNode).prop('numId');
				for (var i = 0; i < testFunctions.length; ++i)
				{
					if (self.testName == testFunctions[i])
					{
						$('#select' + numId).val(i)
					}
				}
				self.blocks[0].generateCommand(tree, $(newNode));
				if (self.blocks[1])
				{
					var parent = tree._get_parent(newNode);
					var next;
					var cur = newNode;
					while (1)
					{
						next = tree._get_next(cur, true);
						cur = next;
						var p1 = tree._get_parent(next);
						if (!next || p1 == -1 || p1.prop('id') == parent.prop('id'))
							break;
					}
					if (next)
					{
						self.blocks[1].generateCommand(tree, next);
					}
				}
			}, true); 
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
		return block.getClass() == 'while' && this.testName == block.testName && 
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
		this.testName = block.testName;
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
	generateCommand: function(tree, node){
		var self = this;
		$("#jstree-container" + curProblem.tabIndex).jstree("create", node, 
			isBlock(tree._get_type(node)) ? "last" : "after", 
			false, function(newNode){
				onCreateItem(tree, newNode, $('#while0'));
				var numId = $(newNode).prop('numId');
				for (var i = 0; i < testFunctions.length; ++i)
				{
					if (self.testName == testFunctions[i])
					{
						$('#select' + numId).val(i)
					}
				}
				self.body.generateCommand(tree, $(newNode));
			}, true); 
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
			str += this.commands[i].convertToCode(tabsNum + 1);
		return str;
	},
	generateCommand: function(tree, node){
		for (var i = 0; i < this.commands.length; ++i)
		{
			this.commands[i].generateCommand(tree, node ? node : 0);
		}
	}
});


var curCodeMirror;

function outf(text)
{
	text = text.replace(/</g, '&lt;');
	$('#cons' + getCurProblem()).append(text);
}

function getCurBlock()
{
	var problem = getCurProblem();
	var scope = finalcode[problem].compiled.scopes[$scope[problem]].scopename;
	return eval('$loc[' + problem + '].' + scope + '.stack[$loc[' + problem + '].' + scope + '.stack.length - 1].blk');
}

function getScope()
{
	var problem = getCurProblem();
	return finalcode[problem].compiled.scopes[$scope[problem]];
}

function tryNextStep(dontHiglight)
{
	var problem = getCurProblem();
	if (getCurBlock() >= 0)
	{
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
				updateWatchList();
			}catch(e)
			{
				$('#cons' + problem).append('\n' + e + '\n');
				return 0;

			}
		}
		drawLabirint();
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
				curProblem.paused = true;
				//curProblem.playing = false;
				return 1;
			}
		}
		if (getCurBlock() < 0)
		{
			if (nextline[problem] != undefined && !dontHiglight)
				codeareas[problem].setLineClass(nextline[problem], null);
			$('#cons' + problem).append('\nfinished\n');
			//curProblem.stopped = true;
			curProblem.playing = false;
			return 0;
		} 
	}
	else
	{
		if (nextline[problem] != undefined)
			codeareas[problem].setLineClass(nextline[problem], null);
		$('#cons' + problem).append('\nfinished\n');
		//curProblem.stopped = true;
		curProblem.playing = false;
		return 0;
	}
	return 1;
}

function getCurProblem()
{
	return $('#tabs').tabs('option', 'selected') - 1;
}

function updateWatchList()
{
	var problem = getCurProblem();
	for(var p in watchList[problem])
	{
		var res = calculateValue(watchList[problem][p]);
		$('#calcVal_' + problem + '_' + p).html(res == undefined ? 'undefined' : res);
	}
}

function tryCode()
{
	var problem = problems.length + 1;
	var output = $('#cons' + problem);
	output.html('');
	Sk.configure({output:outf, 'problem': problem});
	var input = codeareas[problem].getValue();
	try {
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
		codeareas[problem].setLineClass(nextline[problem], 'cm-curline');
		if (codeareas[problem].lineInfo(nextline[problem]).markerText)
		{
			curProblem.paused = true;
			curProblem.playing = false;
		}
		$scopename[problem] = finalcode[problem].compiled.scopes[0].scopename;
		$scopestack[problem] = 0;
		$('#codeRes1').html(finalcode[problem].code);
		$gbl[problem]['my_function'] = my_function;
		updateWatchList();
	} catch (e) {
		alert(e);
	}
}

function showHideCode()
{
	if ($('#showHide').prop('checked'))
		$('#codeRes1').hide();
	else
		$('#codeRes1').show();
}

function testChanged()
{
	codeareas[getCurProblem()].setValue(tests[$('#selectTest :selected').val()]);
}

function calculateExpression(expression)
{
	if (expression._astname == 'Name')
	{
		var result = undefined;
		var problem = getCurProblem();
		if ($scope[problem] != undefined && $loc[problem] != undefined)
		{
			var scope = finalcode[problem].compiled.scopes[$scope[problem]].scopename;
			var t_scope = $scope[problem], 
				t_scopename = $scopename[problem], 
				t_scopestack = $scopestack[problem];
			var name = expression.id.v;
			//find name 
			while(eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].loc." + name) == undefined
				&& eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].parentStack") != undefined)
			{
				t_scope = eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].parent");
				var nm = t_scopename;
				t_scopename = eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].parentName");
				t_scopestack = eval("$loc[" + problem + "]." + nm + ".stack[" + t_scopestack + "].parentStack");
			}
			result = eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].loc." + name) !== undefined ?
						eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].loc." + name):
						Sk.misceval.loadname(name, $gbl[problem], 1);
		}
		return result;
	}
	if (expression._astname == 'Num')
		return expression.n;
	if (expression._astname == 'BinOp')
	{
		var a = calculateExpression(expression.left);
		var b = calculateExpression(expression.right);
		return Sk.abstr.boNumPromote_[expression.op.prototype._astname](a, b);
	}
	if (expression._astname == 'UnaryOp')
	{
		var v = calculateExpression(expression.operand);
		var op = expression.op.prototype._astname;
	    if (op === "USub") return -v;
        if (op === "UAdd") return v;
        if (op === "Invert") return ~v;
	}
}

function calculateValue(source)
{
	var filename = '<stdin>.py'
	var cst = Sk.parse(filename, source);
    var ast = Sk.astFromParse(cst, filename);
	var st = Sk.symboltable(ast, filename);
	if (!(ast.body && ast.body.length == 1))
		return 'Invalid expression';
    var expr = ast.body[0];
	if (expr._astname != 'Expr')
		return 'Invalid expression';
	return calculateExpression(expr.value);
}

function my_function()
{
	alert('yeah!!!');
}

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
	var elem = $('#' + elem);
	if (elem.hasClass('highlighted'))
		elem.removeClass('highlighted');
	else
		elem.addClass('highlighted');
}

function isCmdHighlighted(elem){
	if (!elem)
		return false;
	return $('#' + elem).hasClass('highlighted')
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
	curProblem.changed = true;
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
	var problem = curProblem.tabIndex;
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
	finalcode[problem] = undefined;
	$scope[problem] = undefined,
	$gbl[problem] = undefined,
	$loc[problem] = $gbl[problem];
	nextline[problem] = undefined;
	for (var i = 0; i < codeareas[problem].lineCount(); ++i)
		codeareas[problem].setLineClass(i, null);
	updateWatchList();
}

function prevDivName(){
	if (curProblem.divIndex < 1)
		return false;
	return curProblem.cmdList[curProblem.divIndex - 1].name;
}

function loop(cnt, i){
	if ($('#codeMode' + curProblem.tabIndex).prop('checked'))
	{
		tryNextStep();
	}
	else
	{
		curProblem.cmdList.exec(1);
		++curProblem.step;
		if (curProblem.cmdList.isFinished())
		{
			curProblem.playing = false;
			enableButtons();
			return;
		}
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
	if (cnt && !curProblem.paused && curProblem.playing)
		setTimeout(function() { loop(cnt, i); }, curProblem.speed);
	else
	{
		drawLabirint();
		changeProgressBar();
		enableButtons();
		if (!curProblem.playing && $('#codeMode' + curProblem.tabIndex).prop('checked'))
			onFinishExecuting(getCurProblem());
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
	if (!curProblem.speed)
	{
		if ($('#codeMode' + curProblem.tabIndex).prop('checked'))
		{
			while(!curProblem.paused && tryNextStep()){};
			if ($('#codeMode' + curProblem.tabIndex).prop('checked'))
				onFinishExecuting(getCurProblem());
		}
		else
		{
			curProblem.step += cnt - curProblem.cmdList.exec(cnt);
			if (curProblem.cmdList.isFinished())
				curProblem.playing = false;
		}
		changeProgressBar();
		drawLabirint();
		enableButtons();
		
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

