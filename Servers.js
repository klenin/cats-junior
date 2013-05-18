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
		},

		getId: function() {
			return this.id;
		},

		getName: function() {
			return this.name;
		}
	});

	var Contest = $.inherit({
		__constructor: function(name, cid) {
			this.name = name;
			this.cid = cid;
		},

		getName: function() {
			return this.name;
		},

		getCid: function() {
			return this.cid;
		}
	});

	var Session = $.inherit({
		__constructor: function(sid, contest) {
			this.sid = sid;
			this.contest = contest;
		},

		setContest: function(contest) {
			this.contest = contest;
		},

		getContest: function() {
			return this.contest;
		},

		setSid: function(sid) {
			this.sid = sid;
		},

		getCid: function() {
			return this.contest.getCid();
		},

		getSid: function() {
			return this.sid;
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

		setContest: function(contest) {
			this.session.setContest(contest);
		},

		getContest: function() {
			return this.session.getContest();
		},

		getCid: function() {
			return this.session.getCid();
		},

		setSid: function(sid) {
			this.session.setSid(sid);
		},

		getSid: function() {
			return this.session.getSid();
		},

		getUserId: function() {
			return this.user.getId();
		},

		getUser: function() {
			return this.user;
		},

		submitRequest: function() {
		},

		loginRequest: function(userLogin, userPass) {
			
		},

		logoutRequest: function() {
		},

		usersListRequest: function() {
		},

		contestsListRequest: function() {
		},

		problemsListRequest: function() {
		},

		consoleContentRequest: function() {

		},

		codeRequest: function(rid) {

		},

		onUsersListRequest: function(data) {
			this.users = [];
			for (var i = 0; i < data.length; ++i){
				if (data[i].ooc == 1)
					continue;
				this.users.push(new User(data[i].login, this.defaultPass, data[i].jury, data[i].name, data[i].account_id));
			}
		},

		getUsers: function() {
			return this.users;
		},

		setUserByName: function(name, callback) {
			this.setSid(undefined);
			for (var i = 0; i < this.users.length; ++i) {
				if (name == this.users[i].getName()){
					currentServer.setUser(this.users[i]);
					callback(this.getUser());
					return true;
				}
			}
			return false;
		},

		onContestsListRequest: function(data) {
			this.contests = [];
			for (var i = 0; i < data.contests.length; ++i) {
				this.contests.push(new Contest(data.contests[i].name, data.contests[i].id));
			}
			this.setContest(this.contests[0]);
		},

		getContests: function() {
			return this.contests;
		},

		setContestByName: function(name, callback) {
			for (var i = 0; i < this.contests.length; ++i){
				if (name == this.contests[i].name){
					this.setContest(this.contests[i]);
					callback(this.contest);
					return true;
				}
			}
			return false;
		}
	});

	var CATS = $.inherit(Server, {
		__constructor: function() {
			this.url = atHome ? 'http://imcs.dvgu.ru/cats/main.pl?' : '/cats/main.pl?';
			this.dataType = 'json';
			this.defaultPass = '12345';
			this.defaultCid = 791634;
		},

		submitRequest: function(submitStr, problem_id, badSidCallback) {
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
				        formData.append('submitRequest', 'Send');
						CallServer.callSubmit(self.url + 'f=problems;sid=' + self.getSid() + ';cid=' + self.getCid()+ ';json=1;', formData, function(data){
							alert(data.message ? data.message :'Решение отослано на проверку');
						});
					}
				}
			});
		},

		loginRequest: function(userLogin, userPass, callback) {
			CallServer.callScript(this.url + 'f=login;login=' + userLogin + ';passwd=' + userPass +';json=1;', 
				function(data) {
					callback(data);
				}, 
				this.dataType);
		},

		logoutRequest: function(callback) {
			CallServer.callScript(this.url +'f=logout;sid=' + this.getSid() + ';json=1;', 
				function(data) {
					callback(data);
				}, 
				this.dataType);
		},

		usersListRequest: function(callback) {
			var self = this;
			CallServer.callScript(this.url +'f=users;cid=' + this.getCid() + ';rows=300;json=1;sort=1;sort_dir=0;', 
				function(data) {
					self.onUsersListRequest(data);
					callback(data);
				}, 
				this.dataType);
		},

		contestsListRequest: function(callback) {
			var self = this;
			CallServer.callScript(this.url + 'f=contests;filter=json;sort=1;sort_dir=1;json=1;', 
				function(data) {
					self.onContestsListRequest(data);
					callback(data);
				}, 
				this.dataType);
		},

		problemsListRequest: function(callback) {
			CallServer.callScript(this.url + 'f=problem_text;notime=1;nospell=1;noformal=1;cid=' + this.getCid() + ';nokw=1;json=1',
				function(data) {
					callback(data);
				},
				this.dataType);
		},

		consoleContentRequest: function(callback){
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

		codeRequest: function(rid, callback) {
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

		submitRequest: function(submitStr, problem_id, badSidCallback) {
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

		loginRequest: function(userLogin, userPass, callback) {
			this.sendRequest(this.url, '&action=loginRequest', function(data){
			});
		},

		logoutRequest: function(callback) {
			this.sendRequest(this.url, '&action=logoutRequest', function(data){
			});
		},

		usersListRequest: function(callback) {
			var self = this;
			this.sendRequest(this.url, '&action=usersListRequest', function(data){
				self.onUsersListRequest(data);
				callback(data);
			});
		},

		contestsListRequest: function(callback) {
			var self = this;
			this.sendRequest(this.url, '&action=contestsListRequest', function(data){
				self.onContestsListRequest(data);
				callback(data);
			});
		},

		problemsListRequest: function(callback) {
			this.sendRequest(this.url, '&action=problemsListRequest', function(data){
				callback(data);
			});
		},

		consoleContentRequest: function(callback){
			this.sendRequest(this.url, '&action=consoleContentRequest', function(data){
				callback(data);
			});
		},

		codeRequest: function(rid, callback) {
			this.sendRequest(this.url, '&action=codeRequest', function(data){
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

