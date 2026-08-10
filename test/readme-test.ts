import * as chai from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';

const { expect } = chai;

const README = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');

// Every API bullet is a backticked signature at the start of a list item
const SIGNATURES = README.split('\n')
  .filter((line) => line.startsWith('- `'))
  .map((line) => line.slice(3, line.indexOf('`', 3)));

describe('the generated API reference', () => {
  it('finds signatures to check', () => {
    expect(SIGNATURES.length).to.be.above(80);
  });

  it('never presents a `this` annotation as an argument', () => {
    // `this` is a TypeScript type annotation, so rendering it makes a
    // one-argument method read as taking two
    const leaked = SIGNATURES.filter((s) => /\(this:|, this:/.test(s));

    expect(leaked, `these signatures expose a \`this\` parameter: ${leaked.join(', ')}`).to.eql(
      [],
    );
  });

  it('marks parameters that carry a default as optional', () => {
    // TypeDoc sets isOptional inconsistently for defaulted parameters, so a
    // caller reading these would think the argument is required
    const expected = [
      'static fromAddress4Nat64(address: string, prefix?: string): Address6',
      'toAddress4Nat64(prefix?: string): Address4 | null',
      'regularExpressionString(substringSearch?: boolean): string',
      'regularExpression(substringSearch?: boolean): RegExp',
      'mask(mask?: number): string',
      'possibleSubnets(subnetSize?: number): string',
    ];

    expected.forEach((signature) => {
      expect(SIGNATURES, `missing: ${signature}`).to.include(signature);
    });
  });

  it('documents the methods that return HTML as returning HTML', () => {
    // These are the surfaces GHSA-v2v4-37r5-5v8g was about; a reader who
    // doesn't know they emit markup can't reason about escaping them
    ['group()', 'groupForV6()', 'link('].forEach((method) => {
      const bullet = README.split('\n').find((line) => line.startsWith(`- \`${method}`));

      expect(bullet, `no API bullet for ${method}`).to.be.a('string');
      expect(bullet, `${method} does not mention HTML`).to.match(/HTML/);
    });
  });
});
