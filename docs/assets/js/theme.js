document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const buttonHoverListeners = new Map();

    function applyHeaderStyles() {
        body.style.backgroundColor = '#ffffff';
        body.style.color = '#1e1e1e';
        document.querySelector('.header').style.backgroundColor = '#f8f9fa';
        document.querySelector('.header h1').style.color = '#1e1e1e';
        document.querySelector('.logo').style.filter = 'invert(1)';
    }

    function applyMainContentStyles() {
        document.querySelectorAll('p:not(.button), h1:not(.button)').forEach(element => {
            element.style.color = '#1e1e1e';
        });

        document.querySelectorAll('.hero').forEach(section => {
            section.style.backgroundColor = '#A6A6A6';
        });
    }

    function applyFormStyles() {
        const form = document.querySelector('.formulario');
        if (form) {
            form.style.backgroundColor = '#ffffff';
            form.style.border = '3px solid #7c3aed';
            form.style.boxShadow = 'none';
        }

        document.querySelectorAll('input, textarea').forEach(input => {
            input.style.backgroundColor = '#ffffff';
            input.style.color = '#1e1e1e';
            input.style.borderColor = '#7c3aed';
        });

        const exemploForm = document.querySelector('.exemplo-form p');
        if (exemploForm) {
            exemploForm.style.color = '#1e1e1e';
        }
    }

    function handleButtonStyles() {
        document.querySelectorAll('.button').forEach(button => {
            const oldListeners = buttonHoverListeners.get(button);
            if (oldListeners) {
                button.removeEventListener('mouseover', oldListeners.over);
                button.removeEventListener('mouseout', oldListeners.out);
            }

            if (button.id === 'saibaMais' || button.id === 'gerarExemplo') {
                const mouseoverListener = () => {
                    button.style.backgroundColor = '#ffffff';
                    button.style.color = '#1e1e1e';
                    button.style.border = '2px solid #1e1e1e';
                };
                const mouseoutListener = () => {
                    button.style.backgroundColor = '#1e1e1e';
                    button.style.color = '#ffffff';
                    button.style.border = 'none';
                };

                button.style.backgroundColor = '#1e1e1e';
                button.style.color = '#ffffff';
                
                button.addEventListener('mouseover', mouseoverListener);
                button.addEventListener('mouseout', mouseoutListener);
                buttonHoverListeners.set(button, { over: mouseoverListener, out: mouseoutListener });
            } else {
                const mouseoverListener = () => button.style.backgroundColor = '#6d28d9';
                const mouseoutListener = () => button.style.backgroundColor = '#7c3aed';

                button.style.backgroundColor = '#7c3aed';
                button.style.color = '#ffffff';
                
                button.addEventListener('mouseover', mouseoverListener);
                button.addEventListener('mouseout', mouseoutListener);
                buttonHoverListeners.set(button, { over: mouseoverListener, out: mouseoutListener });
            }
        });
    }

    function applyFooterStyles() {
        const footer = document.querySelector('footer');
        if (footer) {
            footer.style.backgroundColor = '#ffffff';
        }

        document.querySelectorAll('.footer-grid h4').forEach(title => {
            title.style.color = '#1e1e1e';
        });

        document.querySelectorAll('.footer-list img').forEach(icon => {
            icon.style.filter = 'invert(1)';
        });

        document.querySelectorAll('.footer-list a').forEach(link => {
            const existingListeners = link._hoverListeners;
            if (existingListeners) {
                link.removeEventListener('mouseover', existingListeners.over);
                link.removeEventListener('mouseout', existingListeners.out);
            }

            const mouseoverListener = () => {
                if (themeToggle.checked) link.style.color = '#1e1e1e';
            };
            const mouseoutListener = () => {
                if (themeToggle.checked) link.style.removeProperty('color');
            };
            
            link.addEventListener('mouseover', mouseoverListener);
            link.addEventListener('mouseout', mouseoutListener);
            link._hoverListeners = { over: mouseoverListener, out: mouseoutListener };
        });
    }

    function applyLoadingStyles() {
        const loadingText = document.querySelector('#loading p');
        if (loadingText) {
            loadingText.style.color = '#1e1e1e';
        }

        const loading = document.getElementById('loading');
        if (loading && loading.style.display === 'none') {
            loading.style.display = 'none';
        }
    }

    function setLightTheme() {
        applyHeaderStyles();
        applyMainContentStyles();
        applyFormStyles();
        handleButtonStyles();
        applyFooterStyles();
        applyLoadingStyles();
    }

    function setDarkTheme() {
        buttonHoverListeners.forEach((listeners, button) => {
            button.removeEventListener('mouseover', listeners.over);
            button.removeEventListener('mouseout', listeners.out);
        });
        buttonHoverListeners.clear();

        document.querySelectorAll('.footer-list a').forEach(link => {
            const existingListeners = link._hoverListeners;
            if (existingListeners) {
                link.removeEventListener('mouseover', existingListeners.over);
                link.removeEventListener('mouseout', existingListeners.out);
            }
        });

        document.querySelectorAll('[style]').forEach(element => {
            if (element.id === 'loading' && element.style.display === 'none') {
                element.style.display = 'none';
            } else {
                element.removeAttribute('style');
            }
        });
    }

    if (themeToggle.checked) {
        setLightTheme();
    }

    themeToggle.addEventListener('change', () => {
        themeToggle.checked ? setLightTheme() : setDarkTheme();
    });
});