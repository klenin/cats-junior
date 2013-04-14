define('CallServer', ['jQuery', 'AtHome'], function(){
	function callScript(url, callback, dtype){
		if (atHome){
			$.ajax({
				async: false,
				url: 'script.php',
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
		else{
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
	}

	function callSubmit_(serv, path, submitData, callback){
		$.ajax({  
			async: false,
			url: 'submit.php',
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

	function callSubmit(url, formData, callback){
        if (atHome)
            return;
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

	return {
		callScript: callScript,
		callSubmit_: callSubmit_,
		callSubmit: callSubmit
	}
});

