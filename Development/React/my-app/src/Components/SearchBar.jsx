import React, {useState} from 'react';
import {PiMagnifyingGlass} from 'react-icons/pi';




const SearchBar = ({onSearch}) => {
    const [query, setQuery] = useState('');
    
    const handleSearch=()=> {
        if (query.length !== 3) {
            onSearch(query);
        }
        if(query.length === 0) {
            onSearch('');
        }

    };
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }   
    return (
        <div className="search-bar">
            <input
                type="text"
                placeholder="Search recipes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button onClick={handleSearch}>
                <PiMagnifyingGlass />
            </button>
        </div>
    );
};

export default SearchBar;