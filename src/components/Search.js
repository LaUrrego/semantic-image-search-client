import { useState, useEffect } from 'react';
// container from bootstrap to allow for consistent styling
import { Container, Form, Button, Row, Col, Card, InputGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import SearchResults from './SearchResults';


export default function Search({deleteImage}) {
    const supabase = useSupabaseClient();
    const user = useUser();

    const [prompt, setPrompt] = useState("");
    const [results, setResults] = useState([]);
    const [showResult, setShowResult] = useState(false);


    const handleClick = async ()=> {
        console.log("prompt is: ", prompt);
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
        <InputGroup size='lg' className='mb-3'>
                    <Form.Control
                        type="input"
                        placeholder='Search using natural language...'
                        onChange={event => setPrompt(event.target.value)}
                    />
                    <Button variant='primary' onClick={handleClick}  >Submit</Button>
                    {showResult? <SearchResults results={results} showResult={showResult} setShowResult={setShowResult} deleteImage={deleteImage}></SearchResults> : null}
        </InputGroup>
    );
};

