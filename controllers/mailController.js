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
            secure: port == 465,
            auth: {
                user: user,
                pass: pass
            },
            tls: {
                rejectUnauthorized: false
            },
            debug: true,
            logger: true
        });
        
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Error verificando SMTP:', error.message);
            } else {
                console.log('✅ SMTP configurado correctamente:');
                console.log('   Host:', host);
                console.log('   Port:', port);
                console.log('   User:', user);
                console.log('   From:', process.env.MAIL_FROM || user);
                console.log('   Admin emails:', process.env.MAIL_TO);
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
        siteUrl: 'torneojorgecampos.com.mx',
        logoUrl: 'https://torneojorgecampos.com.mx/images/logo.png',
        logoBlackUrl: 'https://torneojorgecampos.com.mx/images/logo-black.png',
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
        },
        // Datos de pago
        pago: {
            banco: 'BanBajío',
            cuenta: '387104710202',
            clabe: '030010900043613530'
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
 * Obtener lista de emails de administrador
 */
function getAdminEmails() {
    const mailTo = process.env.MAIL_TO || 'contacto@torneojorgecampos.com.mx';
    const emails = mailTo
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);
    return emails;
}

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
    
    console.log('═══════════════════════════════════════════');
    console.log('📧 ENVIANDO EMAIL:');
    console.log('   From:', mailOptions.from);
    console.log('   To:', mailOptions.to);
    console.log('   Subject:', mailOptions.subject);
    console.log('═══════════════════════════════════════════');
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email enviado exitosamente:');
        console.log('   Message ID:', info.messageId);
        console.log('   Accepted:', info.accepted);
        return info;
    } catch (error) {
        console.error('❌ ERROR ENVIANDO EMAIL:', error.message);
        throw error;
    }
}

/**
 * Enviar email de confirmación al usuario
 */
async function sendUserConfirmation(inscripcionData) {
    const template = loadTemplate('user-confirmation');
    const baseData = getBaseEmailData();
    
    const templateData = {
        ...baseData,
        nombre: inscripcionData.nombre,
        apellidos: inscripcionData.apellidos,
        email: inscripcionData.email,
        equipo: inscripcionData.equipo || 'No especificado',
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
    };
    
    let htmlContent;
    
    if (template) {
        htmlContent = template(templateData);
    } else {
        // Fallback HTML con datos de pago
        htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="${baseData.logoUrl}" alt="Logo" style="max-height: 80px;">
                </div>
                <h1 style="color: #9220E1; text-align: center;">¡Gracias por tu inscripción!</h1>
                <p>Hola <strong>${inscripcionData.nombre} ${inscripcionData.apellidos}</strong>,</p>
                <p>Hemos recibido tu solicitud de inscripción al <strong>Torneo Jorge Campos 2026</strong>.</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Equipo:</strong> ${inscripcionData.equipo || 'No especificado'}</p>
                    <p style="margin: 5px 0;"><strong>Categoría:</strong> ${inscripcionData.categoria === 'femenil' ? 'Femenil' : 'Varonil'}</p>
                    <p style="margin: 5px 0;"><strong>Año:</strong> ${inscripcionData.año_categoria}</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 25px; border-radius: 10px; margin: 20px 0; border: 2px solid #FDED07;">
                    <h3 style="color: #FDED07; text-align: center; margin-top: 0;">Datos para realizar tu pago</h3>
                    <table style="width: 100%; color: white;">
                        <tr>
                            <td style="padding: 8px 0; color: #aaa;">Banco:</td>
                            <td style="padding: 8px 0; font-weight: bold;">BanBajío</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #aaa;">Cuenta:</td>
                            <td style="padding: 8px 0; font-weight: bold; color: #FDED07; font-family: monospace; font-size: 16px;">387104710202</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #aaa;">CLABE:</td>
                            <td style="padding: 8px 0; font-weight: bold; color: #FDED07; font-family: monospace; font-size: 16px;">030010900043613530</td>
                        </tr>
                    </table>
                    <p style="color: #FDED07; font-size: 13px; margin: 15px 0 0 0; padding: 10px; background: rgba(253,237,7,0.1); border-radius: 5px;">
                        <strong>Importante:</strong> Al realizar la transferencia, incluye tu nombre completo y nombre del equipo como referencia.
                    </p>
                </div>
                
                <h3 style="color: #333;">¿Qué sigue?</h3>
                <ol style="color: #666; line-height: 1.8;">
                    <li>Realiza tu pago a la cuenta indicada</li>
                    <li>Envíanos tu comprobante por WhatsApp o email</li>
                    <li>Confirmaremos tu pago</li>
                    <li>¡Tu inscripción quedará confirmada!</li>
                </ol>
                
                <div style="background: #9220E1; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                    <p style="color: #FDED07; margin: 0 0 10px 0; font-weight: bold;">¿Ya realizaste tu pago?</p>
                    <p style="color: white; margin: 0 0 15px 0;">Envíanos tu comprobante:</p>
                    <a href="https://wa.me/524494699962" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 5px;">WhatsApp</a>
                    <a href="mailto:contacto@torneojorgecampos.com.mx" style="display: inline-block; background: #F6288D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 5px;">Email</a>
                </div>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Torneo Jorge Campos<br>
                    <a href="https://torneojorgecampos.com.mx">torneojorgecampos.com.mx</a><br>
                    contacto@torneojorgecampos.com.mx | +52 449 469 9962
                </p>
            </div>
        `;
    }

    const mailOptions = {
        from: process.env.MAIL_FROM || 'Torneo Jorge Campos <no-reply@torneojorgecampos.com.mx>',
        to: inscripcionData.email,
        replyTo: 'contacto@torneojorgecampos.com.mx',
        subject: `¡Recibimos tu inscripción! - ${inscripcionData.equipo || 'Torneo Jorge Campos 2026'}`,
        html: htmlContent,
        headers: {
            'X-Priority': '1',
            'X-Mailer': 'Torneo Jorge Campos Mailer'
        }
    };

    return sendEmail(mailOptions);
}

/**
 * Generar contenido HTML para notificación admin
 */
function generateAdminHtmlContent(inscripcionData, baseData, template) {
    const templateData = {
        ...baseData,
        nombre: inscripcionData.nombre,
        apellidos: inscripcionData.apellidos,
        email: inscripcionData.email,
        celular: inscripcionData.celular,
        edad: inscripcionData.edad,
        equipo: inscripcionData.equipo || 'No especificado',
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
    };
    
    if (template) {
        return template(templateData);
    }
    
    // Fallback HTML para admin
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #9220E1; padding: 20px; border-radius: 10px 10px 0 0;">
                <table style="width: 100%;">
                    <tr>
                        <td><img src="${baseData.logoUrl}" alt="Logo" style="height: 50px;"></td>
                        <td style="text-align: right;">
                            <span style="background: #21FF04; color: #1a0a2e; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold;">NUEVA INSCRIPCIÓN</span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="background: ${templateData.categoriaColor}; padding: 15px; text-align: center;">
                <h2 style="color: white; margin: 0;">${templateData.categoria} - ${templateData.añoCategoria}</h2>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #eee;">
                <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">📅 ${templateData.fechaInscripcion}</p>
                
                <!-- EQUIPO DESTACADO -->
                <div style="background: linear-gradient(135deg, #9220E1, #F6288D); padding: 20px; border-radius: 10px; margin: 15px 0; text-align: center;">
                    <p style="color: rgba(255,255,255,0.8); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Equipo</p>
                    <h2 style="color: #FDED07; margin: 0; font-size: 28px;">${templateData.equipo}</h2>
                </div>
                
                <h1 style="color: #333; font-size: 24px; margin: 20px 0 10px 0;">
                    ${templateData.nombre} ${templateData.apellidos}
                </h1>
                
                <div style="background: #f8f8f8; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #9220E1; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase;">👤 Datos Personales</h3>
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 8px 0; color: #888; border-bottom: 1px solid #eee;">Email:</td>
                            <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #eee;"><a href="mailto:${templateData.email}" style="color: #9220E1; font-weight: bold;">${templateData.email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888; border-bottom: 1px solid #eee;">Celular:</td>
                            <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #eee;"><a href="tel:${templateData.celular}" style="color: #333; font-weight: bold;">${templateData.celular}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888; border-bottom: 1px solid #eee;">Edad:</td>
                            <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #eee; font-weight: bold;">${templateData.edad} años</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888;">Relación:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${templateData.relacion}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #f8f8f8; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #F6288D; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase;">📍 Ubicación</h3>
                    <table style="width: 100%;">
                        <tr>
                            <td style="padding: 8px 0; color: #888; border-bottom: 1px solid #eee;">País:</td>
                            <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #eee; font-weight: bold;">${templateData.pais}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888; border-bottom: 1px solid #eee;">Estado:</td>
                            <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #eee; font-weight: bold;">${templateData.estado}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888; border-bottom: 1px solid #eee;">Ciudad:</td>
                            <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #eee; font-weight: bold;">${templateData.ciudad}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #888;">C.P.:</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${templateData.cp}</td>
                        </tr>
                    </table>
                </div>
                
                <table style="width: 100%; margin-top: 20px;">
                    <tr>
                        <td style="padding: 5px; width: 50%;">
                            <a href="https://wa.me/52${(templateData.celular || '').replace(/\D/g, '')}" style="display: block; background: #25D366; color: white; padding: 15px; border-radius: 8px; text-decoration: none; text-align: center; font-weight: bold;">💬 WhatsApp</a>
                        </td>
                        <td style="padding: 5px; width: 50%;">
                            <a href="mailto:${templateData.email}" style="display: block; background: #9220E1; color: white; padding: 15px; border-radius: 8px; text-decoration: none; text-align: center; font-weight: bold;">✉️ Email</a>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 5px;">
                            <a href="tel:${templateData.celular}" style="display: block; background: #F6288D; color: white; padding: 15px; border-radius: 8px; text-decoration: none; text-align: center; font-weight: bold;">📞 Llamar: ${templateData.celular}</a>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="background: #f0f0f0; padding: 15px 20px;">
                <p style="color: #888; font-size: 11px; margin: 0;">
                    <strong>IP:</strong> ${templateData.ip} | <strong>User Agent:</strong> ${templateData.userAgent}
                </p>
            </div>
            
            <div style="background: #9220E1; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
                <p style="color: white; font-size: 11px; margin: 0;">© ${templateData.year} ${templateData.siteName} - Panel de Administración</p>
            </div>
        </div>
    `;
}

/**
 * Enviar notificación a TODOS los administradores
 */
async function sendAdminNotification(inscripcionData) {
    const template = loadTemplate('admin-notification');
    const baseData = getBaseEmailData();
    const adminEmails = getAdminEmails();
    
    console.log('🎯 Emails de admin destino:', adminEmails.join(', '));
    
    const htmlContent = generateAdminHtmlContent(inscripcionData, baseData, template);
    const equipoNombre = inscripcionData.equipo || 'Sin equipo';
    const subject = `🆕 Nueva Inscripción: ${equipoNombre} - ${inscripcionData.nombre} ${inscripcionData.apellidos} (${inscripcionData.categoria})`;
    
    const results = [];
    const errors = [];
    
    for (const adminEmail of adminEmails) {
        console.log(`📧 Enviando a admin: ${adminEmail}`);
        
        const mailOptions = {
            from: process.env.MAIL_FROM || 'Torneo Jorge Campos <no-reply@torneojorgecampos.com.mx>',
            to: adminEmail,
            replyTo: inscripcionData.email,
            subject: subject,
            html: htmlContent,
            headers: {
                'X-Priority': '1',
                'X-Mailer': 'Torneo Jorge Campos Mailer'
            }
        };
        
        try {
            const result = await sendEmail(mailOptions);
            results.push({ email: adminEmail, success: true, messageId: result.messageId });
        } catch (error) {
            errors.push({ email: adminEmail, error: error.message });
        }
    }
    
    console.log(`📊 RESUMEN: ✅ ${results.length} enviados, ❌ ${errors.length} fallidos`);
    
    return { sent: results, errors: errors, totalSent: results.length, totalFailed: errors.length };
}

/**
 * Función de prueba
 */
async function sendTestEmail(toEmail) {
    console.log('🧪 Enviando email de prueba a:', toEmail);
    
    const mailOptions = {
        from: process.env.MAIL_FROM || 'Torneo Jorge Campos <no-reply@torneojorgecampos.com.mx>',
        to: toEmail,
        subject: '🧪 Test - Torneo Jorge Campos ' + new Date().toISOString(),
        html: `<div style="font-family: Arial; padding: 20px;"><h1 style="color: #9220E1;">Email de Prueba</h1><p>Enviado: ${new Date().toLocaleString('es-MX')}</p></div>`
    };

    return sendEmail(mailOptions);
}

/**
 * Procesar inscripción completa
 */
async function processInscripcion(inscripcionData) {
    const adminEmails = getAdminEmails();
    
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  📬 PROCESANDO NUEVA INSCRIPCIÓN                          ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  Equipo: ${inscripcionData.equipo || 'No especificado'}`);
    console.log(`║  Nombre: ${inscripcionData.nombre} ${inscripcionData.apellidos}`);
    console.log(`║  Email: ${inscripcionData.email}`);
    console.log(`║  Categoría: ${inscripcionData.categoria} - ${inscripcionData.año_categoria}`);
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  📧 Admins a notificar: ${adminEmails.length}`);
    console.log('╚═══════════════════════════════════════════════════════════╝');
    
    const results = { userEmail: null, adminEmails: null, errors: [] };

    // Email al usuario
    console.log('📧 [1/2] Enviando confirmación al usuario...');
    try {
        results.userEmail = await sendUserConfirmation(inscripcionData);
        console.log('✅ [1/2] Email al usuario enviado');
    } catch (error) {
        console.error('❌ [1/2] Error:', error.message);
        results.errors.push({ type: 'user', error: error.message });
    }

    // Notificación a admins
    console.log(`📧 [2/2] Enviando notificación a ${adminEmails.length} admin(s)...`);
    try {
        results.adminEmails = await sendAdminNotification(inscripcionData);
        console.log(`✅ [2/2] Emails a admins: ${results.adminEmails.totalSent} enviados`);
    } catch (error) {
        console.error('❌ [2/2] Error:', error.message);
        results.errors.push({ type: 'admin', error: error.message });
    }

    return results;
}

module.exports = {
    sendUserConfirmation,
    sendAdminNotification,
    processInscripcion,
    sendTestEmail,
    getAdminEmails
};
