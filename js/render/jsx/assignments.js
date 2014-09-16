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
				<tr className="assignment">
					<td className="name" ref="name">{asg.name}</td>
					<td className="due" ref="due">{RenderUtils.relativeDate(asg.date_due)}</td>
					<td className="grade" ref="grade">
						<span className="score">{RenderUtils.showMaybeNum(asg.score)}</span>
						<span className="aside">{showScoreAside(asg)}</span>
					</td>
					<td className="avg-grade" ref="avg-grade">{RenderUtils.showMaybeNum(asg.average_score)}</td>
				</tr>
			)
		}
	});

	var CategoryCard = Render.CategoryCard = React.createClass({
		displayName: 'CategoryCard',
		render: function () {
			var cat = this.props.category;
			return (
				<div className="category">
					<div className="card-title">
						<h2>{cat.name}</h2>
						<div className="weight">{RenderUtils.showMaybeNum(cat.weight, '× ')}</div>
						<div className="average">{RenderUtils.showMaybeNum(cat.percent)}</div>
					</div>
					<table className="assignments">
						<thead>
							<tr className="header">
								<th className="name">Assignment</th>
								<th className="due">Due</th>
								<th className="grade">Grade</th>
								<th className="avg-grade">Avg Grade</th>
							</tr>
						</thead>
						<tbody>
							{cat.assignments.map(function (asg) {
								return <AssignmentRow assignment={asg} />
							})}
						</tbody>
					</table>
				</div>
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
					<div className="course-view">
					</div> )

			return (
				<div className="course-view">
					<div className="header">
						<div className="vert">
							<h1>{course.name}</h1>
							<div className="updated">{RenderUtils.relativeDate(course.updated, 'Updated ') || 'No grades'}</div>
						</div>
						<div className="grade">{RenderUtils.showMaybeNum(course.grade)}</div>
					</div>
					{course.categories.map(function (cat) {
						return <CategoryCard category={cat} />
					})}
				</div>
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
        <div className='course-list-item' onClick={this.showCourse}>
          <div className='name'>{course.name}</div>
          <div className='grade'>{course.grade}</div>
        </div>
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
        <div className='course-list'>
          {RenderGlobals.grades.map(function (course) {
            return (
              <CourseListItem course={course} />
            )
          })}
        </div>
      )
    }
  });
  
})();