import React from "react";
import Select from "react-select";
import { FaTags } from "react-icons/fa";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const DropdownIndicator = () => <FaTags className="dropdown-icon" />;

const RecipeGrid = ({ recipes, onSort, onFilter, isAsc }) => {
  console.log(typeof recipes);
  recipes = Object.entries(recipes);
  const uniqueTags = [
    ...new Set(Object.entries(recipes).map((recipe) => recipe.tags || [])),
  ];
  const tagOptions = uniqueTags.map((tag) => ({ value: tag, label: tag }));
  const handleTagChange = (selectedOptions) => {
    const selectedTags = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    onFilter(selectedTags);
  };
  return (
    <div className="recipe-grid">
      <div className="toolbars">
        <button onClick={onSort}>
          Sort by Cook Time
          {isAsc ? (
            <FaArrowUp className="icon" />
          ) : (
            <FaArrowDown className="icon" />
          )}
        </button>

        <div style={{ minWidth: "200px", marginBottom: "20px" }}>
          <Select
            ismulti
            closeMenuOnSelect={false}
            options={tagOptions}
            onChange={handleTagChange}
            components={{ DropdownIndicator }}
            placeholder="Filter by Tags"
            className="tag-select"
          />
        </div>
      </div>
      <div className="grid">
        {Object.entries(recipes).map((recipe, idx) => (
          <div className="card" key={idx}>
            <img src={recipe.image} alt="" style={{ width: "100%" }} />
            <h3>{recipe.name}</h3>
            <p>Cook Time: {recipe.cookTimeMinutes} minutes</p>
            <p>Tags: {recipe.tags.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeGrid;
