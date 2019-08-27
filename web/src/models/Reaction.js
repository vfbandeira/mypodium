import { Model } from 'radiks';

export default class Reaction extends Model {
  static className = 'Reaction';

  static schema = {
    messageId: {
      type: String,
      decrypted: true,
    },
    username: {
      type: String,
      decrypted: true,
    },
    type: {
      type: Number,
      decrypted: true,
    }
  }
};
