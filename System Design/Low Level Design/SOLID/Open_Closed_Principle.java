package SOLID;

//classes should be open for extension but closed for modification. In doing so,
//we stop ourselves from modifying existing code and causing potential new bugs
class Guitar {

    private String make;
    private String model;
    private int volume;


    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getVolume() {
        return volume;
    }

    public void setVolume(int volume) {
        this.volume = volume;
    }
}

class SuperCoolGuitarWithFlames extends Guitar {

    private String flameColor;

    public String getFlameColor() {
        return flameColor;
    }

    public void setFlameColor(String flameColor) {
        this.flameColor = flameColor;
    }

    //constructor, getters + setters
}
public class Open_Closed_Principle {
    public static void main(String[] args) {
        Guitar g = new Guitar();
        g.setMake("Fred");
        g.setModel("Fred");
        g.setVolume(3);
        System.out.println(g.getVolume());
        System.out.println(g.getMake());
        System.out.println(g.getModel());
        SuperCoolGuitarWithFlames s = new SuperCoolGuitarWithFlames();
        s.setMake("Fred");
        s.setModel("Fred");
        s.setVolume(3);
        s.setFlameColor("Red");
        System.out.println(s.getVolume());
        System.out.println(s.getMake());
        System.out.println(s.getModel());
        System.out.println(s.getFlameColor());


    }
}
