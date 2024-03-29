export class AddressError extends Error {
  parseMessage?: string;

  constructor(message: string, parseMessage?: string) {
    super(message);

    this.name = 'AddressError';

    this.parseMessage = parseMessage;
  }
}
