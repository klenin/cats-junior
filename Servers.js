var Server = $.inherit({
	__constructor: function() {
		
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
	},

	submit: function(submitStr, problem_id, badSidCallback) {
		var self = this;
		callScript(this.url + 'f=contests;filter=json;sid=' + sid + ';json=1;', function(data){
			if (data.error == 'bad sid'){
				badSidCallback();
			} 
			else {
				if (atHome){
					callSubmit_('imcs.dvgu.ru', '/cats/main.pl?f=problems;sid=' + sid + ';cid=' + cid +';', submitStr, function(data){
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
					callSubmit(self.url + 'f=problems;sid=' + sid + ';cid=' + cid+ ';json=1;', formData, function(data){
						alert(data.message ? data.message :'Решение отослано на проверку');
					});
				}
			}
		});
	},

	login: function(userLogin, userPass, callback) {
		var self = this;
		callScript(this.url + 'f=login;login=' + userLogin + ';passwd=' + userPass +';json=1;', 
			function(data) {
				self.onLogin(data);
				callback(data);
			}, 
			this.dataType);
	},

	logout: function(callback) {
		var self = this;
		callScript(this.url +'f=logout;sid=' + sid + ';json=1;', 
			function(data) {
				self.onLogout(data);
				callback(data);
			}, 
			this.dataType);
	},

	getUsersList: function(callback) {
		var self = this;
		callScript(this.url +'f=users;cid=' + cid + ';rows=300;json=1;sort=1;sort_dir=0;', 
			function(data) {
				self.onGetUsersList(data);
				callback(data);
			}, 
			this.dataType);
	},

	getContestsList: function(callback) {
		var self = this;
		callScript(this.url + 'f=contests;filter=json;sort=1;sort_dir=1;json=1;', 
			function(data) {
				self.onGetContestsList(data);
				callback(data);
			}, 
			this.dataType);
	},

	getProblems: function(callback) {
		var self = this;
		callScript(this.url + 'f=problem_text;notime=1;nospell=1;noformal=1;cid=' + cid + ';nokw=1;json=1',
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
	
	},
});
