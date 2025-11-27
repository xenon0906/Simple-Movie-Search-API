const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory movie database
let movies = [
    { id: 1, title: "Inception", rating: 9, year: 2010, genre: "Sci-Fi", director: "Christopher Nolan" },
    { id: 2, title: "Interstellar", rating: 8.5, year: 2014, genre: "Sci-Fi", director: "Christopher Nolan" },
    { id: 3, title: "Dangal", rating: 8.4, year: 2016, genre: "Drama", director: "Nitesh Tiwari" },
    { id: 4, title: "The Dark Knight", rating: 9.2, year: 2008, genre: "Action", director: "Christopher Nolan" },
    { id: 5, title: "Pulp Fiction", rating: 8.9, year: 1994, genre: "Crime", director: "Quentin Tarantino" },
    { id: 6, title: "The Shawshank Redemption", rating: 9.3, year: 1994, genre: "Drama", director: "Frank Darabont" },
    { id: 7, title: "Forrest Gump", rating: 8.8, year: 1994, genre: "Drama", director: "Robert Zemeckis" },
    { id: 8, title: "The Matrix", rating: 8.7, year: 1999, genre: "Sci-Fi", director: "The Wachowskis" }
];

// Auto-increment ID tracker
let nextId = movies.length + 1;

// ==================== ROUTES ====================

// API Info endpoint
app.get('/api', (req, res) => {
    res.json({
        message: "Welcome to Movie Search API",
        version: "1.0.0",
        endpoints: {
            "GET /movies": "Get all movies",
            "GET /movies/search?title=query": "Search movies by title",
            "GET /movies/filter?genre=&minRating=&year=": "Filter movies",
            "GET /movies/:id": "Get movie by ID",
            "POST /movies": "Add a new movie",
            "PUT /movies/:id": "Update a movie",
            "DELETE /movies/:id": "Delete a movie",
            "GET /stats": "Get movie statistics"
        }
    });
});

// GET /movies - Get all movies with optional sorting
app.get('/movies', (req, res) => {
    const { sortBy, order = 'asc' } = req.query;
    let result = [...movies];

    // Sorting
    if (sortBy && ['title', 'rating', 'year'].includes(sortBy)) {
        result.sort((a, b) => {
            if (order === 'desc') {
                return a[sortBy] > b[sortBy] ? -1 : 1;
            }
            return a[sortBy] > b[sortBy] ? 1 : -1;
        });
    }

    res.json({
        success: true,
        count: result.length,
        data: result
    });
});

// GET /movies/search - Search movies by title (case-insensitive)
// IMPORTANT: This must come before /movies/:id route
app.get('/movies/search', (req, res) => {
    const { title } = req.query;

    // Validation
    if (!title) {
        return res.status(400).json({
            success: false,
            error: "Query parameter 'title' is required",
            example: "/movies/search?title=inc"
        });
    }

    // Case-insensitive search
    const searchTerm = title.toLowerCase();
    const matchingMovies = movies.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm)
    );

    if (matchingMovies.length === 0) {
        return res.json({
            success: true,
            count: 0,
            message: `No movies found matching "${title}"`,
            data: []
        });
    }

    res.json({
        success: true,
        count: matchingMovies.length,
        searchTerm: title,
        data: matchingMovies
    });
});

// GET /movies/filter - Filter movies by genre, rating, year
app.get('/movies/filter', (req, res) => {
    const { genre, minRating, maxRating, year, director } = req.query;
    let result = [...movies];

    if (genre) {
        result = result.filter(m => m.genre.toLowerCase() === genre.toLowerCase());
    }

    if (minRating) {
        const min = parseFloat(minRating);
        if (!isNaN(min)) {
            result = result.filter(m => m.rating >= min);
        }
    }

    if (maxRating) {
        const max = parseFloat(maxRating);
        if (!isNaN(max)) {
            result = result.filter(m => m.rating <= max);
        }
    }

    if (year) {
        const y = parseInt(year);
        if (!isNaN(y)) {
            result = result.filter(m => m.year === y);
        }
    }

    if (director) {
        result = result.filter(m =>
            m.director.toLowerCase().includes(director.toLowerCase())
        );
    }

    res.json({
        success: true,
        count: result.length,
        filters: { genre, minRating, maxRating, year, director },
        data: result
    });
});

// GET /movies/:id - Get movie by ID
app.get('/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            success: false,
            error: "Invalid movie ID. Must be a number."
        });
    }

    const movie = movies.find(m => m.id === id);

    if (!movie) {
        return res.status(404).json({
            success: false,
            error: `Movie with ID ${id} not found`
        });
    }

    res.json({
        success: true,
        data: movie
    });
});

// POST /movies - Add a new movie
app.post('/movies', (req, res) => {
    const { title, rating, year, genre, director } = req.body;

    // Validation
    const errors = [];
    if (!title || typeof title !== 'string' || title.trim() === '') {
        errors.push("Title is required and must be a non-empty string");
    }
    if (rating === undefined || typeof rating !== 'number' || rating < 0 || rating > 10) {
        errors.push("Rating is required and must be a number between 0 and 10");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }

    // Check for duplicate title
    if (movies.some(m => m.title.toLowerCase() === title.toLowerCase())) {
        return res.status(409).json({
            success: false,
            error: "A movie with this title already exists"
        });
    }

    const newMovie = {
        id: nextId++,
        title: title.trim(),
        rating,
        year: year || null,
        genre: genre || "Unknown",
        director: director || "Unknown"
    };

    movies.push(newMovie);

    res.status(201).json({
        success: true,
        message: "Movie added successfully",
        data: newMovie
    });
});

// PUT /movies/:id - Update a movie
app.put('/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            success: false,
            error: "Invalid movie ID"
        });
    }

    const movieIndex = movies.findIndex(m => m.id === id);

    if (movieIndex === -1) {
        return res.status(404).json({
            success: false,
            error: `Movie with ID ${id} not found`
        });
    }

    const { title, rating, year, genre, director } = req.body;

    // Validation for rating if provided
    if (rating !== undefined && (typeof rating !== 'number' || rating < 0 || rating > 10)) {
        return res.status(400).json({
            success: false,
            error: "Rating must be a number between 0 and 10"
        });
    }

    // Update only provided fields
    const updatedMovie = {
        ...movies[movieIndex],
        title: title?.trim() || movies[movieIndex].title,
        rating: rating ?? movies[movieIndex].rating,
        year: year ?? movies[movieIndex].year,
        genre: genre || movies[movieIndex].genre,
        director: director || movies[movieIndex].director
    };

    movies[movieIndex] = updatedMovie;

    res.json({
        success: true,
        message: "Movie updated successfully",
        data: updatedMovie
    });
});

// DELETE /movies/:id - Delete a movie
app.delete('/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            success: false,
            error: "Invalid movie ID"
        });
    }

    const movieIndex = movies.findIndex(m => m.id === id);

    if (movieIndex === -1) {
        return res.status(404).json({
            success: false,
            error: `Movie with ID ${id} not found`
        });
    }

    const deletedMovie = movies.splice(movieIndex, 1)[0];

    res.json({
        success: true,
        message: "Movie deleted successfully",
        data: deletedMovie
    });
});

// GET /stats - Get movie statistics
app.get('/stats', (req, res) => {
    const totalMovies = movies.length;
    const avgRating = movies.reduce((sum, m) => sum + m.rating, 0) / totalMovies;
    const highestRated = movies.reduce((max, m) => m.rating > max.rating ? m : max);
    const lowestRated = movies.reduce((min, m) => m.rating < min.rating ? m : min);

    // Genre distribution
    const genreCount = movies.reduce((acc, m) => {
        acc[m.genre] = (acc[m.genre] || 0) + 1;
        return acc;
    }, {});

    // Director distribution
    const directorCount = movies.reduce((acc, m) => {
        acc[m.director] = (acc[m.director] || 0) + 1;
        return acc;
    }, {});

    res.json({
        success: true,
        data: {
            totalMovies,
            averageRating: parseFloat(avgRating.toFixed(2)),
            highestRated: { title: highestRated.title, rating: highestRated.rating },
            lowestRated: { title: lowestRated.title, rating: lowestRated.rating },
            genreDistribution: genreCount,
            directorDistribution: directorCount
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        hint: "Visit / for available endpoints"
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: "Internal server error"
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
======================================================
      Movie Search API is running!
======================================================
  Web UI:    http://localhost:${PORT}
  API Info:  http://localhost:${PORT}/api
------------------------------------------------------
  API Endpoints:
  GET  /movies              - List all movies
  GET  /movies/search       - Search by title
  GET  /movies/filter       - Filter movies
  GET  /movies/:id          - Get movie by ID
  POST /movies              - Add new movie
  PUT  /movies/:id          - Update movie
  DELETE /movies/:id        - Delete movie
  GET  /stats               - Movie statistics
======================================================
    `);
});

module.exports = app;
