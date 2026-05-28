const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Configuración del transporter SMTP
let transporter = null;

function initMailer() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST || 'smtp.mailgun.org';
    const port = process.env.SMTP_PORT || 465;
    
    if (!user || !pass) {
        console.warn('⚠️ SMTP no configurado');
        console.warn('   SMTP_USER:', user ? '✓' : '✗ falta');
        console.warn('   SMTP_PASS:', pass ? '✓' : '✗ falta');
        return;
    }
    
    try {
        transporter = nodemailer.createTransport({
            host: host,
            port: parseInt(port),
            secure: port == 465, // true para 465, false para otros puertos
            auth: {
                user: user,
                pass: pass
            }
        });
        
        // Verificar conexión
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Error verificando SMTP:', error.message);
            } else {
                console.log('✅ SMTP configurado correctamente:');
                console.log('   Host:', host);
                console.log('   Port:', port);
                console.log('   User:', user);
                console.log('   From:', process.env.MAIL_FROM || user);
            }
        });
        
    } catch (e) {
        console.error('❌ Error configurando SMTP:', e.message);
    }
}

initMailer();

// Cargar y compilar template
function loadTemplate(templateName) {
    const templatePath = path.join(__dirname, '../views/emails', `${templateName}.hbs`);
    
    if (!fs.existsSync(templatePath)) {
        console.warn(`⚠️ Template no encontrado: ${templatePath}`);
        return null;
    }
    
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateSource);
}

// Datos base para todos los emails
function getBaseEmailData() {
    return {
        siteName: 'Torneo Jorge Campos',
        siteUrl: 'https://torneojorgecampos.com.mx',
        logoUrl: 'https://torneojorgecampos.com.mx/images/logo.png',
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

// Mapeo de valores
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
 * Función helper para enviar emails
 */
async function sendEmail(mailOptions) {
    if (!transporter) {
        console.warn('⚠️ SMTP no configurado - email simulado');
        console.log('   To:', mailOptions.to);
        console.log('   Subject:', mailOptions.subject);
        return { messageId: 'simulated', simulated: true };
    }
    
    console.log('📧 Enviando email:');
    console.log('   From:', mailOptions.from);
    console.log('   To:', mailOptions.to);
    console.log('   Subject:', mailOptions.subject);
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error enviando email:', error.message);
        throw error;
    }
}

/**
 * Enviar email de confirmación al usuario
 */
async function sendUserConfirmation(inscripcionData) {
    const template = loadTemplate('user-confirmation');
    const baseData = getBaseEmailData();
    
    let htmlContent;
    
    if (template) {
        htmlContent = template({
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
    } else {
        // Fallback sin template
        htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="https://www.torneojorgecampos.com.mx/images/logo.png" alt="Logo" style="max-height: 80px;">
                </div>
                <h1 style="color: #9220E1; text-align: center;">¡Gracias por tu inscripción!</h1>
                <p>Hola <strong>${inscripcionData.nombre} ${inscripcionData.apellidos}</strong>,</p>
                <p>Hemos recibido tu solicitud de inscripción al <strong>Torneo Jorge Campos 2026</strong>.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Categoría:</strong> ${inscripcionData.categoria === 'femenil' ? 'Femenil' : 'Varonil'}</p>
                    <p style="margin: 5px 0;"><strong>Año:</strong> ${inscripcionData.año_categoria}</p>
                </div>
                <p>Nos pondremos en contacto contigo pronto con más información sobre el torneo.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Torneo Jorge Campos<br>
                    <a href="https://www.torneojorgecampos.com.mx">www.torneojorgecampos.com.mx</a><br>
                    contacto@torneojorgecampos.com.mx | +52 449 469 9962
                </p>
            </div>
        `;
    }

    const mailOptions = {
        from: process.env.MAIL_FROM || 'Torneo Jorge Campos <non-reply@torneojorgecampos.com.mx>',
        to: inscripcionData.email,
        subject: '¡Recibimos tu inscripción! - Torneo Jorge Campos 2026',
        html: htmlContent
    };

    return sendEmail(mailOptions);
}

/**
 * Enviar notificación al administrador
 */
async function sendAdminNotification(inscripcionData) {
    const template = loadTemplate('admin-notification');
    const baseData = getBaseEmailData();
    
    let htmlContent;
    
    if (template) {
        htmlContent = template({
            ...baseData,
            nombre: inscripcionData.nombre,
            apellidos: inscripcionData.apellidos,
            email: inscripcionData.email,
            celular: inscripcionData.celular,
            edad: inscripcionData.edad,
            relacion: relacionLabels[inscripcionData.relacion] || inscripcionData.relacion,
            pais: paisLabels[inscripcionData.pais] || inscripcionData.pais,
            estado: inscripcionData.estado,
            ciudad: inscripcionData.ciudad,
            cp: inscripcionData.cp,
            categoria: inscripcionData.categoria === 'femenil' ? 'Femenil' : 'Varonil',
            categoriaColor: inscripcionData.categoria === 'femenil' ? '#E6007E' : '#DAA520',
            añoCategoria: inscripcionData.año_categoria,
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
    } else {
        // Fallback sin template
        htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #9220E1;">🆕 Nueva Inscripción</h1>
                <p style="color: #666;">Recibida el ${new Date().toLocaleString('es-MX')}</p>
                
                <div style="background: ${inscripcionData.categoria === 'femenil' ? '#FFF0F5' : '#FFF8DC'}; padding: 15px; border-radius: 10px; border-left: 4px solid ${inscripcionData.categoria === 'femenil' ? '#E6007E' : '#DAA520'}; margin: 20px 0;">
                    <strong style="font-size: 18px;">${inscripcionData.categoria === 'femenil' ? 'FEMENIL' : 'VARONIL'} ${inscripcionData.año_categoria}</strong>
                </div>
                
                <h3 style="color: #333; border-bottom: 2px solid #9220E1; padding-bottom: 10px;">Datos Personales</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%;"><strong>Nombre:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${inscripcionData.nombre} ${inscripcionData.apellidos}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${inscripcionData.email}">${inscripcionData.email}</a></td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Celular:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="tel:${inscripcionData.celular}">${inscripcionData.celular}</a></td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Edad:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${inscripcionData.edad} años</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Relación:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${relacionLabels[inscripcionData.relacion] || inscripcionData.relacion}</td></tr>
                </table>
                
                <h3 style="color: #333; border-bottom: 2px solid #9220E1; padding-bottom: 10px; margin-top: 30px;">Ubicación</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%;"><strong>País:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${paisLabels[inscripcionData.pais] || inscripcionData.pais}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Estado:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${inscripcionData.estado}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Ciudad:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${inscripcionData.ciudad}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>CP:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${inscripcionData.cp}</td></tr>
                </table>
                
                <div style="margin-top: 30px; padding: 15px; background: #f0f0f0; border-radius: 5px;">
                    <a href="https://wa.me/${inscripcionData.celular.replace(/\D/g, '')}" style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">💬 WhatsApp</a>
                    <a href="mailto:${inscripcionData.email}" style="display: inline-block; background: #9220E1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">✉️ Email</a>
                </div>
            </div>
        `;
    }

    const mailOptions = {
        from: process.env.MAIL_FROM || 'Torneo Jorge Campos <contacto@torneojorgecampos.com.mx>',
        to: process.env.MAIL_TO || 'contacto@torneojorgecampos.com.mx',
        subject: `🆕 Nueva Inscripción: ${inscripcionData.nombre} ${inscripcionData.apellidos} - ${inscripcionData.categoria}`,
        html: htmlContent
    };

    return sendEmail(mailOptions);
}

/**
 * Procesar inscripción completa
 */
async function processInscripcion(inscripcionData) {
    console.log('📬 Procesando inscripción de:', inscripcionData.nombre, inscripcionData.apellidos);
    
    const results = {
        userEmail: null,
        adminEmail: null,
        errors: []
    };

    // Email al usuario
    try {
        results.userEmail = await sendUserConfirmation(inscripcionData);
    } catch (error) {
        results.errors.push({ type: 'user', error: error.message });
    }

    // Notificación al admin
    try {
        results.adminEmail = await sendAdminNotification(inscripcionData);
    } catch (error) {
        results.errors.push({ type: 'admin', error: error.message });
    }

    if (results.errors.length > 0) {
        console.warn('⚠️ Algunos emails no se enviaron:', results.errors);
    } else {
        console.log('✅ Todos los emails enviados correctamente');
    }

    return results;
}

module.exports = {
    sendUserConfirmation,
    sendAdminNotification,
    processInscripcion
};
