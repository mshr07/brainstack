package SOLID;
import java.util.ArrayList;

public class Single_Responsibility {    
    public static void main(String[] args) {
        Employee employee = new Employee("John Doe", "Software Engineer");
        employee.displayEmployeeDetails();
        System.out.println("Employee Name: " + employee.getName());
    }
}