/** @jsx React.DOM */
'use strict';

(function () {
  
  Render.cacheGrades = function (doc) {
    var dom = parse(doc);
    
    // hack; hide hidden asterisks so they don't show up in innerText of assignment names
		$(doc).find('.sg-asp-table-data-row label[style$="display:none"]').text('');
		
    var grades = AssignmentParser.parse(dom),
      mpInfo = AssignmentParser.getMarkingPeriodInfo(dom),
      aspState = AssignmentParser.getASPState(dom);
    
    // set the event target so we can select a marking period later
    aspState['__EVENTTARGET'] = 'ctl00$plnMain$btnRefreshView';
    
    RenderGlobals.grades = grades;
    RenderGlobals.currMP = mpInfo[0];
    RenderGlobals.maxMP = mpInfo[1];
    RenderGlobals.gradesASPState = aspState;
  }
  
	function showScoreAside(asg) {
		var max_pts = asg.total_points,
			weight = asg.weight,
			asides = [''];

		if (!isNaN(max_pts) && max_pts !== 100)
			asides.push('/ ' + max_pts);
		if (!isNaN(weight) && weight !== 1)
			asides.push('× ' + weight);

		return asides.join(' ');
	}
	
	var AssignmentRow = Render.AssignmentRow = React.createClass({
		displayName: 'AssignmentRow',
		render: function () {
			var asg = this.props.assignment;
			return (
				React.DOM.tr({className: "assignment"}, 
					React.DOM.td({className: "name", ref: "name"}, asg.name), 
					React.DOM.td({className: "due", ref: "due"}, RenderUtils.relativeDate(asg.date_due)), 
					React.DOM.td({className: "grade", ref: "grade"}, 
						React.DOM.span({className: "score"}, RenderUtils.showMaybeNum(asg.score)), 
						React.DOM.span({className: "aside"}, showScoreAside(asg))
					), 
					React.DOM.td({className: "avg-grade", ref: "avg-grade"}, RenderUtils.showMaybeNum(asg.average_score))
				)
			)
		}
	});

	var CategoryCard = Render.CategoryCard = React.createClass({
		displayName: 'CategoryCard',
		render: function () {
			var cat = this.props.category;
			return (
				React.DOM.div({className: "category"}, 
					React.DOM.div({className: "card-title"}, 
						React.DOM.h2(null, cat.name), 
						React.DOM.div({className: "weight"}, RenderUtils.showMaybeNum(cat.weight, '× ')), 
						React.DOM.div({className: "average"}, RenderUtils.showMaybeNum(cat.percent))
					), 
					React.DOM.table({className: "assignments"}, 
						React.DOM.thead(null, 
							React.DOM.tr({className: "header"}, 
								React.DOM.th({className: "name"}, "Assignment"), 
								React.DOM.th({className: "due"}, "Due"), 
								React.DOM.th({className: "grade"}, "Grade"), 
								React.DOM.th({className: "avg-grade"}, "Avg Grade")
							)
						), 
						React.DOM.tbody(null, 
							cat.assignments.map(function (asg) {
								return AssignmentRow({assignment: asg})
							})
						)
					)
				)
			)
		}
	});

	var CourseView = Render.CourseView = React.createClass({
		displayName: 'CourseView',
		componentDidMount: function () {
		  Render.setHeader(
		    this.props.course.name,
		    Render.Button({ label: 'Back', callback: function () {
		      Render.render(CourseList());
		    }}))
		},
		render: function () {
			var course = this.props.course;
			if (course === undefined || course === null)
				return (
					React.DOM.div({className: "course-view"}
					) )

			return (
				React.DOM.div({className: "course-view"}, 
					React.DOM.div({className: "header"}, 
						React.DOM.div({className: "vert"}, 
							React.DOM.h1(null, course.name), 
							React.DOM.div({className: "updated"}, RenderUtils.relativeDate(course.updated, 'Updated ') || 'No grades')
						), 
						React.DOM.div({className: "grade"}, RenderUtils.showMaybeNum(course.grade))
					), 
					course.categories.map(function (cat) {
						return CategoryCard({category: cat})
					})
				)
			)
		}
	});
  
  var CourseListItem = Render.CourseListItem = React.createClass({
    displayName: 'CourseListItem',
    showCourse: function () {
      Render.render(CourseView({course: this.props.course}));
    },
    render: function () {
      var course = this.props.course;
      return (
        React.DOM.div({className: "course-list-item", onClick: this.showCourse}, 
          React.DOM.div({className: "name"}, course.name), 
          React.DOM.div({className: "grade"}, course.grade)
        )
      )
    }
  })
  
  var CourseList = Render.CourseList = React.createClass({
    displayName: 'CourseList',
    componentDidMount: function () {
      Render.setHeader(
        'Grades',
        Render.Button({
          label: 'Logout',
          callback: function () {
            Render.initGlobals();
            Render.render(Render.LoginPrompt());
          } }),
        Render.Button({
          label: 'Refresh',
          callback: function () {
            retrieve.getGrades().then(function (grades) {
              Render.cacheGrades(grades);
              Render.render(CourseList());
            })
          }}));
    },
    render: function () {
      return (
        React.DOM.div({className: "course-list"}, 
          RenderGlobals.grades.map(function (course) {
            return (
              CourseListItem({course: course})
            )
          })
        )
      )
    }
  });
  
})();