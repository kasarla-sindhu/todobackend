const express = require('express')
const app = express()
const path = require('path')
const dbpath = path.join(__dirname, 'todoApplication.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
app.use(express.json())

let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running on port 3000')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const checkReqQuery = (req, res, next) => {
  const {status, priority, category, date} = req.query
  const categoryIncludes = ['WORK', 'HOME', 'LEARNING']
  const statusIncludes = ['TO DO', 'IN PROGRESS', 'DONE']
  const priorityIncludes = ['HIGH', 'MEDIUM', 'LOW']
  if (category !== undefined) {
    if (!categoryIncludes.includes(category)) {
      res.status(400)
      res.send('Invalid Todo Category')
      return
    }
  }
  if (status !== undefined) {
    if (!statusIncludes.includes(status)) {
      res.status(400)
      res.send('Invalid Todo Status')
      return
    }
  }
  if (priority !== undefined) {
    if (!priorityIncludes.includes(priority)) {
      res.status(400)
      res.send('Invalid Todo Priority')
      return
    }
  }
  if (date !== undefined) {
    const formattedDate = format(new Date(date), 'yyyy-MM-dd')
    const isvaliddate = isValid(new Date(date))
    console.log(isvaliddate)
    if (isvaliddate) {
      req.date = formattedDate
    } else {
      res.status(400)
      res.send('Invalid Due Date')
      return
    }
  }
  next()
}

const checkReqbody = async (req, res, next) => {
  const {category, priority, status, dueDate} = req.body

  const categoryIncludes = ['WORK', 'HOME', 'LEARNING']
  const statusIncludes = ['TO DO', 'IN PROGRESS', 'DONE']
  const priorityIncludes = ['HIGH', 'MEDIUM', 'LOW']

  if (category !== undefined && !categoryIncludes.includes(category)) {
    return res.status(400).send('Invalid Todo Category')
  }

  if (status !== undefined && !statusIncludes.includes(status)) {
    return res.status(400).send('Invalid Todo Status')
  }

  if (priority !== undefined && !priorityIncludes.includes(priority)) {
    return res.status(400).send('Invalid Todo Priority')
  }

  if (dueDate !== undefined) {
    const date = new Date(dueDate)
    if (!isValid(date)) {
      return res.status(400).send('Invalid Due Date')
    }
    req.date = format(date, 'yyyy-MM-dd')
  }

  next()
}

app.get('/todos/', checkReqQuery, async (req, res) => {
  const {status = '', priority = '', search_q = '', category = ''} = req.query
  const query = `
    SELECT *
    FROM todo
    WHERE todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' AND status LIKE '%${status}%' AND category LIKE '%${category}%'`

  const responseArr = await db.all(query)
  res.send(responseArr)
})

app.get('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const query = `
  SELECT *
  FROM todo
  WHERE id=${todoId}`
  const responseArr = await db.get(query)
  res.send(responseArr)
})

app.get('/agenda/', checkReqQuery, async (req, res) => {
  const {date} = req
  const query = `
  SELECT *
  FROM todo
  WHERE due_date='${date}'`
  const responseArr = await db.all(query)
  res.send(responseArr)
})

app.post('/todos/', checkReqbody, async (req, res) => {
  const {id, todo, priority, status, category, dueDate} = req.body
  const query = `
  INSERT INTO 
  todo (id,todo,category,priority,status,due_date)
  VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}')`
  await db.run(query)
  res.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', checkReqbody, async (req, res) => {
  const {todo, priority, status, category, dueDate} = req.body
  const {todoId} = req.params
  const query = `
  UPDATE todo
  SET 
    todo='${todo}',
    priority='${priority}',
    status='${status}',
    category='${category}',
    due_date='${dueDate}'
  
  WHERE id= ${todoId}`
  await db.run(query)
  if (todo !== undefined) {
    res.send('Todo Updated')
  }
  if (priority !== undefined) {
    res.send('Priority Updated')
  }
  if (status !== undefined) {
    res.send('Status Updated')
  }
  if (category !== undefined) {
    res.send('Category Updated')
  }
  if (dueDate !== undefined) {
    res.send('Due Date Updated')
  }
})

app.delete('/todos/:todoId', async (req, res) => {
  const {todoId} = req.params
  const query = `
  DELETE FROM todo
  WHERE id=${todoId}`

  await db.run(query)
  res.send('Todo Deleted')
})

module.exports = app
