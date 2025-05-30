// This file contains JavaScript functions that handle animations on the website, providing smooth transitions and effects for various elements.

document.addEventListener('DOMContentLoaded', function() {
    const elementsToAnimate = document.querySelectorAll('.animate');

    elementsToAnimate.forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(20px)';
        
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    entry.target.style.opacity = 1;
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        });

        observer.observe(element);
    });
});

// Typing animation for hero title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing animation when page loads
window.addEventListener('load', () => {
    const typingElement = document.querySelector('.typing-text');
    if (typingElement) {
        const originalText = typingElement.textContent;
        typeWriter(typingElement, originalText, 100);
    }
});

// Parallax effect for floating elements
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-element');
    
    parallaxElements.forEach(element => {
        const speed = element.dataset.speed;
        const yPos = -(scrolled * speed / 10);
        element.style.transform = `translateY(${yPos}px)`;
    });
});

// Particle animation for background
function createParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particles';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    `;
    
    document.body.appendChild(particleContainer);
    
    for (let i = 0; i < 50; i++) {
        createParticle(particleContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: rgba(74, 144, 226, 0.5);
        border-radius: 50%;
        animation: particle-float ${5 + Math.random() * 10}s linear infinite;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
    `;
    
    container.appendChild(particle);
}

// Add particle animation CSS
const particleCSS = `
    @keyframes particle-float {
        0% {
            transform: translateY(0px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(-1000px) rotate(720deg);
            opacity: 0;
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = particleCSS;
document.head.appendChild(styleSheet);

// Initialize particles
createParticles();

// Skill bars animation
function animateSkillBars() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    skillItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.animation = `skillPop 0.6s ease forwards`;
        }, index * 200);
    });
}

// Add skill animation CSS
const skillCSS = `
    @keyframes skillPop {
        0% {
            transform: scale(0) rotate(180deg);
            opacity: 0;
        }
        100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
        }
    }
`;

styleSheet.textContent += skillCSS;

// Trigger skill animation when skills section is visible
const skillsSection = document.querySelector('.skills');
if (skillsSection) {
    const skillsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSkillBars();
                skillsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    skillsObserver.observe(skillsSection);
}

// Cursor trail effect
/*
let cursor = { x: 0, y: 0 };
let trail = [];

document.addEventListener('mousemove', (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
});

function createTrail() {
    trail.push({ ...cursor });
    if (trail.length > 10) {
        trail.shift();
    }
    
    const existingTrails = document.querySelectorAll('.cursor-trail');
    existingTrails.forEach(t => t.remove());
    
    trail.forEach((point, index) => {
        const trailElement = document.createElement('div');
        trailElement.className = 'cursor-trail';
        trailElement.style.cssText = `
            position: fixed;
            left: ${point.x}px;
            top: ${point.y}px;
            width: ${10 - index}px;
            height: ${10 - index}px;
            background: rgba(74, 144, 226, ${0.8 - index * 0.08});
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
        `;
        document.body.appendChild(trailElement);
        
        setTimeout(() => {
            trailElement.remove();
        }, 500);
    });
}

setInterval(createTrail, 50);
*/