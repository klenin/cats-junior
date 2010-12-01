	var curI = [];
	var speed = [];
	var pause = [];
	var stopped = [];
	var playing = [];
	var dead = [];
	var curMap = [];
	var startDir = "right";
	var startX = [];
	var startY = [];
	var map = [];
	var curDir = [];
	var curX = [];
	var curY = [];
	var curList = [[]];
	var life = [];
	var pnts = [];
	var mElemId = 0;
	var dx = [];
	var dy = [];
	var curProblem = 0;
	var problems = [];
	var specSymbols = [];
	var movingElems = [];
	var problemsList = [];
	var users = {"login":[], "name":[],};
	var login;
	var name;
	var passwd;
	var cid = 577647;
	var sid;
	var pathPref = 'http://imcs.dvgu.ru/cats/main.pl?';
	const divNames = {
		"forward": "Прямо",
		"left": "Налево",
		"right": "Направо",
		"wait": "Ждать",
	};
	const classNames = {
		"forward ui-draggable": "forward1 ui-draggable",
		"forward1 ui-draggable": "forward ui-draggable",
		"left ui-draggable":"left1 ui-draggable",
		"left1 ui-draggable":"left ui-draggable",
		"right ui-draggable": "right1 ui-draggable",
		"right1 ui-draggable": "right ui-draggable",
		"wait1 ui-draggable": "wait ui-draggable",
		"wait ui-draggable": "wait1 ui-draggable"
		};
	const classes = new Array ("forward", "left", "right", "wait", "forward1", "left1", "right1", "wait1");
	const changeDir = {
		"forward":{
			"up": {dx: 0, dy: -1, curDir: "up"},
			"down": {dx: 0, dy: 1, curDir: "down"},
			"left":{dx: -1, dy: 0, curDir: "left"},
			"right": {dx: 1, dy: 0, curDir: "right"},
			"wait": {dx: 0, dy: 0, curDir: "forward"},
		},
		"left":{
			"up": {dx: 0, dy: 0, curDir: "left"},
			"down": {dx: 0, dy: 0, curDir: "right"},
			"left":{dx: 0, dy: 0, curDir: "down"},
			"right": {dx: 0, dy: 0, curDir: "up"},
			"wait": {dx: -1, dy: 0, curDir: "left"},
		},
		"right":{
			"up": {dx: 0, dy: 0, curDir: "right"},
			"down": {dx: 0, dy: 0, curDir: "left"},
			"left":{dx: 0, dy: 0, curDir: "up"},
			"right": {dx: 0, dy: 0, curDir: "down"},
			"wait": {dx: 1, dy: 0, curDir: "right"},
		}, 
		"wait":{
			"up": {dx: 0, dy: 0, curDir: "up"},
			"down": {dx: 0, dy: 0, curDir: "down"},
			"left":{dx: 0, dy: 0, curDir: "left"},
			"right": {dx: 0, dy: 0, curDir: "right"},
			"wait": {dx: 0, dy: 0, curDir: "wait"},
		},
		
	}
	const dirs = {"R": "right", "L": "left", "U": "up", "D": "down"}
	const maxx = 185;
	const miny = 0;