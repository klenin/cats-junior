	$(document).ready(function(){
		$("#tabs").tabs();
		fillTabs();
		$("#tabs").tabs();
		document.title = "";
		curDir = startDir;
		//curX = problems[curProblem].start_x;
		//curY = problems[curProblem].start_y;
		life = problems[curProblem].start_life;
		pnts = problems[curProblem].start_points;
		var s = "#" + (curProblem* 10000 + curY * 100 + curX);
		$(s).append("<div class = '" + curDir + "'></div>");
		for (var k = 0; k < specSymbols[curProblem].style.length; ++k){
			s = "#" + (curProblem* 10000 + specSymbols[curProblem].coord.y[k] * 100 + specSymbols[curProblem].coord.x[k]);
			$(s).prepend("<div class = '" + specSymbols[curProblem].style[k] + "'></div>");
		}
		for (var k = 0; k < specSymbols[curProblem].symbol.length; ++k){
			s = "#" + (curProblem* 10000 + specSymbols[curProblem].path[k][0].y * 100 + specSymbols[curProblem].path[k][0].x);
			$(s).prepend("<div class = '" + specSymbols[curProblem].style[k] + "'></div>");
		}
		$( "ul, li" ).disableSelection();
		function callPlay(s){
			if ($("#sortable" + curProblem).sortable('toArray').length == 1 || dead)
				return;
			disableButtons();
			if (curI + 1 < $("#sortable" + curProblem).sortable('toArray').length){
				++curI;
				clearClasses();
			}
			else
				setDefault();
			setTimeout(function() { play(); }, s);
		}
		playClick = function(){
			callPlay(300);
		}
		fastClick = function(){
			callPlay(100);
		}
		clearClick = function(){
			setDefault();
			$('#sortable' + curProblem).children(":gt(0)").remove();
		}
		stopClick = function(){
			stopped = true;
			if (!playing){
				setDefault();
				clearClasses();
			}
		}
		pauseClick = function(){
			pause = true;
			enableButtons();
		}
		nextClick = function(){
			if ($("#sortable" + curProblem).sortable('toArray').length == 1)
				return;
			disableButtons();
			if (curI + 1 < $("#sortable" + curProblem).sortable('toArray').length){
				if (curList.length > curI){
					var el = $("#sortable" + curProblem).children();
					changeClass(el[curI]);
				}
				++curI;
				play(1);
			}
			else
				enableButtons();			
		}
		prevClick = function(){
			disableButtons();
			if(curI == 0 || curList[curI - 1] == "")
				setDefault();
			else if (curI > 0){
				var t = curI;
				setDefault(true);
				var s = speed;
				speed = 0;
				play(t);
				speed = s;
			}
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
			callScript('http://imcs.dvgu.ru/cats/main.pl?f=problems;sid='+sid+';cid='+cid+';json=1;', function(data){
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
				curProblem = openprompt(str);});
			/*$.ajax({
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
					curProblem = openprompt(str);
				}
			});*/			
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
		submitClick = function(){
			callScript('http://imcs.dvgu.ru/cats/main.pl?f=login;login=test;passwd=test;json=1;', function(data){
				if (data.status == "ok")
					sid = data.sid;
				else
					alert("Ошибка подключения к серверу. Попробуйте снова");
			});
			chooseProblem();
			chooseUser();
			var result = "";
			var curList = $("#sortable" + curProblem).sortable("toArray");
			for (var i = 1; i < curList.length - 1; ++i)
				result += "id" + i + "=" + curList[i] + "&";
			if (curList.length > 1)
				result += "id" + (curList.length - 1) + "=" + curList[curList.length - 1];
	
		}
	});
