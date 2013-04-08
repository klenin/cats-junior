define('Servers', ['jQuery', 'jQueryInherit', 'CallServer'], function(){
	var CallServer = require('CallServer');
	
	
	var User = $.inherit({
		__constructor: function(login, pass, jury, name) {
			this.login = login;
			this.passwd = pass;
			this.jury = jury;
			this.name = name;
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
			var self = this;
			CallServer.callScript(this.url + 'f=login;login=' + userLogin + ';passwd=' + userPass +';json=1;', 
				function(data) {
					self.onLogin(data);
					callback(data);
				}, 
				this.dataType);
		},

		logout: function(callback) {
			var self = this;
			CallServer.callScript(this.url +'f=logout;sid=' + this.getSid() + ';json=1;', 
				function(data) {
					self.onLogout(data);
					callback(data);
				}, 
				this.dataType);
		},

		getUsersList: function(callback) {
			var self = this;
			CallServer.callScript(this.url +'f=users;cid=' + this.getCid() + ';rows=300;json=1;sort=1;sort_dir=0;', 
				function(data) {
					self.onGetUsersList(data);
					callback(data);
				}, 
				this.dataType);
		},

		getContestsList: function(callback) {
			var self = this;
			CallServer.callScript(this.url + 'f=contests;filter=json;sort=1;sort_dir=1;json=1;', 
				function(data) {
					self.onGetContestsList(data);
					callback(data);
				}, 
				this.dataType);
		},

		getProblems: function(callback) {
			var self = this;
			CallServer.callScript(this.url + 'f=problem_text;notime=1;nospell=1;noformal=1;cid=' + this.getCid() + ';nokw=1;json=1',
				function(data) {
					self.onGetProblems(data);
					callback(data);
				},
				this.dataType);
		},

		onLogin: function(data) {
		},

		onLogout: function(data) {
			
		},

		onGetUsersList: function(data) {
		
		},

		onGetContestsList: function(data) {
		
		},
		
		onGetProblems: function(data) {
		
		}
	});

	return {
		User: User,
		Session: Session,
		Server: Server,
		CATS: CATS
	};
});

