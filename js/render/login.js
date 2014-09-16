/** @jsx React.DOM */
'use strict';

(function () {

  var LoginPrompt = Render.LoginPrompt = React.createClass({
    displayName: 'LoginPrompt',
    login: function () {
      var username = this.refs.username.getDOMNode().value,
        password = this.refs.password.getDOMNode().value;
      
      retrieve.login(username, password).then(this.postLogin, function (e) { console.log(e.message); debugger; });
      
      return false;
    },
    postLogin: function (data) {
      if (typeof data === 'object') {
        // choose a student
        Render.render(SelectStudentPrompt({choices: data, retView: 'login'}));
      } else {
        retriever.getGrades().then(function (grades) {
          Render.cacheGrades(grades);
          Render.render(Render.CourseList());
        })
      }
    },
    componentDidMount: function () {
      Render.setHeader('Login');
    },
    render: function () {
      return (
        React.DOM.form({className: "login", onSubmit: this.login}, 
          React.DOM.div({className: "prompt"}, "Log on to Home Access Center"), 
          React.DOM.input({type: "text", ref: "username"}), 
          React.DOM.input({type: "password", ref: "password"}), 
          React.DOM.input({type: "submit", value: "Login"})
        )
      )
    }
  });
  
  var SelectStudentPrompt = Render.SelectStudentPrompt = React.createClass({
    displayName: 'SelectStudentPrompt',
    select: function () {
      var student = $('.student-wrapper [name=student]:checked').eq(0).val();
      
      RenderGlobals.studentId = student;
      retrieve.selectStudent(student).then(this.postSelect, function (e) { console.log(e.message); debugger; });
      
      return false;
    },
    postSelect: function (data) {
      retrieve.getGrades().then(function (grades) {
        Render.cacheGrades(grades);
        Render.render(Render.CourseList());
      }, function (e) { debugger; })
    },
    componentDidMount: function () {
      var retView = this.props.retView == 'login' ? LoginPrompt() : Render.CourseList({courses: RenderGlobals.grades});
      Render.setHeader(
        'Select student',
        Render.Button({
          label: 'Cancel',
          callback: function () { Render.render(retView); }}),
        Render.Button({
          label: 'Select',
          callback: this.select.bind(this) }));
    },
    render: function () {
      var choices = this.props.choices;
      return (
        React.DOM.form({className: "select-student", onSubmit: this.select}, 
          choices.map(function (choice, i) {
            return (
              React.DOM.div({className: "student-wrapper"}, 
                React.DOM.input({type: "radio", name: "student", id: 'student-'+i, value: choice.studentId}), 
                React.DOM.label({htmlFor: 'student-'+i}, choice.name)
              )
            )
          }), 
          React.DOM.input({type: "submit", value: "Select"})
        )
      )
    }
  })

})();