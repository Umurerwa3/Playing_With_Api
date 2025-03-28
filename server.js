const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const PORT = 3000;
const COUNTRY_API_BASE_URL = 'https://countryinfoapi.com/api/countries/name/';
const OPEN_LIBRARY_API = 'https://openlibrary.org/search.json?q=';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_APIKEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', async (req, res) => {
    const index_html =`
    <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Book Explorer</title>
  <meta name="description" content="Search and explore books from Open Library" />
  <link rel="stylesheet" href="styles.css" />
</head>

<body>
  <!-- Hero Section -->
  <div class="hero">
    <div class="container">
      <div class="header">
        <div class="badge">Open Library Explorer</div>
        <h1>Discover the world of <span>literature</span></h1>
        <p>Explore millions of books from the Open Library database with a clean, intuitive interface.</p>
      </div>

      <!-- Search Section -->
      <div class="search-container">
        <div class="search-wrapper">
          <input type="text" id="search-input" placeholder="Search for books, authors, or subjects..." />
          <button id="search-button">Search</button>
        </div>
        <div class="recent-searches" id="recent-searches">
          <!-- Recent searches will be populated here -->
        </div>
      </div>
    </div>
  </div>

  <!-- Book Details Modal -->
  <div class="modal-overlay" id="book-modal">
    <div class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-title"></h2>
          <button id="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="book-details">
            <div class="book-cover" id="modal-cover"></div>
            <div class="book-info">
              <div class="book-detail" id="modal-author">
                <h3>Author</h3>
                <p></p>
              </div>
              <div class="book-detail" id="modal-year">
                <h3>First Published</h3>
                <p></p>
              </div>
              <div class="book-detail" id="modal-publisher">
                <h3>Publisher</h3>
                <p></p>
              </div>
              <div class="book-detail" id="modal-subjects">
                <h3>Subjects</h3>
                <div class="subjects-list"></div>
              </div>
              <div class="book-detail" id="modal-description">
                <h3>Description</h3>
                <p></p>
              </div>
              <div class="book-action">
                <a id="modal-link" target="_blank" rel="noopener noreferrer">
                  View on Open Library
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Results Section -->
  <div class="results" id="results-section">
    <h2>Search Results</h2>
    <div class="books-grid" id="books-grid">
      <!-- Books will be displayed here -->
    </div>
  </div>

  <!-- Toast Notifications -->
  <div id="toast-container"></div>

  <!-- Footer -->
  <footer>
    <div class="container">
      <p>Data provided by <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">Open Library</a></p>
      <p>Created for educational purposes only</p>
    </div>
  </footer>

  <script src="script.js"></script>
</body>

</html>
    `
    return res.send(index_html)
});

// Search books in Open Library
app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const response = await axios.get(`${OPEN_LIBRARY_API}${encodeURIComponent(query)}`);
        const books = response.data.docs.map(book => ({
            title: book.title,
            author: book.author_name ? book.author_name.join(', ') : 'Unknown',
            first_publish_year: book.first_publish_year,
            publisher: book.publisher ? book.publisher.join(', ') : 'Unknown',
            subjects: book.subject ? book.subject.slice(0, 5) : [],
            cover_id: book.cover_i,
            key: book.key
        }));
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// Generate book description using Gemini
app.post('/api/describe-book', async (req, res) => {
    const { title, author, subjects } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Book title is required' });
    }

    try {
        const prompt = `Write a concise and engaging description (about 100 words) for the book "${title}"${
            author ? ` by ${author}` : ''
        }${
            subjects && subjects.length > 0 ? ` that covers topics like ${subjects.join(', ')}` : ''
        }. Make it sound professional and appealing to potential readers.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const description = response.text();
        
        res.json({ description });
    } catch (error) {
        console.error('Error generating description:', error);
        res.status(500).json({ error: 'Failed to generate description' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
