document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (menuBtn && mobileMenu) {
    const toggleMenu = () => {
      const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('is-open');
      
      // Update icon
      menuBtn.innerHTML = !isExpanded 
        ? '<svg width="24" height="24" aria-hidden="true"><use href="#icon-x"/></svg>'
        : '<svg width="24" height="24" aria-hidden="true"><use href="#icon-menu"/></svg>';
    };

    menuBtn.addEventListener('click', toggleMenu);

    // Close on link click
    mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (mobileMenu.classList.contains('is-open')) {
          toggleMenu();
        }
      });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        toggleMenu();
        menuBtn.focus();
      }
    });
  }

  // 2. Header Scroll State
  const header = document.getElementById('header');
  if (header) {
    const checkScroll = () => {
      if (window.scrollY > 50) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll(); // Check on load
  }

  // 3. Search Demo Animation
  // Only run if not prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const searchDemo = document.getElementById('search-demo');
  const demoInput = document.getElementById('demo-input-text');
  const demoResult = document.getElementById('demo-result');
  
  if (searchDemo && demoInput && demoResult && !prefersReducedMotion) {
    const targetText = '0803 123 4567';
    let hasAnimated = false;
    
    const typeText = () => {
      demoInput.textContent = '';
      demoInput.style.color = 'var(--c-text-main)';
      let i = 0;
      
      const typeNextChar = () => {
        if (i < targetText.length) {
          demoInput.textContent += targetText.charAt(i);
          i++;
          setTimeout(typeNextChar, 100 + Math.random() * 50); // random delay for realism
        } else {
          // Finished typing, show result
          setTimeout(() => {
            demoResult.classList.add('is-visible');
          }, 300);
        }
      };
      
      // Start typing after a short delay
      setTimeout(typeNextChar, 400);
    };

    // Use Intersection Observer to trigger when visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          typeText();
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(searchDemo);
  }
});
