var atHome = 1; //for testing
var curProblem;
var problems = [];
var users = [];
var curUser;
var logined = false;
var defaultPass = 12345;
var cid = 791634; // contest id
var sid; // session id
var cmdId; // current number for added command(generated for dynamic creating of sortable elements)
var pathPref = 'http://imcs.dvgu.ru/cats/main.pl?';
var resultsUrl = 'http://imcs.dvgu.ru/cats/main.pl?f=rank_table_content;cid=';
var visited = []; // if tab have already been visited -- for proper tabs displaying
var arrow = [];
var contests;
var cmdClassToName = {
	'forward': 'Прямо',
	'left': 'Налево',
	'right': 'Направо',
	'wait': 'Ждать'
};
var classes = ['forward', 'left', 'right', 'wait'];
var changeDir = {
	'forward':{
		'up': {dx: 0, dy: -1, curDir: 'up'},
		'down': {dx: 0, dy: 1, curDir: 'down'},
		'left':{dx: -1, dy: 0, curDir: 'left'},
		'right': {dx: 1, dy: 0, curDir: 'right'}
	},
	'left':{
		'up': {dx: 0, dy: 0, curDir: 'left'},
		'down': {dx: 0, dy: 0, curDir: 'right'},
		'left':{dx: 0, dy: 0, curDir: 'down'},
		'right': {dx: 0, dy: 0, curDir: 'up'}
	},
	'right':{
		'up': {dx: 0, dy: 0, curDir: 'right'},
		'down': {dx: 0, dy: 0, curDir: 'left'},
		'left':{dx: 0, dy: 0, curDir: 'up'},
		'right': {dx: 0, dy: 0, curDir: 'down'}
	}, 
	'wait':{
		'up': {dx: 0, dy: 0, curDir: 'up'},
		'down': {dx: 0, dy: 0, curDir: 'down'},
		'left':{dx: 0, dy: 0, curDir: 'left'},
		'right': {dx: 0, dy: 0, curDir: 'right'}
	}
	
}
var dirs = {'R': 'right', 'L': 'left', 'U': 'up', 'D': 'down'};
var maxx = 185;
var miny = 0;
var btnsPlay = ['play', 'next', 'prev', 'fast'];
var btns = ['play', 'pause', 'stop', 'prev', 'next', 'fast'];
var buttonIconClasses = ['ui-icon-play', 'ui-icon-pause', 'ui-icon-stop', 'ui-icon-seek-prev', 'ui-icon-seek-next', 'ui-icon-seek-end'];
var c = 0;
var curDebugState;
var worker;
