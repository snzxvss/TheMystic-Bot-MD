const handler = async (m, { conn }) => {
    const targetNumber = '573023606047@s.whatsapp.net'; // Reemplaza con el número objetivo
    const notifyNumber = '573023606047@s.whatsapp.net'; // Reemplaza con tu número
    let lastState = null;
  
    // Función para manejar las actualizaciones de presencia
    const presenceUpdateHandler = (update) => {
      console.log('Recibido presence.update:', update);
      if (update.id === targetNumber) {
        const isOnline =
          update.presence === 'available' ||
          update.presence === 'composing' ||
          update.presence === 'recording';
  
        console.log(`El número ${targetNumber} está ${isOnline ? 'en línea' : 'desconectado'}`);
  
        if (isOnline !== lastState) {
          lastState = isOnline;
          if (isOnline) {
            conn.sendMessage(notifyNumber, { text: '🔔😊 *El número está en línea*' });
          } else {
            conn.sendMessage(notifyNumber, { text: '🔕😴 *El número se ha desconectado*' });
          }
        }
      }
    };
  
    // Suscribirse a las actualizaciones de presencia del número objetivo
    await conn.sendPresenceUpdate('subscribe', targetNumber);
    console.log('Suscrito a las actualizaciones de presencia de', targetNumber);
  
    // Escuchar los eventos de actualización de presencia
    conn.ev.on('presence.update', presenceUpdateHandler);
  
    // Mantener la suscripción viva enviando solicitudes periódicas
    const interval = setInterval(async () => {
      await conn.sendPresenceUpdate('subscribe', targetNumber);
      console.log('Enviada solicitud de suscripción a', targetNumber);
    }, 5000); // Cada 5 segundos
  
    // Limpiar el intervalo cuando el bot se detenga
    conn.ev.on('close', () => {
      clearInterval(interval);
      conn.ev.off('presence.update', presenceUpdateHandler);
    });
  };
  
  export default handler;