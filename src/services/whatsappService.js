import sendToWhatsApp from '../services/httpRequest/sendToWhatsApp.js'

class WhatsAppService {

  async sendMessage(to, body, messageId) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      text: { body }
    }

    await sendToWhatsApp(data);
  }

  async sendInteractiveButtons(to, BodyText, buttons) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: BodyText },
        action: {
          buttons: buttons,
        }
      }
    };

    await sendToWhatsApp(data);
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    try {
      const mediaObject = {
        image: { link: mediaUrl, caption: caption },
        audio: { link: mediaUrl },
        video: { link: mediaUrl, caption: caption },
        document: { link: mediaUrl, caption: caption, filename: 'saoVentas.pdf' }
      };

      if (!mediaObject[type]) {
        throw new Error(`Unsupported media type: ${type}`);
      }

      const media = { [type]: mediaObject[type] };

      const data = {
        messaging_product: 'whatsapp',
        to,
        type: type,
        ...media
      };

      await sendToWhatsApp(data);

    } catch (error) {
      console.error('Error sending media', error);
    }
  }

  async markAsRead(messageId) {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    };
    await sendToWhatsApp(data);
  }

  async sendContactMessage(to, contact) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to,
        type: 'contacts',
        contacts: [contact]
      };

      await sendToWhatsApp(data);

    } catch (error) {
      console.log(error);
    }
  }

  async sendLocationMessage(to, location) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to,
        type: 'location',
        location: location
      };

      await sendToWhatsApp(data);

    } catch (error) {
      console.log(error);

    }
  }

}

export default new WhatsAppService();