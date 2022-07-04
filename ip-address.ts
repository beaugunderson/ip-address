import { Address4 } from './lib/ipv4.js';
import { Address6 } from './lib/ipv6.js';
import { AddressError } from './lib/address-error.js';

export { Address4 };
export { Address6 };
export { AddressError };

import * as helpers from './lib/v6/helpers.js';

export const v6 = { helpers };
