import Ember from 'ember';

const {
  Helper,
  typeOf: getTypeOf
} = Ember;

export function isEqualMonth([m1, m2]) {
  if (getTypeOf(m1) !== 'object' || getTypeOf(m2) !== 'object') {
    return false;
  }
  return m1.format('YYYY-MM') === m2.format('YYYY-MM');
}

export default Helper.helper(isEqualMonth);
