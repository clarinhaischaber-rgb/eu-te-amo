document.addEventListener("DOMContentLoaded", async () => {
    // 1. Garante que só quem tem token acessa esta página
    checkAuth();

    const nameInput = document.getElementById("display-name");
    const emailInput = document.getElementById("account-email");
    const passwordInput = document.getElementById("account-password");
    const accountForm = document.getElementById("account-form");
    const logoutBtn = document.getElementById("logout-btn");

    // 2. Carrega os dados do perfil do backend
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            logout();
            return;
        }

        const user = await response.json();
        if (nameInput) nameInput.value = user.displayName;
        if (emailInput) emailInput.value = user.email;

    } catch (error) {
        console.error("Erro ao carregar os dados da conta:", error);
    }

    // 3. Salva alterações no perfil
    if (accountForm) {
        accountForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const updatePayload = {
                displayName: nameInput.value
            };

            if (passwordInput.value.trim() !== "") {
                updatePayload.password = passwordInput.value;
            }

            try {
                const response = await fetch(`${API_URL}/users/profile`, {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(updatePayload)
                });

                if (response.ok) {
                    alert("Perfil atualizado com sucesso!");
                    passwordInput.value = ""; // Limpa o campo de senha após alterar
                } else {
                    alert("Erro ao atualizar o perfil.");
                }
            } catch (error) {
                alert("Erro ao conectar com o servidor.");
            }
        });
    }

    // 4. Ação do Botão "Sair da Conta"
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            logout();
        });
    }
});