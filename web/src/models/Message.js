import Model from 'radiks/lib/model';

export default class Message extends Model {
  static className = 'Message';

  static schema = {
    contentId: {
      type: String,
      decrypted: true,
    },
    createdBy: {
      type: String,
      decrypted: true
    }
  };
}
