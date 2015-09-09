Chinese Fountain
================

Chinese Fountain is a Fountain Code based on Chinese Remainder Theorem.  https://en.wikipedia.org/wiki/Chinese_remainder_theorem

This repo contains a Javascript implementation.  (I've also implemented it in C and Haskell, but that code is less readable.)

Given a block of data of size M, the Chinese Fountain can give you an almost infinite number packets of size N.  ("Almost infinite" is a few million, when using 32 bit slices.  This test uses 16 bit slices, where "almost infinite" is much smaller.)

As soon as the total size of (unique) packets pushed into a Bucket are larger than the original data, the bucket "is_complete" and the original data can be reproduced.

*It does not matter which packets are pushed into the bucket, only their total size matters.* 

From `lib/fountain-test.js`:

```javascript
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

      // fake some packet loss on a pretend network
      // (non-deterministic packet loss would be fine too)
      if (i % 3 === 0 || i % 5 === 0) continue; 

      bucket.push(i, packet);
      packets_rx++;
    }

    assert.deepEqual(17, packets_tx); // 17 packets transmitted
    assert.deepEqual(9, packets_rx); // only 9 received

    // 9 * 6 bytes = 54 bytes, which is more than the length of the original message, and therefore enough to regenerate the original data 
    var reconstructed = bucket.result();
    assert.deepEqual('The quick brown fox jumped over the lazy dog.', reconstructed.toString('utf8'));
  });
```

Uses cases for the Chinese Fountain include:

- Delivering data over unreliable networks.  The sending side can generate and send packet from the fountain.  The receiving side needs to send a whole-message ACK on receipt of each packet, once the bucket is_complete.
- A global, distributed RAID system.
