package com.example.FullStack.service;


import java.util.List;
import com.example.FullStack.model.Recipe;
import com.example.FullStack.repo.RecipeRepo;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.hibernate.search.mapper.orm.session.SearchSession;
import org.hibernate.search.mapper.orm.Search;


@Service
@RequiredArgsConstructor
public class RecipeService {
    private final RecipeRepo recipeRepo;
    private final EntityManager entityManager;

    public List<Recipe> search(String keyword) {
        SearchSession searchSession=Search.session(entityManager);

        return searchSession.search(Recipe.class)
                .where(f-> f.match()
                .fields("name","cuisine")
                .matching(keyword)
                .fuzzy(1)).fetchAllHits();
    }
    public Recipe getById(Long id){
        return recipeRepo.findById(id).orElse(null);
    }
}