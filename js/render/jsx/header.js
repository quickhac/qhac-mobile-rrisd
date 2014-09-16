/** @jsx React.DOM */
'use strict';

(function () {
  
  var Button = Render.Button = React.createClass({
    displayName: 'button',
    render: function () {
      return (
        <div className='button' onClick={this.props.callback}>{this.props.label}</div>
      )
    }
  });
  
})();