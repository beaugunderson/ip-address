import { Address4 } from './lib/ipv4';
import { Address6 } from './lib/ipv6';
import { AddressError } from './lib/address-error';

export { Address4 };
export { Address6 };
export { AddressError };

import * as helpers from './lib/v6/helpers';

export const v6 = { helpers };
