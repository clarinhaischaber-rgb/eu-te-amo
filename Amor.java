import java.util.Scanner;

public class Amor {
    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);
    
        System.out.println("Se eu fosse uma baratinha, você ainda me amaria ? 1- Sim 2- Não");

        int resposta = Integer.parseInt(sc.nextLine());

        if (resposta == 1) {
            System.out.println("Eu te amo <3");
        } else {
            System.out.println("Você não me amaria se eu fosse uma baratinha????");
        }

        System.out.println("E se eu fosse um cachorro, voce ainda me amaria ? 1- Sim 2- Não");

        resposta = Integer.parseInt(sc.nextLine());

        if (resposta == 1) {
            System.out.println("Eu te amo <3");
        } else {
            System.out.println(" Vocé nao me amaria se eu fosse um cachorro???");
        }
    }

}

