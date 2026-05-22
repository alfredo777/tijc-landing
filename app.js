const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// ========== CONFIGURACIÓN DE HANDLEBARS ==========
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        range: function(start, end) {
            const result = [];
            for (let i = start; i <= end; i++) {
                result.push(i);
            }
            return result;
        },
        eq: function(a, b) {
            return a === b;
        },
        lt: function(a, b) {
            return a < b;
        },
        json: function(context) {
            return JSON.stringify(context);
        },
        currentYear: function() {
            return new Date().getFullYear();
        },
        timestamp: function() {
            return Date.now();
        }
    }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ========== MIDDLEWARE ==========
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    lastModified: false,
    maxAge: 0
}));

// ========== FUNCIONES PARA OBTENER DATOS ==========
function getGalleryImages() {
    const galleryPath = path.join(__dirname, 'public/images/gallery');
    const images = [];
    
    try {
        if (fs.existsSync(galleryPath)) {
            const files = fs.readdirSync(galleryPath);
            const imageFiles = files.filter(file => /^tijc\d+\.(png|jpg|jpeg|gif|webp)$/i.test(file));
            
            imageFiles.sort((a, b) => {
                const numA = parseInt(a.match(/\d+/)[0]);
                const numB = parseInt(b.match(/\d+/)[0]);
                return numA - numB;
            });
            
            const categories = ['partidos', 'premiacion', 'equipos'];
            imageFiles.forEach((file, index) => {
                images.push({
                    src: `/images/gallery/${file}`,
                    alt: `Galería ${index + 1}`,
                    index: index,
                    category: categories[index % 3],
                    isLarge: index === 0,
                    isWide: index === 5
                });
            });
        }
    } catch (error) {
        console.error('Error leyendo galería:', error);
    }
    
    if (images.length === 0) {
        for (let i = 1; i <= 30; i++) {
            const categories = ['partidos', 'premiacion', 'equipos'];
            images.push({
                src: `/images/gallery/tijc${i}.png`,
                alt: `Galería ${i}`,
                index: i - 1,
                category: categories[(i - 1) % 3],
                isLarge: i === 1,
                isWide: i === 6
            });
        }
    }
    
    return images;
}

function getSponsors() {
    const sponsorsPath = path.join(__dirname, 'public/images/sponsors');
    const sponsors = [];
    
    try {
        if (fs.existsSync(sponsorsPath)) {
            const files = fs.readdirSync(sponsorsPath);
            const imageFiles = files.filter(file => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file));
            imageFiles.sort();
            
            imageFiles.forEach((file, index) => {
                sponsors.push({
                    src: `/images/sponsors/${file}`,
                    alt: `Patrocinador ${index + 1}`
                });
            });
        }
    } catch (error) {
        console.error('Error leyendo sponsors:', error);
    }
    
    if (sponsors.length === 0) {
        for (let i = 1; i <= 8; i++) {
            sponsors.push({
                src: `/images/sponsors/sponsor-${i}.png`,
                alt: `Patrocinador ${i}`
            });
        }
    }
    
    return sponsors;
}

function getSiteData() {
    const timestamp = Date.now();
    
    return {
        site: {
            title: 'Torneo Internacional Jorge Campos 2026',
            description: 'El torneo de fútbol infantil más importante de México',
            url: 'www.torneojorgecampos.com.mx',
            social: {
                handle: '@torneojcampos',
                facebook: 'https://facebook.com/torneojcampos',
                instagram: 'https://instagram.com/torneojcampos',
                tiktok: 'https://tiktok.com/@torneojcampos'
            },
            contact: {
                email: 'info@torneojorgecampos.com.mx',
                phone: '+52 449 469 9962'
            }
        },
        torneo: {
            edicion: '2026',
            fechaInicio: '12',
            fechaFin: '15',
            mes: 'Noviembre',
            año: '2026',
            fechaCompleta: '12 - 15 de Noviembre 2026',
            fechaLimiteInscripcion: '01 de Noviembre 2026',
            sede: {
                nombre: 'Altium',
                ciudad: 'Zapopan',
                estado: 'Jalisco',
                direccion: 'Altium Sports Complex, Zapopan, Jalisco'
            },
            jugadoresPorEquipo: 18,
            staffPorEquipo: 3
        },
        categorias: {
            femenil: [
                { nombre: 'U12', descripcion: 'Sub 12' },
                { nombre: 'U15', descripcion: 'Sub 15' }
            ],
            varonil: [
                { nombre: '2013-2014', descripcion: 'Nacidos en' },
                { nombre: '2015-2016', descripcion: 'Nacidos en' },
                { nombre: '2017-2018', descripcion: 'Nacidos en' },
                { nombre: '2019-2020', descripcion: 'Nacidos en' }
            ]
        },
        experiencias: [
            { id: 'meet', icon: 'fa-handshake', titulo: 'Meet & Greet', subtitulo: 'Conoce a Cracks Inmortales' },
            { id: 'conferencias', icon: 'fa-microphone', titulo: 'Conferencias', subtitulo: 'Platica con los Expertos' },
            { id: 'interactivas', icon: 'fa-gamepad', titulo: 'Entretenimiento 360°', subtitulo: 'Diversión para Todos' },
            { id: 'pasaporte', icon: 'fa-passport', titulo: 'Pasaporte Brody', subtitulo: 'Llénalo y Gana Increíbles Premios' }
        ],

        infoCards: [
            { id: 'sede', icon: 'fa-map-marker-alt', titulo: 'Sede', valor: 'Altium', subtitulo: 'Zapopan, Jalisco' },
            { id: 'fechas', icon: 'fa-calendar-alt', titulo: 'Fechas', valor: '12-15 Nov', subtitulo: 'Noviembre 2026' },
            { id: 'jugadores', icon: 'fa-users', titulo: 'Jugadores', valor: '18', subtitulo: 'Por equipo' },
            { id: 'categorias', icon: 'fa-futbol', titulo: 'Categorías', valor: null, subtitulo: 'Múltiples edades', badges: ['Varonil', 'Femenil'] }
        ],
        video: {
            youtubeId: 'dQw4w9WgXcQ',
            titulo: 'Video Promocional'
        },
        mapa: {
            embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119421.05584983498!2d-103.43587455!3d20.6737772!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8428b18cb52fd39b%3A0xd63d9302571db8ee!2sZapopan%2C%20Jal.!5e0!3m2!1ses-419!2smx!4v1234567890'
        },
        inscripcion: {
            beneficios: [
                'Participación en torneo',
                'Kit de bienvenida',
                '18 jugadores por equipo',
                '3 miembros de staff',
                'Acceso a actividades',
                'Premiación especial'
            ]
        },
        nav: [
            { href: '#inicio', texto: 'Inicio' },
            { href: '#info', texto: 'Información' },
            { href: '#categorias', texto: 'Categorías' },
            { href: '#experiencia', texto: 'Experiencia' },
            { href: '#galeria', texto: 'Galería' },
            { href: '#ubicacion', texto: 'Ubicación' }
        ],
        footerLinks: {
            enlaces: [
                { href: '#info', texto: 'Información' },
                { href: '#categorias', texto: 'Categorías' },
                { href: '#experiencia', texto: 'Experiencia' },
                { href: '#galeria', texto: 'Galería' },
                { href: '#inscripcion', texto: 'Inscripción' }
            ],
            legal: [
                { href: '#', texto: 'Términos y Condiciones' },
                { href: '#', texto: 'Aviso de Privacidad' },
                { href: '#', texto: 'Reglamento' }
            ]
        },
        gallery: getGalleryImages(),
        sponsors: getSponsors(),
        timestamp: timestamp
    };
}

// ========== RUTAS ==========
app.get('/', (req, res) => {
    const data = getSiteData();
    res.render('index', data);
});

app.get('/api/gallery', (req, res) => {
    const data = getSiteData();
    res.json({ gallery: data.gallery, timestamp: data.timestamp });
});

app.get('/api/sponsors', (req, res) => {
    const data = getSiteData();
    res.json({ sponsors: data.sponsors, timestamp: data.timestamp });
});

app.get('/api/refresh', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});


// Página de Inscripción
app.get('/inscripcion', (req, res) => {
    res.render('inscripcion', {
        title: 'Inscripción - Copa Jorge Campos',
        timestamp: Date.now(),
        site: {
            social: {
                whatsapp: '5212345678901',
                handle: '@copajorgecampos'
            },
            contact: {
                email: 'info@copajorgecampos.com',
                phone: '+52 33 1234 5678'
            }
        }
    });
});
// API para recibir inscripciones (POST)
app.post('/api/inscripcion', (req, res) => {
    // Aquí procesarías el formulario
    console.log('Nueva inscripción:', req.body);
    res.json({ success: true, message: 'Inscripción recibida correctamente' });
});
// ========== SERVIDOR HTTP Y WEBSOCKET ==========
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('🔌 Cliente conectado para hot reload');
    
    ws.on('close', () => {
        clients.delete(ws);
        console.log('🔌 Cliente desconectado');
    });
});

function notifyClients(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// ========== WATCH DE ARCHIVOS ==========
if (process.env.NODE_ENV !== 'production') {
    const watcher = chokidar.watch([
        path.join(__dirname, 'public'),
        path.join(__dirname, 'views')
    ], {
        ignored: /node_modules/,
        persistent: true,
        ignoreInitial: true
    });
    
    watcher.on('all', (event, filePath) => {
        console.log(`[${event}] ${filePath}`);
        
        const ext = path.extname(filePath).toLowerCase();
        let type = 'full';
        
        if (['.css'].includes(ext)) {
            type = 'css';
        } else if (['.js'].includes(ext) && !filePath.includes('views')) {
            type = 'js';
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
            type = 'image';
        }
        
        notifyClients({
            type: 'reload',
            fileType: type,
            file: filePath,
            timestamp: Date.now()
        });
    });
    
    console.log('👀 Watching for file changes...');
}

// ========== INICIAR SERVIDOR ==========
server.listen(PORT, () => {
    console.log(`
    ⚽ Torneo Jorge Campos 2026
    🚀 Servidor corriendo en http://localhost:${PORT}
    🔄 Hot Reload activo (presiona R en el navegador para recargar)
    `);
});