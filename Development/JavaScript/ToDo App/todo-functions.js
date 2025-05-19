const getTods = function (todos) {
    const todosJSON = localStorage.getItem("todos");
  
    if (todosJSON !== null) {
      return JSON.parse(todosJSON);
    } else {
      return [];
    }
  };
  