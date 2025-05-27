package SOLID;

//if class A is a subtype of class B, we should be able to replace
// B with A without disrupting the behavior of our program.
interface Car {

    void turnOnEngine();
    void accelerate();
}
class Engine{
    public void on(){
        System.out.println("Engine On");
    }
    public void powerOn(int i){
        System.out.println("Engine Power On "+i);
    }
}
class MotorCar implements Car {
    private Engine engine=new Engine();
    //Constructors, getters + setters
    public void turnOnEngine() {
        //turn on the engine!
        engine.on();
    }

    public void accelerate() {
        //move forward!
        engine.powerOn(1000);
    }
}
class ElectricCar implements Car {

    public void turnOnEngine() {
        throw new AssertionError("I don't have an engine!");
    }

    public void accelerate() {
        //this acceleration is crazy!
    }
}
public class Liskov_Substitution_Principle {
    public static void main(String[] args) {
        MotorCar mc=new MotorCar();
        ElectricCar ec=new ElectricCar();
        Engine e1=new Engine();
        mc.turnOnEngine();
        //ec.turnOnEngine();
        mc.accelerate();
        ec.accelerate();

    }
}
