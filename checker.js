	function checkCell(i){
		life += problem.d_life;
		for (var k = 0; k < element.list.length; ++k){
			if (cur_map[cur_y][cur_x] == element.list[k]){
				++element.cur_count[k];
				switch(element["do"][k]){
					case "e":
						if (element.cur_count[k] == element.count[k])
							$("#cons").append("Шаг " + (cur_list[0] == "" ? i : i + 1) + ": Нашли все артефакты '" + element.names[k] + "' \n");
						else
							$("#cons").append("Шаг " + (cur_list[0] == "" ? i : i + 1) + ": Нашли артефакт '" +element.names[k] + "', " + element.cur_count[k] +"-й \n");
							break;
					case "m": //ящик, сможем пододвинуть, если за ним пусто
						var t_x = cur_x + dx;
						var t_y = cur_y + dy;
						if (cur_map[t_y][t_x] != '.'){
							$("#cons").append("Шаг " + (cur_list[0] == "" ? i : i + 1) + ": Не можем пододвинуть \n");
							return false;
						}
						else{
							s = '#' + (t_y * 100 + t_x);
							$(s).empty();
							$(s).append("<div class = '" + element.style[k] + "'></div>");
							cur_map[t_y][t_x] = cur_map[cur_y][cur_x];
						}
				}
				cur_map[cur_y][cur_x] = '.';
				s = '#' + (cur_y * 100 + cur_x);
				$(s).empty();
				life += element.d_life[k];
				pnts += element.pnts[k];
				break;
			}
		}
		if (life == 0){
			$("#cons").append("Количество жизней = 0. Попробуйте снова \n");
			return false;
		}
		return true;
	}