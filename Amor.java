import Pessoa
import Chaos

public class Amor {
    public static void main(String[] args) {
        Pessoa joao = new Pessoa("João Andrade");
        Chaos carta = new Chaos("45 75 20 74 65 20 61 6d 6f. ♡");

        if (joao.existe()) {
            System.out.println("Eu te amo, João");
        }
        else{
            System.out.println("Eu nao vivo sem ele :(");
        }
            System.out.println(carta.message);
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
    class Chaos {
        private String message;

        public Chaos(String message) {
        this.message = message;
    }
}
