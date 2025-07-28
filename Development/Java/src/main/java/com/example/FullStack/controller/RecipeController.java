package com.example.FullStack.controller;
import java.util.List;


import com.example.FullStack.model.Recipe;

import com.example.FullStack.service.RecipeLoaderService;
import com.example.FullStack.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



@RestController
@CrossOrigin
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {
    private final RecipeService recipeService;
    private final RecipeLoaderService recipeLoaderService;

    @PostMapping("/load")
    public ResponseEntity<String> load(){
        System.out.println("Loading recipes");
        recipeLoaderService.loadRecipes();
        return ResponseEntity.ok().body("Recipes loaded");
    }

    @GetMapping("/search")
    public ResponseEntity<List<Recipe>> search(@RequestParam String query){
        return ResponseEntity.ok(recipeService.search(query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipe(@PathVariable long id){
        return ResponseEntity.ok(recipeService.getById(id));
    }

}
