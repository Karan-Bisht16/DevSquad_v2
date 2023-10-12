const showSignUpPassword = document.querySelector("#showSignUpPassword");
const userSignUpPassword = document.querySelector("#userSignUpPassword");
const showLoginPassword = document.querySelector("#showLoginPassword");
const userLoginPassword = document.querySelector("#userLoginPassword");

showSignUpPassword.addEventListener('click', ()=>{
    userSignUpPassword.setAttribute('type', 'text');
    setTimeout(()=>{
        userSignUpPassword.setAttribute('type', 'password')
    }, 1000);
});
showLoginPassword.addEventListener('click', ()=>{ 
    userLoginPassword.setAttribute('type', 'text');
    setTimeout(()=>{
        userLoginPassword.setAttribute('type', 'password')
    }, 1000);
});