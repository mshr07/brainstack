package com.example.FullStack.model;

import java.util.List;


import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.search.mapper.pojo.mapping.definition.annotation.FullTextField;
import org.springframework.stereotype.Indexed;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Indexed
public class Recipe {

    @Id
    private Long id;

    @FullTextField
    private String name;

    @FullTextField
    private String cuisine;
    private Integer cookTimeMinutes;
    private List<String> tags;
    private List<String> instructions;


}