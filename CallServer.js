define('CallServer', ['jQuery'], function(){
	function callScriptLocally(url, callback, dtype, scriptPath) {
		$.ajax({
			async: false,
			url: scriptPath,
			data: 'url='+ url,
			dataType: dtype,
			success: function(data){
				//data = data.replace(new RegExp( "\t", "g" ), ' ');
				//var d = $.evalJSON(data);
				callback(data);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if(url.search('rank_table_content') == -1){
					alert('Ошибка подключения к серверу');
				}
				console.error(jqXHR, textStatus, errorThrown);
			}
		});
	}

	function callScript(url, callback, dtype){
		$.ajax({
			async: false,
			dataType : dtype,
			url: url,
			success: callback,
			error: function(jqXHR, textStatus, errorThrown) {
				if(url.search('rank_table_content') == -1){
					alert('Ошибка подключения к серверу');
				}
			}
		});
	}

	function callSubmitLocally(serv, path, submitData, callback, scriptPath){
		$.ajax({
			async: false,
			url: scriptPath,
			type: 'POST',
			data: 'serv='+ serv + '&' + 'path=' + path + '&' + submitData,
			success: function(data){
				callback(data);
			},
			error: function(data){
				alert(data);
			}
		});
	}

	function callScriptJsonp(url, callback, dtype) {
		$.ajax({
			url: url + '&json=?',
			jsonp: 'json',
			dataType: dtype,
			success: callback,
			error: function(xhr, status, error) {
				console.log(error);
				alert('Ошибка подключения к серверу');
			}
		});
	}

	function callSubmit(url, formData, callback){
        $.ajax({
                async: false,
                url: url,
                type: 'POST',
                processData: false,
                contentType: false,
                data: formData,
                success: callback,
                error: function(r, err1, err2){
                        alert('Ошибка подключения к серверу');
                }
        });
	}

	function callSubmitJsonp(url, params, callback) {
		$.ajax({
			url: url + 'json=?',
			jsonp: 'json',
			dataType: 'jsonp',
			data: params,
			success: callback,
			error: function(xhr, status, error) {
				console.log(error);
				alert('Ошибка подключения к серверу');
			}
		});
	}

	return {
		callScript: callScript,
		callSubmitLocally: callSubmitLocally,
		callSubmit: callSubmit,
		callScriptLocally: callScriptLocally,
		callScriptJsonp: callScriptJsonp,
		callSubmitJsonp: callSubmitJsonp
	}
});

