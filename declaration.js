	var cur_i = 0;
	var speed = 300;
	var pause = false;
	var stopped = false;
	var playing = false;
	var cur_map = new Array();
	var start_dir;
	var map;
	var cur_dir;
	var cur_x;
	var cur_y;
	var cur_list = [];
	var life;
	var pnts;
	var problem = {
		"name": "",
		"statement": "",
		"testsNum": 0,
		"commands": [],
		"start_life": NaN,
		"d_life": NaN,
		"start_pnts": NaN,
		"finish_elem": NaN		
	};
	var element = {
		"list": [],
		"names": [],
		"style_list": [],
		"count":[],
		"cur_count":[],
		"elem": [],
		"style":[],
		"coord": {
			"x": [],
			"y": []
		},
		"do": [],
		"pnts": [],
		"d_life" : [],
		"cleaner": [],
		"cleaned": []
	};
	const classNames = {
		"forward ui-draggable": "forward1 ui-draggable",
		"forward1 ui-draggable": "forward ui-draggable",
		"left ui-draggable":"left1 ui-draggable",
		"left1 ui-draggable":"left ui-draggable",
		"right ui-draggable": "right1 ui-draggable",
		"right1 ui-draggable": "right ui-draggable"
		};
	const classes = new Array ("forward", "left", "right", "forward1", "left1", "right1");
	const changeDir = {
		"forward":{
			"up": {dx: 0, dy: -1, cur_dir: "up"},
			"down": {dx: 0, dy: 1, cur_dir: "down"},
			"left":{dx: -1, dy: 0, cur_dir: "left"},
			"right": {dx: 1, dy: 0, cur_dir: "right"},
		},
		"left":{
			"up": {dx: 0, dy: 0, cur_dir: "left"},
			"down": {dx: 0, dy: 0, cur_dir: "right"},
			"left":{dx: 0, dy: 0, cur_dir: "down"},
			"right": {dx: 0, dy: 0, cur_dir: "up"},
		},
		"right":{
			"up": {dx: 0, dy: 0, cur_dir: "right"},
			"down": {dx: 0, dy: 0, cur_dir: "left"},
			"left":{dx: 0, dy: 0, cur_dir: "up"},
			"right": {dx: 0, dy: 0, cur_dir: "down"},
			
		}
	}
	const dirs = {"R": "right", "L": "left", "U": "up", "D": "down"}
	const maxx = 185;
	const miny = 0;