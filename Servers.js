define('Servers', ['jQuery', 'jQueryInherit', 'CallServer'], function(){
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

		authenticateBySid: function (sid, callback) {
			console.warn('authenticateBySid is not implemented');
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

		setContestById: function(cid, callback) {
			for (var i = 0; i < this.contests.length; ++i) {
				if (cid === this.contests[i].cid) {
					this.setContest(this.contests[i]);
					callback(this.getContest());
					return true;
				}
			}
			return false;
		},

		setContestByName: function(name, callback) {
			for (var i = 0; i < this.contests.length; ++i){
				if (name == this.contests[i].name){
					this.setContest(this.contests[i]);
					callback(this.getContest());
					return true;
				}
			}
			return false;
		}
	});

	var CATS = $.inherit(Server, {
		__constructor: function(options = {}) {
			this.baseUrl = options.baseUrl ? options.baseUrl : '';
			this.url = this.baseUrl + '/cats/main.pl?';
			this.dataType = 'json';
			this.defaultPass = '12345';
			this.defaultCid = 791634;
		},

		_submitRequest: function(submitStr, problem_id) {
			var formData = new FormData();
			formData.append('rows', 20);
			formData.append('problem_id', problem_id);//
			formData.append('de_id',772264);
			formData.append('source_text', submitStr);
			formData.append('submit', 1);
			CallServer.callSubmit(this.url + 'f=problems;json=1;sid=' + this.getSid() + ';cid=' + this.getCid(), formData, function(data){
				alert(data.message ? data.message :'Решение отослано на проверку');
			});
		},

		sendServerRequest: function(url, callback, dtype) {
			CallServer.callScript(url.replace(/;$/, '') + ';json=1', callback, dtype);
		},

		submitRequest: function(submitStr, problem_id, badSidCallback) {
			var self = this;
			this.sendServerRequest(this.url + 'f=contests;filter=json;sid=' + this.getSid(), function(data){
				if (data.error == 'bad sid'){
					badSidCallback();
				}
				else {
					self._submitRequest(submitStr, problem_id);
				}
			});
		},

		loginRequest: function(userLogin, userPass, callback) {
			this.sendServerRequest(this.url + 'f=login;login=' + userLogin + ';passwd=' + userPass,
				function(data) {
					callback(data);
				},
				this.dataType);
		},

		logoutRequest: function(callback) {
			this.sendServerRequest(this.url +'f=logout;sid=' + this.getSid(),
				function(data) {
					callback(data);
				},
				this.dataType);
		},

		authenticateBySid: function (sid, success, error) {
			var self = this;
			this.sendServerRequest(
				this.url + 'f=profile;sid=' + sid,
				function (data) {
					if (data.status == 'bad sid') {
						if (error) {
							error(data);
						}
					}
					else {
						self.setSid(sid);
						self.setUser(new User(data.login, undefined, false, data.name, data.id));

						if (success)
							success(data);
					}
				},
				this.dataType
			);
		},

		usersListRequest: function(callback) {
			var self = this;
			this.sendServerRequest(this.url +'f=users;cid=' + this.getCid() + ';rows=300;sort=0;sort_dir=0',
				function(data) {
					self.onUsersListRequest(data);
					callback(data);
				},
				this.dataType);
		},

		contestsListRequest: function(callback) {
			var self = this;

			var requestUrl = this.url + 'f=contests;filter=json;sort=Sd;sort_dir=1;';
			var sid = this.getSid();
			if (sid) {
				requestUrl += 'sid=' + sid;
			}

			this.sendServerRequest(requestUrl, function(data) {
				self.onContestsListRequest(data);
				if (callback)
					callback(data);
			}, this.dataType);
		},

		problemsListRequest: function(callback) {
			var requestUrl = this.url + 'f=problem_text;notime=1;nospell=1;noformal=1;cid=' + this.getCid() + ';nokw=1';
			var sid = this.getSid();
			if (sid) {
				requestUrl += ';sid=' + sid;
			}
			this.sendServerRequest(requestUrl, function(data) {
				if (callback)
					callback(data);
			}, this.dataType);
		},

		consoleContentRequest: function(callback){
			if (this.getCid() && this.getSid()){
				this.sendServerRequest(this.url + 'f=console_content;cid=' + this.getCid() + ';sid=' + this.getSid() +
					';uf=' + this.getUserId() +  ';i_value=-1',
					function(data) {
						callback(data);
					},
					this.dataType
				);
			}
		},

		codeRequest: function(rid, callback) {
			if (this.getCid() && this.getSid()){
				this.sendServerRequest(this.url + 'f=download_source;cid=' + this.getCid() + ';sid=' + this.getSid() +
					';rid=' + rid,
					function(data){
							callback(data);
					},
					'text');
			}
		},

		getResultsUrl: function() {
			var result = this.url + 'f=rank_table_content;cid=' + this.getCid();
			var sid = this.getSid();
			if (sid) {
				result += ';sid=' + sid;
			}
			return result;
		}
	});

	var CATSJsonp = $.inherit(CATS, {
		__constructor: function() {
			this.url = 'https://imcs.dvfu.ru/cats/main.pl?';
			this.dataType = 'jsonp';
		},

		_submitRequest: function(submitStr, problemId) {
			var requestData = {
				f: 'problems',
				search: '',
				rows: 20,
				problem_id: problemId,
				de_id: 772264,
				source_text: submitStr,
				submit: '',
				sid: this.getSid(),
				cid: this.getCid()
			};

			CallServer.callSubmitJsonp(this.url, requestData, function(data) {
				alert(data.message ? data.message :'Решение отослано на проверку');
			});
		},

		sendServerRequest: function(url, callback, dtype) {
			CallServer.callScriptJsonp(url, callback, dtype);
		}
	});

	var LocalServer = $.inherit(Server, {
		__constructor: function() {
			this.dataType = 'json';
			this.defaultPass = '12345';
			this.defaultCid = 791634;
			var args = parseArgs();
			this.usersFile = (args['users'] ? args['users'] : 'LocalServerFiles/users') + '.json';
			this.contestsFile = (args['contests'] ? args['contests'] : 'LocalServerFiles/contests') + '.json';
			this.problemsFile = (args['problems'] ? args['problems'] : 'LocalServerFiles/problems') + '.json';
		},

		submitRequest: function(submitStr, problem_id, badSidCallback) {
			console.log('submitting for local server is unsupported');
			alert(data.message ? data.message : 'Решение отослано на проверку');
		},

		sendRequest: function(url, callback) {
			$.ajax({
				url: url,
				dataType: 'json',
				beforeSend: function(req) { req.overrideMimeType('application/json'); },
				success: function(data){
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
			console.log('login for local server is unsupported');
			alert('login for local server is unsupported');
		},

		logoutRequest: function(callback) {
			console.log('logout for local server is unsupported');
		},

		usersListRequest: function(callback) {
			var self = this;
			this.sendRequest(this.usersFile, function(data){
				self.onUsersListRequest(data);
				callback(data);
			});
		},

		contestsListRequest: function(callback) {
			var self = this;
			this.sendRequest(this.contestsFile, function(data){
				self.onContestsListRequest(data);
				callback(data);
			});
		},

		problemsListRequest: function(callback) {
			this.sendRequest(this.problemsFile, function(data){
				callback(data);
			});
		},

		consoleContentRequest: function(callback){
			console.log('getting content of console for local server is unsupported');
			alert('getting content of console for local server is unsupported');
		},

		codeRequest: function(rid, callback) {
			console.log('getting code for local server is unsupported');
			alert('getting code for local server is unsupported');
		},

		getResultsUrl: function() {
			return 'LocalServerFiles/results.html';
		}
	});

	return {
		User: User,
		Session: Session,
		Server: Server,
		CATS: CATS,
		CATSJsonp: CATSJsonp,
		LocalServer: LocalServer
	};
});
