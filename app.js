const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
var parseISO = require("date-fns/parseISO");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const checkStatusProperty = (status) => {
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    return true;
  } else {
    return false;
  }
};

const checkPriorityProperty = (priority) => {
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    return true;
  } else {
    return false;
  }
};

const checkCategoryProperty = (category) => {
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    return true;
  } else {
    return false;
  }
};

const checkDueDateProperty = (date) => {
  const result = isValid(new Date(date));
  if (result) {
    return true;
  } else {
    return false;
  }
};

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  const checkPriority = checkPriorityProperty(request.query.priority);
  const checkStatus = checkStatusProperty(request.query.status);
  const checkCategory = checkCategoryProperty(request.query.category);

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (checkPriority === true && checkStatus === true) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else if (checkPriority === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (checkStatus === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (checkCategory === true && checkStatus === true) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else if (checkCategory === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (checkStatus === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryAndPriorityProperties(request.query):
      if (checkCategory && checkPriority === true) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        AND category = '${category}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else if (checkCategory === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (checkPriority === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityProperty(request.query):
      if (checkPriority === true) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        ;`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      if (checkStatus === true) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperty(request.query):
      if (checkCategory === true) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
      data = await database.all(getTodosQuery);
      response.send(
        data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const checkDate = checkDueDateProperty(date);

  if (checkDate === true) {
    const dueDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      due_date = '${dueDate}';`;
    data = await database.all(getTodoQuery);
    response.send(
      data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const checkPriority = checkPriorityProperty(priority);
  const checkStatus = checkStatusProperty(status);
  const checkCategory = checkCategoryProperty(category);
  const checkDueDate = checkDueDateProperty(dueDate);

  if (
    checkPriority === true &&
    checkStatus === true &&
    checkCategory === true &&
    checkDueDate === true
  ) {
    const addTodoQuery = `
    INSERT INTO todo (id, todo, priority, status, category, due_date)
    VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
    await database.run(addTodoQuery);
    response.send("Todo Successfully Added");
  } else if (checkPriority === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (checkStatus === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (checkCategory === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (checkDueDate === false) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { id, todo, priority, status, category, dueDate } = request.body;

  let checkPriority = true;
  let checkStatus = true;
  let checkCategory = true;
  let checkDueDate = true;

  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      checkStatus = checkStatusProperty(requestBody.status);
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      checkPriority = checkPriorityProperty(requestBody.priority);
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      checkCategory = checkCategoryProperty(requestBody.category);
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      checkDueDate = checkDueDateProperty(requestBody.dueDate);
      break;
  }

  if (
    checkPriority === true &&
    checkStatus === true &&
    checkCategory === true &&
    checkDueDate === true
  ) {
    const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
    const previousTodo = await database.get(previousTodoQuery);

    const {
      todo = previousTodo.todo,
      priority = previousTodo.priority,
      status = previousTodo.status,
      category = previousTodo.category,
      dueDate = previousTodo.due_date,
    } = request.body;

    const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

    await database.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  } else if (checkStatus === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (checkPriority === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (checkCategory === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (checkDueDate === false) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
