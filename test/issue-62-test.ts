import { expect } from 'chai';
import { Address6 } from '../src/ipv6';

describe('Issue #62', () => {
  it('should recognize v4-mapped addresses in hex format', () => {
    const addr = new Address6('::ffff:7f00:1');
    expect(addr.v4).to.equal(true);
  });

  it('should still recognize v4-mapped addresses in dotted decimal format', () => {
    const addr = new Address6('::ffff:127.0.0.1');
    expect(addr.v4).to.equal(true);
  });

  it('should not recognize other addresses as v4-mapped', () => {
    const addr = new Address6('2001:db8::1');
    expect(addr.v4).to.equal(false);
  });
});
