import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import openAIService from './openAiservice.js';
import geminiService from './geminiService.js';

class MessageHandler {
  constructor() {
    this.appointmentState = {};
    this.assistandState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();
      const mediaFile = ['audio', 'video', 'imagen', 'documento']

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(message.from, message.id, senderInfo)
        await this.sendWelcomeMenu(message.from);
      } else if (mediaFile.includes(incomingMessage)) {
        await this.sendMedia(message.from, incomingMessage);
      } else if (this.appointmentState[message.from]) {
        await this.handleAppointmentFlow(message.from, incomingMessage);
      } else if (this.assistandState[message.from]) {
        await this.handleAssistanFlow(message.from, incomingMessage);
      } else {
        await this.handleMenuOption(message.from, incomingMessage);
      }
      await whatsappService.markAsRead(message.id);
    } else if (message?.type === 'interactive') {
      const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      await this.handleMenuOption(message.from, option);
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message) {
    const greetings = ['hola', 'hello', 'hi', 'Bienvenido'];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    const firtsName = senderInfo.profile?.name?.trim().split(/\s+/)[0];
    return firtsName || senderInfo.wa_id;
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `🌟 ¡Hola ${name}! Bienvenido/a a Ventas SAO.  
📅 Nuestro horario de atención es de **lunes a viernes, de 7:30 a.m. a 6:00 p.m.**  
💡 Cuéntanos, ¿en qué podemos ayudarte hoy? Estamos aquí para brindarte la mejor atención. 😊`;

    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = `📌 *Menú Principal*  
Por favor, elige una de las siguientes opciones:`;

    const buttons = [
      {
        type: 'reply', reply: { id: 'option_1', title: '📅 Agendar' }
      },
      {
        type: 'reply', reply: { id: 'option_2', title: '💡 Consultar' }
      },
      {
        type: 'reply', reply: { id: 'option_3', title: '📍 Ubicación' }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  textClear(text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ñ/g, "n")
      .replace(/Ñ/g, "N")
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim();
  }

  async handleMenuOption(to, option) {
    const responses = {
      agendar: () => {
        this.appointmentState[to] = { step: 'name' };
        return '📅 *¡Vamos a agendar tu cita!* Para empezar, ¿puedes decirme tu nombre? 😊';
      },
      consultar: () => {
        this.assistandState[to] = { step: 'question', type: 'gemini' };
        return '💡 ¡Hola! Soy la IA de soporte de SAO Technology. *¿Tienes alguna duda?* Por favor, escribe tu consulta y con gusto te ayudaremos.'
      },
      contacto: async () => {
        await this.sendContact(to);
        return 'Te enviamos la información de nuestro contacto. 😊';
      },
      ubicacion: async() => {
        await this.sendLocation(to);
        return '📍 *Nuestra ubicación:*. ¡Te esperamos! 😊';
      }
    };

    const cleanedOption = this.textClear(option);
    const response = responses[cleanedOption];
    const mensaje = '❌ *Lo siento, no entendí tu selección.* Por favor, elige una de las opciones del menú.';

    await whatsappService.sendMessage(to, response ? response instanceof Function ? await response() : response : mensaje);
  }

  async sendMedia(to, typeMessage) {

    const mediaObject = {
      imagen: {
        mediaUrl: 'https://www.saotechnology.com/web/wp-content/uploads/2019/06/logo.png',
        caption: '!Esto es una imagen de SAO',
        type: 'image'
      },
      audio: {
        mediaUrl: 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac',
        caption: 'Bienvenida',
        type: 'audio'
      },
      video: {
        mediaUrl: 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4',
        caption: '¡Esto es una video!',
        type: 'video'
      },
      documento: {
        mediaUrl: 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf',
        caption: '¡Esto es un PDF!',
        type: 'document'
      }
    };

    const { mediaUrl, caption, type } = mediaObject[typeMessage];

    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  completeAppointment(to) {
    const appointment = this.appointmentState[to];
    delete this.appointmentState[to];

    const userData = [
      to,
      appointment.name,
      appointment.saoEmpresa,
      appointment.saoProfesion,
      appointment.saoCiudad,
      appointment.saoType,
      appointment.saoModulo,
      appointment.reason,
      new Date().toISOString()
    ];

    appendToSheet(userData);

    return `✅ *¡Tu cita ha sido agendada exitosamente!*  

📌 *Resumen de tu cita:*  
👤 *Nombre:* ${appointment.name}  
🏢 *Empresa:* ${appointment.saoEmpresa}  
👷 *Profesión:* ${appointment.saoProfesion}  
🌍 *Ciudad:* ${appointment.saoCiudad}  
🏗️ *Tipo de proyecto:* ${appointment.saoType}  
📦 *Módulo de interés:* ${appointment.saoModulo}  
❓ *Motivo de consulta:* ${appointment.reason}  

📞 *Nos pondremos en contacto contigo pronto para confirmar la fecha y hora de tu cita.*  
¡Gracias por elegirnos! 😊`;
  }

  async handleAppointmentFlow(to, message) {
    const state = this.appointmentState[to];
    const appointmentList = {
      name: () => {
        state.name = message;
        state.step = 'saoEmpresa';
        return `¡Gracias, ${state.name}! 😊 Para brindarte un mejor servicio, ¿podrías decirnos el nombre de tu empresa?`;
      },
      saoEmpresa: () => {
        state.saoEmpresa = message;
        state.step = 'saoProfesion';
        return `¡Genial! Ahora, cuéntanos, ¿cuál es tu profesión? (Ejemplo: constructor, ingeniero civil, arquitecto, etc.)`;
      },
      saoProfesion: () => {
        state.saoProfesion = message;
        state.step = 'saoCiudad';
        return `¡Excelente, ${state.saoProfesion}! ¿En qué ciudad te encuentras?`;
      },
      saoCiudad: () => {
        state.saoCiudad = message;
        state.step = 'saoType';
        return `¡Perfecto! Nos encanta conocer más sobre tu trabajo en ${state.saoCiudad}. ¿En qué tipo de proyectos se especializa tú empresa?`;
      },
      saoType: () => {
        state.saoType = message;
        state.step = 'saoModulo';
        return `¡Interesante! Ahora, ¿qué módulo te interesa más? (Ejemplo: Presupuesto, Control, ambos)`;
      },
      saoModulo: () => {
        state.saoModulo = message;
        state.step = 'reason';
        return `¡Casi terminamos! 😊 ¿Cuál es la razón principal de tu consulta? Queremos asegurarnos de brindarte la mejor ayuda posible.`;
      },
      reason: () => {
        state.reason = message;
        return this.completeAppointment(to);
      }
    };

    const response = appointmentList[state.step]();
    await whatsappService.sendMessage(to, response);
  }

  async handleAssistanFlow(to, message) {
    const state = this.assistandState[to];
    let response;

    const menuMessage = '¿La respuesta fue de tu ayuda?'
    const buttons = [
      { type: 'reply', reply: { id: 'option_4', title: 'Si, gracias' } },
      { type: 'reply', reply: { id: 'option_5', title: 'Hacer otra pregunta' } },
      { type: 'reply', reply: { id: 'option_6', title: 'Contacto' } }
    ];

    if (state.step === 'question') {
      response = state.type === 'openIA' ? await openAIService(message) : await geminiService(message);
    }

    delete this.assistandState[to];
    await whatsappService.sendMessage(to, response);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async sendContact(to) {
    const contact = {
      addresses: [
        {
          street: "PA Cl. 6 Sur ",
          city: "Medellin",
          state: "Antioquia",
          zip: "12345",
          country: "Colombia",
          country_code: "Code",
          type: "WORK"
        }
      ],
      emails: [
        {
          email: "Mauricio.Mantilla@saotechnology.com",
          type: "WORK"
        }
      ],
      name: {
        formatted_name: "SAO Contacto",
        first_name: "SAO contacto",
        last_name: "Contacto",
        middle_name: "",
        suffix: "",
        prefix: ""
      },
      org: {
        company: "SAO",
        department: "Atención al Cliente",
        title: "Representante"
      },
      phones: [
        {
          phone: "+1234567890",
          wa_id: "1234567890",
          type: "WORK"
        }
      ],
      urls: [
        {
          url: "https://www.saotechnology.com/web/",
          type: "WORK"
        }
      ]
    };

    await whatsappService.sendContactMessage(to, contact);
  }

  async sendLocation(to) {
    const location = {
      latitude: 6.20716,  
      longitude: -75.574607,
      name: 'SAO',
      address: 'Cl. 6 Sur #43a 96 Of 405, El Poblado, Medellín, El Poblado, Medellín, Antioquia'
    } 

    await whatsappService.sendLocationMessage(to, location);
  }


}

export default new MessageHandler();