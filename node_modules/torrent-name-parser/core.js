'use strict';

var EventEmitter = require('events').EventEmitter;

var Core = function() {
  EventEmitter.call(this);

  var parts;

  this.getParts = function() {
    return parts;
  };

  this.on('setup', function () {
    parts = {};
  });

  this.on('part', function (part) {
    parts[part.name] = part.clean;
  });
};

Core.prototype = Object.create(EventEmitter.prototype);
Core.prototype.constructor = EventEmitter;

Core.prototype.exec = function(name, customPatterns, customTypes) {
  this.emit('setup', {
    name: name
  }, {patterns: customPatterns, types:customTypes});
  this.emit('start');
  this.emit('end');

  return this.getParts();
};

Core.prototype.configure = function(customPatterns, customTypes) {
  this.emit('configure', {patterns: customPatterns, types: customTypes});
};

module.exports = new Core();
