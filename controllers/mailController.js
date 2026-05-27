const mailgun = require('mailgun-js');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Configuración de Mailgun
const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
});

// Cargar y compilar template
function loadTemplate(templateName) {
    const templatePath = path.join(__dirname, '../views/emails', `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateSource);
}

// Datos base para todos los emails
function getBaseEmailData() {
    return {
        siteName: 'Torneo Jorge Campos',
        siteUrl: 'https://www.torneojorgecampos.com.mx',
        logoUrl: 'https://www.torneojorgecampos.com.mx/images/logo.png',
        year: new Date().getFullYear(),
        social: {
            facebook: 'https://facebook.com/torneojcampos',
            instagram: 'https://instagram.com/torneojcampos',
            tiktok: 'https://tiktok.com/@torneojcampos'
        },
        contact: {
            email: 'contacto@torneojorgecampos.com.mx',
            phone: '+52 449 469 9962',
            whatsapp: 'https://wa.me/524494699962'
        }
    };
}

// Mapeo de valores para mostrar en emails
const relacionLabels = {
    'jugador': 'Jugador',
    'padre': 'Padre / Madre / Tutor',
    'entrenador': 'Entrenador',
    'auxiliar': 'Auxiliar técnico',
    'representante': 'Representante del equipo'
};

const paisLabels = {
    'MX': 'México',
    'US': 'Estados Unidos',
    'GT': 'Guatemala',
    'HN': 'Honduras',
    'SV': 'El Salvador',
    'CR': 'Costa Rica',
    'PA': 'Panamá',
    'CO': 'Colombia',
    'AR': 'Argentina',
    'OTHER': 'Otro'
};

/**
 * Enviar email de confirmación al usuario
 */
async function sendUserConfirmation(inscripcionData) {
    const template = loadTemplate('user-confirmation');
    const baseData = getBaseEmailData();
    
    const htmlContent = template({
        ...baseData,
        nombre: inscripcionData.nombre,
        apellidos: inscripcionData.apellidos,
        email: inscripcionData.email,
        categoria: inscripcionData.categoria === 'femenil' ? 'Femenil' : 'Varonil',
        añoCategoria: inscripcionData.año_categoria,
        fechaInscripcion: new Date().toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    });

    const mailData = {
        from: process.env.MAIL_FROM || 'Torneo Jorge Campos <noreply@torneojorgecampos.com.mx>',
        to: inscripcionData.email,
        subject: '¡Recibimos tu inscripción! - Torneo Jorge Campos 2026',
        html: htmlContent
    };

    return new Promise((resolve, reject) => {
        mg.messages().send(mailData, (error, body) => {
            if (error) {
                console.error('Error enviando email al usuario:', error);
                reject(error);
            } else {
                console.log('✅ Email de confirmación enviado a:', inscripcionData.email);
                resolve(body);
            }
        });
    });
}

/**
 * Enviar notificación al administrador
 */
async function sendAdminNotification(inscripcionData) {
    const template = loadTemplate('admin-notification');
    const baseData = getBaseEmailData();
    
    const htmlContent = template({
        ...baseData,
        // Datos personales
        nombre: inscripcionData.nombre,
        apellidos: inscripcionData.apellidos,
        email: inscripcionData.email,
        celular: inscripcionData.celular,
        edad: inscripcionData.edad,
        relacion: relacionLabels[inscripcionData.relacion] || inscripcionData.relacion,
        
        // Ubicación
        pais: paisLabels[inscripcionData.pais] || inscripcionData.pais,
        estado: inscripcionData.estado,
        ciudad: inscripcionData.ciudad,
        cp: inscripcionData.cp,
        
        // Categoría
        categoria: inscripcionData.categoria === 'femenil' ? 'Femenil' : 'Varonil',
        categoriaColor: inscripcionData.categoria === 'femenil' ? '#E6007E' : '#DAA520',
        añoCategoria: inscripcionData.año_categoria,
        
        // Metadata
        fechaInscripcion: new Date().toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        ip: inscripcionData.ip || 'No disponible',
        userAgent: inscripcionData.userAgent || 'No disponible'
    });

    const mailData = {
        from: process.env.MAIL_FROM || 'Torneo Jorge Campos <noreply@torneojorgecampos.com.mx>',
        to: process.env.MAIL_TO || 'contacto@torneojorgecampos.com.mx',
        subject: `🆕 Nueva Inscripción: ${inscripcionData.nombre} ${inscripcionData.apellidos} - ${inscripcionData.categoria}`,
        html: htmlContent
    };

    return new Promise((resolve, reject) => {
        mg.messages().send(mailData, (error, body) => {
            if (error) {
                console.error('Error enviando notificación al admin:', error);
                reject(error);
            } else {
                console.log('✅ Notificación enviada a admin');
                resolve(body);
            }
        });
    });
}

/**
 * Procesar inscripción completa (enviar ambos emails)
 */
async function processInscripcion(inscripcionData) {
    const results = {
        userEmail: null,
        adminEmail: null,
        errors: []
    };

    // Enviar email al usuario
    try {
        results.userEmail = await sendUserConfirmation(inscripcionData);
    } catch (error) {
        results.errors.push({ type: 'user', error: error.message });
    }

    // Enviar notificación al admin
    try {
        results.adminEmail = await sendAdminNotification(inscripcionData);
    } catch (error) {
        results.errors.push({ type: 'admin', error: error.message });
    }

    return results;
}

module.exports = {
    sendUserConfirmation,
    sendAdminNotification,
    processInscripcion
};
