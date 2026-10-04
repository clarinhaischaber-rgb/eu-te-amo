document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const visitorBtn = document.getElementById("visitor-btn");


    const token = getToken()
    if(token){
        window.location.replace('./Nos.html')
        return
    }

    // Processa o Login via API
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    throw new Error("E-mail ou senha incorretos.");
                }

                const data = await response.json();
                
                // Salva o token JWT de 2 meses no navegador
                saveToken(data.token);

                // Redireciona para a página principal ou área logada
                window.location.href = "Nos.html";

            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Acesso como Visitante (sem token)
    if (visitorBtn) {
        visitorBtn.addEventListener("click", () => {
            window.location.href = "Nos.html";
        });
    }
});