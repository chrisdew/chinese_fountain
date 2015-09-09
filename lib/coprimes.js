var mpz = require('bigint');

exports.coprimes = coprimes;
exports.coprime16 = coprime16;
exports.coeffs = calc_coeffs;
exports.split = split;
exports.combine = combine;

var MAX_COPRIME_16 = 65535;
var COPRIMES16 = [mpz(MAX_COPRIME_16)];
function coprime16(num) {
  var cop = COPRIMES16[COPRIMES16.length - 1];
  while (num >= COPRIMES16.length) {
    console.log('COPRIMES16', COPRIMES16);
    cop = cop.sub(1);
    if (cop.eq(mpz(1))) throw new Error('no more coprimes');
    console.log('cop', cop);
    var failed = false;
    for (var i = 0; i < COPRIMES16.length; i++) {
      var c = COPRIMES16[i];
      if (c.gcd(cop) != 1) {
        failed = true;
        break;
      }
    }
    if (!failed) {
      COPRIMES16.push(cop);
    }
  }
  return COPRIMES16[num];
}

function coprimes(num, max) {
  var cop = mpz(max);
  var cops = [cop];
  while (cops.length < num) {
    cop = cop.sub(1);
    var failed = false;
    for (var i = 0; i < cops.length; i++) {
      var c = cops[i];
      if (c.gcd(cop) != 1) {
        failed = true;
        break;
      }
    }
    if (!failed) {
      cops.push(mpz(cop));
    }
  }
  return cops;
}

// Returns a list of pre-multiplied coefficients and the base, when supplied with a list of cops.
function calc_coeffs(subset_cops) {
  var base = mpz(1);
  for (var i in subset_cops) {
    base = base.mul(subset_cops[i]);
  }

  var num_cops = subset_cops.length;
  var coeffs = [];
  var pre_mult_coeffs = [];

  function multiply_base(a, b) {
    var ret = a.mul(b).mod(base);
    return ret;
  }

  for (var i = 0; i < num_cops; i++) {
    var prod = mpz(1);
    for (var j = 0; j < num_cops; j++) {
      if (j === i) continue;
      prod = multiply_base(prod, subset_cops[j]);
    }
    var prod_mod_cop = prod.mod(subset_cops[i]);

    var k = prod_mod_cop.invertm(subset_cops[i]);
    coeffs[i] = k;
    pre_mult_coeffs[i] = k.mul(prod);
  }

  return {pre_mult: pre_mult_coeffs, base: base};
}

function split(num, cops) {
  var parts = [];
  for (var i in cops) {
    parts.push(num.mod(cops[i]));
  }
  return parts;
}

// Returns the smallest number which has a given set of remainders when divided by the cops.
function combine(parts, subset_cops) {
  var ob = calc_coeffs(subset_cops);
  var coeffs = ob.pre_mult;
  var base = ob.base;

  if (parts.length !== subset_cops.length) { throw new Error('incorrect number of parts') }
  var ret = mpz(0);
  var num_out = mpz(0);
  var num_subset_cops = subset_cops.length;

  for (var i in subset_cops) {
    var tmp = coeffs[i].mul(parts[i]);
    var tmp2 = num_out.add(tmp);
    num_out = tmp2.mod(base);
    ret = ret.add(coeffs[i].mul(parts[i])).mod(base);
  }

  return ret;
}

