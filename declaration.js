	var cur_i = 0;
	var speed = 300;
	var pause = false;
	var stopped = false;
	var playing = false;
	var dead = false;
	var cur_map = new Array();
	var start_dir;
	var map;
	var cur_dir;
	var cur_x;
	var cur_y;
	var cur_list = [];
	var life;
	var pnts;
	var m_elem_id = 0;
	var dx = 0;
	var dy = 0;
	var problem = {
		"name": "",
		"statement": "",
		"testsNum": 0,
		"commands": [],
		"start_life": NaN,
		"d_life": NaN,
		"start_pnts": NaN,
		"finish_symb": NaN,
		"cleaner": [],
		"cleaned": []	
	};
	var spec_symbols = {
		"list": [],
		"names": [],
		"style_list": [],
		"count":[],
		"cur_count":[],
		"symb": [],
		"style":[],
		"coord": {
			"x": [],
			"y": []
		},
		"do": [],
		"points": [],
		"d_life" : [],
	};
	var moving_elems = {
		"symbol": [],
		"style": [],
		"path": [],
		"looped": [],
		"cur_coord": [],
		"d_life":[],
		"points":[],
		"die":[],
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
			"up": {dx: 0, dy: -1, cur_dir: "up"},
			"down": {dx: 0, dy: 1, cur_dir: "down"},
			"left":{dx: -1, dy: 0, cur_dir: "left"},
			"right": {dx: 1, dy: 0, cur_dir: "right"},
			"wait": {dx: 0, dy: 0, cur_dir: "forward"},
		},
		"left":{
			"up": {dx: 0, dy: 0, cur_dir: "left"},
			"down": {dx: 0, dy: 0, cur_dir: "right"},
			"left":{dx: 0, dy: 0, cur_dir: "down"},
			"right": {dx: 0, dy: 0, cur_dir: "up"},
			"wait": {dx: -1, dy: 0, cur_dir: "left"},
		},
		"right":{
			"up": {dx: 0, dy: 0, cur_dir: "right"},
			"down": {dx: 0, dy: 0, cur_dir: "left"},
			"left":{dx: 0, dy: 0, cur_dir: "up"},
			"right": {dx: 0, dy: 0, cur_dir: "down"},
			"wait": {dx: 1, dy: 0, cur_dir: "right"},
		}, 
		"wait":{
			"up": {dx: 0, dy: 0, cur_dir: "up"},
			"down": {dx: 0, dy: 0, cur_dir: "down"},
			"left":{dx: 0, dy: 0, cur_dir: "left"},
			"right": {dx: 0, dy: 0, cur_dir: "right"},
			"wait": {dx: 0, dy: 0, cur_dir: "wait"},
		},
		
	}
	const dirs = {"R": "right", "L": "left", "U": "up", "D": "down"}
	const maxx = 185;
	const miny = 0;