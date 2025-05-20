package SOLID;

//This principle states that a class should only have one responsibility.
//Furthermore, it should only have one reason to change.
class Book {

    public String name;
    public String author;
    public String text;

    //constructor, getters and setters

    // methods that directly relate to the book properties
    public String replaceWordInText(String word, String replacementWord){
        return text.replaceAll(word, replacementWord);
    }

    public boolean isWordInText(String word){
        return text.contains(word);
    }
}
class BookPrinter {
    public void PrintBook(String s ){
        System.out.println(s);
    }
}

public class Single_Responsibility_Principle {
    public static void main(String[] args) {
        Book b1=new Book();
        Book b2=new Book();

        b1.text="VK is the best batsman in the world";
        b2.text="Dhoni is the best white ball captain in the world";
        BookPrinter bp=new BookPrinter();
        bp.PrintBook(b1.text);
        bp.PrintBook(b2.text);
    }
}