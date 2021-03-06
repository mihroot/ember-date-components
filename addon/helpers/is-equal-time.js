import Ember from 'ember';

const {
  Helper,
  typeOf: getTypeOf
} = Ember;

export function isEqualTime([d1, d2]) {
  if (getTypeOf(d1) !== 'object' || getTypeOf(d2) !== 'object') {
    return false;
  }

  return d1.format('HH:mm') === d2.format('HH:mm');
}

export default Helper.helper(isEqualTime);
