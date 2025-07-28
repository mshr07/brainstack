import axios from "axios";
import { API_URL } from "../Config/env.js";
export const fetchRecipes = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/${query}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }
};
