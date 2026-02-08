// Search Page
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/FirebaseAuthContext';
import { Search, Filter, Grid, List, ArrowLeft } from 'lucide-react';
import { useCategories } from '../utils/categoryManager';
import ImageWithFallback from '../components/ImageWithFallback';
import './Search.css';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [filterType, setFilterType] = useState('all'); // all, images, videos
    const { user } = useAuth();
    const { categories } = useCategories();

    // Perform search
    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            setSearchQuery(query);
            performSearch(query);
        }
    }, [searchParams]);

    const performSearch = async (query) => {
        if (!query.trim()) return;
        
        setLoading(true);
        try {
            console.log('🔍 Searching for:', query);
            
            // Search through categories
            const results = [];
            const searchTerm = query.toLowerCase();
            
            categories.forEach(category => {
                // Check if category name matches
                if (category.name.toLowerCase().includes(searchTerm)) {
                    results.push({
                        type: 'category',
                        id: category.id,
                        name: category.name,
                        description: `Category with ${category.subCategories?.length || 0} subcategories`,
                        emoji: category.emoji,
                        path: `/category/${category.id}`,
                        relevance: category.name.toLowerCase() === searchTerm ? 100 : 80
                    });
                }
                
                // Check subcategories
                category.subCategories?.forEach(subCategory => {
                    if (subCategory.name.toLowerCase().includes(searchTerm)) {
                        results.push({
                            type: 'subcategory',
                            id: `${category.id}-${subCategory.id}`,
                            name: subCategory.name,
                            description: `${category.name} > ${subCategory.name}`,
                            emoji: category.emoji,
                            path: `/category/${category.id}/${subCategory.id}/image`,
                            relevance: subCategory.name.toLowerCase() === searchTerm ? 90 : 70
                        });
                    }
                });
            });
            
            // Sort by relevance
            results.sort((a, b) => b.relevance - a.relevance);
            
            setSearchResults(results);
            console.log(`✅ Found ${results.length} results for "${query}"`);
            
        } catch (error) {
            console.error('❌ Search error:', error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setSearchParams({ q: searchQuery.trim() });
        }
    };

    const filteredResults = searchResults.filter(result => {
        if (filterType === 'all') return true;
        return result.type === filterType;
    });

    return (
        <div className="search-page">
            {/* Search Header */}
            <div className="search-header">
                <Link to="/" className="back-link">
                    <ArrowLeft size={18} />
                    <span>Back to Home</span>
                </Link>
                
                <div className="search-title">
                    <h1>Search Results</h1>
                    {searchParams.get('q') && (
                        <p>
                            {loading ? 'Searching...' : `${filteredResults.length} results for "${searchParams.get('q')}"`}
                        </p>
                    )}
                </div>
            </div>

            {/* Search Form */}
            <div className="search-form-container">
                <form className="search-form-large" onSubmit={handleSearch}>
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        className="search-input-large"
                        placeholder="Search designs, categories, styles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="search-btn">
                        Search
                    </button>
                </form>
            </div>

            {/* Search Filters */}
            {searchResults.length > 0 && (
                <div className="search-filters">
                    <div className="filter-group">
                        <Filter size={16} />
                        <span>Filter by:</span>
                        <button
                            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >
                            All ({searchResults.length})
                        </button>
                        <button
                            className={`filter-btn ${filterType === 'category' ? 'active' : ''}`}
                            onClick={() => setFilterType('category')}
                        >
                            Categories ({searchResults.filter(r => r.type === 'category').length})
                        </button>
                        <button
                            className={`filter-btn ${filterType === 'subcategory' ? 'active' : ''}`}
                            onClick={() => setFilterType('subcategory')}
                        >
                            Subcategories ({searchResults.filter(r => r.type === 'subcategory').length})
                        </button>
                    </div>

                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Search Results */}
            <div className="search-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Searching...</p>
                    </div>
                ) : filteredResults.length > 0 ? (
                    <div className={`search-results ${viewMode}`}>
                        {filteredResults.map((result, index) => (
                            <Link
                                key={result.id}
                                to={result.path}
                                className="search-result-card"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="result-icon">
                                    {result.emoji}
                                </div>
                                <div className="result-content">
                                    <h3>{result.name}</h3>
                                    <p>{result.description}</p>
                                    <span className="result-type">
                                        {result.type === 'category' ? 'Category' : 'Subcategory'}
                                    </span>
                                </div>
                                <div className="result-arrow">
                                    →
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : searchParams.get('q') ? (
                    <div className="no-results">
                        <Search size={64} />
                        <h3>No results found</h3>
                        <p>
                            No results found for "<strong>{searchParams.get('q')}</strong>".
                            <br />
                            Try searching for different keywords or browse categories.
                        </p>
                        <Link to="/categories" className="btn btn-primary">
                            Browse Categories
                        </Link>
                    </div>
                ) : (
                    <div className="search-suggestions">
                        <h3>Popular Categories</h3>
                        <div className="suggestion-grid">
                            {categories.slice(0, 6).map(category => (
                                <Link
                                    key={category.id}
                                    to={`/category/${category.id}`}
                                    className="suggestion-card"
                                >
                                    <span className="suggestion-emoji">{category.emoji}</span>
                                    <span className="suggestion-name">{category.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;