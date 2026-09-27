public class Amor {
    public static void main(String[] args) {
        Pessoa joao = new Pessoa("João Andrade");

        if (joao.existe()) {
            System.out.println("Eu te amo, João");
        }
    }
}

class Pessoa {
    private String nome;

    public Pessoa(String nome) {
        this.nome = nome;
    }

    public boolean existe() {
        return true; // sempre
    }
}
