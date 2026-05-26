/**
 * TORNEO JORGE CAMPOS 2026 - MAIN.JS
 */

(function() {
    'use strict';

    const CONFIG = {
        countdownDate: new Date('November 12, 2026 08:00:00').getTime(),
        galleryPath: '/images/gallery/',
        timestamp: Date.now()
    };

    const Utils = {
        addTimestamp: function(url) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}v=${CONFIG.timestamp}`;
        },
        padZero: function(num) {
            return String(num).padStart(2, '0');
        }
    };

    // Navbar
    const Navbar = {
        navbar: null,
        menuBtn: null,
        mobileMenu: null,

        init: function() {
            this.navbar = document.getElementById('navbar');
            this.menuBtn = document.getElementById('menuBtn');
            this.mobileMenu = document.getElementById('mobileMenu');

            if (this.navbar) {
                window.addEventListener('scroll', this.handleScroll.bind(this));
            }

            if (this.menuBtn && this.mobileMenu) {
                this.menuBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
            }

            document.querySelectorAll('#mobileMenu a').forEach(link => {
                link.addEventListener('click', () => {
                    this.mobileMenu.classList.add('hidden');
                    this.updateMenuIcon(false);
                });
            });
        },

        handleScroll: function() {
            if (window.scrollY > 50) {
                this.navbar.classList.add('bg-rosa-dark/95', 'backdrop-blur', 'shadow-lg');
            } else {
                this.navbar.classList.remove('bg-rosa-dark/95', 'backdrop-blur', 'shadow-lg');
            }
        },

        toggleMobileMenu: function() {
            this.mobileMenu.classList.toggle('hidden');
            const isOpen = !this.mobileMenu.classList.contains('hidden');
            this.updateMenuIcon(isOpen);
        },

        updateMenuIcon: function(isOpen) {
            const icon = this.menuBtn.querySelector('i');
            if (isOpen) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        }
    };

    // Countdown
    const Countdown = {
        elements: {},
        interval: null,

        init: function() {
            this.elements = {
                days: document.getElementById('days'),
                hours: document.getElementById('hours'),
                minutes: document.getElementById('minutes'),
                seconds: document.getElementById('seconds')
            };

            if (this.elements.days) {
                this.update();
                this.interval = setInterval(this.update.bind(this), 1000);
            }
        },

        update: function() {
            const now = new Date().getTime();
            const distance = CONFIG.countdownDate - now;

            if (distance <= 0) {
                clearInterval(this.interval);
                Object.values(this.elements).forEach(el => {
                    if (el) el.textContent = '00';
                });
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (this.elements.days) this.elements.days.textContent = Utils.padZero(days);
            if (this.elements.hours) this.elements.hours.textContent = Utils.padZero(hours);
            if (this.elements.minutes) this.elements.minutes.textContent = Utils.padZero(minutes);
            if (this.elements.seconds) this.elements.seconds.textContent = Utils.padZero(seconds);
        }
    };

    // Gallery
    const Gallery = {
        images: [],
        currentIndex: 0,
        lightbox: null,
        lightboxImg: null,
        counter: null,
        thumbnailsContainer: null,

        init: function() {
            this.lightbox = document.getElementById('galleryLightbox');
            this.lightboxImg = document.getElementById('galleryLightboxImg');
            this.counter = document.getElementById('galleryCounter');
            this.thumbnailsContainer = document.getElementById('galleryThumbnails');

            if (window.galleryData && Array.isArray(window.galleryData)) {
                this.images = window.galleryData.map(img => img.src);
            } else {
                for (let i = 1; i <= 30; i++) {
                    this.images.push(`${CONFIG.galleryPath}tijc${i}.png`);
                }
            }

            this.initFilters();
        },

        initFilters: function() {
            const filterBtns = document.querySelectorAll('.gallery-filter');
            const galleryItems = document.querySelectorAll('.gallery-item');

            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => {
                        b.classList.remove('bg-rosa', 'text-white', 'active');
                        b.classList.add('bg-gray-200', 'text-gray-700');
                    });
                    btn.classList.remove('bg-gray-200', 'text-gray-700');
                    btn.classList.add('bg-rosa', 'text-white', 'active');

                    const filter = btn.dataset.filter;
                    galleryItems.forEach(item => {
                        if (filter === 'all' || item.dataset.category === filter) {
                            item.classList.remove('hidden');
                        } else {
                            item.classList.add('hidden');
                        }
                    });
                });
            });
        },

        open: function(index) {
            this.currentIndex = index || 0;
            this.updateLightbox();
            this.generateThumbnails();
            this.lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        close: function() {
            this.lightbox.classList.remove('active');
            document.body.style.overflow = '';
        },

        changeImage: function(direction) {
            this.currentIndex += direction;
            if (this.currentIndex < 0) this.currentIndex = this.images.length - 1;
            if (this.currentIndex >= this.images.length) this.currentIndex = 0;
            this.updateLightbox();
            this.updateThumbnailsActive();
        },

        updateLightbox: function() {
            const src = Utils.addTimestamp(this.images[this.currentIndex]);
            this.lightboxImg.src = src;
            this.counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        },

        generateThumbnails: function() {
            this.thumbnailsContainer.innerHTML = '';
            this.images.forEach((img, index) => {
                const thumb = document.createElement('img');
                thumb.src = Utils.addTimestamp(img);
                thumb.alt = `Thumbnail ${index + 1}`;
                thumb.className = `w-12 h-12 object-cover cursor-pointer transition-opacity ${index === this.currentIndex ? 'opacity-100 ring-2 ring-dorado' : 'opacity-50 hover:opacity-100'}`;
                thumb.onclick = (e) => {
                    e.stopPropagation();
                    this.currentIndex = index;
                    this.updateLightbox();
                    this.updateThumbnailsActive();
                };
                this.thumbnailsContainer.appendChild(thumb);
            });
        },

        updateThumbnailsActive: function() {
            const thumbs = this.thumbnailsContainer.querySelectorAll('img');
            thumbs.forEach((thumb, index) => {
                if (index === this.currentIndex) {
                    thumb.classList.add('opacity-100', 'ring-2', 'ring-dorado');
                    thumb.classList.remove('opacity-50');
                } else {
                    thumb.classList.remove('opacity-100', 'ring-2', 'ring-dorado');
                    thumb.classList.add('opacity-50');
                }
            });
        },

        updateImages: function() {
            CONFIG.timestamp = Date.now();
            if (this.lightbox.classList.contains('active')) {
                this.updateLightbox();
                this.generateThumbnails();
            }
        }
    };

    // Modals
    const Modals = {
        infoModal: null,
        infoContent: null,
        expModal: null,
        expContent: null,

        infoData: {
            sede: {
                icon: 'fa-map-marker-alt',
                title: 'Sede - Altium Sports Complex',
                content: '<p class="mb-4 text-gray-600">El torneo se realizará en las instalaciones de <strong class="text-gray-900">Altium Sports Complex</strong>, ubicado en Zapopan, Jalisco.</p><ul class="space-y-3 text-gray-600"><li class="flex items-start gap-3"><i class="fas fa-check text-rosa mt-1"></i><span>Canchas de pasto sintético profesional</span></li><li class="flex items-start gap-3"><i class="fas fa-check text-rosa mt-1"></i><span>Control de acceso a instalaciones para jugadores y familiares</span></li><li class="flex items-start gap-3"><i class="fas fa-check text-rosa mt-1"></i><span>Vestidores equipados para equipos</span></li><li class="flex items-start gap-3"><i class="fas fa-check text-rosa mt-1"></i><span>Área de alimentos y bebidas</span></li><li class="flex items-start gap-3"><i class="fas fa-check text-rosa mt-1"></i><span>Estacionamiento amplio y seguro</span></li></ul>'
            },
            fechas: {
                icon: 'fa-calendar-alt',
                title: 'Fechas del Torneo',
                content: '<p class="mb-4 text-gray-600">El Torneo Jorge Campos 2026 se llevará a cabo del <strong class="text-gray-900">12 al 15 de Noviembre de 2026</strong>.</p><ul class="space-y-3 text-gray-600"><li class="flex items-start gap-3"><i class="fas fa-calendar-day text-dorado-dark mt-1"></i><span><strong>12 Nov:</strong> Inauguración y primeros partidos</span></li><li class="flex items-start gap-3"><i class="fas fa-calendar-day text-dorado-dark mt-1"></i><span><strong>13 Nov:</strong> Fase de grupos</span></li><li class="flex items-start gap-3"><i class="fas fa-calendar-day text-dorado-dark mt-1"></i><span><strong>14 Nov:</strong> Cuartos y semifinales</span></li><li class="flex items-start gap-3"><i class="fas fa-calendar-day text-dorado-dark mt-1"></i><span><strong>15 Nov:</strong> Finales y premiación</span></li></ul>'
            },
            jugadores: {
                icon: 'fa-users',
                title: 'Jugadores por Equipo',
                content: '<p class="mb-4 text-gray-600">Cada equipo puede registrar hasta <strong class="text-gray-900">18 jugadores</strong> más <strong class="text-gray-900">3 miembros de staff</strong>.</p><div class="bg-gray-100 p-4 rounded mb-4"><h4 class="font-bold mb-3 text-gray-900">Composición del equipo:</h4><ul class="space-y-2 text-gray-600"><li class="flex items-center gap-2"><i class="fas fa-user text-rosa"></i> 18 jugadores máximo</li><li class="flex items-center gap-2"><i class="fas fa-user-tie text-rosa"></i> 1 Director Técnico</li><li class="flex items-center gap-2"><i class="fas fa-user-tie text-rosa"></i> 1 Auxiliar Técnico</li><li class="flex items-center gap-2"><i class="fas fa-user-tie text-rosa"></i> 1 Preparador Físico o Delegado</li></ul></div>'
            },
            categorias: {
                icon: 'fa-futbol',
                title: 'Categorías Disponibles',
                content: '<div class="space-y-6"><div class="bg-rosa/10 p-4 rounded"><h4 class="font-bold text-rosa mb-3 flex items-center gap-2"><i class="fas fa-venus"></i> Femenil</h4><ul class="text-gray-600 space-y-1"><li>• Sub 12 (U12)</li><li>• Sub 15 (U15)</li></ul></div><div class="bg-dorado/20 p-4 rounded"><h4 class="font-bold text-dorado-dark mb-3 flex items-center gap-2"><i class="fas fa-mars"></i> Varonil</h4><ul class="text-gray-600 space-y-1"><li>• Nacidos 2013-2014</li><li>• Nacidos 2015-2016</li><li>• Nacidos 2017-2018</li><li>• Nacidos 2019-2020</li></ul></div></div>'
            }
        },

        expData: {
            meet: {
                icon: 'fa-handshake',
                title: 'Meet & Greet',
                subtitle: 'Conoce a Cracks Inmortales',
                content: '<p class="mb-4 text-gray-600">Una oportunidad única de <strong class="text-gray-900">conocer en persona a leyendas del fútbol mexicano e internacional</strong>.</p><ul class="space-y-3 text-gray-600"><li class="flex items-start gap-3"><i class="fas fa-camera text-rosa mt-1"></i><span>Sesión de fotos con los cracks</span></li><li class="flex items-start gap-3"><i class="fas fa-pen text-rosa mt-1"></i><span>Firma de autógrafos</span></li><li class="flex items-start gap-3"><i class="fas fa-comments text-rosa mt-1"></i><span>Momento para compartir con los ídolos</span></li><li class="flex items-start gap-3"><i class="fas fa-star text-rosa mt-1"></i><span>Recuerdos inolvidables para toda la vida</span></li></ul>'
            },
            conferencias: {
                icon: 'fa-microphone',
                title: 'Conferencias',
                subtitle: 'Platica con los Expertos',
                content: '<p class="mb-4 text-gray-600">Charlas inspiradoras impartidas por <strong class="text-gray-900">deportistas profesionales y expertos en desarrollo deportivo</strong>.</p><ul class="space-y-3 text-gray-600"><li class="flex items-start gap-3"><i class="fas fa-star text-dorado-dark mt-1"></i><span>Historias de éxito y superación</span></li><li class="flex items-start gap-3"><i class="fas fa-brain text-dorado-dark mt-1"></i><span>Mentalidad ganadora en el deporte</span></li><li class="flex items-start gap-3"><i class="fas fa-graduation-cap text-dorado-dark mt-1"></i><span>Consejos de formación profesional</span></li><li class="flex items-start gap-3"><i class="fas fa-users text-dorado-dark mt-1"></i><span>Trabajo en equipo y liderazgo</span></li></ul>'
            },
            interactivas: {
                icon: 'fa-gamepad',
                title: 'Entretenimiento 360°',
                subtitle: 'Diversión para Todos',
                content: '<p class="mb-4 text-gray-600">Actividades para toda la familia que complementan la experiencia deportiva.</p><ul class="space-y-3 text-gray-600"><li class="flex items-start gap-3"><i class="fas fa-futbol text-rosa mt-1"></i><span>Zona de habilidades y retos de puntería</span></li><li class="flex items-start gap-3"><i class="fas fa-vr-cardboard text-rosa mt-1"></i><span>Experiencias de realidad virtual</span></li><li class="flex items-start gap-3"><i class="fas fa-gamepad text-rosa mt-1"></i><span>Torneos de videojuegos de fútbol</span></li><li class="flex items-start gap-3"><i class="fas fa-music text-rosa mt-1"></i><span>Música y animación en vivo</span></li></ul>'
            },
            pasaporte: {
                icon: 'fa-passport',
                title: 'Pasaporte Brody',
                subtitle: 'Llénalo y Gana Increíbles Premios',
                content: '<p class="mb-4 text-gray-600">Tu <strong class="text-gray-900">pasaporte a la aventura</strong>. Completa las actividades y acumula sellos para ganar.</p><ul class="space-y-3 text-gray-600"><li class="flex items-start gap-3"><i class="fas fa-stamp text-dorado-dark mt-1"></i><span>Colecciona sellos en cada actividad</span></li><li class="flex items-start gap-3"><i class="fas fa-gift text-dorado-dark mt-1"></i><span>Canjea por premios exclusivos</span></li><li class="flex items-start gap-3"><i class="fas fa-trophy text-dorado-dark mt-1"></i><span>Sorpresas especiales para pasaportes completos</span></li><li class="flex items-start gap-3"><i class="fas fa-medal text-dorado-dark mt-1"></i><span>Reconocimientos únicos del torneo</span></li></ul>'
            }
        },

        init: function() {
            this.infoModal = document.getElementById('infoModal');
            this.infoContent = document.getElementById('infoModalContent');
            this.expModal = document.getElementById('expModal');
            this.expContent = document.getElementById('expModalContent');
        },

        openInfo: function(type) {
            const data = this.infoData[type];
            if (!data) return;

            const html = `
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-rosa rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas ${data.icon} text-2xl text-white"></i>
                    </div>
                    <h3 class="font-display text-2xl font-bold text-gray-900">${data.title}</h3>
                </div>
                <div>${data.content}</div>
            `;
            this.infoContent.innerHTML = html;
            this.infoModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        closeInfo: function() {
            this.infoModal.classList.remove('active');
            document.body.style.overflow = '';
        },

        openExp: function(type) {
            const data = this.expData[type];
            if (!data) return;

            const html = `
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-dorado rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas ${data.icon} text-2xl text-rosa-dark"></i>
                    </div>
                    <h3 class="font-display text-2xl font-bold text-gray-900">${data.title}</h3>
                    <p class="text-rosa font-semibold">${data.subtitle}</p>
                </div>
                <div>${data.content}</div>
            `;
            this.expContent.innerHTML = html;
            this.expModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        closeExp: function() {
            this.expModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Smooth Scroll
    const SmoothScroll = {
        init: function() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }
    };

    // Keyboard Navigation
    const Keyboard = {
        init: function() {
            document.addEventListener('keydown', (e) => {
                if (document.getElementById('galleryLightbox').classList.contains('active')) {
                    if (e.key === 'Escape') Gallery.close();
                    if (e.key === 'ArrowLeft') Gallery.changeImage(-1);
                    if (e.key === 'ArrowRight') Gallery.changeImage(1);
                }
                if (document.getElementById('infoModal').classList.contains('active')) {
                    if (e.key === 'Escape') Modals.closeInfo();
                }
                if (document.getElementById('expModal').classList.contains('active')) {
                    if (e.key === 'Escape') Modals.closeExp();
                }
            });
        }
    };

    // Global Functions
    window.openGalleryLightbox = function(index) { Gallery.open(index); };
    window.closeGalleryLightbox = function() { Gallery.close(); };
    window.changeGalleryImage = function(direction) { Gallery.changeImage(direction); };
    window.openInfoModal = function(type) { Modals.openInfo(type); };
    window.closeInfoModal = function() { Modals.closeInfo(); };
    window.openExpModal = function(type) { Modals.openExp(type); };
    window.closeExpModal = function() { Modals.closeExp(); };
    window.updateGalleryImages = function() { Gallery.updateImages(); };

    // Init
    document.addEventListener('DOMContentLoaded', function() {
        console.log('⚽ Torneo Jorge Campos 2026 - Initialized');
        Navbar.init();
        Countdown.init();
        Gallery.init();
        Modals.init();
        SmoothScroll.init();
        Keyboard.init();
    });

})();