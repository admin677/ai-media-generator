document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Authentication Logic ---
    const auth = firebase.auth();
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const signoutBtn = document.getElementById('signout-btn');

    // This function runs when the user's login state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            console.log("User is signed in:", user.email);
            userInfo.textContent = `Welcome, ${user.email}`;
            userInfo.classList.remove('hidden');
            loginBtn.classList.add('hidden');
            signoutBtn.classList.remove('hidden');
        } else {
            // User is signed out
            console.log("User is signed out.");
            userInfo.classList.add('hidden');
            loginBtn.classList.remove('hidden');
            signoutBtn.classList.add('hidden');
        }
    });

    // Sign out button event listener
    signoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => {
            // Sign-out successful.
            window.location.href = 'index.html'; // Optional: redirect to home on signout
        }).catch((error) => {
            console.error('Sign out error', error);
        });
    });


    // --- Existing Animation Logic ---
    const header = document.querySelector('.main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    const fadeUpElements = document.querySelectorAll('.fade-up');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    fadeUpElements.forEach(element => {
        observer.observe(element);
    });
});