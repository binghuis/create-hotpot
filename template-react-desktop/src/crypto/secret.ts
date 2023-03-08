import { AES, enc } from 'crypto-js';
import { isEmpty } from 'lodash-es';

export default class Secret {
  secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  encrypt = (input: string | object) => {
    if (isEmpty(input)) {
      return '';
    }
    return AES.encrypt(JSON.stringify(input), this.secretKey).toString();
  };

  decrypt = (input: string) => {
    if (!input) {
      return '';
    }
    const ret = JSON.parse(AES.decrypt(input, this.secretKey).toString(enc.Utf8));
    return ret;
  };
}