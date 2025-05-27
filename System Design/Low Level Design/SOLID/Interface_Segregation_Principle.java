package SOLID;
//larger interfaces should be split into smaller ones. By doing so,
//we can ensure that implementing classes only need to be
//concerned about the methods that are of interest to them

//We are creating a Interface, which performs multiple actions
interface BearKeeper {
    void washTheBear();
    void feedTheBear();
    void petTheBear();
}
// But if any other perform want to be pet or feed we need a bear keeper
//that doesn't seem fair, so we split the actions into smaller interfaces

interface BearCleaner {
    void washTheBear();
}

interface BearFeeder {
    void feedTheBear();
}

interface BearPetter {
    void petTheBear();
}
class BearCarer implements BearCleaner, BearFeeder {

    public void washTheBear() {
        System.out.println("Wash the Bear");
    }

    public void feedTheBear() {
        System.out.println("Feed the Bear");
    }
}
class CrazyPerson implements BearPetter {

    public void petTheBear() {
        System.out.println("CrazyPerson");
    }
}

public class Interface_Segregation_Principle {
    public static void main(String[] args) {
        CrazyPerson crazyPerson = new CrazyPerson();
        BearCarer bearCarer = new BearCarer();
        crazyPerson.petTheBear();
        bearCarer.washTheBear();

    }
}
