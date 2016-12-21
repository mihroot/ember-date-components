import Ember from 'ember';
import layout from '../templates/components/time-picker';
// import moment from 'moment';
import computed from 'ember-computed';
// import parseTime from 'ember-date-components/utils/parse-time';
import buildTimeRange from 'ember-date-components/utils/build-time-range';

const {
  get,
  set,
  Component,
  run,
  isNone,
  typeOf: getTypeOf
} = Ember;

/**
 * An input field to choose a time in a day.
 * The user can either enter a time directly, or choose from a list.
 *
 * @namespace EmberDateComponents.Component
 * @class TimePicker
 * @extends Ember.Component
 * @public
 */
export default Component.extend({
  layout,

  classNames: ['time-picker__wrapper'],
  classNameBindings: ['isOpen:time-picker__wrapper--open'],

  moment: Ember.inject.service(),
  
  /**
   * The current value of the time picker.
   * Has to be a moment.js object or null.
   *
   * @attribute value
   * @type {Date}
   * @public
   */
  value: null,

  /**
   * The action to call when the time changes.
   *
   * @event action
   * @param {Date} time The new time
   * @public
   */
  action: null,

  /**
   * If the display format should use am/pm or the 24:00 format.
   * By default, this will be determined by checking the localized date formatting of moment.js.
   * However, if you don't use moment.js-locales, this will always return true (because the default locale, 'en', uses am/pm).
   * In such a case, you can just overwrite this.
   *
   * @attribute amPm
   * @type {Boolean}
   * @public
   */
  amPm: computed(function() {
    return this.get('moment').moment().startOf('day').format('LLL').toLowerCase().indexOf('am') > -1;
  }),

  /**
   * The minimum time which can be selected.
   * This should be either a parseable string or a moment.js object.
   *
   * @attribute minTime
   * @type {String|Object}
   * @default '00:00'
   * @public
   */
  minTime: '00:00',

  /**
   * The maxmimum time which can be selected.
   * This should be either a parseable string or a moment.js object.
   *
   * @attribute minTime
   * @type {String|Object}
   * @default '23:59'
   * @public
   */
  maxTime: '23:59',

  /**
   * The placeholder for the time input.
   *
   * @attribute placeholder
   * @type {String}
   * @public
   */
  placeholder: 'Enter time...',

  /**
   * The step in minutes which can be selected.
   * Entered times will be rounded to this accuracy.
   * If you don't specify a selectStep separately, this value will also be used as selectStep.
   *
   * @attribute step
   * @type {Number}
   * @default 30
   * @public
   */
  step: 30,

  /**
   * The step from which dates can be selected in the dropdown.
   * If this is not explicitly set, step will be used for this value as well.
   * However, if values like 22:14 should be allowed but not shown in the dropdown,
   * this can be set to a different value.
   *
   * @attribute selectStep
   * @type {Number}
   * @default 30
   * @public
   */
  selectStep: null,

  /**
   * Classes which should be added to the input.
   *
   * @attribute inputClasses
   * @type {String}
   * @public
   */
  inputClasses: '',

  /**
   * Classes which should be added to the dropdown container.
   *
   * @attribute dropdownClasses
   * @type {String}
   * @public
   */
  dropdownClasses: '',

  /**
   * If the dropdown is open.
   *
   * @property isOpen
   * @type {Boolean}
   * @protected
   */
  isOpen: false,

  /**
   * Which option is currently selected.
   * If -1, no option is selected.
   *
   * @property selected
   * @type {Number}
   * @protected
   */
  selected: -1,

  /**
   * The general options for this component.
   * These are built from the single attributes, but you could theoretically overwrite this if you need custom behaviour.
   * The options should always be fetched via this object.
   *
   * @property options
   * @type {amPm, step, minTime, maxTime}
   * @protected
   */
  options: computed(function() {
    let amPm = get(this, 'amPm');
    let minTime = get(this, 'minTime');
    let maxTime = get(this, 'maxTime');
    let step = get(this, 'step');
    let selectStep = get(this, 'selectStep');

    return {
      amPm,
      step,
      selectStep,
      minTime: this.parseTime(minTime),
      maxTime: this.parseTime(maxTime)
    };
  }),

  /**
   * The internal value.
   * This is used to avoid two-way databinding.
   *
   * @property _value
   * @type {Object|null}
   * @private
   */
  _value: null,

  /**
   * The internal string representation of the value, e.g. the formatted value.
   *
   * @property stringValue
   * @type {String}
   * @protected
   */
  stringValue: null,

  /**
   * The value that is currently entered in the input field.
   *
   * @property inputValue
   * @type {String}
   * @protected
   */
  inputValue: null,

  /**
   * The value which is currently displayed.
   * This is either inputValue, if it is not null, or else stringValue.
   *
   * @property displayValue
   * @type {String}
   * @protected
   */
  displayValue: computed('inputValue', 'stringValue', function() {
    let inputValue = get(this, 'inputValue');
    let value = get(this, 'stringValue');
    return isNone(inputValue) ? value : inputValue;
  }),

  /**
   * The format which should be used.
   * By default, this is computed via the amPm setting.
   * You can overwrite this if necessary.
   *
   * @property format
   * @type {String}
   * @protected
   */
  format: computed('options.amPm', function() {
    let { amPm } = get(this, 'options');
    return amPm ? 'hh:mm a' : 'HH:mm';
  }),

  /**
   * The options to chose from in the dropdown.
   *
   * @property timeOptions
   * @type {Object[]}
   * @readOnly
   * @protected
   */
  timeOptions: computed('options.minTime', 'options.maxTime', 'options.selectStep', function() {
    let { minTime, maxTime, selectStep } = get(this, 'options');
    let format = get(this, 'format');

    let steps = buildTimeRange({
      minTime,
      maxTime,
      step: selectStep
    });

    return steps.map((time) => {
      return {
        value: time.format(format),
        time
      };
    });
  }),

  /**
   * The options for the dropdown which are currently visible.
   * This filters the timeOptions by the inputValue.
   *
   * @property filteredOptions
   * @type {Object[]}
   * @readOnly
   * @protected
   */
  filteredOptions: computed('timeOptions.[]', 'inputValue', function() {
    let val = (get(this, 'inputValue') || '').toLowerCase();
    let options = get(this, 'timeOptions');

    return options.filter((option) => {
      let optionValue = get(option, 'value');
      return optionValue.toLowerCase().indexOf(val) > -1;
    });
  }),

  /**
   * Open the dropdown.
   *
   * @method _open
   * @private
   */
  _open() {
    set(this, 'isOpen', true);
  },

  /**
   * Close the dropdown.
   *
   * @method _close
   * @private
   */
  _close() {
    set(this, 'isOpen', false);
    this._reset();
  },

  /**
   * Reset the temporary values.
   *
   * @method _reset
   * @private
   */
  _reset() {
    set(this, 'selected', -1);
    set(this, 'inputValue', null);

    // Set value correctly
    this._initValue();
  },

  /**
   * Check new value..
   * If they have changed, send the action & set them on the component.
   *
   * @method _checkNewValue
   * @param {Object} newValue A new moment.js object
   * @private
   */
  _checkNewValue(newValue) {
    if (newValue !== get(this, '_value')) {
      set(this, '_value', newValue);
      this._sendAction();
    }
  },

  /**
   * Check stringValue and generate the new value from it.
   *
   * @method _checkInput
   * @private
   */
  _checkInput() {
    let value = (get(this, 'stringValue') || '').toLowerCase();
    let newValue = this.parseTime(value);
    this._checkNewValue(newValue);
  },

  /**
   * Check the inputValue as string and generate the new value from it.
   *
   * @method _checkStringInput
   * @private
   */
  _checkStringInput() {
    let inputValue = get(this, 'inputValue');
    let newValue = this.parseTime(inputValue);

    if (!newValue) {
      set(this, 'stringValue', null);
      this._checkNewValue();
      return;
    }

    let format = get(this, 'format');
    let time = this._normalizeTime(newValue);

    let value = time.format(format);

    set(this, 'stringValue', value);
    this._checkInput();
  },

  /**
   * Takes a moment.js object and normalizes it to the nearest step.
   *
   * @method _normalizeTime
   * @param time
   * @param step
   * @returns {*}
   * @private
   */
  _normalizeTime(time) {
    let { minTime, maxTime, step } = get(this, 'options');

    let min = minTime ? minTime.valueOf() : null;
    let max = maxTime ? maxTime.valueOf() : null;
    step = !isNone(step) ? step : 30;
    let val = time ? time.valueOf() : null;

    // if time is before minTime, return minTime
    if (!isNone(min) && val < min) {
      return this.get('moment').moment(min);
    }

    // if time is after maxTime, return maxTime
    if (!isNone(max) && val > max) {
      return this.get('moment').moment(max);
    }

    // if time is not in step range, round it up/down
    let stepMs = step * 60 * 1000;
    let diff = val % stepMs;
    if (diff !== 0) {
      // If diff > 50%, round up, elese round down
      if (diff * 2 > stepMs) {
        return this.get('moment').moment(val + stepMs - diff);
      } else {
        return this.get('moment').moment(val - diff);
      }
    }

    return time;
  },

  /**
   * Send the action.
   * The action receives a moment.js object or null as parameter.
   *
   * @method _sendAction
   * @private
   */
  _sendAction() {
    let value = get(this, '_value') || null;
    let action = get(this, 'action');

    if (action) {
      action(value);
    }

    this._close();
  },

  /**
   * Initialise stringValue from value.
   * This is called on reset and when the value changes from outside.
   *
   * @method _initValue
   * @private
   */
  _initValue() {
    let value = get(this, '_value');
    let format = get(this, 'format');

    value = this.parseTime(value);
    value = (getTypeOf(value) === 'object') ? value.format(format) : value;
    set(this, 'stringValue', value || null);
  },

  /**
   * Prepare data for the time input.
   *
   * @method didReceiveAttrs
   * @protected
   * @override
   */
  didReceiveAttrs() {
    // Set selectStep to step
    let step = get(this, 'step');
    if (!get(this, 'selectStep')) {
      set(this, 'selectStep', step);
    }

    // Set the internal value
    set(this, '_value', get(this, 'value'));
    this._initValue();
  },

  actions: {

    open() {
      this._open();
    },

    openAndClear() {
      set(this, 'isOpen', true);
      set(this, 'stringValue', null);
    },

    close() {
      this._close();
    },

    closeNext() {
      // Wait for all other events to finish
      // Somehow, 1 or 10 doesn't work
      run.later(this, () => {
        let inputValue = get(this, 'inputValue');
        // If there is an input, this means it hasn't been processed yet
        // --> Process it now!
        if (inputValue) {
          this._checkStringInput();
        }

        this._close();
      }, 100);
    },

    selectUp() {
      this.decrementProperty('selected');
      if (get(this, 'selected') < -1) {
        set(this, 'selected', -1);
      }
    },

    selectDown() {
      this.incrementProperty('selected');
      let optionsLength = get(this, 'filteredOptions.length');

      if (get(this, 'selected') > optionsLength) {
        set(this, 'selected', optionsLength - 1);
      }
    },

    selectCurrent() {
      let options = get(this, 'filteredOptions');
      let selected = get(this, 'selected');

      // If nothing is selected, simply try to parse the entered string
      if (selected === -1) {
        this._checkStringInput();
        return;
      }

      let selectedOption = options[selected];

      // If, for whatever reason, the selected options doesn't exist
      // Just parse the string - this should't happen, normally
      if (!selectedOption) {
        this._checkStringInput();
        return;
      }

      // Actually set stringValue and check the input
      let value = get(selectedOption, 'value');
      set(this, 'stringValue', value);
      this._checkInput();
    },

    selectValue(value) {
      set(this, 'stringValue', value);
      this._checkInput();
    },

    updateInputValue(val) {
      // Always open the select box when someone starts to type
      this._open();
      set(this, 'inputValue', val);
    }
  },

  /**
   * Parse a time from a string.
   *
   * This will parse a string and return a moment.js object.
   * Value can also be a moment.js object.
   *
   * It can detect the following input formats:
   *
   * 7
   * 14
   * 7,5
   * 7.5
   * 14,15
   * 14.15
   * 7:30
   * 14:30
   * 7am
   * 7pm
   * 12am
   * 12pm
   * 7:30
   * 07:30
   * 14:2
   * 12:40 am
   * 08:10 pm
   *
   * It will max out at 23:59.
   *
   * @namespace EmberDateComponents.Utils
   * @method parseTime
   * @param {String|Object} value
   * @return {Object}
   * @public
   */
  parseTime(value) {
    if (!value) {
      return null;
    }

    // Moment.js objects are handled directly.
    if (typeof value === 'object' && typeof value.format === 'function') {
      return value;
    }

    // Always convert to a string for parsing
    value = `${value}`;

    // Try to be smart and detect the used format
    let usesAmPm = value.indexOf('am') > -1 || value.indexOf('pm') > -1;
    let hourIsTwoDigit = /^\d\d$/.test(value.substr(0, 2));
    let minuteSeparator = ':';
    if (value.indexOf(',') > -1) {
      minuteSeparator = ',';
    }
    if (value.indexOf('.') > -1) {
      minuteSeparator = '.';
    }
    let usesMinutes = value.indexOf(minuteSeparator) > -1;

    let hours = 0;
    let minutes = 0;
    let amPm = null;

    // Hours
    if (hourIsTwoDigit) {
      hours = value.substr(0, 2) * 1;
    } else {
      hours = (value[0] || 0) * 1;
    }

    // Minutes
    if (usesMinutes) {
      let minutePosition = value.indexOf(minuteSeparator) + 1;
      let tmp = value.substr(minutePosition, 2);
      let minuteIsTwoDigit = /^\d\d$/.test(tmp);

      if (minuteIsTwoDigit) {
        minutes = tmp * 1;
      } else {
        minutes = (value[minutePosition] || 0) * 1;
      }

      // Convert e.g. 7,5 --> 7:30
      if (minuteSeparator !== ':') {
        minutes = minutes * 60 * (minuteIsTwoDigit ? 0.01 : 0.1);
      }
    }

    // am/pm ?
    if (usesAmPm) {
      amPm = value.indexOf('am') > -1 ? 'am' : 'pm';
      if (amPm === 'am' && hours === 12) {
        hours = 0;
      } else if (amPm === 'pm' && hours === 12) {
        hours = 12;
      } else if (amPm === 'pm') {
        hours += 12;
      }

    }

    // Minutes cannot be greater than 59
    if (minutes > 59) {
      minutes = 59;
    }

    // Hours cannot be greater than 23
    if (hours > 23) {
      hours = 23;
      minutes = 59;
    }

    return this.get('moment').moment(0).hour(hours).minutes(minutes).seconds(0).milliseconds(0);
  }
});
