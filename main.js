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
		for (var k = 0; k < spec_symbols.style.length; ++k){
			s = "#" + (spec_symbols.coord.y[k] * 100 + spec_symbols.coord.x[k]);
			$(s).prepend("<div class = '" + spec_symbols.style[k] + "'></div>");
		}
		for (var k = 0; k < moving_elems.symbol.length; ++k){
			s = "#" + (moving_elems.path[k][0].y * 100 + moving_elems.path[k][0].x);
			$(s).prepend("<div class = '" + moving_elems.style[k] + "'></div>");
		}
		var divs = problem.commands;
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
		for (var i = 0; i < divs.length; ++i)
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
			if ($("#sortable").sortable('toArray').length == 1 || dead)
				return;
			disableButtons();
			if (cur_i + 1 < $("#sortable").sortable('toArray').length){
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
			$('#sortable').children(":gt(0)").remove();
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
			if ($("#sortable").sortable('toArray').length == 1)
				return;
			disableButtons();
			if (cur_i + 1 < $("#sortable").sortable('toArray').length){
				if (cur_list.length > cur_i){
					var el = $("#sortable").children();
					changeClass(el[cur_i]);
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

		function callScript(url, callback){
			$.ajax({
				async: false,
				dataType : "json",
				url: 'script.php',
				data: 'url='+ url,
				success: function(data) {
					callback(data);
				}
			});
		}
		function chooseUser(){
			callScript('http://imcs.dvgu.ru/cats/main.pl?f=users;sid='+sid+';cid='+cid+';json=1;', function(data){
				var users = {"login":[], "name":[],};
				for (var i = 0; i < data.length; ++i){
					if (data[i].ooc == 1)
						continue;
					users.login.push(data[i].login);
					users.name.push(data[i].name);
				}
				var str = '<p>Выберите свое имя из списка</p>'
				for (var i = 0; i < users.login.length; ++i){
					str += '<input type="radio" name="user_name" id="user_name_' + i + '" value="' + users.name[i] + '" ' + (i == 0 ? 'checked': '') + ' class="radioinput" />';
					str += '<label for="user_name_' + i + '">' + users.name[i] + '</label><br>';
				}
				cur_user = openprompt(str);
			});
		}
		function chooseProblem(){
			/*callScript('http://imcs.dvgu.ru/cats/main.pl?f=problems;sid='+sid+';cid='+cid+';json=1;', function(data){
				var problems = {"id":[], "name":[],};
				for (var i = 0; i < data.problems.length; ++i){
					problems.id.push(data.problems[i].id);
					problems.name.push(data.problems[i].name);
				}
				var str = '<p>Выберите задачу</p>'
				for (var i = 0; i < problems.id.length; ++i){
					str += '<input type="radio" name="problem_name" id="problem_name_' + problems.id[i] + '" value="' + problems.name[i] + '" class="radioinput" />';
					str += '<label for="problem_name_' + problems.id[i] + '">' + problems.name[i] + '</label><br>';
				}
				cur_problem = openprompt(str);});*/
			$.ajax({
				async: false,
				dataType : "json",
				url: 'main-12.pl',
				success: function(data) {
					var problems = {"id":[], "name":[],};
					for (var i = 0; i < data.problems.length; ++i){
						problems.id.push(data.problems[i].id);
						problems.name.push(data.problems[i].name);
					}
					var str = '<p>Выберите задачу</p>'
					for (var i = 0; i < problems.id.length; ++i){
						str += '<input type="radio" name="problem_name" id="problem_name_' + problems.id[i] + '" value="' + problems.name[i] + '" ' + (i == 0 ? 'checked': '') + ' class="radioinput" />';
						str += '<label for="problem_name_' + problems.id[i] + '">' + problems.name[i] + '</label><br>';
					}
					cur_problem = openprompt(str);
				}
			});
			
		}
		function openprompt(str){
			var temp = {
				state0 : {
					html:str,
					buttons: { Ok: 1, Cancel: 0 },
					focus: 0,
					submit:function(v,m,f){
						if(v == 0)
							$.prompt.close()
						else 
							return true;
						return false; 
					}
				}
			}	
			$.prompt(temp,{
					callback: function(v,m,f){
						$.each(f,function(i,obj){
							return obj;
						});	
					}
				});
		}
		document.cons_form.submit.onclick = function(){
			callScript('http://imcs.dvgu.ru/cats/main.pl?f=login;login=test;passwd=test;json=1;', function(data){
				if (data.status == "ok")
					sid = data.sid;
				else
					alert("Ошибка подключения к серверу. Попробуйте снова");
			});
			chooseProblem();
			chooseUser();
			var result = "";
			var cur_list = $("#sortable").sortable("toArray");
			for (var i = 1; i < cur_list.length - 1; ++i)
				result += "id" + i + "=" + cur_list[i] + "&";
			if (cur_list.length > 1)
				result += "id" + (cur_list.length - 1) + "=" + cur_list[cur_list.length - 1];
	
		}
	});
