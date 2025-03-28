document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const recentSearchesContainer = document.getElementById('recent-searches');
  const resultsSection = document.getElementById('results-section');
  const booksGrid = document.getElementById('books-grid');
  const bookModal = document.getElementById('book-modal');
  const closeModal = document.getElementById('close-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalCover = document.getElementById('modal-cover');
  const modalAuthor = document.getElementById('modal-author').querySelector('p');
  const modalYear = document.getElementById('modal-year').querySelector('p');
  const modalPublisher = document.getElementById('modal-publisher').querySelector('p');
  const modalSubjects = document.getElementById('modal-subjects').querySelector('.subjects-list');
  const modalDescription = document.getElementById('modal-description').querySelector('p');
  const modalLink = document.getElementById('modal-link');
  const toastContainer = document.getElementById('toast-container');
  
  // State
  let books = [];
  let selectedBook = null;
  let recentSearches = [];

  // Initialize
  function init() {
    // Load recent searches from localStorage
    loadRecentSearches();
    displayRecentSearches();
    
    // Add event listeners
    searchButton.addEventListener('click', searchBooks);
    searchInput.addEventListener('keypress', handleKeyPress);
    closeModal.addEventListener('click', closeBookDetails);
    window.addEventListener('click', function(event) {
      if (event.target === bookModal) {
        closeBookDetails();
      }
    });
  }
  
  // Load recent searches from localStorage
  function loadRecentSearches() {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      recentSearches = JSON.parse(savedSearches);
    }
  }
  
  // Display recent searches
  function displayRecentSearches() {
    if (recentSearches.length === 0) {
      recentSearchesContainer.innerHTML = '';
      return;
    }
    
    let html = '<span class="recent-text">Recent:</span>';
    recentSearches.forEach(term => {
      html += `<button class="recent-item" data-term="${term}">${term}</button>`;
    });
    
    recentSearchesContainer.innerHTML = html;
    
    // Add click event listeners to recent search items
    document.querySelectorAll('.recent-item').forEach(item => {
      item.addEventListener('click', function() {
        const term = this.getAttribute('data-term');
        searchInput.value = term;
        searchInput.focus();
      });
    });
  }
  
  // Handle search
  function searchBooks() {
    const query = searchInput.value.trim();
    
    if (!query) {
      showToast('Please enter a search term', 'error');
      return;
    }
    
    // Show loading state
    searchButton.textContent = 'Searching...';
    searchButton.disabled = true;
    
    // Use our own API endpoint instead of direct Open Library call
    fetch(`/api/search?query=${encodeURIComponent(query)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Reset loading state
        searchButton.textContent = 'Search';
        searchButton.disabled = false;
        
        if (data && data.length > 0) {
          books = data;
          
          // Save to recent searches
          saveRecentSearch(query);
          
          // Display results
          displayBooks(books);
          
          showToast(`Found ${books.length} books`, 'success');
        } else {
          books = [];
          resultsSection.style.display = 'none';
          showToast('No books found', 'error');
        }
      })
      .catch(error => {
        console.error('Search error:', error);
        searchButton.textContent = 'Search';
        searchButton.disabled = false;
        showToast('An error occurred while searching', 'error');
      });
  }
  
  // Save recent search
  function saveRecentSearch(term) {
    // Remove if already exists
    recentSearches = recentSearches.filter(search => search !== term);
    
    // Add to beginning
    recentSearches.unshift(term);
    
    // Limit to 5 recent searches
    recentSearches = recentSearches.slice(0, 5);
    
    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    
    // Update display
    displayRecentSearches();
  }
  
  // Display books
  function displayBooks(books) {
    resultsSection.style.display = 'block';
    booksGrid.innerHTML = '';
    
    books.forEach((book, index) => {
      const delay = index * 50;
      const coverUrl = book.cover_id 
        ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
        : null;
      
      const card = document.createElement('div');
      card.className = 'book-card';
      card.style.animationDelay = `${delay}ms`;
      
      card.innerHTML = `
        <div class="book-cover">
          ${coverUrl 
            ? `<img src="${coverUrl}" alt="${book.title}" />`
            : `<div class="no-cover">No cover</div>`
          }
        </div>
        <div class="book-info">
          <h3 class="book-title">${book.title}</h3>
          ${book.author 
            ? `<p class="book-author">${book.author}</p>`
            : ''
          }
          ${book.first_publish_year 
            ? `<p class="book-year">${book.first_publish_year}</p>`
            : ''
          }
        </div>
      `;
      
      card.addEventListener('click', () => {
        showBookDetails(book);
      });
      
      booksGrid.appendChild(card);
    });
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Show book details
  function showBookDetails(book) {
    selectedBook = book;
    
    // Set modal content
    modalTitle.textContent = book.title;
    
    // Book cover
    if (book.cover_id) {
      modalCover.innerHTML = `<img src="https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg" alt="${book.title}" />`;
    } else {
      modalCover.innerHTML = `<div class="no-cover">No cover available</div>`;
    }
    
    // Author
    if (book.author) {
      modalAuthor.textContent = book.author;
      modalAuthor.parentElement.style.display = 'block';
    } else {
      modalAuthor.parentElement.style.display = 'none';
    }
    
    // Year
    if (book.first_publish_year) {
      modalYear.textContent = book.first_publish_year;
      modalYear.parentElement.style.display = 'block';
    } else {
      modalYear.parentElement.style.display = 'none';
    }
    
    // Publisher
    if (book.publisher) {
      modalPublisher.textContent = book.publisher;
      modalPublisher.parentElement.style.display = 'block';
    } else {
      modalPublisher.parentElement.style.display = 'none';
    }
    
    // Subjects
    if (book.subjects && book.subjects.length > 0) {
      const subjectsHTML = book.subjects.map(subject => 
        `<span class="subject-tag">${subject}</span>`
      ).join('');
      modalSubjects.innerHTML = subjectsHTML;
      modalSubjects.parentElement.style.display = 'block';
    } else {
      modalSubjects.parentElement.style.display = 'none';
    }
    
    // Description - initially show loading
    modalDescription.textContent = 'Generating description...';
    modalDescription.parentElement.style.display = 'block';
    
    // Generate description using our API
    generateBookDescription(book.title, book.author, book.subjects)
      .then(description => {
        modalDescription.textContent = description;
      })
      .catch(error => {
        console.error('Error generating description:', error);
        modalDescription.textContent = 'Description not available';
      });
    
    // Open Library link
    modalLink.href = `https://openlibrary.org${book.key}`;
    
    // Show modal
    bookModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Generate book description using our API
  function generateBookDescription(title, author, subjects) {
    return fetch('/api/describe-book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        author,
        subjects
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to generate description');
      }
      return response.json();
    })
    .then(data => data.description);
  }
  
  // Close book details
  function closeBookDetails() {
    bookModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scrolling
    selectedBook = null;
  }
  
  // Handle key press
  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      searchBooks();
    }
  }
  
  // Show toast notification
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✓' : '✕';
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
  
  // Initialize the app
  init();
});