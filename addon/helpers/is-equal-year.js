import Ember from 'ember';

const {
  Helper,
  typeOf: getTypeOf
} = Ember;

export function isEqualYear([y1, y2]) {
  if (getTypeOf(y1) !== 'object' || getTypeOf(y2) !== 'object') {
    return false;
  }
  return y1.format('YYYY') === y2.format('YYYY');
}

export default Helper.helper(isEqualYear);
