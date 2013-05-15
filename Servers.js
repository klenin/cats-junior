define('Servers', ['jQuery', 'jQueryInherit', 'CallServer', 'AtHome'], function(){
	var CallServer = require('CallServer');
	
	
	var User = $.inherit({
		__constructor: function(login, pass, jury, name, id) {
			this.login = login;
			this.passwd = pass;
			this.jury = jury;
			this.name = name;
			this.id = id;
		},

		setPasswd: function(pass) {
			this.passwd = pass;
		}
	});

	var Session = $.inherit({
		__constructor: function(sid, cid) {
			this.sid = undefined;
			this.cid = undefined;
		},

		setCid: function(cid) {
			this.cid = cid;
		},

		setSid: function(sid) {
			this.sid = sid;
		}
	});


	var Server = $.inherit({
		__constructor: function() {
			
		},

		setSession: function(session) {
			this.session = session;
		},

		setUser: function(user) {
			this.user = user;
		},

		setCid: function(cid) {
			this.session.setCid(cid);
		},

		getCid: function() {
			return this.session.cid;
		},

		setSid: function(sid) {
			this.session.setSid(sid);
		},

		getSid: function() {
			return this.session.sid;
		},

		getUserId: function() {
			return this.user.id;
		},

		getUser: function() {
			return this.user;
		},

		submit: function() {
		},

		login: function(userLogin, userPass) {
			
		},

		logout: function() {
		},

		getUsersList: function() {
		},

		getContestsList: function() {
		},

		getProblems: function() {
		},

		getResults: function() {
		},

		getConsoleContent: function() {

		},

		getCode: function(rid) {

		}
	});

	var CATS = $.inherit(Server, {
		__constructor: function() {
			this.url = atHome ? 'http://imcs.dvgu.ru/cats/main.pl?' : '/cats/main.pl?';
			this.dataType = 'json';
			this.defaultPass = '12345';
			this.defaultCid = 791634;
		},

		submit: function(submitStr, problem_id, badSidCallback) {
			var self = this;
			CallServer.callScript(this.url + 'f=contests;filter=json;sid=' + self.getSid() + ';json=1;', function(data){
				if (data.error == 'bad sid'){
					badSidCallback();
				} 
				else {
					if (atHome){
						CallServer.callSubmit_('imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + self.getSid() + ';cid=' + self.getCid() +';', submitStr, function(data){
							alert(data.message ? data.message : 'Решение отослано на проверку');
						});  
					}
					else {
						var formData = new FormData();
				        formData.append('search', '');
				        formData.append('rows', 20);
				        formData.append('problem_id', problem_id);//
				        formData.append('de_id',772264);
				        formData.append('source_text', submitStr);
				        formData.append('submit', 'Send');
						CallServer.callSubmit(self.url + 'f=problems;sid=' + self.getSid() + ';cid=' + self.getCid()+ ';json=1;', formData, function(data){
							alert(data.message ? data.message :'Решение отослано на проверку');
						});
					}
				}
			});
		},

		login: function(userLogin, userPass, callback) {
			CallServer.callScript(this.url + 'f=login;login=' + userLogin + ';passwd=' + userPass +';json=1;', 
				function(data) {
					callback(data);
				}, 
				this.dataType);
		},

		logout: function(callback) {
			CallServer.callScript(this.url +'f=logout;sid=' + this.getSid() + ';json=1;', 
				function(data) {
					callback(data);
				}, 
				this.dataType);
		},

		getUsersList: function(callback) {
			CallServer.callScript(this.url +'f=users;cid=' + this.getCid() + ';rows=300;json=1;sort=1;sort_dir=0;', 
				function(data) {
					callback(data);
				}, 
				this.dataType);
		},

		getContestsList: function(callback) {
			CallServer.callScript(this.url + 'f=contests;filter=json;sort=1;sort_dir=1;json=1;', 
				function(data) {
					callback(data);
				}, 
				this.dataType);
		},

		getProblems: function(callback) {
			CallServer.callScript(this.url + 'f=problem_text;notime=1;nospell=1;noformal=1;cid=' + this.getCid() + ';nokw=1;json=1',
				function(data) {
					callback(data);
				},
				this.dataType);
		},

		getConsoleContent: function(callback){
			if (this.getCid() && this.getSid()){
				CallServer.callScript(this.url + 'f=console_content;cid=' + this.getCid() + ';sid=' + this.getSid() + 
					';uf=' + this.getUserId() +  ';i_value=-1;json=1',
					function(data) {
						callback(data);
					},
					this.dataType
				);
			}
		},

		getCode: function(rid, callback) {
			if (this.getCid() && this.getSid()){
				CallServer.callScript(this.url + 'f=download_source;cid=' + this.getCid() + ';sid=' + this.getSid() + 
					';rid=' + rid, 
					function(data){
							callback(data);
					},
					'text');
			}
		},

		getResultsUrl: function() {
			result = atHome ? 'http://imcs.dvgu.ru/cats/main.pl?f=rank_table_content;cid=' : '/cats/main.pl?f=rank_table_content;cid=';
			result += this.getCid();
			if (this.getSid()) {
				result += ';sid=' + this.getSid();
			}
			return result;
		}
	});

	var LocalServer = $.inherit(Server, {
		__constructor: function() {
			this.url = 'localServer.php';
			this.dataType = 'json';
			this.defaultPass = '12345';
			this.defaultCid = 791634;
		},

		submit: function(submitStr, problem_id, badSidCallback) {
			CallServer.callSubmit_('imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + self.getSid() + ';cid=' + self.getCid() +';', submitStr, function(data){
				alert(data.message ? data.message : 'Решение отослано на проверку');
			});  
		},

		sendRequest: function(url, data, callback) {
			$.ajax({
				async: false,
				url: url,
				data: data,
				dataType: 'json',
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
		},

		login: function(userLogin, userPass, callback) {
			this.sendRequest(this.url, '&action=login', function(data){
			});
		},

		logout: function(callback) {
			this.sendRequest(this.url, '&action=logout', function(data){
			});
		},

		getUsersList: function(callback) {
			this.sendRequest(this.url, '&action=getUsersList', function(data){
				callback(data);
			});
		},

		getContestsList: function(callback) {
			this.sendRequest(this.url, '&action=getContestsList', function(data){
				callback(data);
			});
		},

		getProblems: function(callback) {
			this.sendRequest(this.url, '&action=getProblems', function(data){
				callback(data);
			});
		},

		getConsoleContent: function(callback){
			this.sendRequest(this.url, '&action=getConsoleContent', function(data){
				callback(data);
			});
		},

		getCode: function(rid, callback) {
			this.sendRequest(this.url, '&action=getCode', function(data){
				callback(data);
			});
		},

		getResultsUrl: function() {
			return 'results.html';
		}
	});
	
	return {
		User: User,
		Session: Session,
		Server: Server,
		CATS: CATS,
		LocalServer: LocalServer
	};
});

