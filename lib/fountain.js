var mpz = require('bigint');
var c = require('./coprimes');
var assert = require('assert');

exports.Fountain16 = Fountain16;
exports.Bucket16 = Bucket16;
exports.div_round_up = div_round_up;

var SIZE_OF_SHORT = 2;

function div_round_up(num, divisor) {
  if (num < 0) throw new Error('num < 0');
  if (divisor < 1) throw new Error('divisor < 1');
  return 0 | ((num - 1 + divisor) / divisor);
}

function Fountain16(data, bundle_size) {
  this.bundle_size = bundle_size;
  this.bundle_shorts = 0 | (this.bundle_size / SIZE_OF_SHORT);
  assert(this.bundle_shorts * SIZE_OF_SHORT === bundle_size); // throw if odd bundle_size

  this.length = data.length;
  this.padded_length = div_round_up(this.length, this.bundle_size) * this.bundle_size;
  var padding = new Buffer(this.padded_length - this.length);
  padding.fill(0); // FIXME: padding with zero
  this.padded_data = Buffer.concat([data, padding]);


  // TODO: handle data whose size is not divisible by BUNDLE_SHORTS
  this.min_bundles = this.padded_length / this.bundle_size;
  if (this.min_bundles > 100) throw new Error('data too long, would require more than ' + this.min_bundles + ' bundles');

  this.slice_size = SIZE_OF_SHORT;
  this.hunk_size = this.min_bundles * this.slice_size;
  this.num_hunks = 0 | (this.padded_length / this.hunk_size);
  assert(this.num_hunks === this.padded_length / this.hunk_size);

  this.mpz_hunks = [];
  for (var i = 0; i < this.num_hunks; i++) {
    var hunk = this.padded_data.slice(i * this.hunk_size, (i+1) * this.hunk_size);
    assert.deepEqual(this.hunk_size, hunk.length);
    this.mpz_hunks[i] = mpz.fromBuffer(hunk);
  }
}

Fountain16.prototype.bundle_data = function(bundle_num) {
  console.log('====================', bundle_num, c.coprime16(bundle_num));
  var buffer = new Buffer(this.bundle_size);
  for (var i = 0; i < this.bundle_shorts; i++) {
    var mpz_hunk = this.mpz_hunks[i];
    console.log('mpz_hunk', mpz_hunk);
    var part = mpz_hunk.mod(c.coprime16(bundle_num));
    console.log('part', part);
    var part_buf = part.toBuffer();
    console.log('part_buf', part_buf);
    if (part_buf.length === 2) {
      buffer[i * SIZE_OF_SHORT] = part_buf[0];
      buffer[i * SIZE_OF_SHORT + 1] = part_buf[1];
    } else {
      buffer[i * SIZE_OF_SHORT] = 0;
      buffer[i * SIZE_OF_SHORT + 1] = part_buf[0];
    }
  }
  return buffer;
};

function Bucket16(checksum, length, bundle_size) {
  this.checksum = checksum;
  this.length = length;
  this.bundle_size = bundle_size;
  this.bundle_shorts = this.bundle_size / SIZE_OF_SHORT;
  assert(this.bundle_shorts * SIZE_OF_SHORT === bundle_size); // throw if odd bundle_size
  this.padded_length = div_round_up(this.length, this.bundle_size) * this.bundle_size;
  this.slice_size = SIZE_OF_SHORT;
  this.min_bundles = this.padded_length / this.bundle_size;
  this.hunk_size = this.min_bundles * this.slice_size;
  this.num_hunks = 0 | (this.padded_length / this.hunk_size);
  assert(this.num_hunks === this.padded_length / this.hunk_size);

  this.bundles = {};
}

Bucket16.prototype.push = function(bundle_num, bundle_data) {
  assert(bundle_data.length === this.bundle_size);
  this.bundles[bundle_num] = bundle_data;
};

Bucket16.prototype.is_complete = function() {
  // do the cops multiply to more than the min_bundles value
  var prod = mpz(1);
  for (var bundle_num in this.bundles) {
    //console.log('prod', prod);
    //console.log('bundle_num', bundle_num);
    prod = prod.mul(c.coprime16(bundle_num));
  }
  var t0 = mpz(this.min_bundles);
  //console.log('t0', t0);
  var t1 = mpz(65536).pow(t0);
  var t2 = prod.gt(t1);
  return t2; //prod.gt(mpz(65536).pow(mpz(this.num_hunks)));
};

Bucket16.prototype.result = function() {
  console.log('--------------------');
  var hunks = [];
  var subset_cops = [];
  for (var bundle_num in this.bundles) {
    subset_cops.push(c.coprime16(bundle_num));
  }
  for (var hunk_num = 0; hunk_num < this.num_hunks; hunk_num++) {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~');
    var parts = [];
    for (var bundle_num in this.bundles) {
      parts.push(mpz(256 * this.bundles[bundle_num][hunk_num * this.slice_size] +
        this.bundles[bundle_num][hunk_num * this.slice_size + 1]))
    }
    console.log('parts', parts);
    console.log('subset_cops', subset_cops);
    var mpz_hunk = c.combine(parts, subset_cops);
    var hunk = mpz_hunk.toBuffer();
    if (hunk.length < this.hunk_size) {
      console.log('short hunk');
      var padding = new Buffer(this.hunk_size - hunk.length);
      padding.set(0);
      hunk = Buffer.concat([hunk, padding]);
      assert(hunk.length === this.hunk_size);
    } else if (hunk.length > this.hunk_size) {
      console.log('long hunk', hunk.length, this.hunk_size);
      console.log('mpz_hunk', mpz_hunk);
      console.log('hunk', hunk);

      mpz_hunk = c.combine(parts.slice(0, -1), subset_cops.slice(0, -1));
      hunk = mpz_hunk.toBuffer();

      console.log('mpz_hunk', mpz_hunk);
      console.log('hunk', hunk);
      assert(hunk.length === this.hunk_size);
      process.exit(1);
    } else {
      console.log('hunk size OK');
      console.log('mpz_hunk', mpz_hunk);
      console.log('hunk', hunk);
    }
    hunks.push(hunk);
  }
  var buffer = Buffer.concat(hunks);
  console.log(buffer.length, this.padded_length);
  assert(buffer.length === this.padded_length);
  return buffer.slice(0, this.length);
};

