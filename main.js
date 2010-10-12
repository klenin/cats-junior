	getProblemStatement();
	getTest("01");
	copyMap();
	fillLabyrinth();
	$(document).ready(function(){
		document.title = problem.name;
		$("#statement").append(problem.statement);
		cur_dir = start_dir;
		cur_x = start_x;
		cur_y = start_y;
		life = problem.start_life;
		pnts = problem.start_points;
		var s = "#" + (cur_y * 100 + cur_x);
		$(s).append("<div class = '" + cur_dir + "'></div>");
		for (var k = 0; k < element.style.length; ++k){
			s = "#" + (element.coord.y[k] * 100 + element.coord.x[k]);
			$(s).append("<div class = '" + element.style[k] + "'></div>");
		}
		var divs = new Array("forward", "left", "right");
		$( "#sortable" ).sortable({
			revert: false,
			beforeStop: function(event, ui){
				if (ui.position.left > maxx || ui.position.top < miny)
					ui.item.remove();
				updated();
			},
			cursor: 'move',
		});
		cur_list = $("#sortable").sortable('toArray');
		for (var i = 0; i < 3; ++i)
		{
			$("#" + divs[i]).draggable({
				connectToSortable: '#sortable',
				helper: 'clone',
				revert: 'invalid',
				cursor: 'default',
			});
		}
		$( "ul, li" ).disableSelection();
		function callPlay(s){
			disableButtons();
			if (cur_i + 1 < cur_list.length){
				++cur_i;
				clearClasses();
			}
			else
				setDefault();
			setTimeout(function() { play(); }, s);
		}
		document.btn_form.btn_play.onclick = function(){
			callPlay(300);
		}
		document.btn_form.btn_fast.onclick = function(){
			callPlay(100);
		}
		document.btn_form.btn_clear.onclick = function(){
			setDefault();
			$('#sortable').empty();
		}
		document.btn_form.btn_stop.onclick = function(){
			stopped = true;
			if (!playing){
				setDefault();
				clearClasses();
			}
		}
		document.btn_form.btn_pause.onclick = function(){
			pause = true;
			enableButtons();
		}
		document.btn_form.btn_next.onclick = function(){
			disableButtons();
			if (cur_i + 1 < $("#sortable").sortable('toArray').length){
				if (cur_list.length > cur_i){
					var el = $("#sortable").children();
					changeClass(el[cur_list[0] == "" ? cur_i : cur_i + 1]);
				}
				++cur_i;
				play(1);
			}
			else
				enableButtons();			
		}
		document.btn_form.btn_prev.onclick = function(){
			disableButtons();
			if(cur_i == 0 || cur_list[cur_i - 1] == "")
				setDefault();
			else if (cur_i > 0){
				var t = cur_i;
				setDefault(true);
				var s = speed;
				speed = 0;
				play(t);
				speed = s;
			}
		}
	});
