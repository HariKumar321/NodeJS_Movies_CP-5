const express = require('express') // importing 3rd party pkg from NPM Website
const sqlite3 = require('sqlite3') // importing 3rd party pkg from NPM Website
const {open} = require('sqlite') // importing 3rd party pkg from NPM Website
const path = require('path') // core module or inbuild file of node JS

const app = express() //server instance created
app.use(express.json()) // recognise JSON format
const dpPath = path.join(__dirname, 'moviesData.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dpPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('sever started at http://localhost:3000')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDbObjectToResponseObjectDirectorTable = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

const convertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

//url: http://localhost:3000
//API-1: Returns a list of all movie names in the movie table --> url: http://localhost:3000/movies/
app.get('/movies/', async (request, response) => {
  const getMoviesQuery = `
        SELECT *
        FROM movie
        ORDER BY movie_id;
      `
  const moviesArray = await db.all(getMoviesQuery)
  response.send(
    moviesArray.map(eachObject => convertDbObjectToResponseObject(eachObject)),
  )
})

//API-2: Creates a new movie in the movie table. movie_id is auto-incremented --> url: http://localhost:3000/movies/
app.post('/movies/', async (request, response) => {
  const newMovie = request.body
  const {directorId, movieName, leadActor} = newMovie
  const addNewMovieQuery = `
    INSERT INTO 
      movie(director_id, movie_name, lead_actor)
    VALUES(${directorId}, "${movieName}", "${leadActor}"); 
  `
  const addNewMovie = await db.run(addNewMovieQuery)
  response.send('Movie Successfully Added')
})

//API-3: Returns a movie based on the movie ID. movie_id is auto-incremented --> url: http://localhost:3000/movies/movieId/
app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
    SELECT *
    FROM movie
    WHERE movie_id = ${movieId};`
  const getMovieObject = await db.get(getMovieQuery)
  const {movie_id, director_id, movie_name, lead_actor} = getMovieObject
  const camelCaseObject = {
    movieId: movie_id,
    directorId: director_id,
    movieName: movie_name,
    leadActor: lead_actor,
  }
  response.send(camelCaseObject)
})

//API-4: Updates the details of a movie in the movie table based on the movie ID --> url: http://localhost:3000/movies/movieId/
app.put('/movies/:movieId/', async (request, response) => {
  const requestBody = request.body
  const {directorId, movieName, leadActor} = requestBody
  const {movieId} = request.params
  const updateMovieQuery = `
    UPDATE movie
    SET 
      director_id	= ${directorId},
      movie_name = "${movieName}",
      lead_actor = "${leadActor}"
    
    WHERE movie_Id = ${movieId}
  `
  const updateMovie = await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

//API-5: Deletes a movie from the movie table based on the movie ID --> url: http://localhost:3000/movies/movieId/
app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
    DELETE FROM movie
    WHERE movie_id = ${movieId}
  `
  const deleteMovie = await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

//API-6: Returns a list of all directors in the director table --> url: http://localhost:3000/directors/
app.get('/directors/', async (request, response) => {
  const getAllDirectorsQuery = `
    SELECT *
    FROM director
    ORDER BY director_id;
  `
  const getAllDirectors = await db.all(getAllDirectorsQuery)
  response.send(
    getAllDirectors.map(eachObject =>
      convertDbObjectToResponseObjectDirectorTable(eachObject),
    ),
  )
})

//API-7: Returns a list of all movie names directed by a specific director --> url: http://localhost:3000/directorId/movies/
app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const moviesByDirectorQuery = `
    SELECT movie.movie_name
    FROM movie NATURAL JOIN director
    WHERE director.director_id = ${directorId}
  `
  const moviesByDirectorId = await db.all(moviesByDirectorQuery)
  response.send(
    moviesByDirectorId.map(eachObject =>
      convertDbObjectToResponseObject(eachObject),
    ),
  )
})

module.exports = app
