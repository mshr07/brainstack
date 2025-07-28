import { useState, useEffect } from "react";
import { fetchRecipes } from "../Services/api";
import SearchBar from "../Components/SearchBar";
import RecipeGrid from "../Components/RecipeGrid";

const HomePage = () => {
  const [recipes, setRecipes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [sortAsc, setsortAsc] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchRecipes(1);
        console.log("Fetched recipes:", data);
        setRecipes(data);
        setFiltered(data);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async (query) => {
    const results = await fetchRecipes(query);
    setRecipes(results);
  };
  const handleSort = () => {
    const sorted = [...recipes].sort((a, b) => {
      sortAsc
        ? a.cookTimeMinutes - b.cookTimeMinutes
        : b.cookTimeMinutes - a.cookTimeMinutes;
    });
    setFiltered(sorted);
    setsortAsc(!sortAsc);
  };
  const handleFilter = (selectedTags) => {
    console.log("Selected tags:", selectedTags);
    if (selectedTags.length === 0) {
      setFiltered(recipes);
      return;
    }
    console.log("Filtering with tags:", recipes);
    const filteredRecipes = recipes.filter((recipe) =>
      selectedTags.every((tag) => recipe.tags.includes(tag))
    );
    setFiltered(filteredRecipes);
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <RecipeGrid
        recipes={filtered}
        onSort={handleSort}
        onFilter={handleFilter}
        isAsc={sortAsc}
      />
    </div>
  );
};
export default HomePage;
