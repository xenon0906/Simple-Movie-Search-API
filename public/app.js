// API Base URL
const API_URL = '';

// Store current movies data
let currentMovies = [];
let lastJsonResponse = null;

// ==================== API CALLS ====================

// Get all movies
async function getAllMovies() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/movies`);
        const data = await response.json();
        lastJsonResponse = data;
        displayMovies(data.data);
        updateJsonView(data);
        showToast(`Loaded ${data.count} movies`, 'info');
    } catch (error) {
        showToast('Failed to fetch movies', 'error');
        console.error(error);
    }
}

// Search movies by title
async function searchMovies() {
    const searchTerm = document.getElementById('searchInput').value.trim();

    if (!searchTerm) {
        showToast('Please enter a search term', 'error');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_URL}/movies/search?title=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        lastJsonResponse = data;
        displayMovies(data.data);
        updateJsonView(data);

        if (data.count === 0) {
            showToast(`No movies found for "${searchTerm}"`, 'info');
        } else {
            showToast(`Found ${data.count} movie(s) matching "${searchTerm}"`, 'info');
        }
    } catch (error) {
        showToast('Search failed', 'error');
        console.error(error);
    }
}

// Filter movies
async function filterMovies() {
    const genre = document.getElementById('filterGenre').value;
    const minRating = document.getElementById('filterMinRating').value;
    const maxRating = document.getElementById('filterMaxRating').value;
    const year = document.getElementById('filterYear').value;
    const director = document.getElementById('filterDirector').value;

    const params = new URLSearchParams();
    if (genre) params.append('genre', genre);
    if (minRating) params.append('minRating', minRating);
    if (maxRating) params.append('maxRating', maxRating);
    if (year) params.append('year', year);
    if (director) params.append('director', director);

    try {
        showLoading();
        const response = await fetch(`${API_URL}/movies/filter?${params.toString()}`);
        const data = await response.json();
        lastJsonResponse = data;
        displayMovies(data.data);
        updateJsonView(data);
        showToast(`Found ${data.count} movie(s)`, 'info');
    } catch (error) {
        showToast('Filter failed', 'error');
        console.error(error);
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('filterGenre').value = '';
    document.getElementById('filterMinRating').value = '';
    document.getElementById('filterMaxRating').value = '';
    document.getElementById('filterYear').value = '';
    document.getElementById('filterDirector').value = '';
    showToast('Filters cleared', 'info');
}

// Add new movie
async function addMovie() {
    const title = document.getElementById('newTitle').value.trim();
    const rating = parseFloat(document.getElementById('newRating').value);
    const year = document.getElementById('newYear').value ? parseInt(document.getElementById('newYear').value) : null;
    const genre = document.getElementById('newGenre').value.trim() || 'Unknown';
    const director = document.getElementById('newDirector').value.trim() || 'Unknown';

    if (!title) {
        showToast('Title is required', 'error');
        return;
    }

    if (isNaN(rating) || rating < 0 || rating > 10) {
        showToast('Rating must be between 0 and 10', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/movies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, rating, year, genre, director })
        });
        const data = await response.json();
        lastJsonResponse = data;
        updateJsonView(data);

        if (data.success) {
            showToast('Movie added successfully!', 'success');
            clearAddForm();
            getAllMovies();
        } else {
            showToast(data.error || data.errors?.join(', ') || 'Failed to add movie', 'error');
        }
    } catch (error) {
        showToast('Failed to add movie', 'error');
        console.error(error);
    }
}

// Clear add movie form
function clearAddForm() {
    document.getElementById('newTitle').value = '';
    document.getElementById('newRating').value = '';
    document.getElementById('newYear').value = '';
    document.getElementById('newGenre').value = '';
    document.getElementById('newDirector').value = '';
}

// Update movie
async function updateMovie() {
    const id = document.getElementById('editId').value;
    const title = document.getElementById('editTitle').value.trim();
    const rating = parseFloat(document.getElementById('editRating').value);
    const year = document.getElementById('editYear').value ? parseInt(document.getElementById('editYear').value) : null;
    const genre = document.getElementById('editGenre').value.trim();
    const director = document.getElementById('editDirector').value.trim();

    const updateData = {};
    if (title) updateData.title = title;
    if (!isNaN(rating)) updateData.rating = rating;
    if (year) updateData.year = year;
    if (genre) updateData.genre = genre;
    if (director) updateData.director = director;

    try {
        const response = await fetch(`${API_URL}/movies/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        const data = await response.json();
        lastJsonResponse = data;
        updateJsonView(data);

        if (data.success) {
            showToast('Movie updated successfully!', 'success');
            closeModal();
            getAllMovies();
        } else {
            showToast(data.error || 'Failed to update movie', 'error');
        }
    } catch (error) {
        showToast('Failed to update movie', 'error');
        console.error(error);
    }
}

// Delete movie
async function deleteMovie(id) {
    if (!confirm('Are you sure you want to delete this movie?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/movies/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        lastJsonResponse = data;
        updateJsonView(data);

        if (data.success) {
            showToast('Movie deleted successfully!', 'success');
            getAllMovies();
        } else {
            showToast(data.error || 'Failed to delete movie', 'error');
        }
    } catch (error) {
        showToast('Failed to delete movie', 'error');
        console.error(error);
    }
}

// Get statistics
async function getStats() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();
        lastJsonResponse = data;
        displayStats(data.data);
        updateJsonView(data);
        showToast('Statistics loaded', 'info');
    } catch (error) {
        showToast('Failed to fetch statistics', 'error');
        console.error(error);
    }
}

// Get top rated movies
async function getTopRated() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/movies?sortBy=rating&order=desc`);
        const data = await response.json();
        lastJsonResponse = data;
        displayMovies(data.data);
        updateJsonView(data);
        showToast('Showing top rated movies', 'info');
    } catch (error) {
        showToast('Failed to fetch movies', 'error');
        console.error(error);
    }
}

// ==================== DISPLAY FUNCTIONS ====================

// Display movies in grid
function displayMovies(movies) {
    currentMovies = movies;
    const grid = document.getElementById('moviesGrid');
    const countEl = document.getElementById('resultsCount');

    countEl.textContent = `${movies.length} movie(s) found`;

    if (movies.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">🎬</div>
                <h3>No movies found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = movies.map(movie => `
        <div class="movie-card">
            <span class="movie-id">ID: ${movie.id}</span>
            <div class="movie-card-header">
                <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
                <span class="movie-rating">${movie.rating}</span>
            </div>
            <div class="movie-details">
                <div class="movie-detail">
                    <span class="movie-detail-label">Year:</span>
                    <span class="movie-detail-value">${movie.year || 'N/A'}</span>
                </div>
                <div class="movie-detail">
                    <span class="movie-detail-label">Genre:</span>
                    <span class="genre-badge">${escapeHtml(movie.genre)}</span>
                </div>
                <div class="movie-detail">
                    <span class="movie-detail-label">Director:</span>
                    <span class="movie-detail-value">${escapeHtml(movie.director)}</span>
                </div>
            </div>
            <div class="movie-actions">
                <button onclick="openEditModal(${movie.id})" class="btn btn-primary btn-small">Edit</button>
                <button onclick="deleteMovie(${movie.id})" class="btn btn-danger btn-small">Delete</button>
            </div>
        </div>
    `).join('');
}

// Display statistics
function displayStats(stats) {
    const grid = document.getElementById('moviesGrid');
    const countEl = document.getElementById('resultsCount');

    countEl.textContent = 'Movie Statistics';

    grid.innerHTML = `
        <div style="grid-column: 1/-1;">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalMovies}</div>
                    <div class="stat-label">Total Movies</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.averageRating}</div>
                    <div class="stat-label">Average Rating</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.highestRated.rating}</div>
                    <div class="stat-label">Highest: ${escapeHtml(stats.highestRated.title)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.lowestRated.rating}</div>
                    <div class="stat-label">Lowest: ${escapeHtml(stats.lowestRated.title)}</div>
                </div>
            </div>

            <div class="distribution-section">
                <h3>Genre Distribution</h3>
                ${Object.entries(stats.genreDistribution).map(([genre, count]) => `
                    <div class="distribution-item">
                        <span>${escapeHtml(genre)}</span>
                        <span>${count} movie(s)</span>
                    </div>
                `).join('')}
            </div>

            <div class="distribution-section">
                <h3>Director Distribution</h3>
                ${Object.entries(stats.directorDistribution).map(([director, count]) => `
                    <div class="distribution-item">
                        <span>${escapeHtml(director)}</span>
                        <span>${count} movie(s)</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Show loading state
function showLoading() {
    const grid = document.getElementById('moviesGrid');
    grid.innerHTML = `
        <div class="loading" style="grid-column: 1/-1;">
            <div class="spinner"></div>
        </div>
    `;
}

// ==================== JSON VIEW ====================

// Update JSON view with syntax highlighting
function updateJsonView(data) {
    const jsonOutput = document.getElementById('jsonOutput');
    const formatted = JSON.stringify(data, null, 2);
    jsonOutput.innerHTML = syntaxHighlight(formatted);
}

// Syntax highlight JSON
function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

// Copy JSON to clipboard
function copyJson() {
    if (lastJsonResponse) {
        navigator.clipboard.writeText(JSON.stringify(lastJsonResponse, null, 2))
            .then(() => showToast('JSON copied to clipboard!', 'success'))
            .catch(() => showToast('Failed to copy', 'error'));
    }
}

// ==================== TABS ====================

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'View').classList.add('active');
}

// ==================== SORTING ====================

function sortResults() {
    const sortValue = document.getElementById('sortBy').value;
    if (!sortValue || currentMovies.length === 0) return;

    const [field, order] = sortValue.split('-');

    const sorted = [...currentMovies].sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (order === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });

    displayMovies(sorted);
}

// ==================== MODAL ====================

function openEditModal(id) {
    const movie = currentMovies.find(m => m.id === id);
    if (!movie) return;

    document.getElementById('editId').value = movie.id;
    document.getElementById('editTitle').value = movie.title;
    document.getElementById('editRating').value = movie.rating;
    document.getElementById('editYear').value = movie.year || '';
    document.getElementById('editGenre').value = movie.genre;
    document.getElementById('editDirector').value = movie.director;

    document.getElementById('editModal').classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
}

// Close modal on outside click
document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// ==================== TOAST ====================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== UTILITIES ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enter key handlers
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchMovies();
    }
});

// ==================== INITIALIZATION ====================

// Load all movies on page load
document.addEventListener('DOMContentLoaded', function() {
    getAllMovies();
});
