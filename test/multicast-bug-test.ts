import * as chai from 'chai';
import { Address6 } from '../src/ipv6';

const { expect } = chai;

describe('isMulticast Bug Reproduction', () => {
  it('should return true for specific multicast addresses', () => {
    // ff01::1 is a multicast address (All nodes on this interface)
    const topic = new Address6('ff01::1');
    
    // This is currently failing because getType() returns 'Multicast (All nodes on this interface)'
    // but isMulticast() checks for strictly 'Multicast'
    expect(topic.isMulticast()).to.equal(true);
  });

  it('should return true for the base multicast range', () => {
    const topic = new Address6('ff00::');
    expect(topic.isMulticast()).to.equal(true);
  });

  it('should return false for global unicast addresses', () => {
    const topic = new Address6('2001:db8::1');
    expect(topic.isMulticast()).to.equal(false);
  });
});
