'use strict';

chrome.runtime.getBackgroundPage(function (page) {
  window.backgroundPage = page;
  window.retrieve = page.retrieve;
});

// parses text into a DOM
var parse = function(doc) {
	return (new DOMParser()).parseFromString(doc, "text/html");
}

var Render = {};

Render.initGlobals = function () {
  window.RenderGlobals = {
    username: null,
    password: null,
    studentId: null,
    grades: null,
    currMP: null,
    maxMP: null,
    gradesASPState: null,
    attendanceASPState: null
  };
}

Render.initGlobals();
  
Render.render = function (mainComponent) {
  React.renderComponent(mainComponent, $('main')[0]);
}

Render.setHeader = function(title, leftButton, rightButton) {
  if (title) $('header > .center').text(title);
  else $('header > .center').text('');
  
  if (leftButton) React.renderComponent(leftButton, $('header > .left')[0]);
  else $('header > .left').html('');
  
  if (rightButton) React.renderComponent(rightButton, $('header > .right')[0]);
  else $('header > .right').html('');
}

$(function () {
  React.renderComponent(Render.LoginPrompt(), $('main')[0]);
});