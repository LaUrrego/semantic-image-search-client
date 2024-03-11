import { useState, useEffect } from 'react';
// container from bootstrap to allow for consistent styling
import { Form, Button, InputGroup, ListGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import SearchResults from './SearchResults';


export default function Search({deleteImage, suggestions}) {
    const supabase = useSupabaseClient();
    const user = useUser();

    const [allSuggestions, setAllSuggestions] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [results, setResults] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Call to microservice storing search results
    async function fetchAndUpdateSuggestions() {
        let list = await fetch(`http://localhost:${process.env.REACT_APP_MS_PORT}/search-terms/all`);
        const data = await list.json();
        setAllSuggestions(data['searchTerms'])
        console.log("This is the Microservice list: ", data['searchTerms'])
    };

    // Call to microservice for a random suggestion term
    async function handleRandom(){
        let response = await fetch(`http://localhost:${process.env.REACT_APP_MS_PORT}/search-terms/random`)
        const data = await response.json()
        console.log("Random term is: ", data['randomTerm'])
        setPrompt(data['randomTerm']);
        
    };
    
  useEffect(()=>{
    // only once at mount
    fetchAndUpdateSuggestions();
  
},[]);

    // For when focus is removed from the search bar, introduce a delay to let selection occur
    const handleBlur = () => {
        // Use a timeout to delay hiding suggestions
        setTimeout(() => {
            setShowSuggestions(false);
        }, 100); 
    };

    // clicking on one of the suggestion options selects it and places it into Search
    const handleSuggestionClick = (suggestion) =>{
        console.log("Clicked: ", suggestion)
        setPrompt(suggestion)
        setShowSuggestions(false)
    };

    // when clicking into the search bar or typing, make the options visible
    const handleSearchFocus = ()=>{
        if (allSuggestions.length > 0) {
            setFilteredSuggestions(allSuggestions);
            setShowSuggestions(true);
        };
    };

    // logic for a dynamic suggestions menu system
    const handleSearchInteration = (e) => {
        
        let value = e.target.value
        setPrompt(value)

        if (value.length > 0){
            const filtered = allSuggestions.filter(suggestion =>
                suggestion.toLowerCase().includes(value.toLowerCase()));
            
            setFilteredSuggestions(filtered);
            setShowSuggestions(true);
        
        } else {

            setShowSuggestions(false);
        }
    };


    // Search button is clicked
    const handleClick = async ()=> {
        console.log("prompt is: ", prompt);
        
        // handle whether search term needs to be added to the microservice server DB or not
        if (!allSuggestions.includes(prompt)){
            // add new term to server
            try {
                const response = await fetch(`http://localhost:${process.env.REACT_APP_MS_PORT}/search-terms/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ search:prompt }),
                });

                if (!response.ok) throw new Error('Failed to add new search term');

                // successful add means update with our new suggestions
                await fetchAndUpdateSuggestions();
            } catch(error) {
                console.error("Error adding new search term: ", error);
                alert("Error adding new search term: ", error.message);
                return;
            }
        }

        // pack up the prompt
        let sendData = {
            'prompt': prompt
        };

        try {
            // convert prompt to embedding
            let response = await fetch('http://127.0.0.1:8000/search', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(sendData)
                });
            console.log("response: ", response)
            // response from microservice needs to be ok
            if (!response.ok){
                throw new Error('Network response was not ok');
            }

            // convert returned to json object
            const jsonResponse = await response.json();
            console.log("Response JSON: ", jsonResponse)

            // if embedding is found in the object
            if (jsonResponse.embedding){
                let prompt_emb = jsonResponse.embedding;

                // query for results
                const {data, error: dbError} = await supabase.rpc("search_db",{
                curr_user: user.id,
                query_emb: prompt_emb,
                similarity_threshold: 0.24,
                match_count: 6,
                });
                
                // search results
                console.log("data:", data)
                if (data){
                    console.log(data);
                    // set in state
                    setResults(data);
                    setShowResult(true);

                // problem with search results
                } else if (dbError){
                    console.log("Database error: ", dbError);
                    alert("Error with search results: ", dbError.message)
                }              
            } else {
                // if returned JSON did not contain the embedding
                console.error("Embedding not found in response:, ");
            }

        } catch(error){
            // general errors from the try block
            console.log("Error with search results: ", error.message)
            alert("Error with search results: ",error.message )
        }
    };

    return(

        <ListGroup size='lg' className='mb-3'>
                    <div style={{position:'relative',}}>
                    <InputGroup >
                    <Button variant='outline-secondary' onClick={handleClick}  >Submit</Button>
                    <Form.Control
                        type="input"
                        placeholder='Search using natural language...'
                        onChange={handleSearchInteration}
                        onFocus={handleSearchFocus}
                        onBlur={handleBlur}
                        value={prompt}
                    />
                    <Button variant='outline-secondary' onClick={handleRandom}  >Random!</Button>
                    </InputGroup>
                    
                    {/**Container to hold search suggestion display */}

                    {showSuggestions &&(
                        <div className='suggestion-container' >
                            {filteredSuggestions.map((suggestion, index)=>(
                                <ListGroup.Item className='search-list-item' key={index} onClick={()=>handleSuggestionClick(suggestion)}>
                                    {suggestion}
                                </ListGroup.Item>
                            ))}
                        </div>
                    )}
                    </div>
                
                {/**Modal for displaying search results */}
                {showResult? <SearchResults results={results} showResult={showResult} setShowResult={setShowResult} deleteImage={deleteImage}></SearchResults> : null}
        </ListGroup>

    );
};

