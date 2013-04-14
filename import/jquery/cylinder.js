
jQuery(function() {
  $.cylinder = function(element, options) {
    var state;
    state = '';
    this.settings = {};
    this.$element = $(element);
    this.setState = function(_state) {
      return state = _state;
    };
    this.getState = function() {
      return state;
    };
    this.getSetting = function(key) {
      return this.settings[key];
    };
    this.callSettingFunction = function(name, args) {
      if (args == null) {
        args = [];
      }
      return this.settings[name].apply(this, args);
    };
    this.init = function() {
      this.settings = $.extend(true, {}, this.defaults, options);
      this.paper = Raphael(element, this.settings.width, this.settings.height);
      this.paper.setViewBox(0, 0, 110, this.settings.height + 50, true);
      this.paper.rect(0, 21, 110, this.settings.height + 3).attr(this.settings.colors.container);
      this.paper.ellipse(55, this.settings.height + 3, 55, 21).attr(this.settings.colors.container);
      this.paper.ellipse(55, 23, 55, 21).attr(this.settings.colors.container);
      this.fluid = this.paper.rect(0, this.settings.height + 3, 110, 0).attr(this.settings.colors.fluid);
      this.paper.ellipse(55, this.settings.height + 23, 55, 21).attr(this.settings.colors.fluid);
      this.fluidTop = this.paper.ellipse(55, this.settings.height + 23, 55, 21).attr(this.settings.colors.accent);
      this.glow = this.paper.path('M 12 35.665 L 12 ' + (this.settings.height + 21) + ' C 12 ' +
        (this.settings.height + 21.5) + ' 17.125 ' + (this.settings.height + 24.375)  + ' 23.125 ' + 
        (this.settings.height + 26.25)  + ' C 28.294 ' + (this.settings.height + 27.8653)  + ' 36.875 ' + 
        (this.settings.height + 29.25)  + ' 37 ' + (this.settings.height + 29) + ' L 37 42.75 C 28.4056 41.56 19.8109 39.536 12 35.665 L 12 35.665 Z');
      this.glow.attr(this.settings.colors.glow);
      this.paper.ellipse(55, 23, 55, 21).attr($.extend({
        'fill-opacity': .4
      }, this.settings.colors.container));
      this._value(this.settings.value);
      return this.setState('ready');
    };
    this._value = function(value) {
      var height, y;
      height = this.settings.height * parseFloat(value);
      y = this.settings.height + 20 - height;
      this.fluid.attr({
        height: height,
        y: y
      });
      return this.fluidTop.attr('cy', y);
    };
    this.value = function(newValue) {
      if (this.settings.value !== newValue) {
        return this._value(this.settings.value = newValue);
      }
    };
    this.init();
    return this;
  };
  $.cylinder.prototype.defaults = {
    colors: {
      container: {
        fill: '#e5e5e5',
        stroke: '#dcdada',
        'stroke-width': 1
      },
      fluid: {
        fill: '#0051A6',
        stroke: '#003974',
        'stroke-width': 1
      },
      accent: {
        fill: '#5d98d7',
        stroke: '#4483c4',
        'stroke-width': 1
      },
      glow: {
        fill: '#ffffff',
        stroke: '#e9e9e9',
        'stroke-width': 1,
        opacity: .4
      }
    },
    height: 235,
    width: 110,
    value: .3
  };
  return $.fn.cylinder = function(options) {
    var args;
    args = Array.prototype.slice.call(arguments, 1);
    return this.each(function() {
      var plugin;
      if ($(this).data('cylinder') === void 0) {
        plugin = new $.cylinder(this, options);
        return $(this).data('cylinder', plugin);
      } else {
        if ($(this).data('cylinder')[options]) {
          return $(this).data('cylinder')[options].apply($(this).data('cylinder'), args);
        }
      }
    });
  };
});
