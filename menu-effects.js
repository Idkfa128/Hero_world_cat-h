// Класс для эффектов меню
class MenuEffects {
    constructor() {
        this.particles = [];
        this.particlesCanvas = null;
        this.particlesCtx = null;
        this.animationId = null;
        this.isInitialized = false;
        this.fallingWords = []; // Массив для падающих слов в меню
    }

    init() {
        if (this.isInitialized) return;
        
        this.particlesCanvas = document.getElementById('particlesCanvas');
        if (!this.particlesCanvas) return;
        
        this.particlesCtx = this.particlesCanvas.getContext('2d');
        this.resizeCanvas();
        this.initializeFallingWords(); // Инициализируем падающие слова
        
        window.addEventListener('resize', () => this.resizeCanvas());
        this.isInitialized = true;
    }

    resizeCanvas() {
        if (!this.particlesCanvas) return;
        
        this.particlesCanvas.width = window.innerWidth;
        this.particlesCanvas.height = window.innerHeight;
    }

    // Инициализация падающих слов в меню
    initializeFallingWords() {
        const sideWords = [
            // Основные IT термины
            "код", "данные", "система", "алгоритм", "программа", "функция", "переменная", "массив", "объект", "класс", "метод", "интерфейс", "модуль", "библиотека", "фреймворк", "база", "сервер", "клиент", "API", "JSON", "XML", "HTML", "CSS", "JS", "SQL", "HTTP", "TCP", "IP", "DNS", "SSL",
            // Языки программирования
            "Python", "Java", "C++", "C#", "PHP", "Ruby", "Go", "Rust", "Swift", "Kotlin", "TypeScript", "Dart", "Scala", "Perl", "Lua", "R", "MATLAB", "Assembly", "Bash", "PowerShell",
            // Технологии и фреймворки
            "React", "Vue", "Angular", "Node.js", "Express", "Django", "Flask", "Spring", "Laravel", "Symfony", "Rails", "ASP.NET", "jQuery", "Bootstrap", "Tailwind", "Sass", "Less", "Webpack", "Vite", "Gulp",
            // Базы данных
            "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "Neo4j", "SQLite", "Oracle", "SQL Server", "MariaDB", "CouchDB", "DynamoDB", "InfluxDB",
            // Облачные технологии
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "GitLab", "GitHub", "Bitbucket", "Heroku", "Vercel", "Netlify", "Cloudflare", "CDN", "S3", "Lambda", "EC2", "RDS",
            // Методологии и процессы
            "Agile", "Scrum", "DevOps", "CI/CD", "TDD", "BDD", "Microservices", "REST", "GraphQL", "OAuth", "JWT", "OOP", "SOLID", "DRY", "KISS", "YAGNI", "MVP", "CRUD", "MVC", "MVP",
            // Инструменты разработки
            "Git", "VS Code", "IntelliJ", "Eclipse", "Sublime", "Atom", "Vim", "Emacs", "Postman", "Insomnia", "Figma", "Sketch", "Photoshop", "Illustrator", "Zeplin", "InVision", "Framer", "Principle",
            // Операционные системы
            "Linux", "Windows", "macOS", "Ubuntu", "CentOS", "Debian", "Fedora", "Arch", "FreeBSD", "OpenBSD", "Android", "iOS", "ChromeOS", "Solaris", "AIX", "HP-UX",
            // Сетевые технологии
            "Ethernet", "WiFi", "Bluetooth", "NFC", "VPN", "Proxy", "Firewall", "Router", "Switch", "Gateway", "Load Balancer", "Reverse Proxy", "SSL/TLS", "HTTPS", "FTP", "SSH", "Telnet", "SMTP", "POP3", "IMAP",
            // Искусственный интеллект
            "Machine Learning", "Deep Learning", "Neural Network", "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Jupyter", "OpenCV", "NLTK", "spaCy", "BERT", "GPT", "YOLO", "ResNet", "LSTM"
        ];
        
        // Создаем падающие слова для левой стороны (больше слов)
        for (let i = 0; i < 15; i++) {
            this.fallingWords.push({
                word: sideWords[Math.floor(Math.random() * sideWords.length)],
                x: Math.random() * 200, // Расширенная левая сторона (0-200px)
                y: Math.random() * window.innerHeight - 200, // Начинаем выше экрана
                speed: Math.random() * 2.5 + 0.3, // Разная скорость падения
                opacity: Math.random() * 0.6 + 0.1, // Больше вариативности прозрачности
                side: 'left'
            });
        }
        
        // Создаем падающие слова для правой стороны (больше слов)
        for (let i = 0; i < 15; i++) {
            this.fallingWords.push({
                word: sideWords[Math.floor(Math.random() * sideWords.length)],
                x: window.innerWidth - 200 + Math.random() * 200, // Расширенная правая сторона
                y: Math.random() * window.innerHeight - 200, // Начинаем выше экрана
                speed: Math.random() * 2.5 + 0.3, // Разная скорость падения
                opacity: Math.random() * 0.6 + 0.1, // Больше вариативности прозрачности
                side: 'right'
            });
        }
    }

    // Создание частиц при приземлении заголовка
    createLandingParticles(x, y) {
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 4 + 3;
            const size = Math.random() * 5 + 2;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                life: 1.0,
                decay: Math.random() * 0.015 + 0.008,
                color: `hsl(${120 + Math.random() * 40}, 100%, ${50 + Math.random() * 30}%)`,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    // Обновление частиц
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.08; // гравитация
            particle.life -= particle.decay;
            particle.rotation += particle.rotationSpeed;
            
            // Добавляем сопротивление воздуха
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Обновляем падающие слова
        for (let i = this.fallingWords.length - 1; i >= 0; i--) {
            const fallingWord = this.fallingWords[i];
            fallingWord.y += fallingWord.speed;
            
            // Если слово упало за экран, создаем новое
            if (fallingWord.y > window.innerHeight + 50) {
                const sideWords = [
                    // Основные IT термины
                    "код", "данные", "система", "алгоритм", "программа", "функция", "переменная", "массив", "объект", "класс", "метод", "интерфейс", "модуль", "библиотека", "фреймворк", "база", "сервер", "клиент", "API", "JSON", "XML", "HTML", "CSS", "JS", "SQL", "HTTP", "TCP", "IP", "DNS", "SSL",
                    // Языки программирования
                    "Python", "Java", "C++", "C#", "PHP", "Ruby", "Go", "Rust", "Swift", "Kotlin", "TypeScript", "Dart", "Scala", "Perl", "Lua", "R", "MATLAB", "Assembly", "Bash", "PowerShell",
                    // Технологии и фреймворки
                    "React", "Vue", "Angular", "Node.js", "Express", "Django", "Flask", "Spring", "Laravel", "Symfony", "Rails", "ASP.NET", "jQuery", "Bootstrap", "Tailwind", "Sass", "Less", "Webpack", "Vite", "Gulp",
                    // Базы данных
                    "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "Neo4j", "SQLite", "Oracle", "SQL Server", "MariaDB", "CouchDB", "DynamoDB", "InfluxDB",
                    // Облачные технологии
                    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "GitLab", "GitHub", "Bitbucket", "Heroku", "Vercel", "Netlify", "Cloudflare", "CDN", "S3", "Lambda", "EC2", "RDS",
                    // Методологии и процессы
                    "Agile", "Scrum", "DevOps", "CI/CD", "TDD", "BDD", "Microservices", "REST", "GraphQL", "OAuth", "JWT", "OOP", "SOLID", "DRY", "KISS", "YAGNI", "MVP", "CRUD", "MVC", "MVP",
                    // Инструменты разработки
                    "Git", "VS Code", "IntelliJ", "Eclipse", "Sublime", "Atom", "Vim", "Emacs", "Postman", "Insomnia", "Figma", "Sketch", "Photoshop", "Illustrator", "Zeplin", "InVision", "Framer", "Principle",
                    // Операционные системы
                    "Linux", "Windows", "macOS", "Ubuntu", "CentOS", "Debian", "Fedora", "Arch", "FreeBSD", "OpenBSD", "Android", "iOS", "ChromeOS", "Solaris", "AIX", "HP-UX",
                    // Сетевые технологии
                    "Ethernet", "WiFi", "Bluetooth", "NFC", "VPN", "Proxy", "Firewall", "Router", "Switch", "Gateway", "Load Balancer", "Reverse Proxy", "SSL/TLS", "HTTPS", "FTP", "SSH", "Telnet", "SMTP", "POP3", "IMAP",
                    // Искусственный интеллект
                    "Machine Learning", "Deep Learning", "Neural Network", "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Jupyter", "OpenCV", "NLTK", "spaCy", "BERT", "GPT", "YOLO", "ResNet", "LSTM"
                ];
                
                fallingWord.word = sideWords[Math.floor(Math.random() * sideWords.length)];
                fallingWord.y = -100; // Начинаем выше экрана
                fallingWord.speed = Math.random() * 2.5 + 0.3;
                fallingWord.opacity = Math.random() * 0.6 + 0.1;
                
                if (fallingWord.side === 'left') {
                    fallingWord.x = Math.random() * 200; // Расширенный диапазон
                } else {
                    fallingWord.x = window.innerWidth - 200 + Math.random() * 200; // Расширенный диапазон
                }
            }
        }
    }

    // Отрисовка частиц
    drawParticles() {
        if (!this.particlesCtx) return;
        
        this.particlesCtx.clearRect(0, 0, this.particlesCanvas.width, this.particlesCanvas.height);
        
        // Рисуем падающие слова
        this.particlesCtx.font = '14px "Share Tech Mono"';
        this.particlesCtx.textBaseline = 'top';
        
        for (const fallingWord of this.fallingWords) {
            this.particlesCtx.save();
            this.particlesCtx.globalAlpha = fallingWord.opacity;
            this.particlesCtx.fillStyle = '#4a7c59'; // Темно-зеленый цвет для падающих слов
            this.particlesCtx.fillText(fallingWord.word, fallingWord.x, fallingWord.y);
            this.particlesCtx.restore();
        }
        
        // Рисуем частицы
        for (const particle of this.particles) {
            this.particlesCtx.save();
            this.particlesCtx.globalAlpha = particle.life;
            this.particlesCtx.fillStyle = particle.color;
            this.particlesCtx.translate(particle.x, particle.y);
            this.particlesCtx.rotate(particle.rotation);
            
            // Рисуем частицу как звезду для более интересного эффекта
            this.particlesCtx.beginPath();
            const spikes = 5;
            const outerRadius = particle.size;
            const innerRadius = particle.size * 0.4;
            
            for (let i = 0; i < spikes * 2; i++) {
                const angle = (i * Math.PI) / spikes;
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    this.particlesCtx.moveTo(x, y);
                } else {
                    this.particlesCtx.lineTo(x, y);
                }
            }
            this.particlesCtx.closePath();
            this.particlesCtx.fill();
            
            // Добавляем свечение
            this.particlesCtx.shadowColor = particle.color;
            this.particlesCtx.shadowBlur = 10;
            this.particlesCtx.fill();
            
            this.particlesCtx.restore();
        }
    }

    // Основной цикл анимации
    animate() {
        this.updateParticles();
        this.drawParticles();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // Запуск анимации
    startAnimation() {
        if (this.animationId) return;
        this.animate();
    }

    // Остановка анимации
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // Эффект вибрации экрана
    screenShake() {
        document.body.style.animation = 'screenShake 0.5s ease-out';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 500);
    }
}

// Класс для анимации меню
class MenuAnimations {
    constructor() {
        this.elements = {
            title: document.getElementById('title'),
            subtitle: document.getElementById('subtitle'),
            options: document.getElementById('options'),
            startBtn: document.getElementById('startBtn'),
            authors: document.getElementById('authors')
        };
        
        this.effects = new MenuEffects();
    }

    // Запуск последовательности анимаций
    startMenuSequence() {
        this.effects.init();
        this.effects.startAnimation();
        
        // Скрываем все элементы кроме заголовка
        this.hideAllElements();
        
        // Запускаем анимацию заголовка
        setTimeout(() => {
            this.animateTitle();
        }, 500);
    }

    hideAllElements() {
        Object.values(this.elements).forEach(el => {
            if (el && el !== this.elements.title) { // Не скрываем заголовок здесь
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.width = '0';
                el.style.overflow = 'hidden';
                el.style.whiteSpace = 'nowrap';
            }
        });
        
        // Заголовок начинаем с позиции выше экрана, но видимым
        if (this.elements.title) {
            this.elements.title.style.transform = 'translateY(-200px)';
            this.elements.title.style.opacity = '1'; // Делаем видимым!
        }
    }

    animateTitle() {
        if (!this.elements.title) return;
        
        this.elements.title.style.opacity = '1';
        this.elements.title.classList.add('falling');
        
        // Создаем частицы при приземлении
        setTimeout(() => {
            this.elements.title.classList.remove('falling');
            this.elements.title.classList.add('landed');
            
            // Фиксируем позицию заголовка после падения
            this.elements.title.style.transform = 'translateY(0)';
            this.elements.title.style.position = 'relative';
            
            // Создаем частицы в центре заголовка
            const titleRect = this.elements.title.getBoundingClientRect();
            const centerX = titleRect.left + titleRect.width / 2;
            const centerY = titleRect.bottom;
            
            this.effects.createLandingParticles(centerX, centerY);
            
            // Вибрация экрана
            this.effects.screenShake();
            
            // Запускаем анимацию подзаголовка
            setTimeout(() => {
                this.animateSubtitle();
            }, 1000);
            
        }, 1500);
    }

    animateSubtitle() {
        if (!this.elements.subtitle) return;
        
        this.elements.subtitle.style.opacity = '1';
        this.elements.subtitle.classList.add('typing');
        
        // Убираем курсор после завершения печати
        setTimeout(() => {
            this.elements.subtitle.classList.remove('typing');
            this.elements.subtitle.style.borderRight = 'none';
            this.elements.subtitle.style.width = 'auto';
            this.elements.subtitle.style.overflow = 'visible';
            this.elements.subtitle.style.whiteSpace = 'normal';
            
            // Запускаем анимацию остальных элементов
            setTimeout(() => {
                this.animateOtherElements();
            }, 500);
        }, 2000);
    }

    animateOtherElements() {
        // Анимация опций
        if (this.elements.options) {
            this.elements.options.style.opacity = '1';
            this.elements.options.classList.add('typing');
            
            setTimeout(() => {
                this.elements.options.classList.remove('typing');
                this.elements.options.style.borderRight = 'none';
                this.elements.options.style.width = 'auto';
                this.elements.options.style.overflow = 'visible';
                this.elements.options.style.whiteSpace = 'normal';
            }, 2000);
        }
        
        // Анимация кнопки
        setTimeout(() => {
            if (this.elements.startBtn) {
                this.elements.startBtn.style.opacity = '1';
                this.elements.startBtn.classList.add('typing');
                
                setTimeout(() => {
                    this.elements.startBtn.classList.remove('typing');
                    this.elements.startBtn.style.borderRight = 'none';
                    this.elements.startBtn.style.width = 'auto';
                    this.elements.startBtn.style.overflow = 'visible';
                    this.elements.startBtn.style.whiteSpace = 'normal';
                }, 2000);
            }
        }, 500);
        
        // Анимация авторов
        setTimeout(() => {
            if (this.elements.authors) {
                this.elements.authors.style.opacity = '1';
                this.elements.authors.classList.add('typing');
                
                setTimeout(() => {
                    this.elements.authors.classList.remove('typing');
                    this.elements.authors.style.borderRight = 'none';
                    this.elements.authors.style.width = 'auto';
                    this.elements.authors.style.overflow = 'visible';
                    this.elements.authors.style.whiteSpace = 'normal';
                }, 2000);
            }
        }, 1000);
    }

    // Сброс анимаций для повторного запуска
    reset() {
        Object.values(this.elements).forEach(el => {
            if (el) {
                el.classList.remove('falling', 'landed', 'typing', 'fade-in');
                el.style.opacity = '';
                el.style.transform = '';
                el.style.borderRight = '';
                el.style.width = '';
                el.style.overflow = '';
                el.style.whiteSpace = '';
            }
        });
        
        this.effects.stopAnimation();
        this.effects.particles = [];
    }
}

// Класс для анимации игрового экрана
class GameAnimations {
    constructor() {
        this.elements = {
            hud: document.getElementById('hud'),
            scoreDisplay: document.getElementById('scoreDisplay'),
            livesDisplay: document.getElementById('livesDisplay'),
            timerDisplay: document.getElementById('timerDisplay'),
            questionDisplay: document.getElementById('questionDisplay'),
            gameCanvas: document.getElementById('gameCanvas'),
            dropbarDisplay: document.getElementById('dropbarDisplay')
        };
    }

    // Запуск анимации игрового экрана
    startGameSequence() {
        this.hideAllElements();
        
        // Сразу показываем вопрос
        this.animateQuestion();
        
        // Анимация HUD элементов
        setTimeout(() => {
            this.animateHUD();
        }, 500);
        
        // Анимация игрового поля
        setTimeout(() => {
            this.animateGameCanvas();
        }, 2000);
        
        // Анимация инструкции
        setTimeout(() => {
            this.animateDropbar();
        }, 4000);
    }

    hideAllElements() {
        // Скрываем только dropbar, НЕ вопрос!
        const textElements = [
            this.elements.dropbarDisplay
        ];
        
        textElements.forEach(el => {
            if (el) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.width = '0';
                el.style.overflow = 'hidden';
                el.style.whiteSpace = 'nowrap';
            }
        });
        
        // HUD элементы НЕ скрываем!
        // Вопрос тоже НЕ скрываем - он должен быть виден сразу!
        
        // Игровое поле начинаем с очень пиксельного эффекта, но сохраняем размеры
        if (this.elements.gameCanvas) {
            this.elements.gameCanvas.style.filter = 'blur(8px) contrast(200%) brightness(0.3) saturate(0)';
            this.elements.gameCanvas.style.opacity = '0';
            this.elements.gameCanvas.style.transform = 'scale(0.8)';
            // НЕ трогаем размеры canvas!
        }
    }

    animateHUD() {
        const hudElements = [
            this.elements.scoreDisplay,
            this.elements.livesDisplay,
            this.elements.timerDisplay
        ];

        hudElements.forEach((element, index) => {
            if (element) {
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.classList.add('typing');
                    
                    setTimeout(() => {
                        element.classList.remove('typing');
                        element.style.borderRight = 'none';
                        element.style.width = 'auto';
                        element.style.overflow = 'visible';
                        element.style.whiteSpace = 'normal';
                    }, 2000);
                }, index * 300);
            }
        });
    }

    animateQuestion() {
        if (!this.elements.questionDisplay) return;
        
        // Просто показываем вопрос без анимации печатания
        this.elements.questionDisplay.style.opacity = '1';
        this.elements.questionDisplay.style.transform = 'translateY(0)';
        this.elements.questionDisplay.style.width = 'auto';
        this.elements.questionDisplay.style.overflow = 'visible';
        this.elements.questionDisplay.style.whiteSpace = 'normal';
        this.elements.questionDisplay.style.borderRight = 'none';
    }

    animateGameCanvas() {
        if (!this.elements.gameCanvas) return;
        
        // Убеждаемся что canvas видим
        this.elements.gameCanvas.style.display = 'block';
        
        // Этап 1: Очень пиксельный эффект (8-bit)
        this.elements.gameCanvas.style.opacity = '0.7';
        this.elements.gameCanvas.style.filter = 'blur(4px) contrast(150%) brightness(0.6) saturate(0.3)';
        this.elements.gameCanvas.style.transform = 'scale(0.9) rotateY(8deg)';
        this.elements.gameCanvas.classList.add('pixelated');
        
        // Этап 2: Переход к менее пиксельному
        setTimeout(() => {
            this.elements.gameCanvas.style.filter = 'blur(2px) contrast(120%) brightness(0.8) saturate(0.6)';
            this.elements.gameCanvas.style.transform = 'scale(0.95) rotateY(4deg)';
        }, 800);
        
        // Этап 3: Почти нормальное качество
        setTimeout(() => {
            this.elements.gameCanvas.style.filter = 'blur(1px) contrast(110%) brightness(0.9) saturate(0.8)';
            this.elements.gameCanvas.style.transform = 'scale(0.98) rotateY(2deg)';
        }, 1600);
        
        // Этап 4: Полное качество
        setTimeout(() => {
            this.elements.gameCanvas.style.filter = 'none';
            this.elements.gameCanvas.style.opacity = '1';
            this.elements.gameCanvas.style.transform = 'scale(1) rotateY(0deg)';
            this.elements.gameCanvas.classList.remove('pixelated');
            this.elements.gameCanvas.classList.add('normal');
        }, 2400);
    }

    animateDropbar() {
        if (!this.elements.dropbarDisplay) return;
        
        this.elements.dropbarDisplay.style.opacity = '1';
        this.elements.dropbarDisplay.classList.add('typing');
        
        setTimeout(() => {
            this.elements.dropbarDisplay.classList.remove('typing');
            this.elements.dropbarDisplay.style.borderRight = 'none';
            this.elements.dropbarDisplay.style.width = 'auto';
            this.elements.dropbarDisplay.style.overflow = 'visible';
            this.elements.dropbarDisplay.style.whiteSpace = 'normal';
        }, 2500);
    }

    // Сброс анимаций
    reset() {
        Object.values(this.elements).forEach(el => {
            if (el) {
                el.classList.remove('typing', 'pixelated', 'normal', 'animate-in');
                el.style.opacity = '';
                el.style.transform = '';
                el.style.borderRight = '';
                el.style.width = '';
                el.style.overflow = '';
                el.style.whiteSpace = '';
                el.style.filter = '';
            }
        });
    }
}
