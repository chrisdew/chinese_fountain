var mpz = require('bigint');
var assert = require('assert');
var f = require('../lib/fountain');


describe('16 bit fountain, with bundle_size of 2', function() {
  it('should split and combine', function() {
    var data = new Buffer('The quick brown fox jumped over the lazy dog.');
    var fountain = new f.Fountain16(data, 2);

    var bucket = new f.Bucket16(null, data.length, 2);

    for (var i = 0; !bucket.is_complete(); i++) {
      bucket.push(i, fountain.bundle_data(i));
    }

    // how many bundles needed for reconstruction
    assert.deepEqual(24, i);

    var reconstructed = bucket.result();
    assert.deepEqual('The quick brown fox jumped over the lazy dog.', reconstructed.toString('utf8'));
  });
});

describe('16 bit fountain, with bundle_size of 6, no packet loss', function() {
  it('should split and combine', function() {
    var data = new Buffer('The quick brown fox jumped over the lazy dog.');
    var fountain = new f.Fountain16(data, 6);

    var bucket = new f.Bucket16(null, data.length, 6);

    for (var i = 0; !bucket.is_complete(); i++) {
      bucket.push(i, fountain.bundle_data(i));
    }

    // bigger bundles === fewer bundles
    assert.deepEqual(9, i);

    var reconstructed = bucket.result();
    assert.deepEqual('The quick brown fox jumped over the lazy dog.', reconstructed.toString('utf8'));
  });

  it('should generate packets from a fountain, and regenerate the original data, despite (faked) packet loss', function() {
    var data = new Buffer('The quick brown fox jumped over the lazy dog.');
    var fountain = new f.Fountain16(data, 6); // the packets are configured to be 6 bytes long

    var bucket = new f.Bucket16(null, data.length, 6);

    var packets_tx = 0;
    var packets_rx = 0;
    for (var i = 0; !bucket.is_complete(); i++) {
      var packet = fountain.generate_packet(i);
      assert.equal(6, packet.length);
      packets_tx++;
      if (i % 3 === 0 || i % 5 === 0) continue; // faking some packet loss
      bucket.push(i, packet);
      packets_rx++;
    }

    assert.deepEqual(17, packets_tx);
    assert.deepEqual(9, packets_rx);

    var reconstructed = bucket.result();
    assert.deepEqual('The quick brown fox jumped over the lazy dog.', reconstructed.toString('utf8'));
  });
});

describe('div_round_up', function() {
  it('should work', function() {
    assert.deepEqual(0, f.div_round_up(0, 10));
    assert.deepEqual(1, f.div_round_up(1, 10));
    assert.deepEqual(1, f.div_round_up(10, 10));
    assert.deepEqual(2, f.div_round_up(11, 10));
    assert.deepEqual(2, f.div_round_up(20, 10));
  });
});
