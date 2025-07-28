package com.example.FullStack.service;


import com.example.FullStack.model.Recipe;
import com.example.FullStack.repo.RecipeRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecipeLoaderService {
    private final RecipeRepo recipeRepo;
    public void loadRecipes(){
        RestTemplate restTemplate = new RestTemplate();
        Map response=restTemplate.getForObject("https://dummyjson.com/recipes", Map.class);
        List<Map<String, Object>> recipes=(List<Map<String, Object>>) response.get("recipes");
        List<Recipe> recipesList=recipes.stream().map(item ->{
            Recipe r=new Recipe();
            System.out.print(item.get("id"));
            r.setId(Long.valueOf(item.get("id").toString()));
            r.setName(item.get("name").toString());
            r.setCuisine(item.get("cuisine").toString());
            r.setCookTimeMinutes((Integer)item.get("cookTimeMinutes"));
            r.setTags((List<String>)item.get("tags"));
            r.setInstructions((List<String>)item.get("Instructions"));
            return r;
        }).toList();
        recipeRepo.saveAll(recipesList);
    }
}
