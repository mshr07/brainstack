package SOLID;



//The principle of dependency inversion refers to the decoupling of software modules.
// This way, instead of high-level modules depending on low-level modules,
// both will depend on abstractions.
class Windows98Machine {

    private final StandardKeyboard keyboard;
    //private final Monitor monitor;

    public Windows98Machine() {
        //monitor = new Monitor();
        keyboard = new StandardKeyboard();
    }

}

//we’ve also lost the ability to switch out our StandardKeyboard class with a different one should the need arise

//Let’s decouple our machine from the StandardKeyboard by adding a more general Keyboard interface

interface Keyboard { }
class StandardKeyboard implements Keyboard { }
interface Monitor{ }
class StandardMonitor implements Monitor { }


// We can use any of the keyword class(Standard or Other) if it implements Keyboard Interface
class WindowsMachine{

    private final Keyboard keyboard;
    private final Monitor monitor;

    public WindowsMachine(Keyboard keyboard, Monitor monitor) {
        this.keyboard = keyboard;
        this.monitor = monitor;
    }

}

public class Dependency_Inversion_Principle {
    public static void main(String[] args) {
        WindowsMachine wm=new WindowsMachine(new StandardKeyboard(), new StandardMonitor());

    }
}
