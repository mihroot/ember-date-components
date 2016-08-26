import Ember from 'ember';

const {
  get,
  TextField
} = Ember;

/**
 * This is an extended {{input}} to send appropriate events for arrowUp/arrowDown.
 * It is also slightly changed to send an input-changed event when a key that is neither arrowUp/arrowDown, enter or escape
 * is pressed.
 *
 * @namespace EmberDateComponents
 * @class TimePickerInput
 * @extends Ember.TextField
 * @public
 */
export default TextField.extend({
  classNames: [],
  type: 'text',

  interpretKeyEvents(event) {
    let map = get(this, 'KEY_EVENTS');
    let { keyCode } = event;

    let method = map[keyCode];
    if (method) {
      return this[method](event);
    } else {
      this.inputChange();
    }
  },

  inputChange() {
    this._elementValueDidChange();
    let value = get(this, 'value');
    this.sendAction('input-change', value, this, event);
  },

  arrowUp(event) {
    this.sendAction('arrow-up', this, event);
  },

  arrowDown(event) {
    this.sendAction('arrow-down', this, event);
  },

  escape(event) {
    this.sendAction('escape', this, event);
  },

  enter(event) {
    this.sendAction('enter', this, event);
  },

  KEY_EVENTS: {
    38: 'arrowUp',
    40: 'arrowDown',
    13: 'enter',
    27: 'escape'
  }
});
