document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();

    const signupForm = document.getElementById('signup-form');
    const signinForm = document.getElementById('signin-form');
    const errorMessage = document.getElementById('error-message');

    const signupContainer = document.getElementById('signup-form-container');
    const signinContainer = document.getElementById('signin-form-container');

    const showSigninLink = document.getElementById('show-signin');
    const showSignupLink = document.getElementById('show-signup');

    // --- Form Switching ---
    showSigninLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupContainer.style.display = 'none';
        signinContainer.style.display = 'block';
        errorMessage.textContent = '';
    });

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        signinContainer.style.display = 'none';
        signupContainer.style.display = 'block';
        errorMessage.textContent = '';
    });

    // --- Sign Up Logic ---
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('User signed up:', userCredential.user);
                // Redirect to the generator page on successful sign-up
                window.location.href = 'generator.html';
            })
            .catch((error) => {
                errorMessage.textContent = error.message;
            });
    });

    // --- Sign In Logic ---
    signinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('User signed in:', userCredential.user);
                // Redirect to the generator page on successful sign-in
                window.location.href = 'generator.html';
            })
            .catch((error) => {
                errorMessage.textContent = error.message;
            });
    });
});