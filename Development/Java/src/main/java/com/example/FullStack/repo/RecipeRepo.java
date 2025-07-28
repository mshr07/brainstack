package com.example.FullStack.repo;

import com.example.FullStack.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;



@Repository
public interface RecipeRepo extends JpaRepository<Recipe, Long> {}
