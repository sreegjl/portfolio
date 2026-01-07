// Scramble text effect
function scrambleText(element, finalText, duration = 1.2) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const length = finalText.length;
    let frame = 0;
    const totalFrames = duration * 60; // 60fps
    
    const interval = setInterval(() => {
        let scrambled = '';
        for (let i = 0; i < length; i++) {
            if (frame / totalFrames > i / length) {
                scrambled += finalText[i];
            } else {
                scrambled += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        element.textContent = scrambled;
        frame++;
        
        if (frame >= totalFrames) {
            clearInterval(interval);
            element.textContent = finalText;
        }
    }, 1000 / 60);
}

// Split text animation for hero
function splitText(element) {
    const html = element.innerHTML;
    element.innerHTML = '';
    
    // Create a temporary container to parse HTML properly
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Process all text nodes and elements
    function processNode(node, parent) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            // Split by words (spaces) but keep words intact
            const words = text.split(/(\s+)/);
            words.forEach(word => {
                if (word.trim() !== '') {
                    const wordSpan = document.createElement('span');
                    wordSpan.className = 'word';
                    word.split('').forEach(char => {
                        const charSpan = document.createElement('span');
                        charSpan.className = 'char';
                        charSpan.textContent = char;
                        wordSpan.appendChild(charSpan);
                    });
                    parent.appendChild(wordSpan);
                } else if (word === ' ') {
                    parent.appendChild(document.createTextNode(' '));
                }
            });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'BR') {
                parent.appendChild(document.createElement('br'));
            } else if (node.tagName === 'SPAN' && node.classList.contains('outline')) {
                // Handle the outline span
                const wordSpan = document.createElement('span');
                wordSpan.className = 'word';
                node.textContent.split('').forEach(char => {
                    if (char.trim() !== '') {
                        const charSpan = document.createElement('span');
                        charSpan.className = 'char outline';
                        charSpan.textContent = char;
                        wordSpan.appendChild(charSpan);
                    }
                });
                parent.appendChild(wordSpan);
            } else {
                node.childNodes.forEach(child => processNode(child, parent));
            }
        }
    }
    
    temp.childNodes.forEach(child => processNode(child, element));
}

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

// HOME PAGE ANIMATIONS
// Apply split text to hero heading
const heroHeading = document.querySelector('.hero-text h1');
if (heroHeading) {
    splitText(heroHeading);
    
    gsap.to('.hero-text h1 .char', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.02,
        scrollTrigger: {
            trigger: '.hero-text',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse'
        }
    });
}

// Apply split text to projects heading
const projectsHeading = document.querySelector('.projects-header');
if (projectsHeading) {
    const projectsText = projectsHeading.textContent;
    projectsHeading.innerHTML = '';
    projectsText.split('').forEach(char => {
        if (char.trim() !== '') {
            const charSpan = document.createElement('span');
            charSpan.className = 'char';
            charSpan.textContent = char;
            projectsHeading.appendChild(charSpan);
        } else {
            projectsHeading.appendChild(document.createTextNode(char));
        }
    });
    
    gsap.to('.projects-header .char', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.02,
        scrollTrigger: {
            trigger: '.projects-header',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse'
        }
    });
}

// GSAP hover animations for project squares
document.querySelectorAll('.project-square').forEach(square => {
    const hoverColor = getComputedStyle(square).getPropertyValue('--hover-color');
    const hoverTextColor = getComputedStyle(square).getPropertyValue('--hover-text-color');
    const hoverSignColor = getComputedStyle(square).getPropertyValue('--hover-sign-color');
    
    // Store original text for different project types
    const stackedTop = square.querySelector('.stacked-text .top');
    const stackedBottom = square.querySelector('.stacked-text .bottom');
    const signGenSpan = square.querySelector('.signgen');
    
    let topText = stackedTop ? stackedTop.textContent : null;
    let bottomText = stackedBottom ? stackedBottom.textContent : null;
    let simpleText = !stackedTop && !signGenSpan ? square.textContent.trim() : null;
    
    // For SignGen, store original HTML structure
    let signGenOriginalHTML = null;
    let signElement = null;
    let genElement = null;
    
    if (signGenSpan) {
        signGenOriginalHTML = signGenSpan.innerHTML;
        signElement = signGenSpan.querySelector('.sign');
        
        // Create gen element if it doesn't exist
        if (!signGenSpan.querySelector('.gen-part')) {
            const signText = signElement.textContent;
            const fullText = signGenSpan.textContent;
            const genText = fullText.replace(signText, '');
            
            genElement = document.createElement('span');
            genElement.className = 'gen-part';
            genElement.textContent = genText;
            
            signGenSpan.innerHTML = '';
            signGenSpan.appendChild(signElement);
            signGenSpan.appendChild(genElement);
        } else {
            genElement = signGenSpan.querySelector('.gen-part');
        }
    }
    
    const signText = signElement ? signElement.textContent : null;
    const genText = genElement ? genElement.textContent : null;
    
    square.addEventListener('mouseenter', () => {
        gsap.to(square, {
            backgroundColor: hoverColor,
            color: hoverTextColor,
            duration: 0.6,
            ease: 'power2.out'
        });
        
        if (signElement && hoverSignColor) {
            gsap.to(signElement, {
                color: hoverSignColor,
                duration: 0.6,
                ease: 'power2.out'
            });
        }
        
        // Scramble effects for different project types
        if (simpleText) {
            scrambleText(square, simpleText, 0.8);
        } else if (topText && bottomText) {
            scrambleText(stackedTop, topText, 0.8);
            setTimeout(() => scrambleText(stackedBottom, bottomText, 0.8), 100);
        } else if (signText && genText) {
            scrambleText(signElement, signText, 0.8);
            setTimeout(() => scrambleText(genElement, genText, 0.8), 100);
        }
    });
    
    square.addEventListener('mouseleave', () => {
        gsap.to(square, {
            backgroundColor: '#6b7280',
            color: '#fff',
            duration: 0.6,
            ease: 'power2.out'
        });
        
        if (signElement) {
            gsap.to(signElement, {
                color: '#fff',
                duration: 0.6,
                ease: 'power2.out'
            });
        }
        
        // Restore original text
        if (signElement && genElement) {
            signElement.textContent = signText;
            genElement.textContent = genText;
        }
    });
});

// RESUME PAGE ANIMATIONS
// Split "Resume" text into characters
const resumeTitle = document.querySelector('.resume-header h1');
if (resumeTitle) {
    const titleText = resumeTitle.textContent;
    resumeTitle.innerHTML = '';
    titleText.split('').forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.textContent = char;
        resumeTitle.appendChild(charSpan);
    });
    
    // Animate resume title characters on scroll
    gsap.to('.resume-header h1 .char', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.03,
        scrollTrigger: {
            trigger: '.resume-header',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse'
        }
    });
}

// Animate subtitle on scroll
const resumeSubtitle = document.querySelector('.resume-header .subtitle');
if (resumeSubtitle) {
    gsap.to('.resume-header .subtitle', {
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.resume-header',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse'
        }
    });
}

// Animate download button on scroll
const downloadBtn = document.querySelector('.download-btn');
if (downloadBtn) {
    gsap.to('.download-btn', {
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.resume-header',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse'
        }
    });
}

// Animate each resume section on scroll
const resumeSections = document.querySelectorAll('.resume-section-block');
if (resumeSections.length > 0) {
    gsap.utils.toArray('.resume-section-block').forEach((section, index) => {
        gsap.to(section, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play reverse play reverse'
            }
        });
    });
}