// ===== YOUTUBE PICKER =====
document.addEventListener('click', function (e) {
    var btn = e.target.closest('.yt-picker-btn');
    if (btn) {
        e.stopPropagation();
        var menu = btn.nextElementSibling;
        var wasOpen = menu.classList.contains('open');
        document.querySelectorAll('.yt-picker-menu.open').forEach(function (m) { m.classList.remove('open'); });
        if (!wasOpen) menu.classList.add('open');
        return;
    }
    if (!e.target.closest('.yt-picker-menu')) {
        document.querySelectorAll('.yt-picker-menu.open').forEach(function (m) { m.classList.remove('open'); });
    }
});

// ===== UTILITY FUNCTIONS =====

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

// Split text into character spans (simple version)
function splitTextIntoChars(element) {
    const text = element.textContent;
    element.innerHTML = '';
    text.split('').forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.textContent = char;
        element.appendChild(charSpan);
    });
}

// Split text animation for hero (complex version with words)
function splitText(element) {
    const html = element.innerHTML;
    element.innerHTML = '';
    
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    function processNode(node, parent) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
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

// ===== REUSABLE GSAP ANIMATION FUNCTIONS =====

// Animate characters with scroll trigger
function animateChars(selector, options = {}) {
    const {
        trigger = selector.split(' ')[0], // Default to parent element
        stagger = 0.03,
        duration = 0.8,
        isMobile = false
    } = options;

    if (isMobile) {
        gsap.set(selector, { opacity: 1, y: 0, clearProps: 'all' });
    } else {
        gsap.to(selector, {
            opacity: 1,
            y: 0,
            duration: duration,
            ease: 'power3.out',
            stagger: stagger,
            scrollTrigger: {
                trigger: trigger,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play reverse play reverse'
            }
        });
    }
}

// Animate element fade in with scroll trigger
function animateFadeIn(selector, options = {}) {
    const {
        trigger = selector,
        duration = 0.8,
        isMobile = false
    } = options;

    if (isMobile) {
        gsap.set(selector, { opacity: 1, clearProps: 'all' });
    } else {
        gsap.to(selector, {
            opacity: 1,
            duration: duration,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: trigger,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play reverse play reverse'
            }
        });
    }
}

// Animate element with y position and opacity
function animateSlideUp(selector, options = {}) {
    const { trigger = selector, duration = 0.8 } = options;
    
    gsap.to(selector, {
        opacity: 1,
        y: 0,
        duration: duration,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: trigger,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse'
        }
    });
}

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

// ===== HOME PAGE ANIMATIONS =====
const heroH1 = document.querySelector('.hero-main h1');
if (heroH1) {
    const cursor = heroH1.querySelector('.hero-cursor');
    const fullName = 'sree gajula';
    let typingTimer = null;

    // Pull out any existing text node and replace with a controlled one
    Array.from(heroH1.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) heroH1.removeChild(node);
    });
    const textNode = document.createTextNode('');
    heroH1.insertBefore(textNode, cursor);

    // Cursor hidden until typing finishes
    cursor.style.opacity = '0';
    cursor.style.animation = 'none';

    function revealAfterTyping() {
        gsap.to('.hero-subtitle', { opacity: 1, duration: 0.6, ease: 'power2.out' });
        gsap.to('.hero-status',   { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.12 });
        gsap.to('.hero-scroll',   { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.25 });
    }

    function startTyping(onComplete) {
        if (typingTimer) clearTimeout(typingTimer);
        textNode.textContent = '';
        cursor.style.opacity = '0';
        cursor.style.animation = 'none';

        let i = 0;
        function typeChar() {
            if (i < fullName.length) {
                textNode.textContent = fullName.slice(0, ++i);
                typingTimer = setTimeout(typeChar, 72);
            } else {
                cursor.style.opacity = '1';
                cursor.style.animation = '';
                if (onComplete) onComplete();
            }
        }
        typeChar();
    }

    // Initial load sequence
    gsap.set('.hero-main h1', { opacity: 1 });
    gsap.to('.hero-label', { opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.1 });
    setTimeout(() => startTyping(revealAfterTyping), 400);

    // Re-type when hero scrolls back into view
    ScrollTrigger.create({
        trigger: '.hero',
        start: 'top 80%',
        onEnterBack: () => {
            gsap.set(['.hero-subtitle', '.hero-status', '.hero-scroll'], { opacity: 0 });
            startTyping(revealAfterTyping);
        }
    });

    // Live clock
    const clockEl = document.getElementById('heroClock');
    if (clockEl) {
        function updateClock() {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const s = String(now.getSeconds()).padStart(2, '0');
            clockEl.textContent = `${h}:${m}:${s} LOCAL`;
        }
        updateClock();
        setInterval(updateClock, 1000);
    }
}

const projectsHeading = document.querySelector('.projects-header');
if (projectsHeading) {
    animateFadeIn('.projects-header', { trigger: '.projects-header' });
}

// Fade in "Selected Work" section on scroll
const projectsContent = document.querySelector('.projects-content');
if (projectsContent) {
    animateFadeIn('.projects-content', { trigger: '.projects-section' });
}

// GSAP hover animations for project squares
document.querySelectorAll('.project-square').forEach(square => {
    const hoverColor = getComputedStyle(square).getPropertyValue('--hover-color');
    const hoverTextColor = getComputedStyle(square).getPropertyValue('--hover-text-color');
    const hoverSignColor = getComputedStyle(square).getPropertyValue('--hover-sign-color');
    
    const stackedTop = square.querySelector('.stacked-text .top');
    const stackedBottom = square.querySelector('.stacked-text .bottom');
    const signGenSpan = square.querySelector('.signgen');
    
    let topText = stackedTop ? stackedTop.textContent : null;
    let bottomText = stackedBottom ? stackedBottom.textContent : null;
    let simpleText = !stackedTop && !signGenSpan ? square.textContent.trim() : null;
    
    let signGenOriginalHTML = null;
    let signElement = null;
    let genElement = null;
    
    if (signGenSpan) {
        signGenOriginalHTML = signGenSpan.innerHTML;
        signElement = signGenSpan.querySelector('.sign');
        
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
        
        if (signElement && genElement) {
            signElement.textContent = signText;
            genElement.textContent = genText;
        }
    });
});

// ===== RESUME PAGE ANIMATIONS =====
const resumeTitle = document.querySelector('.resume-header h1');
if (resumeTitle) {
    animateFadeIn('.resume-header h1', { trigger: '.resume-header' });
}

const resumeSubtitle = document.querySelector('.resume-header .subtitle');
if (resumeSubtitle) {
    animateFadeIn('.resume-header .subtitle', {
        trigger: '.resume-header'
    });
}

const downloadBtn = document.querySelector('.download-btn');
if (downloadBtn) {
    animateFadeIn('.download-btn', {
        trigger: '.resume-header'
    });
}

const resumeSections = document.querySelectorAll('.resume-section-block');
if (resumeSections.length > 0) {
    gsap.utils.toArray('.resume-section-block').forEach((section) => {
        animateSlideUp(section, {
            trigger: section
        });
    });
}

// ===== NOTES PAGE ANIMATIONS =====
const notesTitle = document.querySelector('.notes-header h1');
if (notesTitle) {
    animateFadeIn('.notes-header h1',       { trigger: '.notes-header' });
    animateFadeIn('.notes-header .subtitle', { trigger: '.notes-header' });
}

// ===== NOTE PAGE - Individual note loading =====
if (document.getElementById('markdown-content')) {
    const md = window.markdownit({
        html: true,
        linkify: true,
        typographer: true
    });

    const urlParams = new URLSearchParams(window.location.search);
    const noteFile = urlParams.get('note');
    
    console.log('Raw noteFile from URL:', noteFile);
    
    const decodedNoteFile = noteFile;
    
    console.log('Decoded noteFile:', decodedNoteFile);

    if (!decodedNoteFile) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').innerHTML = '<p>No note specified in URL.</p>';
    } else {
        loadNote(decodedNoteFile);
    }

    async function loadNote(filename) {
        const loadingDiv = document.getElementById('loading');
        const contentDiv = document.getElementById('markdown-content');
        const errorDiv = document.getElementById('error');

        console.log('loadNote called with filename:', filename);

        const pathsToTry = [
            `files/notes/${filename}`,
            `./files/notes/${filename}`,
        ];

        console.log('Paths to try:', pathsToTry);

        let loaded = false;

        for (const path of pathsToTry) {
            try {
                console.log(`Attempting to fetch: ${path}`);
                const response = await fetch(path);
                
                console.log(`Response status for ${path}:`, response.status, response.statusText);
                
                if (response.ok) {
                    const markdown = await response.text();
                    
                    console.log('Successfully loaded markdown, length:', markdown.length);
                    
                    let frontmatter = { tags: [], sources: [] };
                    let contentWithoutFrontmatter = markdown;
                    
                    const lines = markdown.split('\n');
                    if (lines[0]?.trim() === '---') {
                        let frontmatterEndIndex = -1;
                        for (let i = 1; i < lines.length; i++) {
                            if (lines[i].trim() === '---') {
                                frontmatterEndIndex = i;
                                break;
                            }
                        }
                        
                        if (frontmatterEndIndex > 0) {
                            let currentKey = null;
                            for (let i = 1; i < frontmatterEndIndex; i++) {
                                const line = lines[i].trim();
                                if (line.endsWith(':')) {
                                    currentKey = line.slice(0, -1);
                                    frontmatter[currentKey] = [];
                                } else if (line.startsWith('-') && currentKey) {
                                    const value = line.replace(/^-\s*/, '').trim();
                                    frontmatter[currentKey].push(value);
                                }
                            }
                            
                            contentWithoutFrontmatter = lines.slice(frontmatterEndIndex + 1).join('\n');
                        }
                    }
                    
                    const html = md.render(contentWithoutFrontmatter);
                    
                    let titleFromFilename = filename.replace('.md', '');
                    titleFromFilename = titleFromFilename.replace(/\b\w/g, l => l.toUpperCase());
                    document.title = `${titleFromFilename} - @sreegjl`;
                    const stickyTitle = document.getElementById('noteStickyTitle');
                    if (stickyTitle) stickyTitle.textContent = titleFromFilename;
                    
                    let metadataHTML = '';
                    if (frontmatter.tags && frontmatter.tags.length > 0) {
                        metadataHTML += '<div class="note-metadata">';
                        metadataHTML += '<div class="note-tags-container">';
                        frontmatter.tags.forEach(tag => {
                            metadataHTML += `<span class="note-tag">${tag}</span>`;
                        });
                        metadataHTML += '</div>';
                        
                        if (frontmatter.sources && frontmatter.sources.length > 0) {
                            metadataHTML += '<div class="note-sources">';
                            metadataHTML += '<strong>Sources:</strong> ';
                            metadataHTML += '<ul>';
                            frontmatter.sources.forEach(source => {
                                metadataHTML += `<li>${source}</li>`;
                            });
                            metadataHTML += '</ul>';
                            metadataHTML += '</div>';
                        }
                        
                        metadataHTML += '</div>';
                    }
                    
                    loadingDiv.style.display = 'none';
                    contentDiv.innerHTML = metadataHTML + html;
                    loaded = true;
                    break;
                }
            } catch (error) {
                console.error(`Error with path ${path}:`, error);
            }
        }

        if (!loaded) {
            console.error('Failed to load note from any path');
            loadingDiv.style.display = 'none';
            errorDiv.style.display = 'block';
            errorDiv.innerHTML = `
                <p>Note not found: ${filename}</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Tried paths:</p>
                <ul style="font-size: 0.85rem; text-align: left; max-width: 400px; margin: 10px auto;">
                    ${pathsToTry.map(p => `<li>${p}</li>`).join('')}
                </ul>
            `;
        }
    }
}

// ===== NOTES TABLE PAGE - Load and display notes list =====
// Populate course card meta on the course listing page
(function () {
    var meta = document.getElementById('physicsCourseMeta');
    if (!meta) return;
    var topics = 5, lessons = 9;
    fetch('notes-manifest.json').then(function (r) { return r.json(); }).then(function (m) {
        var html = m.htmlNotes || [];
        var noteCount = html.length;
        var topicSet = new Set();
        html.forEach(function (n) {
            var folder = n.path.split('/')[0];
            if (!/^quiz-/.test(folder)) topicSet.add(folder);
        });
        meta.textContent = topicSet.size + ' topics · ' + noteCount + ' lessons';
    }).catch(function () {
        meta.textContent = topics + ' topics · ' + lessons + ' lessons';
    });
})();

if (document.getElementById('notesTableBody') || document.getElementById('htmlNotesTableBody') || document.getElementById('topicsList')) {
    console.log('Notes table page detected');
    
    async function loadNotes() {
        const notesTableBody = document.getElementById('notesTableBody');
        const notesTable = document.getElementById('notesTable');
        const loadingDiv = document.getElementById('loading');
        const emptyState = document.getElementById('emptyState');

        // "Written" notes section is currently commented out of the page
        if (!notesTableBody || !notesTable || !loadingDiv || !emptyState) {
            return;
        }

        let mdFiles = [];
        let successPath = 'files/notes/';

        // Try to load from manifest file (for GitHub Pages)
        try {
            console.log('Trying to fetch notes-manifest.json');
            const manifestResponse = await fetch(`notes-manifest.json?v=${Date.now()}`, { cache: 'no-store' });
            
            if (manifestResponse.ok) {
                const manifest = await manifestResponse.json();
                console.log('Manifest loaded:', manifest);
                mdFiles = manifest.notes || [];
                console.log(`Found ${mdFiles.length} notes in manifest`);
            } else {
                console.log('No manifest found, trying directory listing');
                // Fallback to directory listing (for local development)
                const pathsToTry = ['files/notes/', './files/notes/'];
                
                for (const path of pathsToTry) {
                    try {
                        console.log(`Trying to fetch directory: ${path}`);
                        const response = await fetch(path);
                        
                        console.log(`Response for ${path}:`, response.status, response.statusText);
                        
                        if (response.ok) {
                            const html = await response.text();
                            console.log(`HTML response length: ${html.length}`);
                            
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            const links = doc.querySelectorAll('a');
                            
                            console.log(`Found ${links.length} links in directory listing`);
                            
                            links.forEach(link => {
                                const href = link.getAttribute('href');
                                if (href && href.endsWith('.md')) {
                                    const filename = href.split('/').pop();
                                    console.log(`MD file found: ${filename}`);
                                    mdFiles.push(filename);
                                }
                            });

                            if (mdFiles.length > 0) {
                                successPath = path;
                                console.log(`Success! Found ${mdFiles.length} markdown files`);
                                break;
                            }
                        }
                    } catch (error) {
                        console.error(`Error with path ${path}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading manifest:', error);
        }

        console.log(`Total MD files found: ${mdFiles.length}`);
        console.log(`MD files:`, mdFiles);

        if (mdFiles.length === 0) {
            console.warn('No markdown files found, showing empty state');
            loadingDiv.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.innerHTML = '<p>No notes found. Check console for debugging info.</p>';
            return;
        }

        try {
            const notes = await Promise.all(
                mdFiles.map(async (file) => {
                    try {
                        const contentResponse = await fetch(`${successPath}${file}`);
                        const content = await contentResponse.text();
                        
                        const lines = content.split('\n');
                        let title = file.replace('.md', '');
                        let tags = [];
                        let date = null;
                        let contentStartIndex = 0;

                        if (lines[0]?.trim() === '---') {
                            let frontmatterEndIndex = -1;
                            for (let i = 1; i < lines.length; i++) {
                                if (lines[i].trim() === '---') {
                                    frontmatterEndIndex = i;
                                    break;
                                }
                            }

                            if (frontmatterEndIndex > 0) {
                                contentStartIndex = frontmatterEndIndex + 1;

                                let inTagsSection = false;
                                for (let i = 1; i < frontmatterEndIndex; i++) {
                                    const line = lines[i].trim();
                                    if (line.startsWith('tags:')) {
                                        inTagsSection = true;
                                    } else if (inTagsSection && line.startsWith('-')) {
                                        const tag = line.replace(/^-\s*/, '').trim();
                                        tags.push(tag);
                                    } else if (inTagsSection && !line.startsWith('-') && line !== '') {
                                        inTagsSection = false;
                                    }

                                    if (line.startsWith('date:')) {
                                        const dateValue = line.replace('date:', '').trim();
                                        // Parse date in MM/DD/YYYY format
                                        const [month, day, year] = dateValue.split('/');
                                        if (month && day && year) {
                                            const dateObj = new Date(year, month - 1, day);
                                            date = {
                                                display: dateObj.toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                }),
                                                timestamp: dateObj.getTime()
                                            };
                                        }
                                    }
                                }
                            }
                        }

                        for (let i = contentStartIndex; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (line.startsWith('#')) {
                                title = line.replace(/^#+\s*/, '');
                                break;
                            }
                        }

                        // Fallback to current date if no date found in frontmatter
                        if (!date) {
                            const currentDate = new Date();
                            date = {
                                display: currentDate.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                }),
                                timestamp: currentDate.getTime()
                            };
                        }
                        
                        return {
                            filename: file,
                            title: title,
                            date: date,
                            tags: tags
                        };
                    } catch (error) {
                        console.error(`Error loading ${file}:`, error);
                        return null;
                    }
                })
            );

            const validNotes = notes.filter(note => note !== null);

            // Sort notes by date, newest first
            validNotes.sort((a, b) => b.date.timestamp - a.date.timestamp);

            loadingDiv.style.display = 'none';

            if (validNotes.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            const allTags = new Set();
            validNotes.forEach(note => {
                note.tags.forEach(tag => allTags.add(tag));
            });

            if (allTags.size > 0) {
                const tagFilterSection = document.getElementById('tagFilterSection');
                const tagFilterButtons = document.getElementById('tagFilterButtons');
                
                Array.from(allTags).sort().forEach(tag => {
                    const tagButton = document.createElement('span');
                    tagButton.className = 'filter-tag';
                    tagButton.textContent = tag;
                    tagButton.dataset.tag = tag;
                    tagFilterButtons.appendChild(tagButton);
                });
                
                tagFilterSection.style.display = 'flex';
            }

            window.notesData = validNotes;
            window.selectedTags = new Set();

            displayNotes(validNotes);

            notesTable.style.display = 'table';
            
            document.querySelectorAll('.filter-tag').forEach(button => {
                button.addEventListener('click', () => {
                    const selectedTag = button.dataset.tag;
                    
                    if (window.selectedTags.has(selectedTag)) {
                        window.selectedTags.delete(selectedTag);
                        button.classList.remove('active');
                    } else {
                        window.selectedTags.add(selectedTag);
                        button.classList.add('active');
                    }
                    
                    if (window.selectedTags.size === 0) {
                        displayNotes(window.notesData);
                    } else {
                        const filtered = window.notesData.filter(note => 
                            note.tags.some(tag => window.selectedTags.has(tag))
                        );
                        displayNotes(filtered);
                    }
                });
            });
        } catch (error) {
            console.error('Error loading notes:', error);
            loadingDiv.style.display = 'none';
            emptyState.style.display = 'block';
        }
    }

    function displayNotes(notes) {
        const notesTableBody = document.getElementById('notesTableBody');
        notesTableBody.innerHTML = '';
        
        notes.forEach(note => {
            const row = document.createElement('tr');
            
            const tagsHTML = note.tags.length > 0 
                ? note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
                : '<span class="no-tags">No tags</span>';
            
            const encodedFilename = encodeURIComponent(note.filename);
            
            row.innerHTML = `
                <td>
                    <a href="note.html?note=${encodedFilename}" class="note-title">${note.title}</a>
                </td>
                <td class="note-date">${note.date.display}</td>
                <td class="note-tags">${tagsHTML}</td>
            `;
            notesTableBody.appendChild(row);
        });
    }

    async function loadHtmlNotes() {
        var topicsList = document.getElementById('topicsList');
        var htmlLoading = document.getElementById('htmlLoading');

        var topics = [
            {
                num: 1, title: 'Kinematics',
                lessons: [
                    { type: 'note',      name: 'Kinematics',            desc: 'Graph relations, kinematic equations, and projectile motion', path: 'kinematics/' },
                    { type: 'flashcard', name: 'Kinematics Flashcards', desc: 'Formula cards for quick review',                             path: 'flashcards/?topic=kinematics' },
                    { type: 'practice',  name: 'Kinematics Practice',   desc: 'Test your understanding of motion and kinematics',           path: 'quiz-1a/' }
                ]
            },
            {
                num: 2, title: 'Dynamics',
                lessons: [
                    { type: 'note',      name: 'Dynamics',            desc: "Newton's laws, free-body diagrams, and center of mass", path: 'force-dynamics/' },
                    { type: 'flashcard', name: 'Dynamics Flashcards', desc: 'Formula cards for quick review',                        path: 'flashcards/?topic=dynamics' },
                    { type: 'practice',  name: 'Dynamics Practice',   desc: "Apply Newton's laws and analyze forces in 2D",          path: 'quiz-2a/' }
                ]
            },
            {
                num: 3, title: 'Forces',
                lessons: [
                    { type: 'note',      name: 'Forces',            desc: 'Gravity, inclines, friction, and spring force',         path: 'forces/' },
                    { type: 'flashcard', name: 'Forces Flashcards', desc: 'Formula cards for quick review',                       path: 'flashcards/?topic=forces' },
                    { type: 'practice',  name: 'Forces Practice',   desc: 'Solve problems with gravity, friction, and springs',    path: 'quiz-3a/' }
                ]
            },
            {
                num: 4, title: 'Circular Motion',
                lessons: [
                    { type: 'note',      name: 'Circular Motion',            desc: "Centripetal acceleration, vertical circles, and Kepler's law", path: 'circular-motion/' },
                    { type: 'flashcard', name: 'Circular Motion Flashcards', desc: 'Formula cards for quick review',                              path: 'flashcards/?topic=circular-motion' },
                    { type: 'practice',  name: 'Circular Motion Practice',   desc: 'Practice circular motion and orbital mechanics',              path: 'quiz-4a/' }
                ]
            },
            {
                num: 5, title: 'Work & Energy',
                lessons: [
                    { type: 'note',      name: 'Work & Energy',            desc: 'Kinetic energy, work, and the work-energy theorem', path: 'work-energy/' },
                    { type: 'flashcard', name: 'Work & Energy Flashcards', desc: 'Formula cards for quick review',                   path: 'flashcards/?topic=work-energy' }
                ]
            }
        ];

        var base = topicsList.getAttribute('data-base') || 'notes/';
        var checkSvg = '<svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

        var studied = {};
        try { studied = JSON.parse(localStorage.getItem('notesStudied') || '{}'); } catch(e) {}

        if (!topicsList) return;
        htmlLoading.style.display = 'none';

        var allCheckButtons = [];
        var totalLessons = 0;
        topics.forEach(function (t) { totalLessons += t.lessons.length; });

        var subtitleEl = document.getElementById('syllabusSubtitle');
        if (subtitleEl) subtitleEl.textContent = topics.length + ' topics · ' + totalLessons + ' lessons';

        totalLessons = 0;

        topics.forEach(function (t) {
            var numStr = String(t.num).padStart(2, '0');
            var lessonCount = t.lessons.length;
            totalLessons += lessonCount;

            var card = document.createElement('div');
            card.className = 'module-card';

            var headerHTML = '<div class="module-header">' +
                '<div class="module-num">' + numStr + '</div>' +
                '<div class="module-header-text">' +
                    '<div class="module-title">' + t.title + '</div>' +
                    '<div class="module-meta">' + lessonCount + ' lessons</div>' +
                '</div>' +
            '</div>';

            var lessonsHTML = '<div class="module-lessons">';
            t.lessons.forEach(function (l) {
                var key = base + l.path;
                var isChecked = !!studied[key];
                var iconClass = l.type === 'note' ? 'lesson-icon-note' : l.type === 'practice' ? 'lesson-icon-practice' : 'lesson-icon-flashcard';
                var iconSymbol = l.type === 'note'
                    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>'
                    : l.type === 'practice'
                    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
                    : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>';
                lessonsHTML += '<div class="lesson-row">' +
                    '<a href="' + base + l.path + '" class="lesson-icon ' + iconClass + '">' + iconSymbol + '</a>' +
                    '<a href="' + base + l.path + '" class="lesson-info">' +
                        '<div class="lesson-name-row">' +
                            '<span class="lesson-name">' + l.name + '</span>' +
                        '</div>' +
                        '<div class="lesson-desc">' + l.desc + '</div>' +
                    '</a>' +
                    '<button class="lesson-check' + (isChecked ? ' checked' : '') + '" data-key="' + key + '" type="button" title="Mark as studied">' + checkSvg + '</button>' +
                '</div>';
            });
            lessonsHTML += '</div>';

            card.innerHTML = headerHTML + lessonsHTML;
            topicsList.appendChild(card);
        });

        // Collect all check buttons
        allCheckButtons = topicsList.querySelectorAll('.lesson-check');

        function updateSidebar() {
            var count = 0;
            allCheckButtons.forEach(function (btn) { if (btn.classList.contains('checked')) count++; });

            var countEl = document.getElementById('studiedCount');
            var totalEl = document.getElementById('totalLessons');
            var fillEl = document.getElementById('sidebarProgressFill');
            if (countEl) countEl.textContent = count;
            if (totalEl) totalEl.textContent = totalLessons;
            if (fillEl) fillEl.style.width = (count / totalLessons * 100) + '%';

            // Up next
            var upNextTopic = document.getElementById('upNextTopic');
            var upNextLink = document.getElementById('upNextLink');
            var upNextCard = document.getElementById('upNextCard');
            var nextLesson = null;
            for (var i = 0; i < topics.length; i++) {
                for (var j = 0; j < topics[i].lessons.length; j++) {
                    var key = base + topics[i].lessons[j].path;
                    if (!studied[key]) {
                        nextLesson = { topic: topics[i].title, lesson: topics[i].lessons[j] };
                        break;
                    }
                }
                if (nextLesson) break;
            }
            var continueBtn = document.getElementById('continueBtn');
            if (nextLesson && upNextTopic && upNextLink) {
                upNextTopic.textContent = nextLesson.topic;
                upNextLink.href = base + nextLesson.lesson.path;
                upNextCard.style.display = '';
                if (continueBtn) continueBtn.href = base + nextLesson.lesson.path;
            } else if (upNextCard) {
                upNextTopic.textContent = 'All done!';
                upNextLink.style.display = 'none';
                if (continueBtn) continueBtn.href = base + topics[0].lessons[0].path;
            }
        }

        allCheckButtons.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var key = btn.getAttribute('data-key');
                if (btn.classList.contains('checked')) {
                    btn.classList.remove('checked');
                    delete studied[key];
                } else {
                    btn.classList.add('checked');
                    studied[key] = true;
                }
                try { localStorage.setItem('notesStudied', JSON.stringify(studied)); } catch(ex) {}
                updateSidebar();
            });
        });

        updateSidebar();
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadNotes();
        loadHtmlNotes();
    });
}