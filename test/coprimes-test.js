var mpz = require('bigint');
var assert = require('assert');
var c = require('../lib/coprimes');

function mpzs2strs(mpzs) {
  var strs = [];
  for (var i in mpzs) {
    strs.push(mpzs[i].toString(10));
  }
  return strs;
}

describe('coprimes', function() {
  it('should calculate 16 bit coprimes', function() {
    var cops = new c.coprimes(12, 65535);
    assert.deepEqual(["65535", "65534", "65533", "65531", "65521", "65519", "65509", "65497", "65491", "65489", "65483",
      "65479"], mpzs2strs(cops));
  });
  it('should calculate 32 bit coprimes', function() {
    var cops = new c.coprimes(12, 4294967295);
    assert.deepEqual(["4294967295", "4294967294", "4294967293", "4294967291", "4294967287", "4294967281", "4294967279",
      "4294967273", "4294967269", "4294967267", "4294967263", "4294967257"], mpzs2strs(cops));
  });
  it('should calculate 101 16 bit coprimes', function() {
    var cops = new c.coprimes(101, 65535);
    assert.deepEqual("65534", cops[1].toString());
    assert.deepEqual("65483", cops[10].toString());
    assert.deepEqual("64783", cops[100].toString());
    //assert.deepEqual("54973", cops[1000].toString());
  });
  it('should calculate 101 32 bit coprimes', function() {
    var cops = new c.coprimes(101, 4294967295);
    assert.deepEqual("4294967294", cops[1].toString());
    assert.deepEqual("4294967263", cops[10].toString());
    assert.deepEqual("4294966583", cops[100].toString());
    //assert.deepEqual("4294956167", cops[1000].toString());
  });
  it('should calculate 16 bit coeffs', function() {
    var coeffs = new c.coeffs([mpz(65535), mpz(65534), mpz(65533), mpz(65531), mpz(65521)], 8);
    assert.deepEqual(["1046600945338611358480876", "433800749525790037165125", "276935985937852878315420",
      "659610174641130077822730", "1208390931305579426610660"], mpzs2strs(coeffs.pre_mult));
    assert.deepEqual("1208446262249654592798270", '' + coeffs.base)
  });
  it('should calculate 32 bit coeffs', function() {
    var coeffs = new c.coeffs([mpz(4294967295), mpz(4294967294), mpz(4294967293), mpz(4294967291), mpz(4294967287)], 8);
    assert.deepEqual(["22835962982274030567069713834970412650852253696",
      "765548473116072815911933802025028672406291180835", "669854914004920577717479211875555046841416417160",
      "1263589951388082621635903369757171889995088133910", "201173959559161135921330517534670347923152474660"],
      mpzs2strs(coeffs.pre_mult));
    assert.deepEqual("1461501630525255590876858307513698184908400230130", '' + coeffs.base)
  });
  it('should split and recombine 16 bit', function() {
    var cops = new c.coprimes(12, 65535);
    var plaintext = mpz("12345678901234567890");
    var parts = c.split(plaintext, cops);
    assert.deepEqual(["19155", "57842", "54341", "56101", "7173", "65048", "9649", "48341", "53655", "49403", "19108",
      "32567"], mpzs2strs(parts));
    var combined = c.combine([mpz(19155), mpz(57842), mpz(54341), mpz(56101), mpz(7173)], [mpz(65535), mpz(65534),
      mpz(65533), mpz(65531), mpz(65521)]);
    assert.deepEqual("12345678901234567890", combined.toString());
  });
  it('should split and recombine 32 bit', function() {
    var cops = new c.coprimes(12, 4294967295);
    var plaintext = mpz("12345678901234567890");
    var parts = c.split(plaintext, cops);
    assert.deepEqual(["2524165215", "1103650286", "3978102652", "1137072802", "4044947700", "4111792796", "1270762986",
      "1337608150", "4245483132", "1404453362", "17361109", "84206403"], mpzs2strs(parts));
    var combined = c.combine(
      [mpz(2524165215), mpz(1103650286), mpz(3978102652), mpz(1137072802), mpz(4044947700)],
      [mpz(4294967295), mpz(4294967294), mpz(4294967293), mpz(4294967291), mpz(4294967287)]
    );
    assert.deepEqual("12345678901234567890", combined.toString());
  });
  it('should calculate 16 bit coprimes on demand', function() {
    assert.deepEqual("65535", c.coprime16(0).toString());
    assert.deepEqual("65534", c.coprime16(1).toString());
    assert.deepEqual("65533", c.coprime16(2).toString());
    assert.deepEqual("65531", c.coprime16(3).toString());
  });
});
