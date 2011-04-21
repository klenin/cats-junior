var atHome = 1; //for testing
var curProblem;
var curProblemIndex;
var problems = [];
var users = [];
var login;
var name;
var passwd = 12345;
var cid = 777988; // contest id
var sid; // session id
var cmdId; // current number for added command(generated for dynamic creating of sortable elements)
var pathPref = 'http://imcs.dvgu.ru/cats/main.pl?';
var resultsUrl = 'http://imcs.dvgu.ru/cats/main.pl?f=rank_table_content;cid=785773;';
var visited = []; // if tab have already been visited -- for proper tabs displaying
var arrow = [];
var divNames = {
	'forward': 'Прямо',
	'left': 'Налево',
	'right': 'Направо',
	'wait': 'Ждать'
};
var classNames = {
	'forward ui-draggable': 'forward1 ui-draggable',
	'forward1 ui-draggable': 'forward ui-draggable',
	'left ui-draggable':'left1 ui-draggable',
	'left1 ui-draggable':'left ui-draggable',
	'right ui-draggable': 'right1 ui-draggable',
	'right1 ui-draggable': 'right ui-draggable',
	'wait1 ui-draggable': 'wait ui-draggable',
	'wait ui-draggable': 'wait1 ui-draggable'
	};
var classes = new Array ('forward', 'left', 'right', 'wait', 'forward1', 'left1', 'right1', 'wait1');
var changeDir = {
	'forward':{
		'up': {dx: 0, dy: -1, curDir: 'up'},
		'down': {dx: 0, dy: 1, curDir: 'down'},
		'left':{dx: -1, dy: 0, curDir: 'left'},
		'right': {dx: 1, dy: 0, curDir: 'right'},
		'wait': {dx: 0, dy: 0, curDir: 'forward'}
	},
	'left':{
		'up': {dx: 0, dy: 0, curDir: 'left'},
		'down': {dx: 0, dy: 0, curDir: 'right'},
		'left':{dx: 0, dy: 0, curDir: 'down'},
		'right': {dx: 0, dy: 0, curDir: 'up'},
		'wait': {dx: -1, dy: 0, curDir: 'left'}
	},
	'right':{
		'up': {dx: 0, dy: 0, curDir: 'right'},
		'down': {dx: 0, dy: 0, curDir: 'left'},
		'left':{dx: 0, dy: 0, curDir: 'up'},
		'right': {dx: 0, dy: 0, curDir: 'down'},
		'wait': {dx: 1, dy: 0, curDir: 'right'}
	}, 
	'wait':{
		'up': {dx: 0, dy: 0, curDir: 'up'},
		'down': {dx: 0, dy: 0, curDir: 'down'},
		'left':{dx: 0, dy: 0, curDir: 'left'},
		'right': {dx: 0, dy: 0, curDir: 'right'},
		'wait': {dx: 0, dy: 0, curDir: 'wait'}
	}
	
}
var dirs = {'R': 'right', 'L': 'left', 'U': 'up', 'D': 'down', 'right': 'R', 'left': 'L', 'up': 'U', 'down': 'D'};
var maxx = 185;
var miny = 0;
var btnsPlay = new Array('play', 'next', 'prev', 'fast');
var btns = new Array('play', 'pause', 'stop', 'prev', 'next', 'fast');
var buttonClass = 'ui-button ui-button-text-only ui-widget ui-state-default ui-corner-all';