var curProblem;
problems = [];
var cmdId; // current number for added command(generated for dynamic creating of sortable elements)
var	currentServer = undefined;

var btns = ['play', 'pause', 'stop', 'prev', 'next'];

var lastWatchedIndex = [];
var watchList = [];
codeareas = [];
var finalcode = [],
	$gbl = [],
	$loc = [],
	$expr = [],
	$scope = [],
	nextline = [],
	$scopename = [],
	$scopestack = [];
