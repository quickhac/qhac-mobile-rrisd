'use strict';

var Retrieve = function () {

	// constants
	var loginUrl = 'https://accesscenter.roundrockisd.org/HomeAccess/Account/LogOn?ReturnUrl=%2fhomeaccess%2f',
		validateLoginPage = function (doc) { return !!$(doc).find('form').length; },
		validateAfterLogin = function (doc) { return !!$(doc).find('#MainContent').length; },

		selectStudentUrl = 'https://accesscenter.roundrockisd.org/HomeAccess/Frame/StudentPicker',
		postSelectUrl = '/HomeAccess/Home/WeekView',
		validateSelectStudent = function (doc) { return !!$(doc).find('form#StudentPicker').length; },
		selectStudentRequired = function (doc) {
			var buttons = $(doc).find('.sg-button'),
				len = buttons.length;
			for (var i = 0; i < len; i++)
				if (buttons[i].innerText.indexOf('Change Student') !== -1)
					return true;
			return false;
		},
		getSelectStudentChoices = function (doc) {
			return [].map.call($(doc).find('.sg-student-picker-row'), function (elem, idx) {
				var $elem = $(elem);
				return {
					name: $elem.find('.sg-picker-student-name').eq(0).text(),
					studentId: $elem.find('input[name=studentId]').eq(0).val()
				};
			});
		},

		gradesUrl = 'https://accesscenter.roundrockisd.org/HomeAccess/Content/Student/Assignments.aspx',
		validateGrades = function (doc) { return !!$(doc).find('.AssignmentClass').length; };

	// parses text into a DOM
	var parse = function(doc) {
		return (new DOMParser()).parseFromString(doc, "text/html");
	}

	// returns a function that passes the right error message for a jqXHR to
	// the reject function given
	function handleError (reject) {
		return function (jqXHR, textStatus, errorThrown) {
			switch (textStatus) {
				case 'timeout':
					reject(new Error('Request timed out. Please check your Internet connection.'));
					break;
				case 'error':
					reject(new Error('An error occurred during the request.'));
					break;
				default:
			}
		}
	}

	// instance variables
	var me = this,
		username,
		password,
		lastResponseTime;

	this.login = function (u, p) {
		return new Promise(function (resolve, reject) {
			username = u;
			password = p;

			$.ajax({
				url: loginUrl
			}).done(sendLoginQuery).fail(handleError(reject));

			function sendLoginQuery (doc) {
				if (!validateLoginPage(parse(doc)))
					reject(new Error('Login page not valid.'));
				
				$.ajax({
					type: 'POST',
					url: loginUrl,
					data: {
						'Database': 10,
						'LogOnDetails.UserName': u,
						'LogOnDetails.Password': p
					}
				}).done(postLogin).fail(handleError(reject));
			}

			function postLogin (doc) {
				if (!validateAfterLogin(parse(doc))) {
					reject(new Error('Could not validate page after login.'));
					return;
				}

				me.lastResponseTime = +new Date();

				// only return choices if there are any; the success callback
				// should detect whether the disambiguation choices array is null
				// or not.
				if (selectStudentRequired(doc))
					$.ajax({
						url: selectStudentUrl
					}).done(resolveChoice).fail(handleError(reject));
				else
					resolve(doc);
			}

			function resolveChoice(doc) {
				if (!validateSelectStudent(parse(doc))) {
					reject(new Error('Could not validate student picker.'));
					return;
				}

				me.lastResponseTime = +new Date();

				resolve(getSelectStudentChoices(doc));
			}
		});
	}

	this.selectStudent = function (studentId) {
		return new Promise(function (resolve, reject) {
			me.assureLoggedIn().then(sendSelectRequest, reject);

			function sendSelectRequest() {
				$.ajax({
					type: 'POST',
					url: selectStudentUrl,
					data: {
					  'studentId': studentId,
					  'url': postSelectUrl
					}
				}).done(_resolve).fail(handleError(reject));
			}

			function _resolve (doc) {
				if (!validateAfterLogin(parse(doc))) {
					reject(new Error('Could not validate page after selecting student.'));
					return;
				}

				me.lastResponseTime = +new Date();
				resolve(doc);
			}
		});
	}

	this.getGrades = function (query) {
		return new Promise(function (resolve, reject) {
			if (query)
				// POST request grades for a specific marking period
				$.ajax({
					type: 'POST',
					data: query,
					url: gradesUrl
				}).done(_resolve).fail(handleError(reject));
			else
				// get whatever grades page is accepted
				$.ajax({
					url: gradesUrl
				}).done(_resolve).fail(handleError(reject));

			function _resolve (doc) {
				if (!validateGrades(parse(doc))) {
					reject(new Error('Could not validate grades page.'));
					return;
				}

				me.lastResponseTime = +new Date();
				resolve(doc);
			}
		});
	}

	this.assureLoggedIn = function () {
		return new Promise(function (resolve, reject) {
			if (lastResponseTime && lastResponseTime + 1000 * 60 * 9 >= +new Date()){
				this.login(username, password).then(resolve, reject);
			} else {
				resolve();
			}
		});
	}
}