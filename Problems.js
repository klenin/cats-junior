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
	exec: function(cnt) {
		var t = Math.min(cnt, Math.abs(this.curCnt - this.cnt));
		var i;
		for (i = 0; i < t && !(this.problem.stopped || this.problem.paused || this.problem.arrow.dead); ++i)
		{
			eval(this.name + '();');
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
		$("#jstree-container" + this.problem.tabIndex).jstree("create", node, isBlock(tree._get_type(node)) ? "last" : "after", 
			false, function(newNode){
				onCreateItem(tree, newNode, $('#' + self.name + '0'), self.problem);
				var numId = $(newNode).prop('numId');
				$('#' + self.name + numId + ' > span > input').prop('value', self.cnt);
			}, true); 
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
	exec: function(cnt)
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
		$('#' + this.id + '>span').css('background-color', 'white');
		this.body.highlightOff();
	},
	highlightOn: function(){
		$('#' + this.id + '>span').css('background-color', '#1CB2B3');
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
		$("#jstree-container" + this.problem.tabIndex).jstree("create", node, 
			isBlock(tree._get_type(node)) ? "last" : "after", 
			false, function(newNode){
				onCreateItem(tree, newNode, $('#for0'), self.problem);
				var numId = $(newNode).prop('numId');
				$('#for' + numId + ' > span > input').prop('value', self.cnt);
				self.body.generateCommand(tree, $(newNode));
			}, true); 
	}
});

var CondStmt = $.inherit({
	__constructor : function(testName, args, parent, id, problem) {
		this.args = args.clone();
		this.testName = testName;
		switch(testName){
			case 'objectPosition':
				this.test = function(){return objectPosition(selectObjects[args[0]][0], 
					selectConditions[args[2]][0], 
					selectDirections[args[1]][0])};
				break;
			default:
				this.test = function(){return false};
		}
		this.parent = parent;	
		this.id = id;
		this.problem = problem;
	},
	eq: function(block){
		return block.getClass() == this.getClass() && this.testName == block.testName && this.args.compare(block.args);
	},
	copyDiff: function(block, compareCnt){
		this.test = block.test; //?
		this.testName = block.testName;
		this.args = block.args.clone();
		switch(this.testName){
			case 'objectPosition':
				this.test = function(){return objectPosition(selectObjects[this.args[0]][0], 
					selectConditions[this.args[2]][0], 
					selectDirections[this.args[1]][0])};
				break;
			default:
				this.test = function(){return false};
		}
		this.id = block.id;
	},
	highlightOff: function(){
		$('#' + this.id + '>select').css('background-color', 'white');
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
				if (this.args[2] )
					str += 'not ';
				str += 'objectPosition("' + 
				selectObjects[this.args[0]][0] + '", "' + 
				selectDirections[this.args[1]][0] + '"):\n';
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
	exec: function(cnt)
	{
		if (this.curBlock == undefined && cnt)
		{
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
		$("#jstree-container" + this.problem.tabIndex).jstree("create", node, 
			isBlock(tree._get_type(node)) ? "last" : "after", 
			false, function(newNode){
				onCreateItem(tree, newNode, self.blocks[1] ? $('#ifelse0') : $('#if0'), self.problem);
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
	}
});

var WhileStmt = $.inherit(CondStmt, {
	__constructor : function(testName, args, body, parent, id, problem) {
        this.finished = false;//
		this.executing = false;//
		this.isStarted = false; //should be changed to one or two properties.
		this.args = args.clone();
		this.testName = testName;
		switch(testName){
			case 'objectPosition':
				this.test = function(){return objectPosition(selectObjects[args[0]][0], 
					selectConditions[args[2]][0], 
					selectDirections[args[1]][0])};
				break;
			default:
				this.test = function(){return false};
		}
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
	exec: function(cnt)
	{
		while (cnt && !this.finished && !(this.problem.stopped || this.problem.paused || this.problem.arrow.dead))
		{
			this.isStarted = true;
			if (!this.executing)
			{
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
		$("#jstree-container" + this.problem.tabIndex).jstree("create", node, 
			isBlock(tree._get_type(node)) ? "last" : "after", 
			false, function(newNode){
				onCreateItem(tree, newNode, $('#while0'), self.problem);
				self.generateSelect(newNode);
				self.body.generateCommand(tree, $(newNode));
			}, true); 
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
	exec: function(cnt)
	{
		var cmd = undefined;
		while(cnt && this.commands.length > this.curCmd && !(this.problem.stopped || this.problem.paused || this.problem.arrow.dead))
		{
			cmd = this.commands[this.curCmd];
			cnt = cmd.exec(cnt);
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
			str += this.commands[i].convertToCode(tabsNum);
		return str;
	},
	generateCommand: function(tree, node){
		for (var i = 0; i < this.commands.length; ++i)
		{
			this.commands[i].generateCommand(tree, node ? node : 0);
		}
	}
});

var Problem = $.inherit({
	__constructor : function(problem, tabIndex) {
		$.extend(true, this, problem, problem.data);
		this.cmdIndex = 0; 
		this.divIndex = 0; 
		this.step = 0; 
		this.divName = '';
		this.speed = 1000; 
		this.life = problem.data.startLife;
		this.points = problem.data.startPoints;
		this.paused = false; 
		this.stopped = false; 
		this.playing = false; 
		this.cmdListEnded = false; 
		this.cmdList = new Block([], undefined, this);
		this.mapFromTest = problem.data.map.slice(); 
		this.map = [];
		this.maxBoxId = 0; 
		this.maxMonsterId = 0;
		this.maxPrizeId = 0; 
		this.maxCellId = 0;
		this.monsters = [];
		this.numOfPrizes = 0;
		this.curNumOfPrizes = 0; 
		this.visited = false; 
		this.dx = 0;
		this.dy = 0;
		this.executedCommandsNum = 0;
		this.lastExecutedCmd = undefined;
		this.prevCmd = undefined;
		this.tabIndex = tabIndex;
		if (this.maxCmdNum)
			this.maxStep = 0;
		this.setLabyrinth(problem.data.specSymbols);
		this.setMonsters(problem.data.movingElements);
		this.setKeysAndLocks(problem.data.keys, problem.data.locks);
		this.curCounter = 0;
		this.counters = [{'name': 'i', 'cnt': 0}, {'name': 'j', 'cnt': 0}, {'name': 'k', 'cnt': 0}];
		this.playedLines = [];
		this.usedCommands = [];
		this.commandsFine = this.commandsFine ? this.commandsFine : 0;
		this.stepsFine = this.stepsFine ? this.stepsFine : 0;
		this.invalidDirectionFine = this.invalidDirectionFine ? this.invalidDirectionFine : 0;
	},
	setLabyrinth: function(specSymbols){
		var obj = undefined;
		for (var i = 0; i < this.mapFromTest.length; ++i){
			this.map[i] = [];
			for (var j = 0; j < this.mapFromTest[i].length; ++j){
				this.map[i][j] = [];
				var c = new Coord(j, i);
				this.map[i][j] = new FieldElem(this, c,this.mapFromTest[i][j] == "#")
				if (this.mapFromTest[i][j] == "R" || this.mapFromTest[i][j] == "U" || 
					this.mapFromTest[i][j] == "D" ||this.mapFromTest[i][j] == "L" ){
					obj = this.arrow = new Arrow(this, c, dirs[this.mapFromTest[i][j]]);
				}
				for (var k = 0; k < specSymbols.length; ++k)
					if (specSymbols[k].symbol == this.mapFromTest[i][j]){
						obj = specSymbols[k].action == "eat" ? 
							new Prize(this, c, specSymbols[k]) : 
							new Box(this, c,specSymbols[k]) ;
						if (obj.__self == Prize)
							++this.numOfPrizes;
						break;
					}
				if (obj)
					this.map[i][j].pushCell(obj);
				obj = undefined;
			}
		}
	},
	setMonsters: function(monsters){
		var obj = undefined;
		for (var k = 0; k < monsters.length; ++k){
			var c = new Coord(monsters[k].path[0].x, monsters[k].path[0].y);
			obj = new Monster(this, c, monsters[k]);
			this.map[c.y][c.x].pushCell(obj);
			this.monsters.push({'x': c.x, 'y': c.y});
		}
	},
	setKeysAndLocks: function(keys, locks){
		var obj = undefined;
		for (var k = 0; k < keys.length; ++k){
			var c = new Coord(keys[k].x, keys[k].y);
			obj = new Key(this, c, locks[k]);
			this.map[c.y][c.x].pushCell(obj);
			for (var j = 0; j < locks[k].length; ++j){
				var c1 = new Coord(locks[k][j].x, locks[k][j].y);
				obj = new Lock(this, c1);
				this.map[c1.y][c1.x].pushCell(obj);
			}
		}
	},
	fillLabyrinth: function(){
		this.highlightOn();//
		var l = this.tabIndex;
		$('#tdField' + l).append('<table id = "table_field' + l + '" class = "field"></table>');
		var table = $('#table_field' + l);
		for (var i = 0; i < this.map.length; ++i){
			table.append('<tr id = "tr_field' + (l * 1000 + i) + '"></tr>');
			var tr = $('#tr_field' + (l * 1000 + i));
			for (var j = 0; j < this.map[i].length; ++j){
				tr.append('<td id = "'+ (l * 10000 + i * 100 + j)+'"></td>');
				this.map[i][j].draw();
			}
		}
	},
	highlightOn: function(){
		for (var i = 0; i < this.map.length; ++i)
			this.map[i][this.arrow.coord.x].highlightOn();
		for (var i = 0; i < this.map[0].length; ++i)
			this.map[this.arrow.coord.y][i].highlightOn();
	},
	highlightOff: function(){
		for (var i = 0; i < this.map.length; ++i)
			this.map[i][this.arrow.coord.x].highlightOff();
		for (var i = 0; i < this.map[0].length; ++i)
			this.map[this.arrow.coord.y][i].highlightOff();
	},
	drawLabirint: function(){
		for (var i = 0; i < this.map.length; ++i)
			for (var j = 0; j < this.map[i].length; ++j)
				this.map[i][j].draw();
	},
	setDefault: function(f){
		for (var i = 0; i < btns.length; ++i)
			$('#btn_' + btns[i] + this.tabIndex).button('enable');	
		$('#jstree-container' + this.tabIndex).sortable('enable');
		for (var i = 0; i < this.map.length; ++i)
			for (var j = 0; j < this.map[i].length; ++j)
				this.map[i][j].setDefault();
		for (var i = 0; i < this.map.length; ++i){
			for (var j = 0; j < this.map[i].length; ++j){
				var arr = this.map[i][j].changedCells();
				for (var k = 0; k < arr.length; ++k){
					this.map[arr[k].coord.y][arr[k].coord.x].pushCell(arr[k]);
					switch(arr[k].__self){
						case Arrow: 
							this.arrow = arr[k];
							break;
						case Monster:
							this.monsters[arr[k].id] = arr[k];
							this.monsters[arr[k].id].x = arr[k].coord.x;
							this.monsters[arr[k].id].y = arr[k].coord.y;
							break;
					}
				}
			}

		}
		this.highlightOn();
		this.arrow.setDefault();
		this.paused = false;
		this.stopped = false;
		this.playing = false;
		this.points = 0;
		this.cmdListEnded = false;
		this.curNumOfPrizes = 0;
		this.cmdIndex = 0;
		this.divIndex = 0;
		this.step = 0;
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
			this.drawLabirint();
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
		$('#jstree-container' + this.tabIndex).sortable('enable');
		for (var i = 0; i < btnsPlay.length; ++i)
			$('#btn_' + btnsPlay[i] + this.tabIndex).removeAttr('disabled');		
	},

	disableButtons: function(){
		$('#jstree-container' + this.tabIndex).sortable('disable');
		for (var i = 0; i < btnsPlay.length; ++i)
			$('#btn_' + btnsPlay[i] + this.tabIndex).prop('disabled', true);
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
					$('#cons' + problem).append('\n' + e + '\n');
					return 0;

				}
			}
			++this.executedCommandsNum;
			this.drawLabirint();
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
				$('#cons' + problem).append('\nfinished\n');
				this.playing = false;
				return 0;
			} 
		}
		else
		{
			if (nextline[problem] != undefined)
				codeareas[problem].setLineClass(nextline[problem], null);
			$('#cons' + problem).append('\nfinished\n');
			this.playing = false;
			return 0;
		}
		return 1;
	},
	divI: function(){ return this.divIndex; },
	divN: function(){ return this.divName;},
	list: function() {return this.cmdList; },
	setCounters: function(j, dontReload){
		var el = $('#jstree-container' + this.tabIndex).children();
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
	updated: function(){
		var newCmdList = convert($("#jstree-container" + this.tabIndex).jstree('get_json', -1), undefined, this);
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
	},
	loop: function(cnt, i){
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
	},
	heroIsDead: function(){
		for (var i = 0; i < btns.length; ++i)
			$('#btn_' + btns[i] + this.tabIndex).button('disable');
		$('#btn_stop' + this.tabIndex).button('enable');
		$('#jstree-container' + this.tabIndex).sortable('enable');
		if (!this.speed)
			this.notSpeed();
		this.playing = false;
		this.hideFocus();
	},
	nextCmd: function(){
		if (this.speed)
			this.changeProgressBar();
		return true;
	},
	notSpeed: function(){ //check! looks like outdated
		this.speed = 100;
		this.setCounters(0, true);
		var lastCmd = (this.divI() >= this.list().length) ? 
			$('#jstree-container' + this.tabIndex + ' > li:last').prop('id') : this.divN();
		if (!isCmdHighlighted(lastCmd))
			changeCmdHighlight(lastCmd);
		this.drawLabirint();
		this.changeProgressBar();
	},
	nextStep: function(cnt, i){
		if (this.arrow.dead || this.stopped){
			if (this.arrow.dead)
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
			this.drawLabirint();
			this.changeProgressBar();
			this.enableButtons();
			if (!this.playing && $('#codeMode' + this.tabIndex).prop('checked'))
				onFinishExecuting(getCurProblem());
		}
	},
	highlightLast: function()
	{
		if (this.lastExecutedCmd && !isCmdHighlighted(this.lastExecutedCmd.id))
		{
			this.lastExecutedCmd.highlightOn()
		}
	},
	play: function(cnt){
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
			this.drawLabirint();
			this.enableButtons();
			
			this.cmdList.highlightOff();//inefficiency!!!!!!!!
			
			this.highlightLast();
		}
		else
			this.nextStep(cnt);
	},
	oneStep: function(dir, cnt)
	{
		for (var i = 0; i < cnt && !this.stoped && !this.paused; ++i)
		{
			var x = this.arrow.coord.x;
			var y = this.arrow.coord.y;
			this.dx = changeDir[dir][this.arrow.dir].dx;
			this.dy = changeDir[dir][this.arrow.dir].dy;
			this.changeLabyrinth(this.step, undefined, changeDir[dir][this.arrow.dir].curDir, !this.speed);
			++this.step;
			if (this.stepsFine){
				this.points -= this.stepsFine;
				var mes = new MessageStepFine(this.step - 1, this.points);
			}
			if (this.maxStep && this.step == this.maxStep)
				break;
		}
		if (nextline[this.tabIndex] != undefined && !this.playedLines[nextline[this.tabIndex]] && this.codeMode()){
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
	labirintOverrun: function(x, y){
		return (x >= this.map[0].length || x < 0 || y >= this.map.length || y < 0);
	},
	die: function(){
		var mes = new MessageDead();
		this.arrow.dead = true;
		for (var i = 0; i < btnsPlay.length; ++i)
			$('#btn_' + btnsPlay[i] + this.tabIndex).button('disable');
		$('#btn_pause' + this.tabIndex).button('disable');		
	},
	tryNextCoord: function(i, changedElems){
		var p = this.tabIndex;
		var result = true;
		var cX = this.arrow.coord.x + this.dx;
		var cY = this.arrow.coord.y + this.dy;
		if (this.labirintOverrun(cX, cY)){
			var mes = new MessageLabirinthOverrun(i);
			result = false;
		}
		else {
			var elem = this.map[cY][cX];
			if (elem.isWall){
				var mes = new MessageWall(i);
				result = false;
			}
			var cells = elem.getCells();
			for (var j = 0; !elem.isWall && j < cells.length; ++j){
				if (cells[j].__self == Lock && cells[j].locked){
					var mes = new MessageWall(i);
					result = false;
					break;
				}
				if (cells[j].__self == Monster){
					this.die();
					break;
				}
				if (cells[j].__self == Box){
					var tX = cX + this.dx;
					var tY = cY + this.dy;
					var f = this.labirintOverrun(tX, tY);
					if (!f){
						var el1 = this.map[tY][tX];
						f = el1.isWall;
						var cells1 = el1.getCells();
						for (var k = 0; k < cells1.length; ++k)
							f = f || (cells1[k].zIndex >= cells[j].zIndex);
					}
					if (f){
						var mes = new MessageCantMove(i);
						result = false;
					}
					else{
						var box = cells[j];
						this.map[cY][cX].deleteElement(cells[j]);
						box.coord = new Coord(tX, tY);
						this.map[tY][tX].pushCell(box);
						changedElems.push(new Coord(tX, tY));
						--j;
						continue;
					}
				}
				if (cells[j].__self == Prize && !cells[j].eaten){
					cells[j].eaten = true;
					var mes = new MessagePrizeFound(i, cells[j].name, (this.points + cells[j].points), 
						++this.curNumOfPrizes == this.numOfPrizes);
					this.life += cells[j].dLife;
					this.points += cells[j].points;
					this.map[cY][cX].deleteElement(cells[j]);
					--j;
					continue;
				}
				if (cells[j].__self == Key && !cells[j].found){
					for (var k = 0; k < cells[j].locks.length; ++k){
						var x = cells[j].locks[k].x;
						var y = cells[j].locks[k].y;
						var mes = new MessageCellOpened(i, x, y);
						var cells1 = this.map[y][x].getCells();
						for(var l = 0; l < cells1.length; ++l)
							if(cells1[l].__self == Lock)
								cells1[l].setUnlocked();
						changedElems.push(new Coord(x, y));
					}
					cells[j].found = true;
					this.map[cY][cX].deleteElement(cells[j]);					
					--j;
					continue;
				}						
			}
		}
		return result;
	},
	changeLabyrinth: function(i, cnt, newDir, dontNeedToDraw){
		var p = this.tabIndex;
		this.life += this.dLife;
		var changedElems = [];
		var cX = this.arrow.coord.x + this.dx;
		var cY = this.arrow.coord.y + this.dy;
		changedElems.push(new Coord(this.arrow.coord.x, this.arrow.coord.y));
		var changeCoord = this.tryNextCoord(i, changedElems);
		if (changeCoord){
			for (var i = 0; i < this.map.length; ++i){
				this.map[i][this.arrow.coord.x].highlightOff();
				if (i != this.arrow.coord.y)
					changedElems.push(new Coord(this.arrow.coord.x, i));
			}
			for (var i = 0; i < this.map[0].length; ++i){
				this.map[this.arrow.coord.y][i].highlightOff();
				if (i != this.arrow.coord.x)
					changedElems.push(new Coord(i, this.arrow.coord.y));
			}
			this.map[this.arrow.coord.y][this.arrow.coord.x].deleteElement(this.arrow);
			this.arrow.coord = new Coord(cX, cY);
			this.arrow.dir = newDir;
			this.map[cY][cX].pushCell(this.arrow);
		}
		else if(this.invalidDirectionFine){
			this.points -= this.invalidDirectionFine;
			var mes = new MessageInvalidDirectionFine(this.step, this.points);
		}
		if (!this.arrow.dead){
			for (var k = 0; k < this.monsters.length; ++k){
				var elem = this.map[this.monsters[k].y][this.monsters[k].x];
				var m = elem.findCell(Monster, k);
				var c = m.tryNextStep();
				var elem1 = this.map[c.y][c.x];
				if (elem1.mayPush(m)){
					elem.deleteElement(m);
					m.nextStep();
					m.coord = c;
					changedElems.push(c);
					changedElems.push(new Coord(this.monsters[k].x, this.monsters[k].y));
					elem1.pushCell(m);
					if (c.x == this.arrow.coord.x && c.y == this.arrow.coord.y)
						this.die();
					this.monsters[k].x = c.x;
					this.monsters[k].y = c.y;
				}
			}
		}
		if (changeCoord && 	!this.arrow.dead){
			changedElems.push(new Coord(cX, cY));
			for (var i = 0; i < this.map.length; ++i){
				this.map[i][this.arrow.coord.x].highlightOn();
				if (i != this.arrow.coord.y)
					changedElems.push(new Coord(this.arrow.coord.x, i));
			}
			for (var i = 0; i < this.map[0].length; ++i){
				this.map[this.arrow.coord.y][i].highlightOn();
				if (i != this.arrow.coord.x)
					changedElems.push(new Coord(i, this.arrow.coord.y));
			}
		}
		if (!dontNeedToDraw){
			for (var i = 0; i < changedElems.length; ++i)
				this.map[changedElems[i].y][changedElems[i].x].draw();
		}
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
		if (1){
			submitStr = 'source=' + result + '&problem_id=' + this.id + '&de_id=772264';
			submit('', '', '', submitStr);
		} 
		else {
			var problem_id = this.id;  //problem_id = 
			var de_id = 772264;
			var boundary = Math.round((Math.random() * 999999999999));
			var sep = '-------------' + boundary + '\r\n';
			var l = 0;
			function genPostQuery(serv, path, data)	{
				var result = 'Content-Type: multipart/form-data; Content-Disposition: multipart/form-data; boundary=' + sep + '\r\n';
				result += 'Content-Length: ' + data.length + '\r\n\r\n';
				l = data.length;
				result += data;
				return result;
			}
			function genFieldData(name, value){
				var result = sep + 'Content-Disposition: form-data; name="' + name + '"' + "\r\n\r\n";
				result += value + '\r\n';
				return result;
			}
			function genFileFieldData(name, filename, type, data){
				var result = sep + 'Content-Disposition: form-data; name="' + name  +  '"; filename="' + filename + '"' + "\r\n";
				result += 'Content-Type: ' + type + "\r\n\r\n";
				result += data + '\r\n\r\n';
				return result;
			}
			var data = genFieldData('search', '');
			data += genFieldData('rows', '20');
			data += genFieldData('problem_id', problem_id);
			data += genFieldData('de_id', de_id);
			data += genFieldData('submit', 'send');
			data += genFileFieldData('source', 'ans.txt', 'text/plain', result);
			data += '-------------' + boundary  + '--\r\n';
			var query = genPostQuery('imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + sid + ';cid=' + cid, data);
			submit(data, sep, l, result);
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
		if (!this.playing || this.arrow.dead)
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
			this.playing = false;
			$('#cons' + this.tabIndex).html('Invalid commands');
		}
	},
	prepareForExecuting: function(dontHighlight)
	{
		var problem = this.tabIndex;
		this.setDefault();
		this.playing = false;
		this.cmdHighlightOff();
		this.setCounters();
		this.compileCode();
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
			var problem = this.tabIndex;
			finalcode[problem] = undefined;
			$scope[problem] = undefined,
			$gbl[problem] = undefined,
			$loc[problem] = $gbl[problem];
			nextline[problem] = undefined;
			this.updateWatchList();
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
				this.playing = false;
				alert(e)
			}
		}
		else
		{
			this.speed = 0;
			this.paused = false;
			this.hideCounters();
			if (!this.playing || this.changed)
			{
				try
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
				catch(e)
				{
					$('#cons' + this.tabIndex).html('Invalid commands');
					return;
				}
			}
			this.lastExecutedCmd = undefined;
			this.cmdHighlightOff();
			this.cmdList.exec(1);
			this.changeProgressBar();
			++this.executedCommandsNum;
			this.highlightLast();
			this.drawLabirint();
			if (this.cmdList.isFinished())
				this.playing = false;
		}
	},
	prev: function(){
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
	},
	getFieldElem: function(dir)
	{
		var newDir = changeDir[dir][this.arrow.dir];
		var cX = this.arrow.coord.x + newDir.dx;
		var cY = this.arrow.coord.y + newDir.dy;
		if (dir != 'forward' && dir != 'behind')
		{
			cX += changeDir['forward'][newDir.curDir].dx;
			cY += changeDir['forward'][newDir.curDir].dy;
		}
		return this.labirintOverrun(cX, cY) ? new FieldElem(this, new Coord(cX, cY), false) : this.map[cY][cX];
	},
	checkLimit: function(){
		if (this.maxCmdNum && this.divIndex == this.maxCmdNum || 
			this.maxStep && this.step == this.maxStep){
			var mes = this.maxCmdNum ? new MessageCmdLimit() : new MessageStepsLimit();
			this.arrow.dead = true;
			//this.stopped = true;
			this.heroIsDead();
			return false;
		}
		return true;
	}
});
